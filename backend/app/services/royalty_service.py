"""
Royalty calculation service — Phase 13.

Handles:
- Retrieving the active royalty configuration for a franchise
- Calculating franchisor and branch owner splits from sale totals
- Storing royalty records per sale (best-effort, caller commits)
- Aggregating royalty summaries per franchise or per branch
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import func

from ..extensions import db
from ..models import Branch, RoyaltyConfig, Sale, SaleRoyalty
from ..utils.db_helpers import month_bounds


def get_active_royalty_config(franchise_id: int) -> RoyaltyConfig | None:
    """Return the most recently created RoyaltyConfig for the given franchise, or None."""
    return (
        RoyaltyConfig.query.filter_by(franchise_id=franchise_id)
        .order_by(
            RoyaltyConfig.effective_from.desc(),
            RoyaltyConfig.royalty_config_id.desc(),
        )
        .first()
    )


def calculate_royalty_split(
    total_amount: Decimal,
    config: RoyaltyConfig,
) -> tuple[Decimal, Decimal]:
    """Return (franchisor_amount, branch_owner_amount) for a given sale total and config."""
    franchisor_amount = (
        total_amount * config.franchisor_cut_pct / Decimal("100")
    ).quantize(Decimal("0.01"))
    branch_owner_amount = total_amount - franchisor_amount
    return franchisor_amount, branch_owner_amount


def record_sale_royalty(
    sale_id: int,
    config: RoyaltyConfig,
    franchisor_amount: Decimal,
    branch_owner_amount: Decimal,
) -> SaleRoyalty:
    """Create and flush (do not commit) a SaleRoyalty record. Caller must commit."""
    royalty = SaleRoyalty(
        sale_id=sale_id,
        royalty_config_id=config.royalty_config_id,
        franchisor_amount=franchisor_amount,
        branch_owner_amount=branch_owner_amount,
    )
    db.session.add(royalty)
    db.session.flush()
    return royalty


def get_royalty_summary(
    franchise_id: int,
    month: int,
    year: int,
) -> list[dict]:
    """
    Return a per-branch royalty summary for the given month and year.
    Branches with no royalty data in the period are included with zeros.
    """
    start_date, end_date = month_bounds(date(year, month, 1))

    # Get all branches for this franchise
    branches = Branch.query.filter_by(franchise_id=franchise_id).all()

    # Query royalty totals grouped by branch
    rows = (
        db.session.query(
            Sale.branch_id,
            func.sum(Sale.total_amount).label("total_sales"),
            func.sum(SaleRoyalty.franchisor_amount).label("franchisor_earned"),
            func.sum(SaleRoyalty.branch_owner_amount).label("branch_owner_earned"),
            SaleRoyalty.royalty_config_id,
        )
        .join(SaleRoyalty, Sale.sale_id == SaleRoyalty.sale_id)
        .join(Branch, Sale.branch_id == Branch.branch_id)
        .filter(
            Branch.franchise_id == franchise_id,
            Sale.sale_datetime >= start_date,
            Sale.sale_datetime < end_date,
        )
        .group_by(Sale.branch_id, SaleRoyalty.royalty_config_id)
        .all()
    )

    # Index results by branch_id
    row_by_branch: dict[int, object] = {row.branch_id: row for row in rows}

    result = []
    for branch in branches:
        row = row_by_branch.get(branch.branch_id)
        if row:
            config = db.session.get(RoyaltyConfig, row.royalty_config_id)
            franchisor_cut_pct = float(config.franchisor_cut_pct) if config else 0.0
            result.append(
                {
                    "branch_id": branch.branch_id,
                    "branch_name": branch.name,
                    "total_sales": float(row.total_sales or 0),
                    "franchisor_earned": float(row.franchisor_earned or 0),
                    "branch_owner_earned": float(row.branch_owner_earned or 0),
                    "royalty_config_id": row.royalty_config_id,
                    "franchisor_cut_pct": franchisor_cut_pct,
                }
            )
        else:
            result.append(
                {
                    "branch_id": branch.branch_id,
                    "branch_name": branch.name,
                    "total_sales": 0.0,
                    "franchisor_earned": 0.0,
                    "branch_owner_earned": 0.0,
                    "royalty_config_id": None,
                    "franchisor_cut_pct": 0.0,
                }
            )

    return result


def get_branch_royalty_summary(
    branch_id: int,
    month: int,
    year: int,
) -> dict:
    """Return royalty summary for a single branch for the given month and year."""
    start_date, end_date = month_bounds(date(year, month, 1))

    branch = db.session.get(Branch, branch_id)
    branch_name = branch.name if branch else str(branch_id)

    row = (
        db.session.query(
            func.sum(Sale.total_amount).label("total_sales"),
            func.sum(SaleRoyalty.franchisor_amount).label("franchisor_earned"),
            func.sum(SaleRoyalty.branch_owner_amount).label("branch_owner_earned"),
            SaleRoyalty.royalty_config_id,
        )
        .join(SaleRoyalty, Sale.sale_id == SaleRoyalty.sale_id)
        .filter(
            Sale.branch_id == branch_id,
            Sale.sale_datetime >= start_date,
            Sale.sale_datetime < end_date,
        )
        .group_by(SaleRoyalty.royalty_config_id)
        .first()
    )

    if row:
        config = db.session.get(RoyaltyConfig, row.royalty_config_id)
        franchisor_cut_pct = float(config.franchisor_cut_pct) if config else 0.0
        return {
            "branch_id": branch_id,
            "branch_name": branch_name,
            "total_sales": float(row.total_sales or 0),
            "franchisor_earned": float(row.franchisor_earned or 0),
            "branch_owner_earned": float(row.branch_owner_earned or 0),
            "royalty_config_id": row.royalty_config_id,
            "franchisor_cut_pct": franchisor_cut_pct,
        }

    return {
        "branch_id": branch_id,
        "branch_name": branch_name,
        "total_sales": 0.0,
        "franchisor_earned": 0.0,
        "branch_owner_earned": 0.0,
        "royalty_config_id": None,
        "franchisor_cut_pct": 0.0,
    }


__all__ = [
    "get_active_royalty_config",
    "calculate_royalty_split",
    "record_sale_royalty",
    "get_royalty_summary",
    "get_branch_royalty_summary",
]
