"""Inventory management routes for branch-scoped stock control."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, jsonify, request, g
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    Branch,
    BranchInventory,
    Franchise,
    InventoryTransaction,
    StockItem,
    Unit,
)
from ..services.inventory_service import (
    apply_inventory_transaction,
    get_transaction_type_id,
)
from ..utils.security import token_required
from ..utils.db_helpers import serialize_dt
from ..utils.branch_helpers import _current_role


inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


def _allowed_branch_id(
    explicit_branch_id: int | None,
) -> int:
    """Return the branch ID the caller is authorized to access, or raise."""
    role = _current_role()

    if role.scope_type == "BRANCH":
        branch_id = role.scope_id
    elif role.scope_type == "FRANCHISE":
        branch_id = explicit_branch_id
    else:
        branch_id = explicit_branch_id

    if branch_id is None:
        raise ValueError("branch_id is required.")

    if role.scope_type == "FRANCHISE":
        branch = db.session.get(Branch, branch_id)
        if not branch or branch.franchise_id != role.scope_id:
            raise PermissionError("Branch not accessible for this franchise scope.")
    else:
        if branch_id != role.scope_id:
            raise PermissionError("Unauthorized branch access.")

    return branch_id


def _serialize_inventory(record: BranchInventory) -> dict[str, object]:
    return {
        "branch_inventory_id": record.branch_inventory_id,
        "branch_id": record.branch_id,
        "stock_item_id": record.stock_item_id,
        "stock_item_name": record.stock_item.name if record.stock_item else None,
        "unit_name": record.stock_item.unit.unit_name
        if record.stock_item and record.stock_item.unit
        else None,
        "quantity": float(record.quantity),
        "reorder_level": float(record.reorder_level)
        if record.reorder_level is not None
        else None,
        "updated_at": serialize_dt(record.updated_at),
    }

@inventory_bp.route("", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def list_inventory() -> tuple[list[dict[str, object]], int]:
    branch_id_param = request.args.get("branch_id", type=int)
    try:
        branch_id = _allowed_branch_id(branch_id_param)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    records = (
        BranchInventory.query.options(
            joinedload(BranchInventory.stock_item).joinedload(StockItem.unit)
        )
        .filter(BranchInventory.branch_id == branch_id)
        .order_by(BranchInventory.branch_inventory_id.asc())
        .all()
    )

    return jsonify([_serialize_inventory(record) for record in records]), HTTPStatus.OK




@inventory_bp.route("/stock-in", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def record_stock_delivery() -> tuple[dict[str, object], int]:
    branch_id_param = request.args.get("branch_id", type=int)
    try:
        branch_id = _allowed_branch_id(branch_id_param)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

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
        return jsonify(
            {"error": "quantity must be greater than zero."}
        ), HTTPStatus.BAD_REQUEST

    branch = db.session.get(Branch, branch_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    stock_item = db.session.get(StockItem, stock_item_id)
    if not stock_item or stock_item.franchise_id != branch.franchise_id:
        return jsonify(
            {"error": "Stock item is not available for this branch."}
        ), HTTPStatus.BAD_REQUEST

    try:
        transaction_type_id = get_transaction_type_id("IN")
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    transaction, inventory_record = apply_inventory_transaction(
        branch_id=branch.branch_id,
        stock_item_id=stock_item.stock_item_id,
        quantity_delta=quantity,
        transaction_type_id=transaction_type_id,
        created_by_user_id=getattr(g, "current_user", None).user_id if getattr(g, "current_user", None) else None,
        note=(payload.get("note") or "Recorded via staff delivery"),
    )

    db.session.commit()

    refreshed_record = db.session.get(
        BranchInventory, inventory_record.branch_inventory_id,
        options=[joinedload(BranchInventory.stock_item).joinedload(StockItem.unit)]
    )

    if not refreshed_record:
        refreshed_record = inventory_record

    return (
        jsonify(
            {
                "transaction_id": transaction.transaction_id,
                "transaction_type": "IN",
                "quantity_change": float(transaction.quantity_change),
                "branch_inventory": _serialize_inventory(refreshed_record),
            }
        ),
        HTTPStatus.CREATED,
    )

@inventory_bp.route("/stock-items", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def list_stock_items() -> tuple[list[dict[str, object]], int]:
    role = _current_role()
    if role.scope_type != "BRANCH":
        return jsonify({"error": "Branch-scoped role required."}), HTTPStatus.FORBIDDEN

    branch = db.session.get(Branch, role.scope_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    items = (
        StockItem.query.filter_by(franchise_id=branch.franchise_id)
        .order_by(StockItem.name.asc())
        .all()
    )

    payload = [
        {
            "stock_item_id": item.stock_item_id,
            "stock_item_name": item.name,
            "description": item.description,
        }
        for item in items
    ]
    return jsonify(payload), HTTPStatus.OK

@inventory_bp.route("", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def create_branch_inventory() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}

    branch_id_param = request.args.get("branch_id", type=int) or payload.get(
        "branch_id"
    )
    if branch_id_param is not None:
        try:
            branch_id_param = int(branch_id_param)
        except (TypeError, ValueError):
            return jsonify(
                {"error": "branch_id must be numeric."}
            ), HTTPStatus.BAD_REQUEST

    try:
        branch_id = _allowed_branch_id(branch_id_param)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    stock_item_id = payload.get("stock_item_id")
    if stock_item_id is None:
        return jsonify({"error": "stock_item_id is required."}), HTTPStatus.BAD_REQUEST

    try:
        stock_item_id = int(stock_item_id)
    except (TypeError, ValueError):
        return jsonify(
            {"error": "stock_item_id must be numeric."}
        ), HTTPStatus.BAD_REQUEST

    quantity_raw = payload.get("quantity", 0)
    reorder_level_raw = payload.get("reorder_level", 0)

    try:
        quantity = Decimal(str(quantity_raw))
        reorder_level = Decimal(str(reorder_level_raw))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify(
            {"error": "quantity and reorder_level must be numeric."}
        ), HTTPStatus.BAD_REQUEST

    if quantity < 0:
        return jsonify(
            {"error": "quantity cannot be negative."}
        ), HTTPStatus.BAD_REQUEST

    branch = db.session.get(Branch, branch_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    stock_item = db.session.get(StockItem, stock_item_id)
    if not stock_item or stock_item.franchise_id != branch.franchise_id:
        return jsonify(
            {"error": "Stock item is not available for this branch."}
        ), HTTPStatus.BAD_REQUEST

    existing = BranchInventory.query.filter_by(
        branch_id=branch_id, stock_item_id=stock_item_id
    ).first()
    if existing:
        return (
            jsonify(
                {
                    "error": "Item already exists in inventory. Use Stock In to add quantity."
                }
            ),
            HTTPStatus.BAD_REQUEST,
        )

    inventory = BranchInventory(
        branch_id=branch_id,
        stock_item_id=stock_item_id,
        quantity=quantity,
        reorder_level=reorder_level,
    )
    db.session.add(inventory)
    db.session.flush()

    try:
        transaction_type_id = get_transaction_type_id("ADJUSTMENT")
    except LookupError:
        try:
            transaction_type_id = get_transaction_type_id("IN")
        except LookupError as exc:
            db.session.rollback()
            return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    transaction = InventoryTransaction(
        branch_id=branch_id,
        stock_item_id=stock_item_id,
        transaction_type_id=transaction_type_id,
        quantity_change=quantity,
        note="Initial inventory load",
        created_by_user_id=getattr(getattr(g, "current_user", None), "user_id", None),
        created_at=datetime.now(timezone.utc),
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


@inventory_bp.route("/stock-items", methods=["POST"])
@token_required({"FRANCHISOR"})
def create_stock_item() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}
    
    name = payload.get("name")
    if not name or not str(name).strip():
        return jsonify({"error": "name is required and must be a non-empty string."}), HTTPStatus.BAD_REQUEST
    name = str(name).strip()

    unit_id = payload.get("unit_id")
    if not unit_id:
        return jsonify({"error": "unit_id is required."}), HTTPStatus.BAD_REQUEST

    try:
        unit_id = int(unit_id)
    except (TypeError, ValueError):
        return jsonify({"error": "unit_id must be numeric."}), HTTPStatus.BAD_REQUEST

    unit = db.session.get(Unit, unit_id)
    if not unit:
        return jsonify({"error": "Invalid unit reference."}), HTTPStatus.BAD_REQUEST

    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED

    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found for this franchisor."}), HTTPStatus.NOT_FOUND

    existing = StockItem.query.filter(
        db.func.lower(StockItem.name) == name.lower(),
        StockItem.franchise_id == franchise.franchise_id
    ).first()
    
    if existing:
        return jsonify({"error": "A stock item with this name already exists."}), HTTPStatus.CONFLICT

    description = payload.get("description")

    stock_item = StockItem(
        franchise_id=franchise.franchise_id,
        name=name,
        description=description,
        unit_id=unit_id
    )
    db.session.add(stock_item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Unable to create stock item due to duplicate data."}), HTTPStatus.CONFLICT

    return jsonify({
        "stock_item_id": stock_item.stock_item_id,
        "name": stock_item.name,
        "description": stock_item.description,
        "unit_id": stock_item.unit_id,
        "unit_name": unit.unit_name,
        "franchise_id": stock_item.franchise_id
    }), HTTPStatus.CREATED


@inventory_bp.route("/units", methods=["GET"])
@token_required({"FRANCHISOR"})
def list_units() -> tuple[list[dict[str, object]], int]:
    units = Unit.query.order_by(Unit.unit_name.asc()).all()
    payload = [
        {
            "unit_id": unit.unit_id,
            "unit_name": unit.unit_name
        }
        for unit in units
    ]
    return jsonify(payload), HTTPStatus.OK


@inventory_bp.route("/stock-items/all", methods=["GET"])
@token_required({"FRANCHISOR"})
def list_all_stock_items() -> tuple[list[dict[str, object]], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED

    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found for this franchisor."}), HTTPStatus.NOT_FOUND

    items = (
        StockItem.query.options(joinedload(StockItem.unit), joinedload(StockItem.product_ingredients))
        .filter_by(franchise_id=franchise.franchise_id)
        .order_by(StockItem.name.asc())
        .all()
    )

    payload = [
        {
            "stock_item_id": item.stock_item_id,
            "name": item.name,
            "description": item.description,
            "unit_id": item.unit_id,
            "unit_name": item.unit.unit_name if item.unit else None,
            "franchise_id": item.franchise_id,
            "used_in_count": len(item.product_ingredients)
        }
        for item in items
    ]
    return jsonify(payload), HTTPStatus.OK

