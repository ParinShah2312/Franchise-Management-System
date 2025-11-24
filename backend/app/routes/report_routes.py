"""Financial reporting routes for franchises."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from http import HTTPStatus

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from ..extensions import db
from ..models import Expense, Franchise, FranchiseStatus, Report, Sales, UserRole
from ..utils.auth import current_user, login_required


report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _parse_period() -> tuple[int, int]:
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    if month is None or year is None:
        raise ValueError("month and year query parameters are required.")

    if month < 1 or month > 12:
        raise ValueError("month must be between 1 and 12.")

    return month, year


def _calculate_bounds(year: int, month: int) -> tuple[date, date]:
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    return start_date, end_date


def _resolve_franchise(user, requested_id: int | None) -> tuple[int | None, tuple[dict[str, object], int] | None]:
    if user.role == UserRole.ADMIN:
        return requested_id, None

    if not user.franchise_id:
        return None, (jsonify({"error": "User is not associated with a franchise."}), HTTPStatus.BAD_REQUEST)

    if requested_id and requested_id != user.franchise_id:
        return None, (jsonify({"error": "Unauthorized franchise access."}), HTTPStatus.FORBIDDEN)

    return user.franchise_id, None


def _get_totals(franchise_id: int, start: date, end: date) -> tuple[Decimal, Decimal]:
    sales_total = (
        db.session.query(func.coalesce(func.sum(Sales.total_amount), 0))
        .filter(Sales.franchise_id == franchise_id, Sales.sale_date >= start, Sales.sale_date < end)
        .scalar()
    )

    expenses_total = (
        db.session.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.franchise_id == franchise_id, Expense.expense_date >= start, Expense.expense_date < end)
        .scalar()
    )

    return Decimal(sales_total), Decimal(expenses_total)


@report_bp.route("/summary", methods=["GET"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE])
def report_summary() -> tuple[dict[str, object], int]:
    """Return sales, expenses, and profit for a specific period."""

    user = current_user()

    try:
        month, year = _parse_period()
    except ValueError as exc:  # pragma: no cover - simple validation
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    requested_franchise = request.args.get("franchise_id", type=int)
    franchise_id, error = _resolve_franchise(user, requested_franchise)
    if error:
        return error

    if not franchise_id:
        return jsonify({"error": "franchise_id is required for this report."}), HTTPStatus.BAD_REQUEST

    franchise = Franchise.query.get(franchise_id)
    if not franchise or franchise.status != FranchiseStatus.ACTIVE:
        return jsonify({"error": "Franchise must exist and be active."}), HTTPStatus.BAD_REQUEST

    start_date, end_date = _calculate_bounds(year, month)
    total_sales, total_expenses = _get_totals(franchise_id, start_date, end_date)
    profit = total_sales - total_expenses

    month_year = f"{year:04d}-{month:02d}"
    report = Report.query.filter_by(franchise_id=franchise_id, month_year=month_year).first()
    if not report:
        report = Report(
            franchise_id=franchise_id,
            month_year=month_year,
            total_sales=total_sales,
            total_expenses=total_expenses,
            profit_loss=profit,
        )
        db.session.add(report)
    else:
        report.total_sales = total_sales
        report.total_expenses = total_expenses
        report.profit_loss = profit

    db.session.commit()

    return (
        jsonify(
            {
                "franchise_id": franchise_id,
                "month": month,
                "year": year,
                "total_sales": float(total_sales),
                "total_expenses": float(total_expenses),
                "profit_loss": float(profit),
            }
        ),
        HTTPStatus.OK,
    )
