"""Dashboard analytics routes for franchisors and operational managers."""

from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, g, jsonify, request
from ..utils.db_helpers import floatify
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
    SaleStatus,
    StockPurchaseRequest,
    StockPurchaseRequestItem,
    TransactionType,
)
from ..utils.security import token_required
from ..utils.branch_helpers import _current_role


dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/franchisor/metrics", methods=["GET"])
@token_required({"FRANCHISOR"})
def get_franchisor_metrics() -> tuple[dict[str, object], int]:
    """Return high-level metrics for the franchisor dashboard, scoped to their franchise."""
    current_user = getattr(g, "current_user", None)
    franchisor_id = getattr(current_user, "franchisor_id", None)

    if not franchisor_id:
        return jsonify({"error": "Franchisor context missing."}), HTTPStatus.FORBIDDEN

    total_revenue = (
        db.session.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .join(Branch, Sale.branch_id == Branch.branch_id)
        .join(Franchise, Branch.franchise_id == Franchise.franchise_id)
        .join(SaleStatus, Sale.status_id == SaleStatus.sale_status_id)
        .filter(
            SaleStatus.status_name == "PAID",
            Franchise.franchisor_id == franchisor_id,
        )
        .scalar()
        or 0
    )

    active_branches = (
        Branch.query
        .join(Franchise, Branch.franchise_id == Franchise.franchise_id)
        .join(BranchStatus, Branch.status_id == BranchStatus.status_id)
        .filter(
            BranchStatus.status_name == "ACTIVE",
            Franchise.franchisor_id == franchisor_id,
        ).count()
    )

    pending_applications = (
        FranchiseApplication.query
        .join(Franchise, FranchiseApplication.franchise_id == Franchise.franchise_id)
        .join(ApplicationStatus, FranchiseApplication.status_id == ApplicationStatus.status_id)
        .filter(
            ApplicationStatus.status_name == "PENDING",
            Franchise.franchisor_id == franchisor_id,
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
    """Aggregate metrics for a branch owner or manager, scoped to their branch."""

    branch_id_param = request.args.get("branch_id", type=int)
    role = _current_role()

    if not role or role.scope_type != "BRANCH":
        return jsonify({"error": "Branch-scoped role required."}), HTTPStatus.FORBIDDEN

    branch_id = role.scope_id
    if branch_id_param is not None and branch_id_param != branch_id:
        return jsonify({"error": "Unauthorized branch access."}), HTTPStatus.FORBIDDEN

    total_revenue = (
        db.session.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .join(SaleStatus, Sale.status_id == SaleStatus.sale_status_id)
        .filter(
            Sale.branch_id == branch_id,
            SaleStatus.status_name == "PAID",
        )
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
            InventoryTransaction.transaction_type_id == TransactionType.transaction_type_id,
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