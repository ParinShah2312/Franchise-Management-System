"""Dashboard analytics routes for admin users."""

from __future__ import annotations

from datetime import date
from http import HTTPStatus

from flask import Blueprint, jsonify
from sqlalchemy import func

from ..extensions import db
from ..models import (
    ApplicationStatus,
    Branch,
    BranchStatus,
    Franchise,
    FranchiseApplication,
    Sale,
)
from ..utils.security import token_required


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
@token_required({"SYSTEM_ADMIN"})
def get_dashboard_metrics() -> tuple[dict[str, object], int]:
    """Aggregate high-level business metrics for the admin dashboard."""

    total_revenue = (
        db.session.query(func.coalesce(func.sum(Sale.total_amount), 0)).scalar() or 0
    )

    today = date.today()
    month_start, month_end = _month_bounds(today)
    monthly_revenue = (
        db.session.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(Sale.sale_datetime >= month_start, Sale.sale_datetime < month_end)
        .scalar()
        or 0
    )

    total_franchises = Franchise.query.count()
    active_branches = (
        Branch.query.join(BranchStatus, Branch.status_id == BranchStatus.status_id)
        .filter(BranchStatus.status_name == "ACTIVE")
        .count()
    )
    pending_applications = (
        FranchiseApplication.query.join(
            ApplicationStatus, FranchiseApplication.status_id == ApplicationStatus.status_id
        )
        .filter(ApplicationStatus.status_name == "PENDING")
        .count()
    )

    payload = {
        "total_revenue": _floatify(total_revenue),
        "monthly_revenue": _floatify(monthly_revenue),
        "total_franchises": total_franchises,
        "active_branches": active_branches,
        "pending_applications": pending_applications,
    }

    return jsonify(payload), HTTPStatus.OK


@dashboard_bp.route("/recent-sales", methods=["GET"])
@token_required({"SYSTEM_ADMIN"})
def get_recent_sales() -> tuple[list[dict[str, object]], int]:
    """Return the latest sales across all franchises for admin visibility."""

    # Join with Franchise to surface contextual details.
    results = (
        db.session.query(
            Sale.sale_id,
            Sale.sale_datetime,
            Sale.total_amount,
            Branch.branch_id,
            Branch.name.label("branch_name"),
            Franchise.franchise_id,
            Franchise.name.label("franchise_name"),
        )
        .join(Branch, Sale.branch_id == Branch.branch_id)
        .join(Franchise, Branch.franchise_id == Franchise.franchise_id)
        .order_by(Sale.sale_datetime.desc(), Sale.sale_id.desc())
        .limit(10)
        .all()
    )

    sales_data: list[dict[str, object]] = []
    for row in results:
        sale_datetime = (
            row.sale_datetime.isoformat()
            if hasattr(row.sale_datetime, "isoformat")
            else str(row.sale_datetime)
        )
        sales_data.append(
            {
                "id": row.sale_id,
                "sale_datetime": sale_datetime,
                "total_amount": _floatify(row.total_amount),
                "branch_id": row.branch_id,
                "branch_name": row.branch_name,
                "franchise_id": row.franchise_id,
                "franchise_name": row.franchise_name,
            }
        )

    return jsonify(sales_data), HTTPStatus.OK
