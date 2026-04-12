"""Branch-level helper routes for manager and owner workflows."""

from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, jsonify, g
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import Branch, BranchStatus, BranchStaff, User, UserRole
from ..utils.security import token_required
from ..utils.branch_helpers import _current_role

branch_bp = Blueprint("branch", __name__, url_prefix="/api/branch")

def _branch_scope() -> Branch | tuple[dict[str, object], int]:
    role = _current_role()
    current_user = getattr(g, "current_user", None)

    if not role or role.scope_type != "BRANCH" or not current_user:
        return jsonify({"error": "Branch-scoped role required."}), HTTPStatus.FORBIDDEN

    branch = db.session.get(Branch, role.scope_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    if (
        getattr(role.role, "name", "") == "MANAGER"
        and branch.manager_user_id != current_user.user_id
    ):
        return jsonify(
            {"error": "You are not assigned as manager for this branch."}
        ), HTTPStatus.FORBIDDEN

    active_status = BranchStatus.query.filter_by(status_name="ACTIVE").first()
    if not active_status or branch.status_id != active_status.status_id:
        return jsonify({"error": "Branch is not active."}), HTTPStatus.BAD_REQUEST

    return branch

def _resolve_branch_role(user: User, branch_id: int) -> str | None:
    for assignment in user.user_roles:
        if (
            assignment.scope_type == "BRANCH"
            and assignment.scope_id == branch_id
            and assignment.role
        ):
            return assignment.role.name
    return None

@branch_bp.route("/staff", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def list_branch_staff() -> tuple[list[dict[str, object]], int]:
    branch_or_error = _branch_scope()
    if isinstance(branch_or_error, tuple):
        return branch_or_error
    branch = branch_or_error

    staff_assignments = (
        BranchStaff.query.options(
            joinedload(BranchStaff.user)
            .joinedload(User.user_roles)
            .joinedload(UserRole.role)
        )
        .filter(BranchStaff.branch_id == branch.branch_id)
        .order_by(BranchStaff.created_at.asc())
        .all()
    )

    payload: list[dict[str, object]] = []

    # Include manager and owner insights if present
    if branch.manager:
        payload.append(
            {
                "user_id": branch.manager.user_id,
                "user_name": branch.manager.name,
                "email": branch.manager.email,
                "phone": branch.manager.phone,
                "role": "MANAGER",
                "is_active": branch.manager.is_active,
            }
        )

    if branch.branch_owner:
        payload.append(
            {
                "user_id": branch.branch_owner.user_id,
                "user_name": branch.branch_owner.name,
                "email": branch.branch_owner.email,
                "phone": branch.branch_owner.phone,
                "role": "BRANCH_OWNER",
                "is_active": branch.branch_owner.is_active,
            }
        )

    for assignment in staff_assignments:
        if not assignment.user:
            continue
        role_name = _resolve_branch_role(assignment.user, branch.branch_id) or "STAFF"
        payload.append(
            {
                "user_id": assignment.user.user_id,
                "user_name": assignment.user.name,
                "email": assignment.user.email,
                "phone": assignment.user.phone,
                "role": role_name,
                "is_active": assignment.user.is_active,
            }
        )

    # Deduplicate users preserving first occurrence (manager/owner first)
    seen: set[int] = set()
    deduped: list[dict[str, object]] = []
    for entry in payload:
        user_id = entry.get("user_id")
        if user_id in seen:
            continue
        seen.add(user_id)
        deduped.append(entry)

    return jsonify(deduped), HTTPStatus.OK
