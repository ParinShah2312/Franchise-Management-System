"""Dashboard analytics routes for admin users."""

from __future__ import annotations

from datetime import date
from http import HTTPStatus

from flask import Blueprint, jsonify
from sqlalchemy import func

from ..extensions import db
from ..models import Franchise, FranchiseStatus, Sales, UserRole
from ..utils.auth import login_required


def _floatify(value: object) -> float:
    """Best-effort conversion of numeric database values to float."""

    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _month_bounds(today: date) -> tuple[date, date]:
    """Return the inclusive/exclusive boundaries for the month of ``today``."""

    start = date(today.year, today.month, 1)
    if today.month == 12:
        end = date(today.year + 1, 1, 1)
    else:
        end = date(today.year, today.month + 1, 1)
    return start, end


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/metrics", methods=["GET"])
@login_required(roles=[UserRole.ADMIN])
def get_dashboard_metrics() -> tuple[dict[str, object], int]:
    """Aggregate high-level business metrics for the admin dashboard."""

    total_revenue = (
        db.session.query(func.coalesce(func.sum(Sales.total_amount), 0))
        .scalar()
        or 0
    )

    today = date.today()
    month_start, month_end = _month_bounds(today)
    monthly_revenue = (
        db.session.query(func.coalesce(func.sum(Sales.total_amount), 0))
        .filter(Sales.sale_date >= month_start, Sales.sale_date < month_end)
        .scalar()
        or 0
    )

    total_franchises = Franchise.query.count()
    active_franchises = Franchise.query.filter_by(status=FranchiseStatus.ACTIVE).count()
    pending_franchises = Franchise.query.filter_by(status=FranchiseStatus.PENDING).count()

    payload = {
        "total_revenue": _floatify(total_revenue),
        "monthly_revenue": _floatify(monthly_revenue),
        "total_franchises": total_franchises,
        "active_franchises": active_franchises,
        "pending_franchises": pending_franchises,
    }

    return jsonify(payload), HTTPStatus.OK


@dashboard_bp.route("/recent-sales", methods=["GET"])
@login_required(roles=[UserRole.ADMIN])
def get_recent_sales() -> tuple[list[dict[str, object]], int]:
    """Return the latest sales across all franchises for admin visibility."""

    # Join with Franchise to surface contextual details.
    results = (
        db.session.query(
            Sales.id.label("sale_id"),
            Sales.sale_date,
            Sales.total_amount,
            Sales.payment_mode,
            Sales.franchise_id,
            Franchise.name.label("franchise_name"),
            Franchise.owner_name.label("owner_name"),
        )
        .join(Franchise, Sales.franchise_id == Franchise.id)
        .order_by(Sales.sale_date.desc(), Sales.id.desc())
        .limit(10)
        .all()
    )

    sales_data: list[dict[str, object]] = []
    for row in results:
        sale_date = row.sale_date.isoformat() if hasattr(row.sale_date, "isoformat") else str(row.sale_date)
        sales_data.append(
            {
                "id": row.sale_id,
                "sale_date": sale_date,
                "total_amount": _floatify(row.total_amount),
                "payment_mode": row.payment_mode,
                "franchise_id": row.franchise_id,
                "franchise_name": row.franchise_name,
                "owner_name": row.owner_name,
            }
        )

    return jsonify(sales_data), HTTPStatus.OK
