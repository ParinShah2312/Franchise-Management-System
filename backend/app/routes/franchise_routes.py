"""Public-facing franchise routes plus admin application workflows."""

from __future__ import annotations

import os
from datetime import datetime
from http import HTTPStatus
from uuid import uuid4

from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy.orm import joinedload
from werkzeug.utils import secure_filename

from ..extensions import db
from ..models import (
    Address,
    ApplicationStatus,
    Branch,
    BranchStatus,
    Franchise,
    FranchiseApplication,
    Role,
    UserRole,
)
from ..utils.security import token_required


franchise_bp = Blueprint("franchises", __name__, url_prefix="/api/franchises")


@franchise_bp.route("/brands", methods=["GET"])
def list_brands() -> tuple[list[dict[str, object]], int]:
    """Return all franchises (id + name) for public selection."""

    franchises = Franchise.query.order_by(Franchise.name.asc()).all()
    payload = [
        {"id": franchise.franchise_id, "name": franchise.name}
        for franchise in franchises
    ]
    return jsonify(payload), HTTPStatus.OK


@franchise_bp.route("/active-branches", methods=["GET"])
def list_active_branches() -> tuple[list[dict[str, object]], int]:
    """Expose active branches for staff signup flows."""

    active_status = BranchStatus.query.filter_by(status_name="ACTIVE").first()
    if not active_status:
        return jsonify({"error": "ACTIVE branch status not configured."}), HTTPStatus.INTERNAL_SERVER_ERROR

    branches = (
        Branch.query.options(joinedload(Branch.franchise))
        .filter(Branch.status_id == active_status.status_id)
        .order_by(Branch.name.asc())
        .all()
    )

    payload = [
        {
            "id": branch.branch_id,
            "name": branch.name,
            "franchise_id": branch.franchise_id,
            "franchise_name": branch.franchise.name if branch.franchise else None,
            "location": branch.address.city if branch.address else "Unknown", # Added location for UI
        }
        for branch in branches
    ]
    return jsonify(payload), HTTPStatus.OK


