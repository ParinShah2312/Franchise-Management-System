"""Database utility helpers shared across route handlers."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from ..extensions import db
from ..models import BranchInventory


def get_or_create_inventory(
    branch_id: int, stock_item_id: int
) -> BranchInventory:
    """
    Return the BranchInventory record for the given branch and stock item.
    If no record exists, create one with quantity=0 and flush to the session.

    Must be called within an active database session.
    The caller is responsible for committing the session.
    """
    record = BranchInventory.query.filter_by(
        branch_id=branch_id,
        stock_item_id=stock_item_id,
    ).first()

    if record:
        return record

    record = BranchInventory(
        branch_id=branch_id,
        stock_item_id=stock_item_id,
        quantity=Decimal("0"),
    )
    db.session.add(record)
    db.session.flush()
    return record


def floatify(value: object) -> float:
    """
    Best-effort conversion of a numeric database value to float.
    Returns 0.0 if the value is None or cannot be converted.
    """
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def month_bounds(today: date) -> tuple[date, date]:
    """
    Return the inclusive start date and exclusive end date
    for the calendar month containing the given date.

    Example: month_bounds(date(2025, 3, 15)) → (date(2025,3,1), date(2025,4,1))
    """
    start = date(today.year, today.month, 1)
    if today.month == 12:
        end = date(today.year + 1, 1, 1)
    else:
        end = date(today.year, today.month + 1, 1)
    return start, end


def serialize_dt(dt: object) -> str | None:
    """
    Serialize a datetime to an ISO 8601 string.
    If the datetime is timezone-naive (as returned by SQLite), append +00:00 so
    that browsers correctly interpret it as UTC rather than local time.
    Returns None if dt is None.
    """
    from datetime import datetime, timezone as _tz
    if dt is None:
        return None
    if not isinstance(dt, datetime):
        return str(dt)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=_tz.utc)
    return dt.isoformat()
