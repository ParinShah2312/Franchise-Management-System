"""Inventory management routes for branch-scoped stock control."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, jsonify, request, g
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    Branch,
    BranchInventory,
    InventoryTransaction,
    StockItem,
    TransactionType,
)
from ..utils.security import token_required


inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


def _allowed_branch_id(explicit_branch_id: int | None) -> int | tuple[dict[str, object], int]:
    role = getattr(g, "current_role", None)
    if not role:
        return jsonify({"error": "No role scope attached to request."}), HTTPStatus.FORBIDDEN

    if role.scope_type == "BRANCH":
        branch_id = role.scope_id
    elif role.scope_type == "FRANCHISE":
        branch_id = explicit_branch_id
    else:
        branch_id = explicit_branch_id

    if branch_id is None:
        return jsonify({"error": "branch_id is required."}), HTTPStatus.BAD_REQUEST

    if role.scope_type == "FRANCHISE":
        branch = Branch.query.get(branch_id)
        if not branch or branch.franchise_id != role.scope_id:
            return jsonify({"error": "Branch not accessible for this franchise scope."}), HTTPStatus.FORBIDDEN
    else:
        if branch_id != role.scope_id:
            return jsonify({"error": "Unauthorized branch access."}), HTTPStatus.FORBIDDEN

    return branch_id


def _serialize_inventory(record: BranchInventory) -> dict[str, object]:
    return {
        "branch_inventory_id": record.branch_inventory_id,
        "branch_id": record.branch_id,
        "stock_item_id": record.stock_item_id,
        "stock_item_name": record.stock_item.name if record.stock_item else None,
        "unit_name": record.stock_item.unit.unit_name if record.stock_item and record.stock_item.unit else None,
        "quantity": float(record.quantity),
        "reorder_level": float(record.reorder_level) if record.reorder_level is not None else None,
        "updated_at": record.updated_at.isoformat() if record.updated_at else None,
    }


def _next_id(model, pk_column):
    next_value = db.session.query(func.coalesce(func.max(pk_column), 0)).scalar() + 1
    while db.session.query(model).get(next_value) is not None:
        next_value += 1
    return next_value


@inventory_bp.route("", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def list_inventory() -> tuple[list[dict[str, object]], int]:
    branch_id_param = request.args.get("branch_id", type=int)
    result = _allowed_branch_id(branch_id_param)
    if isinstance(result, tuple):
        return result

    records = (
        BranchInventory.query.options(
            joinedload(BranchInventory.stock_item).joinedload(StockItem.unit)
        )
        .filter(BranchInventory.branch_id == result)
        .order_by(BranchInventory.branch_inventory_id.asc())
        .all()
    )

    return jsonify([_serialize_inventory(record) for record in records]), HTTPStatus.OK


def _get_or_create_inventory(branch_id: int, stock_item_id: int) -> BranchInventory:
    record = BranchInventory.query.filter_by(branch_id=branch_id, stock_item_id=stock_item_id).first()
    if record:
        return record
    record = BranchInventory(
        branch_inventory_id=_next_id(BranchInventory, BranchInventory.branch_inventory_id),
        branch_id=branch_id,
        stock_item_id=stock_item_id,
        quantity=Decimal("0"),
    )
    db.session.add(record)
    db.session.flush()
    return record


def _apply_transaction(
    *,
    branch: Branch,
    stock_item: StockItem,
    quantity_delta: Decimal,
    transaction_type_id: int,
    note: str | None = None,
) -> tuple[InventoryTransaction, BranchInventory]:
    record = _get_or_create_inventory(branch.branch_id, stock_item.stock_item_id)
    record.quantity = record.quantity + quantity_delta

    current_user = getattr(g, "current_user", None)

    transaction = InventoryTransaction(
        transaction_id=_next_id(InventoryTransaction, InventoryTransaction.transaction_id),
        branch_id=branch.branch_id,
        stock_item_id=stock_item.stock_item_id,
        transaction_type_id=transaction_type_id,
        quantity_change=quantity_delta,
        created_by_user_id=current_user.user_id if current_user else None,
        created_at=datetime.utcnow(),
        note=note,
    )
    db.session.add(transaction)
    db.session.flush()

    return transaction, record


@inventory_bp.route("/transaction", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def create_transaction() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}

    branch_id_param = request.args.get("branch_id", type=int) or payload.get("branch_id")
    if branch_id_param is not None:
        try:
            branch_id_param = int(branch_id_param)
        except (TypeError, ValueError):
            return jsonify({"error": "branch_id must be numeric."}), HTTPStatus.BAD_REQUEST

    result = _allowed_branch_id(branch_id_param)
    if isinstance(result, tuple):
        return result

    stock_item_id = payload.get("stock_item_id")
    if not stock_item_id:
        return jsonify({"error": "stock_item_id is required."}), HTTPStatus.BAD_REQUEST

    stock_item = StockItem.query.options(joinedload(StockItem.franchise)).get(stock_item_id)
    if not stock_item:
        return jsonify({"error": "Stock item not found."}), HTTPStatus.BAD_REQUEST

    branch = Branch.query.get(result)
    if not branch or branch.franchise_id != stock_item.franchise_id:
        return jsonify({"error": "Stock item does not belong to this branch's franchise."}), HTTPStatus.BAD_REQUEST

    transaction_code = (payload.get("transaction_type") or "").upper()
    if transaction_code not in {"IN", "OUT", "ADJUSTMENT"}:
        return jsonify({"error": "transaction_type must be one of IN, OUT, ADJUSTMENT."}), HTTPStatus.BAD_REQUEST

    quantity_raw = payload.get("quantity")
    if quantity_raw is None:
        return jsonify({"error": "quantity is required."}), HTTPStatus.BAD_REQUEST

    try:
        quantity = Decimal(str(quantity_raw))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"error": "quantity must be numeric."}), HTTPStatus.BAD_REQUEST

    if transaction_code == "OUT" and quantity > 0:
        quantity = quantity * Decimal("-1")
    elif transaction_code == "IN" and quantity < 0:
        quantity = quantity.copy_abs()

    note = payload.get("note")

    transaction_type = TransactionType.query.filter_by(type_name=transaction_code).first()
    if not transaction_type:
        return (
            jsonify({"error": f"Transaction type '{transaction_code}' is not configured."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    transaction, inventory_record = _apply_transaction(
        branch=branch,
        stock_item=stock_item,
        quantity_delta=quantity,
        transaction_type_id=transaction_type.transaction_type_id,
        note=note,
    )

    db.session.commit()

    refreshed_record = BranchInventory.query.options(
        joinedload(BranchInventory.stock_item).joinedload(StockItem.unit)
    ).get(inventory_record.branch_inventory_id)

    if not refreshed_record:
        refreshed_record = inventory_record

    return (
        jsonify(
            {
                "transaction_id": transaction.transaction_id,
                "transaction_type": transaction_type.type_name,
                "quantity_change": float(transaction.quantity_change),
                "branch_inventory": _serialize_inventory(refreshed_record),
            }
        ),
        HTTPStatus.CREATED,
    )


@inventory_bp.route("/stock-in", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def record_stock_delivery() -> tuple[dict[str, object], int]:
    branch_id_param = request.args.get("branch_id", type=int)
    result = _allowed_branch_id(branch_id_param)
    if isinstance(result, tuple):
        return result

    payload = request.get_json(silent=True) or {}
    stock_item_id = payload.get("stock_item_id")
    if stock_item_id is None:
        return jsonify({"error": "stock_item_id is required."}), HTTPStatus.BAD_REQUEST

    quantity_raw = payload.get("quantity")
    if quantity_raw is None:
        return jsonify({"error": "quantity is required."}), HTTPStatus.BAD_REQUEST

    try:
        quantity = Decimal(str(quantity_raw))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"error": "quantity must be numeric."}), HTTPStatus.BAD_REQUEST

    if quantity <= 0:
        return jsonify({"error": "quantity must be greater than zero."}), HTTPStatus.BAD_REQUEST

    branch = Branch.query.get(result)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    stock_item = StockItem.query.get(stock_item_id)
    if not stock_item or stock_item.franchise_id != branch.franchise_id:
        return jsonify({"error": "Stock item is not available for this branch."}), HTTPStatus.BAD_REQUEST

    transaction_type = TransactionType.query.filter_by(type_name="IN").first()
    if not transaction_type:
        return jsonify({"error": "Transaction type 'IN' is not configured."}), HTTPStatus.INTERNAL_SERVER_ERROR

    transaction, inventory_record = _apply_transaction(
        branch=branch,
        stock_item=stock_item,
        quantity_delta=quantity,
        transaction_type_id=transaction_type.transaction_type_id,
        note=(payload.get("note") or "Recorded via staff delivery"),
    )

    db.session.commit()

    refreshed_record = BranchInventory.query.options(
        joinedload(BranchInventory.stock_item).joinedload(StockItem.unit)
    ).get(inventory_record.branch_inventory_id)

    if not refreshed_record:
        refreshed_record = inventory_record

    return (
        jsonify(
            {
                "transaction_id": transaction.transaction_id,
                "transaction_type": transaction_type.type_name,
                "quantity_change": float(transaction.quantity_change),
                "branch_inventory": _serialize_inventory(refreshed_record),
            }
        ),
        HTTPStatus.CREATED,
    )


@inventory_bp.route("/stock-items", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def list_stock_items() -> tuple[list[dict[str, object]], int]:
    role = getattr(g, "current_role", None)
    if not role or role.scope_type != "BRANCH":
        return jsonify({"error": "Branch-scoped role required."}), HTTPStatus.FORBIDDEN

    branch = Branch.query.get(role.scope_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    items = (
        StockItem.query.filter_by(franchise_id=branch.franchise_id)
        .order_by(StockItem.name.asc())
        .all()
    )

    payload = [
        {
            "id": item.stock_item_id,
            "name": item.name,
            "description": item.description,
        }
        for item in items
    ]
    return jsonify(payload), HTTPStatus.OK


@inventory_bp.route("", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def create_branch_inventory() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}

    branch_id_param = request.args.get("branch_id", type=int) or payload.get("branch_id")
    result = _allowed_branch_id(branch_id_param)
    if isinstance(result, tuple):
        return result

    stock_item_id = payload.get("stock_item_id")
    if stock_item_id is None:
        return jsonify({"error": "stock_item_id is required."}), HTTPStatus.BAD_REQUEST

    try:
        stock_item_id = int(stock_item_id)
    except (TypeError, ValueError):
        return jsonify({"error": "stock_item_id must be numeric."}), HTTPStatus.BAD_REQUEST

    quantity_raw = payload.get("quantity", 0)
    reorder_level_raw = payload.get("reorder_level", 0)

    try:
        quantity = Decimal(str(quantity_raw))
        reorder_level = Decimal(str(reorder_level_raw))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"error": "quantity and reorder_level must be numeric."}), HTTPStatus.BAD_REQUEST

    if quantity < 0:
        return jsonify({"error": "quantity cannot be negative."}), HTTPStatus.BAD_REQUEST

    branch = Branch.query.get(result)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    stock_item = StockItem.query.get(stock_item_id)
    if not stock_item or stock_item.franchise_id != branch.franchise_id:
        return jsonify({"error": "Stock item is not available for this branch."}), HTTPStatus.BAD_REQUEST

    existing = BranchInventory.query.filter_by(branch_id=result, stock_item_id=stock_item_id).first()
    if existing:
        return (
            jsonify({"error": "Item already exists in inventory. Use Stock In to add quantity."}),
            HTTPStatus.BAD_REQUEST,
        )

    inventory = BranchInventory(
        branch_inventory_id=_next_id(BranchInventory, BranchInventory.branch_inventory_id),
        branch_id=result,
        stock_item_id=stock_item_id,
        quantity=quantity,
        reorder_level=reorder_level,
    )
    db.session.add(inventory)
    db.session.flush()

    transaction_type = TransactionType.query.filter_by(type_name="ADJUSTMENT").first()
    if not transaction_type:
        transaction_type = TransactionType.query.filter_by(type_name="IN").first()
        if not transaction_type:
            db.session.rollback()
            return jsonify({"error": "Transaction type 'ADJUSTMENT' or 'IN' is not configured."}), HTTPStatus.INTERNAL_SERVER_ERROR

    transaction = InventoryTransaction(
        transaction_id=_next_id(InventoryTransaction, InventoryTransaction.transaction_id),
        branch_id=result,
        stock_item_id=stock_item_id,
        transaction_type_id=transaction_type.transaction_type_id,
        quantity_change=quantity,
        note="Initial inventory load",
        created_by_user_id=getattr(getattr(g, "current_user", None), "user_id", None),
        created_at=datetime.utcnow(),
    )
    db.session.add(transaction)

    db.session.commit()

    return (
        jsonify(
            {
                "message": "Item added to inventory",
                "id": inventory.branch_inventory_id,
            }
        ),
        HTTPStatus.CREATED,
    )
