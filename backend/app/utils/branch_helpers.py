"""Branch ownership and staff-resolution helpers.

Extracted from registration_routes for shared use across
registration_routes.py and auth_routes.py.
"""

from __future__ import annotations

from http import HTTPStatus

from flask import g, jsonify

from ..extensions import db
from ..models import Branch, BranchStatus, Franchise, Franchisor, Role


def _current_role():
    """Return the current user's role from the request context, or raise."""
    role = getattr(g, "current_role", None)
    if not role:
        raise PermissionError("No role scope attached to request.")
    return role

def _get_role_by_name(role_name: str) -> Role:
    """Look up a role by its canonical name or raise LookupError."""
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        raise LookupError(f"Role '{role_name}' is not configured.")
    return role


def _require_owner_branch(
    branch_id_param: int | None,
) -> Branch | tuple[dict[str, object], int]:
    """Verify the caller owns the branch indicated by their token role."""
    role = getattr(g, "current_role", None)
    current_user = getattr(g, "current_user", None)
    if not role or role.scope_type != "BRANCH" or not current_user:
        return jsonify(
            {"error": "Branch-scoped owner role required."}
        ), HTTPStatus.FORBIDDEN

    branch_id = role.scope_id
    if branch_id_param is not None:
        if not isinstance(branch_id_param, int):
            return jsonify(
                {"error": "branch_id must be numeric."}
            ), HTTPStatus.BAD_REQUEST
        if branch_id_param != branch_id:
            return jsonify(
                {"error": "You are not authorized to manage this branch."}
            ), HTTPStatus.FORBIDDEN

    branch = db.session.get(Branch, branch_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    if branch.branch_owner_user_id != getattr(current_user, "user_id", None):
        return jsonify(
            {"error": "You are not the owner for this branch."}
        ), HTTPStatus.FORBIDDEN

    return branch


def _resolve_branch_for_staff(
    branch_id_raw: object | None,
) -> Branch | tuple[dict[str, object], int]:
    """Resolve the branch for staff/manager registration from the caller's role."""
    role = getattr(g, "current_role", None)
    current_user = getattr(g, "current_user", None)
    if not role or role.scope_type != "BRANCH" or not current_user:
        return jsonify({"error": "Branch scope required."}), HTTPStatus.FORBIDDEN

    branch_id = role.scope_id
    role_name = getattr(role.role, "name", "") if getattr(role, "role", None) else ""

    if role_name == "BRANCH_OWNER":
        branch_id_param: int | None = None
        if branch_id_raw is not None:
            try:
                branch_id_param = int(branch_id_raw)
            except (TypeError, ValueError):
                return jsonify(
                    {"error": "branch_id must be numeric."}
                ), HTTPStatus.BAD_REQUEST

        branch = _require_owner_branch(branch_id_param)
        if isinstance(branch, tuple):
            return branch
        active_status = BranchStatus.query.filter_by(status_name="ACTIVE").first()
        if not active_status or branch.status_id != active_status.status_id:
            return jsonify({"error": "Branch is not active."}), HTTPStatus.BAD_REQUEST
        return branch

    if role_name == "MANAGER":
        if branch_id_raw is not None:
            try:
                explicit_branch_id = int(branch_id_raw)
            except (TypeError, ValueError):
                return jsonify(
                    {"error": "branch_id must be numeric."}
                ), HTTPStatus.BAD_REQUEST
            if explicit_branch_id != branch_id:
                return jsonify(
                    {"error": "You are not authorized to manage this branch."}
                ), HTTPStatus.FORBIDDEN

        branch = db.session.get(Branch, branch_id)
        if not branch:
            return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND
        if branch.manager_user_id != getattr(current_user, "user_id", None):
            return jsonify(
                {"error": "You are not assigned as manager for this branch."}
            ), HTTPStatus.FORBIDDEN
        active_status = BranchStatus.query.filter_by(status_name="ACTIVE").first()
        if not active_status or branch.status_id != active_status.status_id:
            return jsonify({"error": "Branch is not active."}), HTTPStatus.BAD_REQUEST
        return branch

    return jsonify(
        {"error": "Only branch owners or managers can manage staff."}
    ), HTTPStatus.FORBIDDEN


def _ensure_franchise_for_franchisor(franchisor: Franchisor) -> Franchise | None:
    """Guarantee the franchisor has a primary franchise record."""
    from sqlalchemy.exc import IntegrityError
    from flask import current_app

    existing = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if existing:
        return existing

    franchise_name = (
        franchisor.organization_name or f"Franchise {franchisor.franchisor_id}"
    )
    description = f"Primary franchise for {franchise_name}."

    franchise = Franchise(
        franchisor_id=franchisor.franchisor_id,
        name=franchise_name,
        description=description,
    )

    db.session.add(franchise)
    try:
        db.session.commit()
        return franchise
    except IntegrityError as exc:
        db.session.rollback()
        current_app.logger.warning(
            "Failed to auto-create franchise for franchisor %s: %s",
            franchisor.franchisor_id,
            getattr(exc, "orig", exc),
        )
        return Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
