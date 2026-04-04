"""Dashboard analytics routes for admin users."""

from __future__ import annotations

from datetime import date
from http import HTTPStatus

from flask import Blueprint, jsonify
from ..utils.db_helpers import floatify, month_bounds, serialize_dt
from sqlalchemy import func

from ..extensions import db
from ..models import (
    ApplicationStatus,
    BranchStatus,
    Branch,
    Franchise,
    FranchiseApplication,
    InventoryTransaction,
    Sale,
    StockPurchaseRequest,
    StockPurchaseRequestItem,
    TransactionType,
)
from ..utils.security import token_required



dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/franchisor/metrics", methods=["GET"])
@token_required({"FRANCHISOR"})
def get_franchisor_metrics() -> tuple[dict[str, object], int]:
    """Return high-level metrics required for the franchisor dashboard."""
    from flask import g
    current_user = getattr(g, "current_user", None)
    franchisor_id = getattr(current_user, "franchisor_id", None)

    if not franchisor_id:
        return jsonify({"error": "Franchisor context missing."}), HTTPStatus.FORBIDDEN

    total_revenue = (
        db.session.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .join(Branch, Sale.branch_id == Branch.branch_id)
        .join(Franchise, Branch.franchise_id == Franchise.franchise_id)
        .filter(
            Sale.status_id == 1,
            Franchise.franchisor_id == franchisor_id
        )
        .scalar()
        or 0
    )

    active_branches = (
        Branch.query
        .join(Franchise, Branch.franchise_id == Franchise.franchise_id)
        .filter(
            Branch.status_id == 1,
            Franchise.franchisor_id == franchisor_id
        ).count()
    )

    pending_applications = (
        FranchiseApplication.query
        .join(Franchise, FranchiseApplication.franchise_id == Franchise.franchise_id)
        .filter(
            FranchiseApplication.status_id == 1,
            Franchise.franchisor_id == franchisor_id
        ).count()
    )

    payload = {
        "revenue": floatify(total_revenue),
        "branches": active_branches,
        "pending_apps": pending_applications,
    }

    return jsonify(payload), HTTPStatus.OK


@dashboard_bp.route("/branch/metrics", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def get_branch_metrics() -> tuple[dict[str, object], int]:
    """Aggregate metrics for a branch owner scoped to their branch."""

    from flask import g, request

    branch_id_param = request.args.get("branch_id", type=int)
    role = getattr(g, "current_role", None)

    if not role or role.scope_type != "BRANCH":
        return jsonify({"error": "Branch-scoped role required."}), HTTPStatus.FORBIDDEN

    branch_id = role.scope_id
    if branch_id_param is not None and branch_id_param != branch_id:
        return jsonify({"error": "Unauthorized branch access."}), HTTPStatus.FORBIDDEN

    total_revenue = (
        db.session.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(Sale.branch_id == branch_id)
        .scalar()
        or 0
    )

    inventory_value = (
        db.session.query(
            func.coalesce(
                func.sum(
                    InventoryTransaction.quantity_change
                    * func.coalesce(InventoryTransaction.unit_cost, 0)
                ),
                0,
            )
        )
        .join(
            TransactionType,
            InventoryTransaction.transaction_type_id
            == TransactionType.transaction_type_id,
        )
        .filter(
            InventoryTransaction.branch_id == branch_id,
            TransactionType.type_name == "IN",
        )
        .scalar()
        or 0
    )

    pending_requests = (
        db.session.query(func.count(StockPurchaseRequest.request_id))
        .filter(
            StockPurchaseRequest.branch_id == branch_id,
            StockPurchaseRequest.status.has(status_name="PENDING"),
        )
        .scalar()
        or 0
    )

    pending_items = (
        db.session.query(
            func.coalesce(
                func.sum(StockPurchaseRequestItem.requested_quantity),
                0,
            )
        )
        .join(
            StockPurchaseRequest,
            StockPurchaseRequest.request_id == StockPurchaseRequestItem.request_id,
        )
        .filter(
            StockPurchaseRequest.branch_id == branch_id,
            StockPurchaseRequest.status.has(status_name="PENDING"),
        )
        .scalar()
        or 0
    )

    payload = {
        "revenue": floatify(total_revenue),
        "inventory_value": floatify(inventory_value),
        "pending_requests": int(pending_requests),
        "pending_items": floatify(pending_items),
    }

    return jsonify(payload), HTTPStatus.OK


@dashboard_bp.route("/metrics", methods=["GET"])
@token_required({"FRANCHISOR"})
def get_dashboard_metrics() -> tuple[dict[str, object], int]:
    """Aggregate high-level business metrics for the admin dashboard."""

    total_revenue = (
        db.session.query(func.coalesce(func.sum(Sale.total_amount), 0)).scalar() or 0
    )

    today = date.today()
    month_start, month_end = month_bounds(today)
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
            ApplicationStatus,
            FranchiseApplication.status_id == ApplicationStatus.status_id,
        )
        .filter(ApplicationStatus.status_name == "PENDING")
        .count()
    )

    payload = {
        "total_revenue": floatify(total_revenue),
        "monthly_revenue": floatify(monthly_revenue),
        "total_franchises": total_franchises,
        "active_branches": active_branches,
        "pending_applications": pending_applications,
    }

    return jsonify(payload), HTTPStatus.OK


@dashboard_bp.route("/recent-sales", methods=["GET"])
@token_required({"FRANCHISOR"})
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
            serialize_dt(row.sale_datetime)
            if hasattr(row.sale_datetime, "isoformat")
            else str(row.sale_datetime)
        )
        sales_data.append(
            {
                "id": row.sale_id,
                "sale_datetime": sale_datetime,
                "total_amount": floatify(row.total_amount),
                "branch_id": row.branch_id,
                "branch_name": row.branch_name,
                "franchise_id": row.franchise_id,
                "franchise_name": row.franchise_name,
            }
        )

    return jsonify(sales_data), HTTPStatus.OK
