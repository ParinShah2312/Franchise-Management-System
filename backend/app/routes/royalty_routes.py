"""Royalty configuration and summary routes."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import Branch, Franchise, Franchisor, RoyaltyConfig
from ..services.royalty_service import (
    get_active_royalty_config,
    get_branch_royalty_summary,
    get_royalty_summary,
)
from ..utils.security import token_required
from ..utils.db_helpers import serialize_dt


royalty_bp = Blueprint("royalty", __name__, url_prefix="/api/royalty")


def _get_franchisor_franchise() -> tuple[Franchisor | None, Franchise | None]:
    """Return (franchisor, franchise) for the current FRANCHISOR user, or raise."""
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return None, None
    franchise = Franchise.query.filter_by(
        franchisor_id=franchisor.franchisor_id
    ).first()
    return franchisor, franchise


def _serialize_config(config: RoyaltyConfig) -> dict[str, object]:
    return {
        "royalty_config_id": config.royalty_config_id,
        "franchise_id": config.franchise_id,
        "franchisor_cut_pct": float(config.franchisor_cut_pct),
        "branch_owner_cut_pct": float(config.branch_owner_cut_pct),
        "effective_from": config.effective_from.isoformat(),
        "created_at": serialize_dt(config.created_at),
    }


# ---------------------------------------------------------------------------
# GET /api/royalty/config
# ---------------------------------------------------------------------------

@royalty_bp.route("/config", methods=["GET"])
@token_required({"FRANCHISOR"})
def get_royalty_config() -> tuple[dict[str, object], int]:
    _, franchise = _get_franchisor_franchise()
    if not franchise:
        return jsonify({"error": "No franchise found for this franchisor."}), HTTPStatus.NOT_FOUND

    config = get_active_royalty_config(franchise.franchise_id)
    if not config:
        return jsonify({"configured": False, "config": None}), HTTPStatus.OK

    return jsonify({"configured": True, "config": _serialize_config(config)}), HTTPStatus.OK


# ---------------------------------------------------------------------------
# POST /api/royalty/config
# ---------------------------------------------------------------------------

@royalty_bp.route("/config", methods=["POST"])
@token_required({"FRANCHISOR"})
def create_royalty_config() -> tuple[dict, int]:
    franchisor, franchise = _get_franchisor_franchise()
    if not franchise:
        return jsonify({"error": "No franchise found for this franchisor."}), HTTPStatus.NOT_FOUND

    payload = request.get_json(silent=True) or {}
    franchisor_cut_raw = payload.get("franchisor_cut_pct")
    effective_from_raw = payload.get("effective_from")

    if franchisor_cut_raw is None:
        return jsonify({"error": "franchisor_cut_pct is required."}), HTTPStatus.BAD_REQUEST

    try:
        franchisor_cut_pct = Decimal(str(franchisor_cut_raw))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"error": "franchisor_cut_pct must be numeric."}), HTTPStatus.BAD_REQUEST

    if franchisor_cut_pct < Decimal("0") or franchisor_cut_pct > Decimal("100"):
        return (
            jsonify({"error": "franchisor_cut_pct must be between 0 and 100."}),
            HTTPStatus.BAD_REQUEST,
        )

    branch_owner_cut_pct = Decimal("100") - franchisor_cut_pct

    if effective_from_raw:
        try:
            effective_from = date.fromisoformat(str(effective_from_raw))
        except (TypeError, ValueError):
            return (
                jsonify({"error": "effective_from must be a valid ISO date (YYYY-MM-DD)."}),
                HTTPStatus.BAD_REQUEST,
            )
    else:
        effective_from = date.today()

    config = RoyaltyConfig(
        franchise_id=franchise.franchise_id,
        franchisor_cut_pct=franchisor_cut_pct,
        branch_owner_cut_pct=branch_owner_cut_pct,
        effective_from=effective_from,
        created_at=datetime.now(timezone.utc),
        created_by_franchisor_id=franchisor.franchisor_id,
    )
    db.session.add(config)
    db.session.commit()

    return jsonify(_serialize_config(config)), HTTPStatus.CREATED


# ---------------------------------------------------------------------------
# GET /api/royalty/summary
# ---------------------------------------------------------------------------

@royalty_bp.route("/summary", methods=["GET"])
@token_required({"FRANCHISOR"})
def royalty_summary() -> tuple[dict[str, object], int]:
    _, franchise = _get_franchisor_franchise()
    if not franchise:
        return jsonify({"error": "No franchise found for this franchisor."}), HTTPStatus.NOT_FOUND

    today = date.today()
    try:
        month = int(request.args.get("month", today.month))
        year = int(request.args.get("year", today.year))
    except (TypeError, ValueError):
        return jsonify({"error": "month and year must be integers."}), HTTPStatus.BAD_REQUEST

    if not (1 <= month <= 12):
        return jsonify({"error": "month must be between 1 and 12."}), HTTPStatus.BAD_REQUEST

    branches = get_royalty_summary(franchise.franchise_id, month, year)

    return jsonify(
        {
            "month": month,
            "year": year,
            "franchise_id": franchise.franchise_id,
            "branches": branches,
        }
    ), HTTPStatus.OK


# ---------------------------------------------------------------------------
# GET /api/royalty/branch-summary
# ---------------------------------------------------------------------------

@royalty_bp.route("/branch-summary", methods=["GET"])
@token_required({"BRANCH_OWNER"})
def royalty_branch_summary() -> tuple[dict[str, object], int]:
    role = getattr(g, "current_role", None)
    if not role:
        return jsonify({"error": "No role scope attached to request."}), HTTPStatus.FORBIDDEN

    branch_id_param = request.args.get("branch_id", type=int)

    # Determine effective branch_id and enforce ownership scope
    if role.scope_type == "BRANCH":
        effective_branch_id = role.scope_id
        # If they explicitly pass a branch_id, it must match their scope
        if branch_id_param is not None and branch_id_param != effective_branch_id:
            return jsonify({"error": "Unauthorized branch access."}), HTTPStatus.FORBIDDEN
    else:
        if branch_id_param is None:
            return jsonify({"error": "branch_id is required."}), HTTPStatus.BAD_REQUEST
        effective_branch_id = branch_id_param

    # Verify the branch exists
    branch = db.session.get(Branch, effective_branch_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    today = date.today()
    try:
        month = int(request.args.get("month", today.month))
        year = int(request.args.get("year", today.year))
    except (TypeError, ValueError):
        return jsonify({"error": "month and year must be integers."}), HTTPStatus.BAD_REQUEST

    if not (1 <= month <= 12):
        return jsonify({"error": "month must be between 1 and 12."}), HTTPStatus.BAD_REQUEST

    summary = get_branch_royalty_summary(effective_branch_id, month, year)

    return jsonify(
        {
            "month": month,
            "year": year,
            **summary,
        }
    ), HTTPStatus.OK
