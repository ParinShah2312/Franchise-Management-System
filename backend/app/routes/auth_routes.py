"""Authentication routes aligned with role-based permissions."""

from __future__ import annotations

import os
from datetime import datetime
from decimal import Decimal, InvalidOperation
import re

from http import HTTPStatus

from uuid import uuid4

from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
from werkzeug.utils import secure_filename

from ..extensions import db
from ..models import (
    ApplicationStatus,
    Branch,
    BranchStaff,
    BranchStatus,
    Franchisor,
    Franchise,
    FranchiseApplication,
    Role,
    User,
    UserRole,
)
from ..utils.security import generate_token, hash_password, token_required, verify_password


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _select_primary_role(user: User) -> UserRole | None:
    """Return the first role assigned to a user ordered by scope priority."""

    return (
        UserRole.query.options(joinedload(UserRole.role))
        .filter(UserRole.user_id == user.user_id)
        .order_by(UserRole.scope_type.desc(), UserRole.scope_id.asc())
        .first()
    )


def _get_role_by_name(role_name: str) -> Role:
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        raise LookupError(f"Role '{role_name}' is not configured.")
    return role


def _require_owner_branch(branch_id_param: int | None) -> Branch | tuple[dict[str, object], int]:
    role = getattr(g, "current_role", None)
    current_user = getattr(g, "current_user", None)
    if not role or role.scope_type != "BRANCH" or not current_user:
        return jsonify({"error": "Branch-scoped owner role required."}), HTTPStatus.FORBIDDEN

    branch_id = role.scope_id
    if branch_id_param is not None:
        if not isinstance(branch_id_param, int):
            return jsonify({"error": "branch_id must be numeric."}), HTTPStatus.BAD_REQUEST
        if branch_id_param != branch_id:
            return jsonify({"error": "You are not authorized to manage this branch."}), HTTPStatus.FORBIDDEN

    branch = Branch.query.get(branch_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    if branch.branch_owner_user_id != getattr(current_user, "user_id", None):
        return jsonify({"error": "You are not the owner for this branch."}), HTTPStatus.FORBIDDEN

    return branch


def _resolve_branch_for_staff(branch_id_raw: object | None) -> Branch | tuple[dict[str, object], int]:
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
                return jsonify({"error": "branch_id must be numeric."}), HTTPStatus.BAD_REQUEST

        branch = _require_owner_branch(branch_id_param)
        if isinstance(branch, tuple):
            return branch
        if branch.status_id != 1:
            return jsonify({"error": "Branch is not active."}), HTTPStatus.BAD_REQUEST
        return branch

    if role_name == "MANAGER":
        if branch_id_raw is not None:
            try:
                explicit_branch_id = int(branch_id_raw)
            except (TypeError, ValueError):
                return jsonify({"error": "branch_id must be numeric."}), HTTPStatus.BAD_REQUEST
            if explicit_branch_id != branch_id:
                return jsonify({"error": "You are not authorized to manage this branch."}), HTTPStatus.FORBIDDEN

        branch = Branch.query.get(branch_id)
        if not branch:
            return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND
        if branch.manager_user_id != getattr(current_user, "user_id", None):
            return jsonify({"error": "You are not assigned as manager for this branch."}), HTTPStatus.FORBIDDEN
        if branch.status_id != 1:
            return jsonify({"error": "Branch is not active."}), HTTPStatus.BAD_REQUEST
        return branch

    return jsonify({"error": "Only branch owners or managers can manage staff."}), HTTPStatus.FORBIDDEN


def _save_application_file(upload) -> tuple[str, str]:
    """Persist uploaded application file and return stored and relative paths."""

    filename = secure_filename(upload.filename)
    if not filename:
        raise ValueError("Uploaded file name is invalid.")

    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg"}
    file_extension = os.path.splitext(filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise ValueError("Unsupported file type. Upload PDF, JPG, or PNG.")

    upload_folder = current_app.config.get("UPLOAD_FOLDER", "")
    unique_filename = f"{uuid4().hex}_{filename}"
    stored_path = os.path.join(upload_folder, unique_filename)
    upload.save(stored_path)
    relative_path = os.path.join("uploads", unique_filename).replace("\\", "/")
    return stored_path, relative_path


def _ensure_franchise_for_franchisor(franchisor: Franchisor) -> Franchise | None:
    """Guarantee the franchisor has a primary franchise record."""

    existing = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if existing:
        return existing

    next_franchise_id = (
        db.session.query(db.func.coalesce(db.func.max(Franchise.franchise_id), 0)).scalar()
        + 1
    )

    franchise_name = franchisor.organization_name or f"Franchise {franchisor.franchisor_id}"
    description = f"Primary franchise for {franchise_name}."

    franchise = Franchise(
        franchise_id=next_franchise_id,
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


@auth_bp.route("/login", methods=["POST"])
def login() -> tuple[dict[str, object], int]:
    """Authenticate a user and return their role and scope."""

    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), HTTPStatus.BAD_REQUEST

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
        return jsonify({"error": "Account is inactive. Contact administrator."}), HTTPStatus.FORBIDDEN

    user_role = _select_primary_role(user)
    if not user_role or not user_role.role:
        return jsonify({"error": "No role assigned. Contact administrator."}), HTTPStatus.FORBIDDEN

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
                "joined_at": assignment.created_at.isoformat() if assignment.created_at else None,
            }
            for assignment in staff_assignments
            if assignment.user is not None
        ],
    }

    return jsonify(payload), HTTPStatus.OK


