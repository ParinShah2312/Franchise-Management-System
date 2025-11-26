"""Public-facing franchise routes plus admin application workflows."""

from __future__ import annotations

from datetime import datetime
from http import HTTPStatus

from flask import Blueprint, jsonify
from sqlalchemy.orm import joinedload

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


@franchise_bp.route("/applications", methods=["GET"])
@token_required({"SYSTEM_ADMIN"})
def list_pending_applications() -> tuple[list[dict[str, object]], int]:
    """Return all pending franchise applications for admins."""

    pending_status = ApplicationStatus.query.filter_by(status_name="PENDING").first()
    if not pending_status:
        return jsonify({"error": "PENDING application status not configured."}), HTTPStatus.INTERNAL_SERVER_ERROR

    applications = (
        FranchiseApplication.query.options(
            joinedload(FranchiseApplication.branch_owner_user),
            joinedload(FranchiseApplication.franchise),
        )
        .filter(FranchiseApplication.status_id == pending_status.status_id)
        .order_by(FranchiseApplication.created_at.asc())
        .all()
    )

    payload = []
    for application in applications:
        applicant = application.branch_owner_user
        payload.append(
            {
                "application_id": application.application_id,
                "franchise_id": application.franchise_id,
                "franchise_name": application.franchise.name if application.franchise else None,
                "applicant_id": applicant.user_id if applicant else None,
                "applicant_name": applicant.name if applicant else None,
                "proposed_location": application.proposed_location,
                "investment": str(application.investment_capacity) if application.investment_capacity else "0",
                "experience": application.reason, 
                "document_url": f"/uploads/{application.document_path}" if application.document_path else None, # Fixed path
                "submitted_at": application.created_at.isoformat() if application.created_at else None,
            }
        )

    return jsonify(payload), HTTPStatus.OK


def _hydrate_address(location: str) -> Address:
    """Helper to create an Address object from a location string."""
    # Simple parsing logic: "City, State, Country - Pincode"
    # Fallback: Just put everything in address_line
    parts = [segment.strip() for segment in (location or "").split(",") if segment.strip()]
    city = parts[0] if parts else location or "UNKNOWN"
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

    # 1. Create Address
    address = _hydrate_address(application.proposed_location)
    db.session.add(address)
    db.session.flush() # To get address_id

    # 2. Create Branch
    city_suffix = address.city if address.city and address.city != "UNKNOWN" else application.proposed_location
    branch_name = f"{application.franchise.name if application.franchise else 'Franchise'} - {city_suffix}".strip()
    
    # Unique code generation
    timestamp_code = datetime.utcnow().strftime('%y%m%d')
    branch_code = f"BR-{application.application_id}-{timestamp_code}"

    branch = Branch(
        franchise_id=application.franchise_id,
        name=branch_name,
        code=branch_code,
        address_id=address.address_id,
        branch_owner_user_id=application.branch_owner_user.user_id,
        status_id=support["branch_status"].status_id,
    )
    db.session.add(branch)
    db.session.flush() # To get branch_id

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