"""Financial reporting routes for franchise performance summaries."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from http import HTTPStatus

from flask import Blueprint, jsonify, request, g
from sqlalchemy import func

from ..extensions import db
from ..models import Branch, Sale
from ..utils.security import token_required


report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _month_year() -> tuple[int, int]:
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    today = date.today()
    month = month or today.month
    year = year or today.year

    if month < 1 or month > 12:
        raise ValueError("month must be between 1 and 12.")

    return month, year


def _period_bounds(year: int, month: int) -> tuple[date, date]:
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    return start_date, end_date


def _authorized_branch_ids() -> set[int]:
    role = getattr(g, "current_role", None)
    if not role:
        return set()

    if role.scope_type == "BRANCH":
        return {role.scope_id}

    if role.scope_type == "FRANCHISE":
        branches = Branch.query.with_entities(Branch.branch_id).filter_by(franchise_id=role.scope_id).all()
        return {branch_id for (branch_id,) in branches}

    return set()


def _filter_branch_ids(requested_branch_id: int | None) -> tuple[list[int], tuple[dict[str, object], int] | None]:
    allowed = _authorized_branch_ids()

    if requested_branch_id is not None:
        if allowed and requested_branch_id not in allowed:
            return [], (jsonify({"error": "Unauthorized branch access."}), HTTPStatus.FORBIDDEN)
        return [requested_branch_id], None

    if allowed:
        return list(allowed), None

    return [], (jsonify({"error": "No branches available for reporting."}), HTTPStatus.BAD_REQUEST)


def _sales_total(branch_ids: list[int], start: date, end: date) -> Decimal:
    query = db.session.query(func.coalesce(func.sum(Sale.total_amount), 0)).filter(
        Sale.sale_datetime >= start,
        Sale.sale_datetime < end,
    )
    if branch_ids:
        query = query.filter(Sale.branch_id.in_(branch_ids))

    return Decimal(query.scalar() or 0)


def _branch_breakdown(branch_ids: list[int], start: date, end: date) -> list[dict[str, object]]:
    if not branch_ids:
        return []

    rows = (
        db.session.query(
            Branch.branch_id,
            Branch.name,
            func.coalesce(func.sum(Sale.total_amount), 0).label("total_sales"),
        )
        .outerjoin(Sale, (Sale.branch_id == Branch.branch_id) & (Sale.sale_datetime >= start) & (Sale.sale_datetime < end))
        .filter(Branch.branch_id.in_(branch_ids))
        .group_by(Branch.branch_id, Branch.name)
        .order_by(Branch.name.asc())
        .all()
    )

    return [
        {
            "branch_id": branch_id,
            "branch_name": name,
            "total_sales": float(total_sales or 0),
        }
        for branch_id, name, total_sales in rows
    ]


@report_bp.route("/summary", methods=["GET"])
@token_required({"SYSTEM_ADMIN", "BRANCH_OWNER", "MANAGER"})
def report_summary() -> tuple[dict[str, object], int]:
    try:
        month, year = _month_year()
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    start_date, end_date = _period_bounds(year, month)

    branch_id_param = request.args.get("branch_id", type=int)
    branch_ids, error = _filter_branch_ids(branch_id_param)
    if error:
        return error

    total_sales = _sales_total(branch_ids, start_date, end_date)
    total_expenses = Decimal("0")  # Expense tracking not implemented in new schema
    profit = total_sales - total_expenses

    return (
        jsonify(
            {
                "month": month,
                "year": year,
                "branch_ids": branch_ids,
                "total_sales": float(total_sales),
                "total_expenses": float(total_expenses),
                "profit_loss": float(profit),
                "branches": _branch_breakdown(branch_ids, start_date, end_date),
            }
        ),
        HTTPStatus.OK,
    )
