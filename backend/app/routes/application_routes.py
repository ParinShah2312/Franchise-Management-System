"""Admin application workflows."""

from __future__ import annotations
from datetime import datetime, timezone
from http import HTTPStatus
from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy.orm import joinedload
from ..extensions import db
from ..models import (
    Address, ApplicationStatus, Branch, BranchStatus,
    Franchise, FranchiseApplication, Role, UserRole,
)
from ..utils.security import token_required
from ..utils.db_helpers import serialize_dt
from ..utils.branch_helpers import _current_role, get_role_name

application_bp = Blueprint("applications", __name__, url_prefix="/api/franchises")

def _hydrate_address(location: str) -> Address:
    """Parse location string into an Address object."""

    parts = [p.strip() for p in location.split(",")]
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

def _serialize_application(application: FranchiseApplication) -> dict[str, object]:
    applicant = application.branch_owner_user
    return {
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
        "document_url": f"/api/files/{application.document_blob_id}" if application.document_blob_id else None,
        "status": application.status.status_name if application.status else None,
        "submitted_at": serialize_dt(application.created_at),
    }

@application_bp.route("/applications", methods=["GET"])
@token_required({"FRANCHISOR"})
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

    role = _current_role()
    current_user = getattr(g, "current_user", None)
    role_name = get_role_name(role)

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
        payload.append(_serialize_application(application))

    return jsonify(payload), HTTPStatus.OK

# Changed to PUT to match standard REST conventions for updates
@application_bp.route("/applications/<int:application_id>/approve", methods=["PUT"])
@token_required({"FRANCHISOR"})
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

    # Ensure the franchisor can only approve applications for their own franchises
    current_user = getattr(g, "current_user", None)
    franchisor_id = getattr(current_user, "franchisor_id", None)
    if franchisor_id and application.franchise and \
            application.franchise.franchisor_id != franchisor_id:
        return jsonify(
            {"error": "You do not have permission to approve this application."}
        ), HTTPStatus.FORBIDDEN

    if not application.branch_owner_user:
        return jsonify(
            {"error": "Application is missing an associated applicant user."}
        ), HTTPStatus.BAD_REQUEST

    if application.status and application.status.status_name != "PENDING":
        return jsonify(
            {"error": "Only pending applications can be approved."}
        ), HTTPStatus.BAD_REQUEST

    try:
        support = _ensure_supporting_rows()
    except LookupError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    address = _hydrate_address(application.proposed_location)
    db.session.add(address)
    db.session.flush()

    city_suffix = (
        address.city
        if address.city and address.city != "UNKNOWN"
        else application.proposed_location
    )
    branch_name = f"{application.franchise.name if application.franchise else 'Franchise'} - {city_suffix}".strip()

    # Unique code generation
    timestamp_code = datetime.now(timezone.utc).strftime("%y%m%d")
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
    application.decision_by_franchisor_id = franchisor_id

    db.session.commit()

    return (
        jsonify(
            {
                "message": "Application approved and Branch created",
                "branch_id": branch.branch_id,
            }
        ),
        HTTPStatus.OK,
    )

@application_bp.route("/applications/<int:application_id>/reject", methods=["PUT"])
@token_required({"FRANCHISOR"})
def reject_application(application_id: int) -> tuple[dict[str, object], int]:
    """Reject a pending franchise application with optional notes."""

    payload = request.get_json(silent=True) or {}
    notes = (payload.get("notes") or "").strip() or None

    current_user = getattr(g, "current_user", None)
    franchisor_id = getattr(current_user, "franchisor_id", None)

    application = (
        FranchiseApplication.query.options(joinedload(FranchiseApplication.status))
        .filter_by(application_id=application_id)
        .first()
    )
    if not application:
        return jsonify({"error": "Application not found."}), HTTPStatus.NOT_FOUND

    if application.status is None or application.status.status_name != "PENDING":
        return jsonify(
            {"error": "Only pending applications can be rejected."}
        ), HTTPStatus.BAD_REQUEST

    rejected_status = ApplicationStatus.query.filter_by(status_name="REJECTED").first()
    if not rejected_status:
        return jsonify(
            {"error": "REJECTED application status not configured."}
        ), HTTPStatus.INTERNAL_SERVER_ERROR

    application.status_id = rejected_status.status_id
    application.decision_notes = notes
    application.decision_by_franchisor_id = franchisor_id

    db.session.commit()

    return jsonify({"message": "Application rejected."}), HTTPStatus.OK
