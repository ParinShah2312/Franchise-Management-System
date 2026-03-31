"""Authentication routes aligned with role-based permissions."""

from __future__ import annotations
from ..utils.validators import validate_password_strength, PASSWORD_ERROR
from http import HTTPStatus
from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy.orm import joinedload
from ..extensions import db
from ..models import (
    ApplicationStatus, BranchStaff, Franchisor, FranchiseApplication, User
)
from ..utils.security import (
    generate_token, hash_password, token_required, verify_password, _select_primary_role
)
from .registration_routes import _ensure_franchise_for_franchisor, _resolve_branch_for_staff

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login() -> tuple[dict[str, object], int]:
    """Authenticate a user and return their role and scope."""

    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify(
            {"error": "Email and password are required."}
        ), HTTPStatus.BAD_REQUEST

    franchisor = Franchisor.query.filter_by(email=email).first()
    if franchisor and verify_password(password, franchisor.password_hash):
        _ensure_franchise_for_franchisor(franchisor)
        token = generate_token(franchisor.franchisor_id, user_type="franchisor")
        return (
            jsonify(
                {
                    "token": token,
                    "user": {
                        "id": franchisor.franchisor_id,
                        "name": franchisor.organization_name,
                        "email": franchisor.email,
                        "must_reset_password": False,
                    },
                    "role": "FRANCHISOR",
                    "scope": {"type": "GLOBAL", "id": None},
                }
            ),
            HTTPStatus.OK,
        )

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password."}), HTTPStatus.UNAUTHORIZED

    if not user.is_active:
        return jsonify(
            {"error": "Account is inactive. Contact administrator."}
        ), HTTPStatus.FORBIDDEN

    user_role = _select_primary_role(user)
    if not user_role or not user_role.role:
        # Check if they have a pending franchise application
        pending_status = ApplicationStatus.query.filter_by(status_name="PENDING").first()
        if pending_status:
            pending_app = FranchiseApplication.query.filter_by(
                branch_owner_user_id=user.user_id,
                status_id=pending_status.status_id
            ).first()
            if pending_app:
                token = generate_token(user.user_id, user_type="user")
                return (
                    jsonify(
                        {
                            "token": token,
                            "user": {
                                "id": user.user_id,
                                "name": user.name,
                                "email": user.email,
                                "must_reset_password": False,  # Skip reset for pending
                            },
                            "role": "PENDING_APPLICANT",
                            "scope": {"type": "GLOBAL", "id": None},
                        }
                    ),
                    HTTPStatus.OK,
                )

        return jsonify(
            {"error": "No role assigned. Contact administrator."}
        ), HTTPStatus.FORBIDDEN

    token = generate_token(user.user_id, user_type="user")

    return (
        jsonify(
            {
                "token": token,
                "user": {
                    "id": user.user_id,
                    "name": user.name,
                    "email": user.email,
                    "must_reset_password": user.must_reset_password,
                },
                "role": user_role.role.name,
                "scope": {
                    "type": user_role.scope_type,
                    "id": user_role.scope_id,
                },
            }
        ),
        HTTPStatus.OK,
    )


@auth_bp.route("/profile", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def get_branch_profile() -> tuple[dict[str, object], int]:
    branch_id_raw = request.args.get("branch_id")
    branch = _resolve_branch_for_staff(branch_id_raw)
    if isinstance(branch, tuple):
        return branch

    staff_assignments = (
        BranchStaff.query.options(joinedload(BranchStaff.user))
        .filter(BranchStaff.branch_id == branch.branch_id)
        .order_by(BranchStaff.created_at.asc())
        .all()
    )

    def _serialize_user(user: User | None) -> dict[str, object] | None:
        if not user:
            return None
        return {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "is_active": user.is_active,
        }

    payload = {
        "branch": {
            "id": branch.branch_id,
            "name": branch.name,
        },
        "owner": _serialize_user(branch.branch_owner),
        "manager": _serialize_user(branch.manager),
        "staff": [
            {
                "user_id": assignment.user.user_id if assignment.user else None,
                "name": assignment.user.name if assignment.user else None,
                "email": assignment.user.email if assignment.user else None,
                "phone": assignment.user.phone if assignment.user else None,
                "is_active": assignment.user.is_active if assignment.user else None,
                "role": "STAFF",
                "joined_at": assignment.created_at.isoformat()
                if assignment.created_at
                else None,
            }
            for assignment in staff_assignments
            if assignment.user is not None
        ],
    }

    return jsonify(payload), HTTPStatus.OK


@auth_bp.route("/reset-password", methods=["POST"])
@token_required()
def reset_password() -> tuple[dict[str, object], int]:
    user = getattr(g, "current_user", None)
    if not user or getattr(g, "current_user_type", None) != "user":
        return jsonify({"error": "Only regular users can reset their password."}), HTTPStatus.FORBIDDEN

    payload = request.get_json(silent=True) or {}
    new_password = payload.get("new_password") or ""
    confirm_password = payload.get("confirm_password") or ""

    if not new_password or not confirm_password:
        return jsonify({"error": "New password and confirmation are required."}), HTTPStatus.BAD_REQUEST

    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), HTTPStatus.BAD_REQUEST

    if not validate_password_strength(new_password):
        return (
            jsonify({"error": PASSWORD_ERROR}),
            HTTPStatus.BAD_REQUEST,
        )

    try:
        user.password_hash = hash_password(new_password)
        user.must_reset_password = False
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        current_app.logger.exception("Failed to reset password: %s", exc)
        return jsonify({"error": "Unable to reset password."}), HTTPStatus.INTERNAL_SERVER_ERROR

    return jsonify({"message": "Password reset successfully."}), HTTPStatus.OK
