"""
Report generation service.

Handles all data aggregation for financial reports. Functions in this
module are called by report route handlers and must be called within
an active Flask application context.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import func

from ..extensions import db
from ..models import Branch, Sale


def get_sales_total(
    branch_ids: list[int],
    start_date: date,
    end_date: date,
) -> Decimal:
    """
    Return the total sales amount across the given branches
    for the period [start_date, end_date).

    Args:
        branch_ids: List of branch IDs to include
        start_date: Inclusive start of the period
        end_date: Exclusive end of the period

    Returns:
        Total as a Decimal, or Decimal("0") if no sales found
    """
    query = db.session.query(
        func.coalesce(func.sum(Sale.total_amount), 0)
    ).filter(
        Sale.sale_datetime >= start_date,
        Sale.sale_datetime < end_date,
    )
    if branch_ids:
        query = query.filter(Sale.branch_id.in_(branch_ids))

    return Decimal(query.scalar() or 0)


def get_branch_sales_breakdown(
    branch_ids: list[int],
    start_date: date,
    end_date: date,
) -> list[dict]:
    """
    Return a per-branch breakdown of total sales for the given period.

    Args:
        branch_ids: List of branch IDs to include
        start_date: Inclusive start of the period
        end_date: Exclusive end of the period

    Returns:
        List of dicts with keys: branch_id, branch_name, total_sales
        Ordered by branch name ascending.
        Branches with no sales in the period return total_sales=0.0
    """
    if not branch_ids:
        return []

    rows = (
        db.session.query(
            Branch.branch_id,
            Branch.name,
            func.coalesce(func.sum(Sale.total_amount), 0).label("total_sales"),
        )
        .outerjoin(
            Sale,
            (Sale.branch_id == Branch.branch_id)
            & (Sale.sale_datetime >= start_date)
            & (Sale.sale_datetime < end_date),
        )
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


def get_authorized_branch_ids(role) -> set[int]:
    """
    Return the set of branch IDs accessible to the given user role.

    For BRANCH scope: returns the single branch ID from the role.
    For FRANCHISE scope: returns all branch IDs belonging to that franchise.
    For any other scope: returns an empty set.

    Args:
        role: The UserRole object from g.current_role

    Returns:
        Set of integer branch IDs
    """
    if not role:
        return set()

    if role.scope_type == "BRANCH":
        return {role.scope_id}

    if role.scope_type == "FRANCHISE":
        branches = (
            Branch.query.with_entities(Branch.branch_id)
            .filter_by(franchise_id=role.scope_id)
            .all()
        )
        return {branch_id for (branch_id,) in branches}

    return set()


def build_report_summary(
    branch_ids: list[int],
    month: int,
    year: int,
    start_date: date,
    end_date: date,
) -> dict:
    """
    Build a complete report summary dict for the given branches and period.

    Args:
        branch_ids: Branches to include in the report
        month: Report month (1-12)
        year: Report year
        start_date: Inclusive start date of the period
        end_date: Exclusive end date of the period

    Returns:
        Dict with keys: month, year, branch_ids, total_sales,
        total_expenses, profit_loss, branches
    """
    total_sales = get_sales_total(branch_ids, start_date, end_date)
    total_expenses = Decimal("0")  # Expense tracking not yet implemented
    profit = total_sales - total_expenses

    return {
        "month": month,
        "year": year,
        "branch_ids": branch_ids,
        "total_sales": float(total_sales),
        "total_expenses": float(total_expenses),
        "profit_loss": float(profit),
        "branches": get_branch_sales_breakdown(branch_ids, start_date, end_date),
    }
