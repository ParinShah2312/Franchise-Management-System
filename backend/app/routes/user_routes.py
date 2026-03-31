"""User management routes for activation and deactivation."""

from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, g, jsonify

from ..models import User, UserRole
from ..extensions import db
from ..utils.security import token_required

user_bp = Blueprint("users", __name__, url_prefix="/api/users")


@user_bp.route("/<int:user_id>/deactivate", methods=["PUT"])
@token_required({"BRANCH_OWNER"})
def deactivate_user(user_id: int) -> tuple[dict[str, object], int]:
    """Deactivate a staff member or manager belonging to the caller's branch."""

    role = getattr(g, "current_role", None)
    current_user = getattr(g, "current_user", None)

    if not role or role.scope_type != "BRANCH" or not current_user:
        return jsonify({"error": "Branch-scoped role required."}), HTTPStatus.FORBIDDEN

    # Prevent self-deactivation
    if user_id == current_user.user_id:
        return (
            jsonify({"error": "You cannot deactivate your own account."}),
            HTTPStatus.BAD_REQUEST,
        )

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({"error": "User not found."}), HTTPStatus.NOT_FOUND

    # Verify target user belongs to the caller's branch
    branch_role_record = (
        UserRole.query.filter_by(
            user_id=user_id,
            scope_type="BRANCH",
            scope_id=role.scope_id,
        )
        .join(UserRole.role)
        .first()
    )

    if not branch_role_record:
        return (
            jsonify({"error": "User not found."}),
            HTTPStatus.NOT_FOUND,
        )

    # Prevent deactivating another branch owner
    target_role_name = (
        branch_role_record.role.name if branch_role_record.role else ""
    )
    if target_role_name == "BRANCH_OWNER":
        return (
            jsonify({"error": "You cannot deactivate a branch owner."}),
            HTTPStatus.FORBIDDEN,
        )

    if not target_user.is_active:
        return jsonify({"error": "User is already inactive."}), HTTPStatus.BAD_REQUEST

    target_user.is_active = False
    db.session.commit()

    return (
        jsonify(
            {
                "message": "User deactivated successfully.",
                "user_id": target_user.user_id,
                "is_active": False,
            }
        ),
        HTTPStatus.OK,
    )


@user_bp.route("/<int:user_id>/activate", methods=["PUT"])
@token_required({"BRANCH_OWNER"})
def activate_user(user_id: int) -> tuple[dict[str, object], int]:
    """Reactivate a deactivated staff member or manager belonging to the caller's branch."""

    role = getattr(g, "current_role", None)
    current_user = getattr(g, "current_user", None)

    if not role or role.scope_type != "BRANCH" or not current_user:
        return jsonify({"error": "Branch-scoped role required."}), HTTPStatus.FORBIDDEN

    # Prevent self-action (edge case guard – user would be active anyway)
    if user_id == current_user.user_id:
        return (
            jsonify({"error": "You cannot deactivate your own account."}),
            HTTPStatus.BAD_REQUEST,
        )

    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({"error": "User not found."}), HTTPStatus.NOT_FOUND

    # Verify target user belongs to the caller's branch
    branch_role_record = (
        UserRole.query.filter_by(
            user_id=user_id,
            scope_type="BRANCH",
            scope_id=role.scope_id,
        )
        .join(UserRole.role)
        .first()
    )

    if not branch_role_record:
        return (
            jsonify({"error": "User not found."}),
            HTTPStatus.NOT_FOUND,
        )

    # Prevent acting on another branch owner
    target_role_name = (
        branch_role_record.role.name if branch_role_record.role else ""
    )
    if target_role_name == "BRANCH_OWNER":
        return (
            jsonify({"error": "You cannot deactivate a branch owner."}),
            HTTPStatus.FORBIDDEN,
        )

    if target_user.is_active:
        return jsonify({"error": "User is already active."}), HTTPStatus.BAD_REQUEST

    target_user.is_active = True
    db.session.commit()

    return (
        jsonify(
            {
                "message": "User activated successfully.",
                "user_id": target_user.user_id,
                "is_active": True,
            }
        ),
        HTTPStatus.OK,
    )