@auth_bp.route("/register-franchisor", methods=["POST"])
def register_franchisor() -> tuple[dict[str, object], int]:
    """Register a new franchisor account with basic validations."""

    payload = request.get_json(silent=True) or {}
    organization_name = (payload.get("organization_name") or "").strip()
    contact_person = (payload.get("contact_person") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone_raw = (payload.get("phone") or "").strip()
    password = payload.get("password") or ""

    if not all([organization_name, contact_person, email, phone_raw, password]):
        return jsonify({"error": "All fields are required."}), HTTPStatus.BAD_REQUEST

    email_pattern = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    if not email_pattern.match(email):
        return jsonify({"error": "Invalid email format."}), HTTPStatus.BAD_REQUEST

    sanitized_phone = "".join(filter(str.isdigit, phone_raw))
    if len(sanitized_phone) != 10:
        return jsonify({"error": "Phone must be exactly 10 digits."}), HTTPStatus.BAD_REQUEST

    password_pattern = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")
    if not password_pattern.match(password):
        return (
            jsonify(
                {
                    "error": "Password must be 8+ chars with uppercase, lowercase, and a number.",
                }
            ),
            HTTPStatus.BAD_REQUEST,
        )

    if Franchisor.query.filter_by(email=email).first() or User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), HTTPStatus.CONFLICT

    if Franchisor.query.filter_by(phone=sanitized_phone).first() or User.query.filter_by(phone=sanitized_phone).first():
        return jsonify({"error": "Phone number is already registered."}), HTTPStatus.CONFLICT

    next_franchisor_id = (
        db.session.query(db.func.coalesce(db.func.max(Franchisor.franchisor_id), 0)).scalar() + 1
    )

    franchisor = Franchisor(
        franchisor_id=next_franchisor_id,
        organization_name=organization_name,
        contact_person=contact_person,
        email=email,
        phone=sanitized_phone,
        password_hash=hash_password(password),
    )

    try:
        db.session.add(franchisor)
        db.session.commit()
        _ensure_franchise_for_franchisor(franchisor)
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Unable to register franchisor due to duplicate data."}), HTTPStatus.CONFLICT
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        current_app.logger.exception("Failed to register franchisor: %s", exc)
        return jsonify({"error": "Unable to register franchisor."}), HTTPStatus.INTERNAL_SERVER_ERROR

    return (
        jsonify(
            {
                "message": "Franchisor registered successfully.",
                "franchisor_id": franchisor.franchisor_id,
            }
        ),
        HTTPStatus.CREATED,
    )


