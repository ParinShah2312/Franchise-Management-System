"""Financial reporting routes for franchise performance summaries."""

from __future__ import annotations

from datetime import date, datetime, timezone
from http import HTTPStatus

from flask import Blueprint, current_app, jsonify, request, g
import calendar
from ..extensions import db
from ..models import Report, ReportData, Branch, Franchise
from ..services.report_service import get_authorized_branch_ids, build_report_summary
from ..utils.security import token_required
from ..utils.db_helpers import month_bounds


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
@token_required({"FRANCHISOR", "BRANCH_OWNER", "MANAGER"})
def report_summary() -> tuple[dict[str, object], int]:
    try:
        month, year = _month_year()
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    start_date, end_date = month_bounds(date(year, month, 1))

    _role = getattr(g, "current_role", None)
    role_name = getattr(getattr(_role, "role", None), "name", None)
    current_user = getattr(g, "current_user", None)

    # ── Build summary data ──────────────────────────────────────────────────
    if role_name == "FRANCHISOR":
        if not current_user:
            return jsonify({"error": "Unauthorized."}), HTTPStatus.UNAUTHORIZED
        franchise = Franchise.query.filter_by(
            franchisor_id=current_user.franchisor_id
        ).first()
        if not franchise:
            return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND
        branch_ids = [
            b.branch_id
            for b in Branch.query.filter_by(franchise_id=franchise.franchise_id).all()
        ]
        month_name = calendar.month_name[month]
        summary_data = build_report_summary(
            branch_ids, month, year, start_date, end_date,
            include_royalty=True, franchise_id=franchise.franchise_id,
        )
        report_title = f"{franchise.name} - Report - {month_name} {year}"
        franchisor_id = current_user.franchisor_id
        generated_by_user_id = None
        report_type = "MASTER"
        report_branch_id = None
    else:
        branch_id_param = request.args.get("branch_id", type=int)
        branch_ids, error = _filter_branch_ids(branch_id_param)
        if error:
            return error
        summary_data = build_report_summary(
            branch_ids, month, year, start_date, end_date
        )
        # Resolve franchisor_id through the branch's franchise
        month_name = calendar.month_name[month]
        franchisor_id = None
        report_title = f"Report - {month_name} {year}"
        report_branch_id = branch_ids[0] if len(branch_ids) == 1 else None
        if report_branch_id:
            branch = db.session.get(Branch, report_branch_id)
            if branch:
                franchise = db.session.get(Franchise, branch.franchise_id)
                if franchise:
                    franchisor_id = franchise.franchisor_id
                    report_title = f"{franchise.name} - {branch.name} - {month_name} {year}"
        generated_by_user_id = getattr(current_user, "user_id", None)
        report_type = "BRANCH" if report_branch_id else "MASTER"

    # ── Persist report record ───────────────────────────────────────────────
    report_id = None
    if franchisor_id is not None:
        try:
            report_record = Report(
                generated_by_user_id=generated_by_user_id,
                franchisor_id=franchisor_id,
                branch_id=report_branch_id,
                report_type=report_type,
                period_start=start_date,
                period_end=end_date,
                created_at=datetime.now(timezone.utc),
            )
            db.session.add(report_record)
            db.session.flush()

            # Store key summary metrics as report_data rows
            data_entries = {
                "total_sales": str(summary_data.get("total_sales", 0)),
                "total_expenses": str(summary_data.get("total_expenses", 0)),
                "profit_loss": str(summary_data.get("profit_loss", 0)),
                "royalty_configured": str(summary_data.get("royalty_configured", False)),
                "branch_count": str(len(summary_data.get("branches", []))),
            }
            for key, value in data_entries.items():
                db.session.add(ReportData(
                    report_id=report_record.report_id,
                    data_key=key,
                    data_value=value,
                ))

            db.session.commit()
            report_id = report_record.report_id
        except Exception as exc:
            db.session.rollback()
            # Persistence failure must not break the report response
            current_app.logger.warning(
                "Failed to persist report record: %s", exc
            )

    # ── Return summary with report_id ───────────────────────────────────────
    response_data = {"report_id": report_id, "filename": report_title, **summary_data}
    return jsonify(response_data), HTTPStatus.OK
