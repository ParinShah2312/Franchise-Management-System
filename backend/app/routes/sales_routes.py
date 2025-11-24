"""Sales management routes."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from ..extensions import db
from ..models import Franchise, FranchiseStatus, Sales, UserRole
from ..utils.auth import current_user, login_required


sales_bp = Blueprint("sales", __name__, url_prefix="/api/sales")


def _serialize_sale(sale: Sales) -> dict[str, object]:
    if isinstance(sale.sale_date, (datetime, date)):
        sale_date = sale.sale_date.isoformat()
    else:
        sale_date = str(sale.sale_date)

    return {
        "id": sale.id,
        "franchise_id": sale.franchise_id,
        "sale_date": sale_date,
        "total_amount": float(sale.total_amount),
        "payment_mode": sale.payment_mode,
        "entered_by": sale.entered_by,
    }


@sales_bp.route("", methods=["POST"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE, UserRole.STAFF])
def create_sale() -> tuple[dict[str, object], int]:
    """Create a sale entry for the authenticated user's franchise."""

    user = current_user()
    payload = request.get_json(silent=True) or {}

    if user.role == UserRole.ADMIN:
        franchise_id = payload.get("franchise_id")
    else:
        franchise_id = user.franchise_id

    if not franchise_id:
        return jsonify({"error": "Franchise association is required."}), HTTPStatus.BAD_REQUEST

    franchise = Franchise.query.get(franchise_id)
    if not franchise or franchise.status != FranchiseStatus.ACTIVE:
        return jsonify({"error": "Franchise must exist and be active."}), HTTPStatus.BAD_REQUEST

    # Ensure staff users only submit for their franchise
    if user.role == UserRole.STAFF and franchise_id != user.franchise_id:
        return jsonify({"error": "Unauthorized franchise access."}), HTTPStatus.FORBIDDEN

    sale_date_raw = payload.get("sale_date")
    try:
        sale_date = datetime.fromisoformat(sale_date_raw).date() if sale_date_raw else datetime.utcnow().date()
    except ValueError:
        return jsonify({"error": "Invalid sale_date format."}), HTTPStatus.BAD_REQUEST

    raw_amount = payload.get("total_amount")
    if raw_amount is None:
        return jsonify({"error": "total_amount is required."}), HTTPStatus.BAD_REQUEST

    try:
        total_amount = Decimal(str(raw_amount))
    except (InvalidOperation, TypeError):
        return jsonify({"error": "total_amount must be numeric."}), HTTPStatus.BAD_REQUEST

    sale = Sales(
        franchise_id=franchise_id,
        sale_date=sale_date,
        total_amount=total_amount,
        payment_mode=payload.get("payment_mode"),
        entered_by=user.id,
    )

    try:
        db.session.add(sale)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Unable to create sale."}), HTTPStatus.BAD_REQUEST

    return jsonify(_serialize_sale(sale)), HTTPStatus.CREATED


@sales_bp.route("", methods=["GET"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE, UserRole.STAFF])
def list_sales() -> tuple[list[dict[str, object]], int]:
    """Return sales scoped to the requesting user's franchise unless admin."""

    user = current_user()

    if user.role == UserRole.ADMIN:
        sales = Sales.query.order_by(Sales.sale_date.desc()).all()
    else:
        sales = (
            Sales.query.filter_by(franchise_id=user.franchise_id)
            .order_by(Sales.sale_date.desc())
            .all()
        )

    return jsonify([_serialize_sale(sale) for sale in sales]), HTTPStatus.OK
