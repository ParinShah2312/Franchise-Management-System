"""Authentication routes for the Franchise Management System backend."""

from __future__ import annotations

from http import HTTPStatus
import os
from datetime import datetime
from uuid import uuid4

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy.exc import IntegrityError
from werkzeug.utils import secure_filename

from ..extensions import db
from ..models import Franchise, FranchiseStatus, Staff, User, UserRole
from ..utils.security import hash_password, verify_password


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login() -> tuple[dict[str, object], int]:
    """Authenticate a user by email and password."""

    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), HTTPStatus.BAD_REQUEST

    user: User | None = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password."}), HTTPStatus.UNAUTHORIZED

    return (
        jsonify(
            {
                "id": user.id,
                "email": user.email,
                "role": user.role.value,
                "franchise_id": user.franchise_id,
                "token": str(user.id),
            }
        ),
        HTTPStatus.OK,
    )


@auth_bp.route("/register-franchisee", methods=["POST"])
def register_franchisee() -> tuple[dict[str, object], int]:
    """Register a new franchisee via multipart submission with supporting file."""

    form_data = request.form or {}
    files = request.files or {}

    required_user_fields = ["email", "password", "name"]
    required_franchise_fields = ["franchise_name", "location"]

    missing_fields = [field for field in required_user_fields if not form_data.get(field)]
    missing_fields += [field for field in required_franchise_fields if not form_data.get(field)]

    application_file = files.get("application_file")
    if not application_file or not application_file.filename:
        missing_fields.append("application_file")

    if missing_fields:
        return (
            jsonify({"error": f"Missing required fields: {', '.join(sorted(set(missing_fields)))}"}),
            HTTPStatus.BAD_REQUEST,
        )

    email = form_data.get("email", "").strip().lower()
    password = form_data.get("password")
    owner_name = form_data.get("name", "").strip()
    selected_brand = form_data.get("franchise_name", "").strip()
    location = form_data.get("location", "").strip()

    brand_exists = (
        db.session.query(Franchise.id)
        .filter(Franchise.name == selected_brand)
        .first()
    )
    if not brand_exists:
        return (
            jsonify({"error": "Selected franchise brand is invalid."}),
            HTTPStatus.BAD_REQUEST,
        )

    filename = secure_filename(application_file.filename)
    if not filename:
        return jsonify({"error": "Uploaded file name is invalid."}), HTTPStatus.BAD_REQUEST

    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg"}
    file_extension = os.path.splitext(filename)[1].lower()
    if file_extension not in allowed_extensions:
        return (
            jsonify({"error": "Unsupported file type. Upload PDF, JPG, or PNG."}),
            HTTPStatus.BAD_REQUEST,
        )

    upload_folder = current_app.config.get("UPLOAD_FOLDER")
    unique_filename = f"{uuid4().hex}_{filename}"
    stored_path = os.path.join(upload_folder, unique_filename)
    relative_path = os.path.join("uploads", unique_filename).replace("\\", "/")

    expected_opening_raw = form_data.get("expected_opening_date")
    expected_opening_date = None
    if expected_opening_raw:
        try:
            expected_opening_date = datetime.strptime(expected_opening_raw, "%Y-%m-%d").date()
        except ValueError:
            return (
                jsonify({"error": "Expected opening date must be in YYYY-MM-DD format."}),
                HTTPStatus.BAD_REQUEST,
            )

    saved_file_path = None

    try:
        application_file.save(stored_path)
        saved_file_path = stored_path

        franchise = Franchise(
            name=selected_brand,
            location=location,
            owner_name=owner_name or None,
            phone=form_data.get("phone") or None,
            property_size=form_data.get("property_size") or None,
            investment_capacity=form_data.get("investment_capacity") or None,
            business_experience=form_data.get("business_experience") or None,
            reason_for_franchise=form_data.get("reason_for_franchise") or None,
            expected_opening_date=expected_opening_date,
            application_file=relative_path,
            status=FranchiseStatus.PENDING,
        )
        db.session.add(franchise)
        db.session.flush()

        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=owner_name or form_data.get("name"),
            role=UserRole.FRANCHISEE,
            franchise_id=franchise.id,
        )

        db.session.add(user)
        db.session.flush()

        franchise.owner_id = user.id

        db.session.commit()

    except IntegrityError:
        db.session.rollback()
        if saved_file_path and os.path.exists(saved_file_path):
            os.remove(saved_file_path)
        return jsonify({"error": "Email is already registered."}), HTTPStatus.CONFLICT
    except Exception as exc:  # pragma: no cover - unexpected failure logging
        db.session.rollback()
        if saved_file_path and os.path.exists(saved_file_path):
            os.remove(saved_file_path)
        current_app.logger.exception("Failed to register franchisee: %s", exc)
        return jsonify({"error": "Unable to complete registration at this time."}), HTTPStatus.INTERNAL_SERVER_ERROR

    return (
        jsonify(
            {
                "message": "Registration successful. Await admin approval.",
                "user": {"id": user.id, "email": user.email, "role": user.role.value},
                "franchise": {
                    "id": franchise.id,
                    "status": franchise.status.value,
                    "application_file": franchise.application_file,
                },
            }
        ),
        HTTPStatus.CREATED,
    )