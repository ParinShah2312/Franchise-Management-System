"""Inventory management routes."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Franchise, FranchiseStatus, Inventory, Notification, UserRole
from ..utils.auth import current_user, login_required


inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


def _serialize_item(item: Inventory) -> dict[str, object]:
    return {
        "id": item.id,
        "franchise_id": item.franchise_id,
        "item_name": item.item_name,
        "category": item.category,
        "quantity": item.quantity,
        "reorder_level": item.reorder_level,
        "unit_price": float(item.unit_price) if item.unit_price is not None else None,
        "updated_at": item.updated_at.isoformat() if isinstance(item.updated_at, datetime) else None,
    }


def _resolve_franchise_id(user, explicit_franchise_id: int | None) -> tuple[int | None, tuple[dict[str, object], int] | None]:
    """Determine the franchise ID for the request, enforcing role constraints."""

    if user.role == UserRole.ADMIN:
        return explicit_franchise_id, None

    if not user.franchise_id:
        return None, (jsonify({"error": "User is not associated with a franchise."}), HTTPStatus.BAD_REQUEST)

    if explicit_franchise_id and explicit_franchise_id != user.franchise_id:
        return None, (jsonify({"error": "Unauthorized franchise access."}), HTTPStatus.FORBIDDEN)

    return user.franchise_id, None


@inventory_bp.route("", methods=["GET"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE, UserRole.STAFF])
def list_inventory() -> tuple[list[dict[str, object]], int]:
    """List inventory items scoped to the appropriate franchise."""

    user = current_user()
    requested_franchise = request.args.get("franchise_id", type=int)
    franchise_id, error = _resolve_franchise_id(user, requested_franchise)
    if error:
        return error

    query = Inventory.query
    if franchise_id:
        query = query.filter_by(franchise_id=franchise_id)

    items = query.order_by(Inventory.item_name.asc()).all()
    return jsonify([_serialize_item(item) for item in items]), HTTPStatus.OK


@inventory_bp.route("", methods=["POST"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE, UserRole.STAFF])
def create_inventory_item() -> tuple[dict[str, object], int]:
    """Create a new inventory item for the target franchise."""

    user = current_user()
    payload = request.get_json(silent=True) or {}

    franchise_id_raw = payload.get("franchise_id")
    if franchise_id_raw is not None:
        try:
            franchise_id_candidate = int(franchise_id_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "franchise_id must be an integer."}), HTTPStatus.BAD_REQUEST
    else:
        franchise_id_candidate = None

    franchise_id, error = _resolve_franchise_id(user, franchise_id_candidate)
    if error:
        return error

    if not franchise_id:
        return jsonify({"error": "franchise_id is required."}), HTTPStatus.BAD_REQUEST

    franchise = Franchise.query.get(franchise_id)
    if not franchise or franchise.status != FranchiseStatus.ACTIVE:
        return jsonify({"error": "Franchise must exist and be active."}), HTTPStatus.BAD_REQUEST

    required_fields = ["item_name", "quantity"]
    missing_fields = [field for field in required_fields if not payload.get(field)]
    if missing_fields:
        return (
            jsonify({"error": f"Missing required fields: {', '.join(sorted(set(missing_fields)))}"}),
            HTTPStatus.BAD_REQUEST,
        )

    try:
        quantity = int(payload.get("quantity", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be an integer."}), HTTPStatus.BAD_REQUEST

    reorder_level = payload.get("reorder_level")
    try:
        reorder_value = int(reorder_level) if reorder_level is not None else None
    except (TypeError, ValueError):
        return jsonify({"error": "reorder_level must be an integer."}), HTTPStatus.BAD_REQUEST

    unit_price_raw = payload.get("unit_price")
    if unit_price_raw is not None:
        try:
            unit_price = Decimal(str(unit_price_raw))
        except (InvalidOperation, TypeError):
            return jsonify({"error": "unit_price must be numeric."}), HTTPStatus.BAD_REQUEST
    else:
        unit_price = None

    item = Inventory(
        franchise_id=franchise_id,
        item_name=payload["item_name"],
        category=payload.get("category"),
        quantity=quantity,
        reorder_level=reorder_value,
        unit_price=unit_price,
    )

    db.session.add(item)
    db.session.commit()

    return jsonify(_serialize_item(item)), HTTPStatus.CREATED


@inventory_bp.route("/<int:item_id>", methods=["PUT"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE, UserRole.STAFF])
def update_inventory(item_id: int) -> tuple[dict[str, object], int]:
    """Update inventory quantity (and optionally reorder level) for an item."""

    user = current_user()
    payload = request.get_json(silent=True) or {}

    item = Inventory.query.get(item_id)
    if not item:
        return jsonify({"error": "Inventory item not found."}), HTTPStatus.NOT_FOUND

    franchise_id_raw = payload.get("franchise_id")
    if franchise_id_raw is not None:
        try:
            franchise_id_candidate = int(franchise_id_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "franchise_id must be an integer."}), HTTPStatus.BAD_REQUEST
    else:
        franchise_id_candidate = None

    franchise_id, error = _resolve_franchise_id(user, franchise_id_candidate)
    if error:
        return error

    if franchise_id and item.franchise_id != franchise_id:
        return jsonify({"error": "Inventory item does not belong to this franchise."}), HTTPStatus.FORBIDDEN

    if user.role != UserRole.ADMIN and item.franchise_id != user.franchise_id:
        return jsonify({"error": "Unauthorized inventory access."}), HTTPStatus.FORBIDDEN

    quantity_raw = payload.get("quantity")
    if quantity_raw is None:
        return jsonify({"error": "quantity is required."}), HTTPStatus.BAD_REQUEST

    try:
        new_quantity = int(quantity_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be an integer."}), HTTPStatus.BAD_REQUEST

    reorder_level_raw = payload.get("reorder_level")
    if reorder_level_raw is not None:
        try:
            item.reorder_level = int(reorder_level_raw)
        except (TypeError, ValueError):
            return jsonify({"error": "reorder_level must be an integer."}), HTTPStatus.BAD_REQUEST

    item.quantity = new_quantity

    should_alert = (
        item.reorder_level is not None
        and item.quantity <= item.reorder_level
    )

    owner = item.franchise.owner if should_alert else None

    notification = None
    if should_alert and owner:
        notification = Notification(
            user_id=owner.id,
            message=f"Alert: {item.item_name} is low on stock.",
            type="inventory",
        )
        db.session.add(notification)

    db.session.commit()

    return jsonify(_serialize_item(item)), HTTPStatus.OK
