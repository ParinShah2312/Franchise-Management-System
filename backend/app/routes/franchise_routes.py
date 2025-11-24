"""Franchise management routes."""

from __future__ import annotations

from http import HTTPStatus

from flask import Blueprint, jsonify

from ..extensions import db
from ..models import Franchise, FranchiseStatus, UserRole
from ..utils.auth import current_user, login_required


franchise_bp = Blueprint("franchises", __name__, url_prefix="/api/franchises")


@franchise_bp.route("/public", methods=["GET"])
def list_public_franchises() -> tuple[list[str], int]:
    """Return distinct franchise brand names for backward compatibility."""

    distinct_names = (
        db.session.query(Franchise.name)
        .filter(Franchise.name.isnot(None))
        .order_by(Franchise.name.asc())
        .distinct()
        .all()
    )

    brands = [name for (name,) in distinct_names if name]

    return jsonify(brands), HTTPStatus.OK


@franchise_bp.route("/brands", methods=["GET"])
def list_public_brands() -> tuple[list[dict[str, str]], int]:
    """Return distinct franchise brand names for franchise registration."""

    distinct_names = (
        db.session.query(Franchise.name)
        .filter(Franchise.name.isnot(None))
        .order_by(Franchise.name.asc())
        .distinct()
        .all()
    )

    brands = [
        {"name": name}
        for (name,) in distinct_names
        if name
    ]

    return jsonify(brands), HTTPStatus.OK


@franchise_bp.route("/active-locations", methods=["GET"])
def list_active_locations() -> tuple[list[dict[str, object]], int]:
    """Return active franchise locations for staff registration."""

    active_franchises = (
        Franchise.query.filter(Franchise.status == FranchiseStatus.ACTIVE)
        .order_by(Franchise.name.asc(), Franchise.location.asc())
        .all()
    )

    data = [
        {
            "id": franchise.id,
            "name": franchise.name,
            "location": franchise.location,
        }
        for franchise in active_franchises
    ]

    return jsonify(data), HTTPStatus.OK


# ✅ FIXED: Changed "/" to "" to prevent 308 Redirect / CORS errors
@franchise_bp.route("", methods=["GET"])
@login_required()
def list_franchises() -> tuple[dict[str, object], int]:
    """Return franchises filtered by the requesting user's role."""

    user = current_user()

    if user.role == UserRole.ADMIN:
        franchises = Franchise.query.order_by(Franchise.created_at.desc()).all()
    else:
        if not user.franchise_id:
            return jsonify([]), HTTPStatus.OK
        franchises = [Franchise.query.get(user.franchise_id)]

    data = []
    for franchise in franchises:
        if not franchise:
            continue

        record = {
            "id": franchise.id,
            "franchise_name": franchise.name,
            "location": franchise.location,
            "status": franchise.status.value,
            "owner_id": franchise.owner_id,
            "owner_name": franchise.owner_name,
            "phone": franchise.phone,
            "property_size": franchise.property_size,
            "investment_capacity": franchise.investment_capacity,
        }

        if user.role == UserRole.ADMIN:
            record.update(
                {
                    "application_file": franchise.application_file,
                    "business_experience": franchise.business_experience,
                    "reason_for_franchise": franchise.reason_for_franchise,
                    "expected_opening_date": (
                        franchise.expected_opening_date.isoformat()
                        if franchise.expected_opening_date
                        else None
                    ),
                }
            )

        data.append(record)

    return jsonify(data), HTTPStatus.OK


@franchise_bp.route("/<int:franchise_id>/approve", methods=["PUT"])
@login_required(roles=[UserRole.ADMIN])
def approve_franchise(franchise_id: int) -> tuple[dict[str, object], int]:
    """Approve a pending franchise (admin only)."""

    franchise = Franchise.query.get(franchise_id)
    if not franchise:
        return jsonify({"error": "Franchise not found."}), HTTPStatus.NOT_FOUND

    franchise.status = FranchiseStatus.ACTIVE
    db.session.commit()

    return (
        jsonify(
            {
                "id": franchise.id,
                "status": franchise.status.value,
                "message": "Franchise approved successfully"
            }
        ),
        HTTPStatus.OK,
    )


@franchise_bp.route("/<int:franchise_id>/reject", methods=["PUT"])
@login_required(roles=[UserRole.ADMIN])
def reject_franchise(franchise_id: int) -> tuple[dict[str, object], int]:
    """Reject a pending franchise (admin only)."""

    franchise = Franchise.query.get(franchise_id)
    if not franchise:
        return jsonify({"error": "Franchise not found."}), HTTPStatus.NOT_FOUND

    franchise.status = FranchiseStatus.REJECTED

    if franchise.owner_id:
        owner = franchise.owner
        if owner:
            owner.franchise_id = None

    franchise.owner_id = None
    db.session.commit()

    return (
        jsonify(
            {
                "id": franchise.id,
                "status": franchise.status.value,
                "message": "Franchise rejected successfully",
            }
        ),
        HTTPStatus.OK,
    )