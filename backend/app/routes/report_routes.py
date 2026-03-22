"""Financial reporting routes for franchise performance summaries."""

from __future__ import annotations

from datetime import date
from http import HTTPStatus

from flask import Blueprint, jsonify, request, g
from ..services.report_service import get_authorized_branch_ids, build_report_summary
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




def _filter_branch_ids(
    requested_branch_id: int | None,
) -> tuple[list[int], tuple[dict[str, object], int] | None]:
    allowed = get_authorized_branch_ids(getattr(g, 'current_role', None))

    if requested_branch_id is not None:
        if allowed and requested_branch_id not in allowed:
            return [], (
                jsonify({"error": "Unauthorized branch access."}),
                HTTPStatus.FORBIDDEN,
            )
        return [requested_branch_id], None

    if allowed:
        return list(allowed), None

    return [], (
        jsonify({"error": "No branches available for reporting."}),
        HTTPStatus.BAD_REQUEST,
    )






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

    return jsonify(build_report_summary(branch_ids, month, year, start_date, end_date)), HTTPStatus.OK
