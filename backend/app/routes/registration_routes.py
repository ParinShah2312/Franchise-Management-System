"""Registration routes aligned with role-based permissions."""

from __future__ import annotations
from decimal import Decimal, InvalidOperation
from ..utils.validators import validate_email, validate_phone, validate_password_strength, sanitize_phone, EMAIL_ERROR, PHONE_ERROR, PASSWORD_ERROR
from ..utils.file_helpers import save_file_to_db
from http import HTTPStatus
from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy.exc import IntegrityError
from ..extensions import db
from ..models import (
    ApplicationStatus, Branch, BranchStaff, Franchisor,
    Franchise, FranchiseApplication, Role, User, UserRole,
)
from ..utils.security import (
    hash_password, token_required,
)

from ..utils.branch_helpers import (
    _get_role_by_name,
    _require_owner_branch,
    _resolve_branch_for_staff,
    _ensure_franchise_for_franchisor,
)

registration_bp = Blueprint("registration", __name__, url_prefix="/api/auth")

@registration_bp.route("/register-franchisor", methods=["POST"])
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

    if not validate_email(email):
        return jsonify({"error": EMAIL_ERROR}), HTTPStatus.BAD_REQUEST

    sanitized_phone = sanitize_phone(phone_raw)
    if not validate_phone(sanitized_phone):
        return jsonify({"error": PHONE_ERROR}), HTTPStatus.BAD_REQUEST

    if not validate_password_strength(password):
        return (
            jsonify({"error": PASSWORD_ERROR}),
            HTTPStatus.BAD_REQUEST,
        )

    if (
        Franchisor.query.filter_by(email=email).first()
        or User.query.filter_by(email=email).first()
    ):
        return jsonify({"error": "Email is already registered."}), HTTPStatus.CONFLICT

    if (
        Franchisor.query.filter_by(phone=sanitized_phone).first()
        or User.query.filter_by(phone=sanitized_phone).first()
    ):
        return jsonify(
            {"error": "Phone number is already registered."}
        ), HTTPStatus.CONFLICT

    franchisor = Franchisor(
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
        return jsonify(
            {"error": "Unable to register franchisor due to duplicate data."}
        ), HTTPStatus.CONFLICT
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        current_app.logger.exception("Failed to register franchisor: %s", exc)
        return jsonify(
            {"error": "Unable to register franchisor."}
        ), HTTPStatus.INTERNAL_SERVER_ERROR

    return (
        jsonify(
            {
                "message": "Franchisor registered successfully.",
                "franchisor_id": franchisor.franchisor_id,
            }
        ),
        HTTPStatus.CREATED,
    )

@registration_bp.route("/register-franchisee", methods=["POST"])
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
    experience_text = (
        form_data.get("business_experience") or ""
    ).strip() or None
    reason_text = (
        form_data.get("reason") or ""
    ).strip() or None
    application_file = files.get("application_file")

    if not all(
        [
            email,
            password,
            name,
            phone_raw,
            franchise_id_raw,
            proposed_location,
            application_file,
        ]
    ):
        return (
            jsonify({"error": "Missing required fields."}),
            HTTPStatus.BAD_REQUEST,
        )

    if not validate_email(email):
        return jsonify({"error": EMAIL_ERROR}), HTTPStatus.BAD_REQUEST

    if not validate_password_strength(password):
        return (
            jsonify({"error": PASSWORD_ERROR}),
            HTTPStatus.BAD_REQUEST,
        )

    sanitized_phone = sanitize_phone(phone_raw)
    if not validate_phone(sanitized_phone):
        return jsonify({"error": PHONE_ERROR}), HTTPStatus.BAD_REQUEST

    if User.query.filter_by(email=email).first() or Franchisor.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), HTTPStatus.CONFLICT

    if User.query.filter_by(phone=sanitized_phone).first() or Franchisor.query.filter_by(phone=sanitized_phone).first():
        return jsonify({"error": "Phone number is already registered."}), HTTPStatus.CONFLICT

    try:
        franchise_id = int(franchise_id_raw)
    except (TypeError, ValueError):
        return jsonify(
            {"error": "Invalid franchise selection."}
        ), HTTPStatus.BAD_REQUEST

    franchise = db.session.get(Franchise, franchise_id)
    if not franchise:
        return jsonify({"error": "Franchise not found."}), HTTPStatus.BAD_REQUEST

    try:
        investment_capacity = (
            Decimal(investment_capacity_raw)
            if investment_capacity_raw not in (None, "")
            else Decimal("0")
        )
    except (InvalidOperation, TypeError):
        return jsonify(
            {"error": "Investment capacity must be numeric."}
        ), HTTPStatus.BAD_REQUEST

    if investment_capacity < 0:
        return jsonify(
            {"error": "Investment capacity cannot be negative."}
        ), HTTPStatus.BAD_REQUEST

    status = ApplicationStatus.query.filter_by(status_name="PENDING").first()
    if not status:
        status = db.session.get(ApplicationStatus, 1)
    if not status:
        return (
            jsonify({"error": "Application status configuration missing."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    try:
        blob = save_file_to_db(application_file)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    db.session.add(blob)
    db.session.flush()

    try:
        user = User(
            name=name,
            email=email,
            phone=sanitized_phone,
            password_hash=hash_password(password),
            is_active=True,
            must_reset_password=False,
        )

        db.session.add(user)
        db.session.flush()

        application = FranchiseApplication(
            franchise_id=franchise.franchise_id,
            branch_owner_user_id=user.user_id,
            proposed_location=proposed_location,
            business_experience=experience_text,
            reason=reason_text,
            investment_capacity=investment_capacity,
            status_id=status.status_id,
            document_blob_id=blob.blob_id,
        )

        db.session.add(application)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return (
            jsonify({"error": "Unable to register franchisee due to duplicate data."}),
            HTTPStatus.CONFLICT,
        )
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
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

@registration_bp.route("/register-manager", methods=["POST"])
@token_required({"BRANCH_OWNER"})
def register_manager() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    phone_raw = (payload.get("phone") or "").strip()
    branch_id_raw = payload.get("branch_id")

    if not all([name, email, password, phone_raw, branch_id_raw]):
        return jsonify({"error": "Missing required fields."}), HTTPStatus.BAD_REQUEST

    if not validate_email(email):
        return jsonify({"error": EMAIL_ERROR}), HTTPStatus.BAD_REQUEST

    sanitized_phone = sanitize_phone(phone_raw)
    if not validate_phone(sanitized_phone):
        return jsonify({"error": PHONE_ERROR}), HTTPStatus.BAD_REQUEST

    if not validate_password_strength(password):
        return jsonify({"error": PASSWORD_ERROR}), HTTPStatus.BAD_REQUEST

    if User.query.filter_by(email=email).first() or Franchisor.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), HTTPStatus.CONFLICT

    if User.query.filter_by(phone=sanitized_phone).first() or Franchisor.query.filter_by(phone=sanitized_phone).first():
        return jsonify({"error": "Phone number is already registered."}), HTTPStatus.CONFLICT

    try:
        branch = _resolve_branch_for_staff(branch_id_raw)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    if branch.manager_user_id is not None:
        return jsonify({"error": "This branch already has a manager assigned."}), HTTPStatus.CONFLICT

    try:
        user = User(
            name=name,
            email=email,
            phone=sanitized_phone,
            password_hash=hash_password(password),
            is_active=True,
            must_reset_password=True,
        )

        db.session.add(user)
        db.session.flush()

        manager_role = _get_role_by_name("MANAGER")

        db.session.add(
            UserRole(
                user_id=user.user_id,
                role_id=manager_role.role_id,
                scope_type="BRANCH",
                scope_id=branch.branch_id,
            )
        )
        
        branch.manager_user_id = user.user_id

        db.session.commit()
    except LookupError as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR
    except IntegrityError:
        db.session.rollback()
        return jsonify(
            {"error": "Email or phone already registered."}
        ), HTTPStatus.CONFLICT
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        current_app.logger.exception("Failed to register manager: %s", exc)
        return jsonify(
            {"error": "Unable to register manager."}
        ), HTTPStatus.INTERNAL_SERVER_ERROR

    return jsonify(
        {"message": "Manager registered successfully."}
    ), HTTPStatus.CREATED

@registration_bp.route("/register-staff", methods=["POST"])
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

    if not validate_email(email):
        return jsonify({"error": EMAIL_ERROR}), HTTPStatus.BAD_REQUEST

    sanitized_phone = sanitize_phone(phone_raw)
    if not validate_phone(sanitized_phone):
        return jsonify({"error": PHONE_ERROR}), HTTPStatus.BAD_REQUEST

    if not validate_password_strength(password):
        return jsonify({"error": PASSWORD_ERROR}), HTTPStatus.BAD_REQUEST

    if User.query.filter_by(email=email).first() or Franchisor.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), HTTPStatus.CONFLICT

    if User.query.filter_by(phone=sanitized_phone).first() or Franchisor.query.filter_by(phone=sanitized_phone).first():
        return jsonify({"error": "Phone number is already registered."}), HTTPStatus.CONFLICT

    try:
        branch = _resolve_branch_for_staff(branch_id_raw)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    try:
        user = User(
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
        return jsonify(
            {"error": "Email or phone already registered."}
        ), HTTPStatus.CONFLICT
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        current_app.logger.exception("Failed to register staff: %s", exc)
        return jsonify(
            {"error": "Unable to register staff."}
        ), HTTPStatus.INTERNAL_SERVER_ERROR

    return jsonify(
        {"message": "Staff member registered successfully."}
    ), HTTPStatus.CREATED