@franchise_bp.route("/<int:franchise_id>/menu", methods=["POST"])
@token_required({"FRANCHISOR", "SYSTEM_ADMIN"})
def upload_franchise_menu(franchise_id: int) -> tuple[dict[str, object], int]:
    franchise = Franchise.query.get(franchise_id)
    if not franchise:
        return jsonify({"error": "Franchise not found."}), HTTPStatus.NOT_FOUND

    role = getattr(g, "current_role", None)
    current_user = getattr(g, "current_user", None)
    role_name = getattr(getattr(role, "role", None), "name", None)

    if role_name == "FRANCHISOR":
        franchisor_id = getattr(current_user, "franchisor_id", None)
        if franchisor_id != franchise.franchisor_id:
            return (
                jsonify({"error": "You do not have permission to manage this franchise."}),
                HTTPStatus.FORBIDDEN,
            )

    upload = request.files.get("menu_file")
    if upload is None or not upload.filename:
        return jsonify({"error": "menu_file is required."}), HTTPStatus.BAD_REQUEST

    filename = secure_filename(upload.filename)
    if not filename:
        return jsonify({"error": "Uploaded file name is invalid."}), HTTPStatus.BAD_REQUEST

    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg"}
    extension = os.path.splitext(filename)[1].lower()
    if extension not in allowed_extensions:
        return (
            jsonify({"error": "Unsupported file type. Upload PDF or image files."}),
            HTTPStatus.BAD_REQUEST,
        )

    upload_folder = current_app.config.get("UPLOAD_FOLDER")
    if not upload_folder:
        upload_folder = os.path.join(current_app.root_path, "static", "uploads")
    os.makedirs(upload_folder, exist_ok=True)

    unique_filename = f"{uuid4().hex}_{filename}"
    stored_path = os.path.join(upload_folder, unique_filename)

    try:
        upload.save(stored_path)
    except Exception as exc:  # pragma: no cover - filesystem errors
        current_app.logger.exception("Failed to store uploaded menu: %s", exc)
        return (
            jsonify({"error": "Unable to store uploaded menu file."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    relative_path = os.path.join("uploads", unique_filename).replace("\\", "/")
    previous_menu_path = franchise.menu_file_path
    franchise.menu_file_path = relative_path

    try:
        db.session.commit()
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        if os.path.exists(stored_path):
            os.remove(stored_path)
        current_app.logger.exception("Failed to update franchise menu path: %s", exc)
        return (
            jsonify({"error": "Unable to update franchise menu."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    if previous_menu_path:
        old_full_path = os.path.join(current_app.root_path, "static", previous_menu_path)
        try:
            if os.path.exists(old_full_path):
                os.remove(old_full_path)
        except OSError:
            current_app.logger.warning("Failed to remove previous menu file at %s", old_full_path)

    return (
        jsonify(
            {
                "message": "Menu uploaded successfully",
                "file_path": f"/static/{relative_path}",
            }
        ),
        HTTPStatus.CREATED,
    )


@franchise_bp.route("/applications", methods=["GET"])
@token_required({"SYSTEM_ADMIN", "FRANCHISOR"})
def list_pending_applications() -> tuple[list[dict[str, object]], int]:
    """Return all pending franchise applications the caller can access."""

    pending_status = ApplicationStatus.query.filter_by(status_name="PENDING").first()
    if not pending_status:
        return (
            jsonify({"error": "PENDING application status not configured."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    query = FranchiseApplication.query.options(
        joinedload(FranchiseApplication.branch_owner_user),
        joinedload(FranchiseApplication.franchise),
        joinedload(FranchiseApplication.status),
    ).filter(FranchiseApplication.status_id == pending_status.status_id)

    role = getattr(g, "current_role", None)
    current_user = getattr(g, "current_user", None)
    role_name = getattr(getattr(role, "role", None), "name", None)

    if role_name == "FRANCHISOR":
        franchisor_id = getattr(current_user, "franchisor_id", None)
        if franchisor_id is None:
            return (
                jsonify({"error": "Franchisor context missing."}),
                HTTPStatus.FORBIDDEN,
            )
        query = query.join(Franchise).filter(Franchise.franchisor_id == franchisor_id)

    applications = query.order_by(FranchiseApplication.created_at.asc()).all()

    payload: list[dict[str, object]] = []
    for application in applications:
        applicant = application.branch_owner_user
        payload.append(
            {
                "application_id": application.application_id,
                "franchise_id": application.franchise_id,
                "franchise_name": application.franchise.name if application.franchise else None,
                "applicant_id": applicant.user_id if applicant else None,
                "applicant_name": applicant.name if applicant else None,
                "applicant_email": applicant.email if applicant else None,
                "applicant_phone": applicant.phone if applicant else None,
                "proposed_location": application.proposed_location,
                "investment_capacity": str(application.investment_capacity or "0"),
                "business_experience": application.business_experience,
                "reason": application.reason,
                "document_url": f"/static/{application.document_path}" if application.document_path else None,
                "status": application.status.status_name if application.status else None,
                "submitted_at": application.created_at.isoformat() if application.created_at else None,
            }
        )

    return jsonify(payload), HTTPStatus.OK


@franchise_bp.route("/applications", methods=["OPTIONS"])
def options_pending_applications():
    return current_app.make_default_options_response()


def _hydrate_address(location: str) -> Address:
    """Parse location string into an Address object."""

    parts = location.split(",")
    city = parts[0] if len(parts) > 0 else "UNKNOWN"
    state = parts[1] if len(parts) > 1 else "UNKNOWN"
    country = parts[2] if len(parts) > 2 else "India"
    pincode = parts[3] if len(parts) > 3 else "000000"

    return Address(
        address_line=location or city,
        city=city,
        state=state,
        country=country,
        pincode=pincode,
    )


def _ensure_supporting_rows() -> dict[str, object]:
    """Helper to fetch required status/role objects."""
    branch_active = BranchStatus.query.filter_by(status_name="ACTIVE").first()
    if not branch_active:
        raise LookupError("ACTIVE branch status not configured.")

    app_approved = ApplicationStatus.query.filter_by(status_name="APPROVED").first()
    if not app_approved:
        raise LookupError("APPROVED application status not configured.")

    owner_role = Role.query.filter_by(name="BRANCH_OWNER").first()
    if not owner_role:
        raise LookupError("BRANCH_OWNER role not configured.")

    return {
        "branch_status": branch_active,
        "app_status": app_approved,
        "owner_role": owner_role,
    }


# Changed to PUT to match standard REST conventions for updates
@franchise_bp.route("/applications/<int:application_id>/approve", methods=["PUT"])
@token_required({"SYSTEM_ADMIN"})
def approve_application(application_id: int) -> tuple[dict[str, object], int]:
    """Approve a pending franchise application and bootstrap a branch."""

    application = (
        FranchiseApplication.query.options(
            joinedload(FranchiseApplication.franchise),
            joinedload(FranchiseApplication.branch_owner_user),
            joinedload(FranchiseApplication.status),
        )
        .filter_by(application_id=application_id)
        .first()
    )

    if not application:
        return jsonify({"error": "Application not found."}), HTTPStatus.NOT_FOUND

    if not application.branch_owner_user:
        return jsonify({"error": "Application is missing an associated applicant user."}), HTTPStatus.BAD_REQUEST

    if application.status and application.status.status_name != "PENDING":
        return jsonify({"error": "Only pending applications can be approved."}), HTTPStatus.BAD_REQUEST

    try:
        support = _ensure_supporting_rows()
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    next_address_id = (
        db.session.query(db.func.coalesce(db.func.max(Address.address_id), 0)).scalar() + 1
    )

    address = _hydrate_address(application.proposed_location)
    address.address_id = next_address_id
    db.session.add(address)
    db.session.flush()

    next_branch_id = (
        db.session.query(db.func.coalesce(db.func.max(Branch.branch_id), 0)).scalar() + 1
    )

    city_suffix = address.city if address.city and address.city != "UNKNOWN" else application.proposed_location
    branch_name = f"{application.franchise.name if application.franchise else 'Franchise'} - {city_suffix}".strip()

    # Unique code generation
    timestamp_code = datetime.utcnow().strftime('%y%m%d')
    branch_code = f"BR-{application.application_id}-{timestamp_code}"

    branch = Branch(
        branch_id=next_branch_id,
        franchise_id=application.franchise_id,
        name=branch_name,
        code=branch_code,
        address_id=address.address_id,
        branch_owner_user_id=application.branch_owner_user.user_id,
        status_id=support["branch_status"].status_id,
    )
    db.session.add(branch)
    db.session.flush()

    # 3. Assign Role (BRANCH_OWNER)
    existing_assignment = UserRole.query.filter_by(
        user_id=application.branch_owner_user.user_id,
        role_id=support["owner_role"].role_id,
        scope_type="BRANCH",
        scope_id=branch.branch_id,
    ).first()

    if not existing_assignment:
        db.session.add(
            UserRole(
                user_id=application.branch_owner_user.user_id,
                role_id=support["owner_role"].role_id,
                scope_type="BRANCH",
                scope_id=branch.branch_id,
            )
        )

    # 4. Update Application Status
    application.status_id = support["app_status"].status_id
    # Optional: Link decision maker if current_user is available in context
    # application.decision_by_franchisor_id = g.user.id 
    
    db.session.commit()

    return (
        jsonify({
            "message": "Application approved and Branch created", 
            "branch_id": branch.branch_id
        }),
        HTTPStatus.OK,
    )


@franchise_bp.route("/network", methods=["GET"])
@token_required({"SYSTEM_ADMIN", "FRANCHISOR"})
def list_franchise_network() -> tuple[list[dict[str, object]], int]:
    """Return a hierarchical view of franchises and their branches."""

    franchises = (
        Franchise.query.options(
            joinedload(Franchise.branches)
            .joinedload(Branch.address),
            joinedload(Franchise.branches).joinedload(Branch.branch_owner),
            joinedload(Franchise.branches).joinedload(Branch.manager),
            joinedload(Franchise.branches).joinedload(Branch.status),
        )
        .order_by(Franchise.name.asc())
        .all()
    )

    def _branch_location(branch: Branch) -> str:
        if branch.address:
            parts = [branch.address.city, branch.address.state]
            return ", ".join(part for part in parts if part)
        return "Unknown"

    network: list[dict[str, object]] = []
    for franchise in franchises:
        branches_payload = []
        for branch in sorted(franchise.branches, key=lambda b: b.name.lower() if b.name else ""):
            branches_payload.append(
                {
                    "branch_id": branch.branch_id,
                    "name": branch.name,
                    "location": _branch_location(branch),
                    "owner_name": branch.branch_owner.name if branch.branch_owner else None,
                    "manager_name": branch.manager.name if branch.manager else None,
                    "status": branch.status.status_name if branch.status else None,
                }
            )

        network.append(
            {
                "franchise_id": franchise.franchise_id,
                "franchise_name": franchise.name,
                "menu_file_url": f"/static/{franchise.menu_file_path}" if franchise.menu_file_path else None,
                "branches": branches_payload,
            }
        )

    return jsonify(network), HTTPStatus.OK


@franchise_bp.route("/applications/<int:application_id>/reject", methods=["PUT"])
@token_required({"SYSTEM_ADMIN", "FRANCHISOR"})
def reject_application(application_id: int) -> tuple[dict[str, object], int]:
    """Reject a pending franchise application with optional notes."""

    payload = request.get_json(silent=True) or {}
    notes = (payload.get("notes") or "").strip() or None

    application = (
        FranchiseApplication.query.options(joinedload(FranchiseApplication.status))
        .filter_by(application_id=application_id)
        .first()
    )
    if not application:
        return jsonify({"error": "Application not found."}), HTTPStatus.NOT_FOUND

    if application.status is None or application.status.status_name != "PENDING":
        return jsonify({"error": "Only pending applications can be rejected."}), HTTPStatus.BAD_REQUEST

    rejected_status = ApplicationStatus.query.filter_by(status_name="REJECTED").first()
    if not rejected_status:
        return jsonify({"error": "REJECTED application status not configured."}), HTTPStatus.INTERNAL_SERVER_ERROR

    application.status_id = rejected_status.status_id
    application.decision_notes = notes

    db.session.commit()

    return jsonify({"message": "Application rejected."}), HTTPStatus.OK