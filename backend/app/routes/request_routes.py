"""Stock purchase request workflows for branch inventory replenishment."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, g, jsonify, request
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    Branch,
    RequestStatus,
    StockItem,
    StockPurchaseRequest,
    StockPurchaseRequestItem,
)
from ..services.inventory_service import apply_inventory_transaction, get_transaction_type_id
from ..utils.security import token_required
from ..utils.db_helpers import serialize_dt
from ..utils.branch_helpers import resolve_branch_id_from_request

request_bp = Blueprint("requests", __name__, url_prefix="/api/requests")

def _get_status_id(name: str) -> int:
    status = RequestStatus.query.filter_by(status_name=name).first()
    if not status:
        raise LookupError(f"Request status '{name}' is not configured.")
    return status.request_status_id

def _serialize_request(request_obj: StockPurchaseRequest) -> dict[str, object]:
    return {
        "request_id": request_obj.request_id,
        "branch_id": request_obj.branch_id,
        "status": request_obj.status.status_name if request_obj.status else None,
        "requested_by_user_id": request_obj.requested_by_user_id,
        "approved_by_user_id": request_obj.approved_by_user_id,
        "created_at": serialize_dt(request_obj.created_at),
        "approved_at": serialize_dt(request_obj.approved_at),
        "rejected_at": serialize_dt(request_obj.rejected_at),
        "note": request_obj.note,
        "items": [
            {
                "request_item_id": item.request_item_id,
                "stock_item_id": item.stock_item_id,
                "stock_item_name": item.stock_item.name if item.stock_item else None,
                "unit_name": item.stock_item.unit.unit_name if item.stock_item and item.stock_item.unit else None,
                "requested_quantity": float(item.requested_quantity) if item.requested_quantity is not None else 0.0,
                "estimated_unit_cost": float(item.estimated_unit_cost)
                if item.estimated_unit_cost is not None
                else None,
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
        return jsonify(
            {"error": "items must be a non-empty list."}
        ), HTTPStatus.BAD_REQUEST

    branch_id_param = request.args.get("branch_id", type=int) or payload.get(
        "branch_id"
    )

    try:
        branch_id = resolve_branch_id_from_request(branch_id_param)
    except (PermissionError, ValueError) as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN if isinstance(
            exc, PermissionError
        ) else HTTPStatus.BAD_REQUEST

    branch = db.session.get(Branch, branch_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    pending_status_id: int
    try:
        pending_status_id = _get_status_id("PENDING")
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    current_user = getattr(g, "current_user", None)

    request_record = StockPurchaseRequest(
        branch_id=branch.branch_id,
        requested_by_user_id=current_user.user_id if current_user else None,
        status_id=pending_status_id,
        note=payload.get("note"),
    )
    db.session.add(request_record)
    db.session.flush()

    for entry in items_payload:
        stock_item_id = entry.get("stock_item_id")
        if stock_item_id is None:
            db.session.rollback()
            return jsonify(
                {"error": "Each item requires stock_item_id."}
            ), HTTPStatus.BAD_REQUEST

        stock_item = db.session.get(StockItem, stock_item_id)
        if not stock_item or stock_item.franchise_id != branch.franchise_id:
            db.session.rollback()
            return jsonify(
                {"error": f"Stock item {stock_item_id} is not valid for this branch."}
            ), HTTPStatus.BAD_REQUEST

        if "requested_quantity" not in entry:
            db.session.rollback()
            return jsonify(
                {"error": "Each item requires requested_quantity."}
            ), HTTPStatus.BAD_REQUEST

        quantity_raw = entry.get("requested_quantity")
        try:
            quantity = Decimal(str(quantity_raw))
        except (InvalidOperation, TypeError, ValueError):
            db.session.rollback()
            return jsonify(
                {"error": "requested_quantity must be numeric."}
            ), HTTPStatus.BAD_REQUEST

        if quantity <= 0:
            db.session.rollback()
            return jsonify(
                {"error": "requested_quantity must be greater than zero."}
            ), HTTPStatus.BAD_REQUEST

        estimated_cost_raw = entry.get("estimated_unit_cost")
        estimated_cost: Decimal | None
        if estimated_cost_raw is None or estimated_cost_raw == "":
            estimated_cost = None
        else:
            try:
                estimated_cost = Decimal(str(estimated_cost_raw))
            except (InvalidOperation, TypeError, ValueError):
                db.session.rollback()
                return jsonify(
                    {"error": "estimated_unit_cost must be numeric."}
                ), HTTPStatus.BAD_REQUEST

        db.session.add(
            StockPurchaseRequestItem(
                request_id=request_record.request_id,
                stock_item_id=stock_item.stock_item_id,
                requested_quantity=quantity,
                estimated_unit_cost=estimated_cost,
            )
        )

    db.session.commit()

    request_record = db.session.query(StockPurchaseRequest).options(
        joinedload(StockPurchaseRequest.items).joinedload(
            StockPurchaseRequestItem.stock_item
        ).joinedload(StockItem.unit),
        joinedload(StockPurchaseRequest.status),
    ).filter(StockPurchaseRequest.request_id == request_record.request_id).first()

    return jsonify(_serialize_request(request_record)), HTTPStatus.CREATED

def _ensure_request_access(
    request_obj: StockPurchaseRequest,
) -> tuple[dict[str, object], int] | None:
    try:
        resolve_branch_id_from_request(request_obj.branch_id)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    return None

@request_bp.route("", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def list_requests() -> tuple[list[dict[str, object]], int]:
    branch_id_param = request.args.get("branch_id", type=int)

    try:
        branch_id = resolve_branch_id_from_request(branch_id_param)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    records = (
        StockPurchaseRequest.query.options(
            joinedload(StockPurchaseRequest.items).joinedload(
                StockPurchaseRequestItem.stock_item
            ).joinedload(StockItem.unit),
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
    record = db.session.query(StockPurchaseRequest).options(
        joinedload(StockPurchaseRequest.items),
        joinedload(StockPurchaseRequest.branch),
    ).filter(StockPurchaseRequest.request_id == request_id).first()

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
        return jsonify(
            {"error": "Only pending requests can be approved."}
        ), HTTPStatus.BAD_REQUEST

    if not record.items:
        return jsonify(
            {"error": "Cannot approve a request without items."}
        ), HTTPStatus.BAD_REQUEST

    branch = record.branch or db.session.get(Branch, record.branch_id)
    if not branch:
        return jsonify(
            {"error": "Branch not found for this request."}
        ), HTTPStatus.NOT_FOUND

    try:
        transaction_type_id = get_transaction_type_id("IN")
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    current_user = getattr(g, "current_user", None)

    for item in record.items:
        apply_inventory_transaction(
            branch_id=branch.branch_id,
            stock_item_id=item.stock_item_id,
            quantity_delta=item.requested_quantity,
            transaction_type_id=transaction_type_id,
            unit_cost=item.estimated_unit_cost,
            created_by_user_id=current_user.user_id if current_user else None,
            approved_by_user_id=current_user.user_id if current_user else None,
            note=f"Auto-approved from request {record.request_id}",
        )

    record.status_id = approved_status_id
    record.approved_by_user_id = current_user.user_id if current_user else None
    record.approved_at = datetime.now(timezone.utc)

    db.session.commit()

    record = db.session.query(StockPurchaseRequest).options(
        joinedload(StockPurchaseRequest.items).joinedload(
            StockPurchaseRequestItem.stock_item
        ).joinedload(StockItem.unit),
        joinedload(StockPurchaseRequest.status),
    ).filter(StockPurchaseRequest.request_id == record.request_id).first()

    return jsonify(_serialize_request(record)), HTTPStatus.OK

@request_bp.route("/<int:request_id>/reject", methods=["PUT"])
@token_required({"BRANCH_OWNER"})
def reject_request(request_id: int) -> tuple[dict[str, object], int]:
    record = db.session.query(StockPurchaseRequest).options(
        joinedload(StockPurchaseRequest.branch)
    ).filter(StockPurchaseRequest.request_id == request_id).first()

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
        return jsonify(
            {"error": "Only pending requests can be rejected."}
        ), HTTPStatus.BAD_REQUEST

    record.status_id = rejected_status_id
    record.rejected_at = datetime.now(timezone.utc)

    db.session.commit()

    record = db.session.query(StockPurchaseRequest).options(
        joinedload(StockPurchaseRequest.items).joinedload(
            StockPurchaseRequestItem.stock_item
        ).joinedload(StockItem.unit),
        joinedload(StockPurchaseRequest.status),
    ).filter(StockPurchaseRequest.request_id == record.request_id).first()

    return jsonify(_serialize_request(record)), HTTPStatus.OK
