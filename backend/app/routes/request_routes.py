"""Stock purchase request workflows for branch inventory replenishment."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, g, jsonify, request
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    Branch,
    BranchInventory,
    InventoryTransaction,
    RequestStatus,
    StockItem,
    StockPurchaseRequest,
    StockPurchaseRequestItem,
    TransactionType,
)
from ..utils.security import token_required


request_bp = Blueprint("requests", __name__, url_prefix="/api/requests")


def _current_role():
    role = getattr(g, "current_role", None)
    if not role:
        raise PermissionError("No role scope attached to request.")
    return role


def _resolve_branch_id(explicit_branch_id: int | None) -> int:
    role = _current_role()

    if role.scope_type == "BRANCH":
        branch_id = role.scope_id
        if explicit_branch_id is not None and explicit_branch_id != branch_id:
            raise PermissionError("Unauthorized branch access.")
    elif role.scope_type == "FRANCHISE":
        if explicit_branch_id is None:
            raise ValueError("branch_id is required for this operation.")
        branch = Branch.query.get(explicit_branch_id)
        if not branch or branch.franchise_id != role.scope_id:
            raise PermissionError("Branch not accessible for this franchise scope.")
        branch_id = branch.branch_id
    else:
        if explicit_branch_id is None:
            raise ValueError("branch_id is required for this operation.")
        branch_id = explicit_branch_id

    if branch_id is None:
        raise ValueError("branch_id is required for this operation.")

    return branch_id


def _get_status_id(name: str) -> int:
    status = RequestStatus.query.filter_by(status_name=name).first()
    if not status:
        raise LookupError(f"Request status '{name}' is not configured.")
    return status.request_status_id


def _get_transaction_type_id(code: str) -> int:
    transaction_type = TransactionType.query.filter_by(type_name=code).first()
    if not transaction_type:
        raise LookupError(f"Transaction type '{code}' is not configured.")
    return transaction_type.transaction_type_id


def _get_or_create_inventory(branch_id: int, stock_item_id: int) -> BranchInventory:
    record = BranchInventory.query.filter_by(branch_id=branch_id, stock_item_id=stock_item_id).first()
    if record:
        return record

    next_inventory_id = (
        db.session.query(func.coalesce(func.max(BranchInventory.branch_inventory_id), 0)).scalar() + 1
    )

    while BranchInventory.query.get(next_inventory_id) is not None:
        next_inventory_id += 1

    record = BranchInventory(
        branch_inventory_id=next_inventory_id,
        branch_id=branch_id,
        stock_item_id=stock_item_id,
        quantity=Decimal("0"),
    )
    db.session.add(record)
    db.session.flush()
    return record


def _serialize_request(request_obj: StockPurchaseRequest) -> dict[str, object]:
    return {
        "request_id": request_obj.request_id,
        "branch_id": request_obj.branch_id,
        "status": request_obj.status.status_name if request_obj.status else None,
        "requested_by_user_id": request_obj.requested_by_user_id,
        "approved_by_user_id": request_obj.approved_by_user_id,
        "created_at": request_obj.created_at.isoformat() if request_obj.created_at else None,
        "approved_at": request_obj.approved_at.isoformat() if request_obj.approved_at else None,
        "note": request_obj.note,
        "items": [
            {
                "request_item_id": item.request_item_id,
                "stock_item_id": item.stock_item_id,
                "stock_item_name": item.stock_item.name if item.stock_item else None,
                "requested_quantity": float(item.requested_quantity),
                "estimated_unit_cost": float(item.estimated_unit_cost) if item.estimated_unit_cost is not None else None,
            }
            for item in request_obj.items
        ],
    }


@request_bp.route("", methods=["POST"])
@token_required({"MANAGER"})
def create_request() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}
    items_payload = payload.get("items") or []
    if not isinstance(items_payload, list) or not items_payload:
        return jsonify({"error": "items must be a non-empty list."}), HTTPStatus.BAD_REQUEST

    branch_id_param = request.args.get("branch_id", type=int) or payload.get("branch_id")

    try:
        branch_id = _resolve_branch_id(branch_id_param)
    except (PermissionError, ValueError) as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN if isinstance(exc, PermissionError) else HTTPStatus.BAD_REQUEST

    branch = Branch.query.get(branch_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    pending_status_id: int
    try:
        pending_status_id = _get_status_id("PENDING")
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    current_user = getattr(g, "current_user", None)

    next_request_id = (
        db.session.query(func.coalesce(func.max(StockPurchaseRequest.request_id), 0)).scalar() + 1
    )

    request_record = StockPurchaseRequest(
        request_id=next_request_id,
        branch_id=branch.branch_id,
        requested_by_user_id=current_user.user_id if current_user else None,
        status_id=pending_status_id,
        note=payload.get("note"),
    )
    db.session.add(request_record)
    db.session.flush()

    next_request_item_id = (
        db.session.query(func.coalesce(func.max(StockPurchaseRequestItem.request_item_id), 0)).scalar()
    )

    for entry in items_payload:
        stock_item_id = entry.get("stock_item_id")
        if stock_item_id is None:
            db.session.rollback()
            return jsonify({"error": "Each item requires stock_item_id."}), HTTPStatus.BAD_REQUEST

        stock_item = StockItem.query.get(stock_item_id)
        if not stock_item or stock_item.franchise_id != branch.franchise_id:
            db.session.rollback()
            return jsonify({"error": f"Stock item {stock_item_id} is not valid for this branch."}), HTTPStatus.BAD_REQUEST

        if "requested_quantity" not in entry:
            db.session.rollback()
            return jsonify({"error": "Each item requires requested_quantity."}), HTTPStatus.BAD_REQUEST

        quantity_raw = entry.get("requested_quantity")
        try:
            quantity = Decimal(str(quantity_raw))
        except (InvalidOperation, TypeError, ValueError):
            db.session.rollback()
            return jsonify({"error": "requested_quantity must be numeric."}), HTTPStatus.BAD_REQUEST

        if quantity <= 0:
            db.session.rollback()
            return jsonify({"error": "requested_quantity must be greater than zero."}), HTTPStatus.BAD_REQUEST

        estimated_cost_raw = entry.get("estimated_unit_cost")
        estimated_cost: Decimal | None
        if estimated_cost_raw is None or estimated_cost_raw == "":
            estimated_cost = None
        else:
            try:
                estimated_cost = Decimal(str(estimated_cost_raw))
            except (InvalidOperation, TypeError, ValueError):
                db.session.rollback()
                return jsonify({"error": "estimated_unit_cost must be numeric."}), HTTPStatus.BAD_REQUEST

        next_request_item_id += 1

        db.session.add(
            StockPurchaseRequestItem(
                request_item_id=next_request_item_id,
                request_id=request_record.request_id,
                stock_item_id=stock_item.stock_item_id,
                requested_quantity=quantity,
                estimated_unit_cost=estimated_cost,
            )
        )

    db.session.commit()

    request_record = StockPurchaseRequest.query.options(
        joinedload(StockPurchaseRequest.items).joinedload(StockPurchaseRequestItem.stock_item),
        joinedload(StockPurchaseRequest.status),
    ).get(request_record.request_id)

    return jsonify(_serialize_request(request_record)), HTTPStatus.CREATED


def _ensure_request_access(request_obj: StockPurchaseRequest) -> tuple[dict[str, object], int] | None:
    try:
        role = _current_role()
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN

    if role.scope_type == "BRANCH" and request_obj.branch_id != role.scope_id:
        return jsonify({"error": "Unauthorized branch access."}), HTTPStatus.FORBIDDEN

    if role.scope_type == "FRANCHISE":
        branch = Branch.query.get(request_obj.branch_id)
        if not branch or branch.franchise_id != role.scope_id:
            return jsonify({"error": "Unauthorized branch access."}), HTTPStatus.FORBIDDEN

    return None


@request_bp.route("", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def list_requests() -> tuple[list[dict[str, object]], int]:
    branch_id_param = request.args.get("branch_id", type=int)

    try:
        branch_id = _resolve_branch_id(branch_id_param)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    records = (
        StockPurchaseRequest.query.options(
            joinedload(StockPurchaseRequest.items).joinedload(StockPurchaseRequestItem.stock_item),
            joinedload(StockPurchaseRequest.status),
        )
        .filter(StockPurchaseRequest.branch_id == branch_id)
        .order_by(StockPurchaseRequest.created_at.desc())
        .all()
    )

    return jsonify([_serialize_request(record) for record in records]), HTTPStatus.OK


@request_bp.route("/<int:request_id>/approve", methods=["PUT"])
@token_required({"BRANCH_OWNER"})
def approve_request(request_id: int) -> tuple[dict[str, object], int]:
    record = StockPurchaseRequest.query.options(
        joinedload(StockPurchaseRequest.items),
        joinedload(StockPurchaseRequest.branch),
    ).get(request_id)

    if not record:
        return jsonify({"error": "Request not found."}), HTTPStatus.NOT_FOUND

    access_error = _ensure_request_access(record)
    if access_error:
        return access_error

    pending_status_id: int
    approved_status_id: int
    try:
        pending_status_id = _get_status_id("PENDING")
        approved_status_id = _get_status_id("APPROVED")
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    if record.status_id != pending_status_id:
        return jsonify({"error": "Only pending requests can be approved."}), HTTPStatus.BAD_REQUEST

    if not record.items:
        return jsonify({"error": "Cannot approve a request without items."}), HTTPStatus.BAD_REQUEST

    branch = record.branch or Branch.query.get(record.branch_id)
    if not branch:
        return jsonify({"error": "Branch not found for this request."}), HTTPStatus.NOT_FOUND

    try:
        transaction_type_id = _get_transaction_type_id("IN")
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    current_user = getattr(g, "current_user", None)

    next_transaction_id = (
        db.session.query(func.coalesce(func.max(InventoryTransaction.transaction_id), 0)).scalar() + 1
    )

    for item in record.items:
        inventory_record = _get_or_create_inventory(branch.branch_id, item.stock_item_id)
        inventory_record.quantity = inventory_record.quantity + item.requested_quantity

        while InventoryTransaction.query.get(next_transaction_id) is not None:
            next_transaction_id += 1

        db.session.add(
            InventoryTransaction(
                transaction_id=next_transaction_id,
                branch_id=branch.branch_id,
                stock_item_id=item.stock_item_id,
                transaction_type_id=transaction_type_id,
                quantity_change=item.requested_quantity,
                unit_cost=item.estimated_unit_cost,
                created_by_user_id=current_user.user_id if current_user else None,
                approved_by_user_id=current_user.user_id if current_user else None,
                note=f"Auto-approved from request {record.request_id}",
                created_at=datetime.utcnow(),
            )
        )

        next_transaction_id += 1

    record.status_id = approved_status_id
    record.approved_by_user_id = current_user.user_id if current_user else None
    record.approved_at = datetime.utcnow()

    db.session.commit()

    record = StockPurchaseRequest.query.options(
        joinedload(StockPurchaseRequest.items).joinedload(StockPurchaseRequestItem.stock_item),
        joinedload(StockPurchaseRequest.status),
    ).get(record.request_id)

    return jsonify(_serialize_request(record)), HTTPStatus.OK


@request_bp.route("/<int:request_id>/reject", methods=["PUT"])
@token_required({"BRANCH_OWNER"})
def reject_request(request_id: int) -> tuple[dict[str, object], int]:
    record = StockPurchaseRequest.query.options(joinedload(StockPurchaseRequest.branch)).get(request_id)

    if not record:
        return jsonify({"error": "Request not found."}), HTTPStatus.NOT_FOUND

    access_error = _ensure_request_access(record)
    if access_error:
        return access_error

    try:
        pending_status_id = _get_status_id("PENDING")
        rejected_status_id = _get_status_id("REJECTED")
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    if record.status_id != pending_status_id:
        return jsonify({"error": "Only pending requests can be rejected."}), HTTPStatus.BAD_REQUEST

    current_user = getattr(g, "current_user", None)

    record.status_id = rejected_status_id
    record.approved_by_user_id = current_user.user_id if current_user else None
    record.approved_at = datetime.utcnow()

    db.session.commit()

    record = StockPurchaseRequest.query.options(
        joinedload(StockPurchaseRequest.items).joinedload(StockPurchaseRequestItem.stock_item),
        joinedload(StockPurchaseRequest.status),
    ).get(record.request_id)

    return jsonify(_serialize_request(record)), HTTPStatus.OK