@auth_bp.route("/register-franchisee", methods=["POST"])
def register_franchisee() -> tuple[dict[str, object], int]:
    """Handle new franchisee applications with document upload."""

    form_data = request.form or {}
    files = request.files

    email = (form_data.get("email") or "").strip().lower()
    password = form_data.get("password") or ""
    name = (form_data.get("name") or "").strip()
    phone_raw = (form_data.get("phone") or "").strip()
    franchise_id_raw = form_data.get("franchise_id")
    proposed_location = (form_data.get("proposed_location") or "").strip()
    investment_capacity_raw = form_data.get("investment_capacity")
    experience_text = (form_data.get("experience") or form_data.get("business_experience") or "").strip() or None
    reason_text = (form_data.get("reason") or form_data.get("reason_for_franchise") or "").strip() or None
    application_file = files.get("application_file")

    if not all([email, password, name, phone_raw, franchise_id_raw, proposed_location, application_file]):
        return (
            jsonify({"error": "Missing required fields."}),
            HTTPStatus.BAD_REQUEST,
        )

    password_pattern = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")
    if not password_pattern.match(password):
        return (
            jsonify(
                {
                    "error": "Password must be 8+ chars with uppercase, lowercase, and a number.",
                }
            ),
            HTTPStatus.BAD_REQUEST,
        )

    sanitized_phone = "".join(filter(str.isdigit, phone_raw))
    if len(sanitized_phone) != 10:
        return jsonify({"error": "Phone must be a 10 digit number."}), HTTPStatus.BAD_REQUEST

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), HTTPStatus.CONFLICT

    if Franchisor.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered as a franchisor."}), HTTPStatus.CONFLICT

    if User.query.filter_by(phone=sanitized_phone).first():
        return jsonify({"error": "Phone number is already registered."}), HTTPStatus.CONFLICT

    if Franchisor.query.filter_by(phone=sanitized_phone).first():
        return jsonify({"error": "Phone number is already registered to another franchisor."}), HTTPStatus.CONFLICT

    try:
        franchise_id = int(franchise_id_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid franchise selection."}), HTTPStatus.BAD_REQUEST

    franchise = Franchise.query.get(franchise_id)
    if not franchise:
        return jsonify({"error": "Franchise not found."}), HTTPStatus.BAD_REQUEST

    try:
        stored_path, relative_path = _save_application_file(application_file)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    try:
        investment_capacity = (
            Decimal(investment_capacity_raw)
            if investment_capacity_raw not in (None, "")
            else Decimal("0")
        )
    except (InvalidOperation, TypeError):
        if os.path.exists(stored_path):
            os.remove(stored_path)
        return jsonify({"error": "Investment capacity must be numeric."}), HTTPStatus.BAD_REQUEST

    status = ApplicationStatus.query.filter_by(status_name="PENDING").first()
    if not status:
        status = ApplicationStatus.query.get(1)
    if not status:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        return (
            jsonify({"error": "Application status configuration missing."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    next_user_id = db.session.query(db.func.coalesce(db.func.max(User.user_id), 0)).scalar() + 1
    next_application_id = (
        db.session.query(db.func.coalesce(db.func.max(FranchiseApplication.application_id), 0)).scalar() + 1
    )

    try:
        user = User(
            user_id=next_user_id,
            name=name,
            email=email,
            phone=sanitized_phone,
            password_hash=hash_password(password),
            is_active=True,
            must_reset_password=True,
        )

        db.session.add(user)
        db.session.flush()

        application = FranchiseApplication(
            application_id=next_application_id,
            franchise_id=franchise.franchise_id,
            branch_owner_user_id=user.user_id,
            proposed_location=proposed_location,
            business_experience=experience_text,
            reason=reason_text,
            investment_capacity=investment_capacity,
            status_id=status.status_id,
            document_path=relative_path,
        )

        db.session.add(application)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        if os.path.exists(stored_path):
            os.remove(stored_path)
        return (
            jsonify({"error": "Unable to register franchisee due to duplicate data."}),
            HTTPStatus.CONFLICT,
        )
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        if os.path.exists(stored_path):
            os.remove(stored_path)
        current_app.logger.exception("Failed to register franchisee: %s", exc)
        return (
            jsonify({"error": "Unable to register franchisee."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    return (
        jsonify(
            {
                "message": "Application submitted successfully. Await approval.",
                "application_id": application.application_id,
            }
        ),
        HTTPStatus.CREATED,
    )


@auth_bp.route("/register-staff", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def register_staff() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    phone_raw = (payload.get("phone") or "").strip()
    branch_id_raw = payload.get("branch_id")

    if not all([name, email, password, phone_raw]):
        return jsonify({"error": "Missing required fields."}), HTTPStatus.BAD_REQUEST

    sanitized_phone = "".join(filter(str.isdigit, phone_raw))
    if len(sanitized_phone) != 10:
        return jsonify({"error": "Phone must be a 10 digit number."}), HTTPStatus.BAD_REQUEST

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), HTTPStatus.BAD_REQUEST

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), HTTPStatus.CONFLICT

    if User.query.filter_by(phone=sanitized_phone).first():
        return jsonify({"error": "Phone number is already registered."}), HTTPStatus.CONFLICT

    branch = _resolve_branch_for_staff(branch_id_raw)
    if isinstance(branch, tuple):
        return branch

    next_user_id = (
        db.session.query(db.func.coalesce(db.func.max(User.user_id), 0)).scalar() + 1
    )

    try:
        user = User(
            user_id=next_user_id,
            name=name,
            email=email,
            phone=sanitized_phone,
            password_hash=hash_password(password),
            is_active=True,
            must_reset_password=True,
        )

        db.session.add(user)
        db.session.flush()

        staff_role = _get_role_by_name("STAFF")

        db.session.add(
            UserRole(
                user_id=user.user_id,
                role_id=staff_role.role_id,
                scope_type="BRANCH",
                scope_id=branch.branch_id,
            )
        )

        db.session.add(
            BranchStaff(
                branch_id=branch.branch_id,
                user_id=user.user_id,
            )
        )

        db.session.commit()
    except LookupError as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Email or phone already registered."}), HTTPStatus.CONFLICT
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        current_app.logger.exception("Failed to register staff: %s", exc)
        return jsonify({"error": "Unable to register staff."}), HTTPStatus.INTERNAL_SERVER_ERROR

    return jsonify({"message": "Staff member registered successfully."}), HTTPStatus.CREATED