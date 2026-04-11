"""Public-facing franchise routes."""

from __future__ import annotations
from http import HTTPStatus
from ..utils.file_helpers import save_file_to_db, MENU_EXTENSIONS
from flask import Blueprint, current_app, g, jsonify, request
from sqlalchemy.orm import joinedload
from ..extensions import db
from ..models import Branch, BranchStatus, Franchise
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
        return jsonify(
            {"error": "ACTIVE branch status not configured."}
        ), HTTPStatus.INTERNAL_SERVER_ERROR

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
            "location": branch.address.city
            if branch.address
            else "Unknown",  # Added location for UI
        }
        for branch in branches
    ]
    return jsonify(payload), HTTPStatus.OK


@franchise_bp.route("/<int:franchise_id>/menu", methods=["POST"])
@token_required({"FRANCHISOR"})
def upload_franchise_menu(franchise_id: int) -> tuple[dict[str, object], int]:
    franchise = db.session.get(Franchise, franchise_id)
    if not franchise:
        return jsonify({"error": "Franchise not found."}), HTTPStatus.NOT_FOUND

    role = getattr(g, "current_role", None)
    current_user = getattr(g, "current_user", None)
    role_name = getattr(getattr(role, "role", None), "name", None)

    if role_name == "FRANCHISOR":
        franchisor_id = getattr(current_user, "franchisor_id", None)
        if franchisor_id != franchise.franchisor_id:
            return (
                jsonify(
                    {"error": "You do not have permission to manage this franchise."}
                ),
                HTTPStatus.FORBIDDEN,
            )

    upload = request.files.get("menu_file")
    if upload is None or not upload.filename:
        return jsonify({"error": "menu_file is required."}), HTTPStatus.BAD_REQUEST

    try:
        blob = save_file_to_db(upload, allowed_extensions=MENU_EXTENSIONS)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    db.session.add(blob)
    db.session.flush()

    franchise.menu_blob_id = blob.blob_id

    try:
        db.session.commit()
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        current_app.logger.exception("Failed to update franchise menu: %s", exc)
        return (
            jsonify({"error": "Unable to update franchise menu."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    return (
        jsonify(
            {
                "message": "Menu uploaded successfully",
                "file_url": f"/api/files/{blob.blob_id}",
            }
        ),
        HTTPStatus.CREATED,
    )


@franchise_bp.route("/<int:franchise_id>", methods=["PATCH"])
@token_required({"FRANCHISOR"})
def update_franchise(franchise_id: int) -> tuple[dict[str, object], int]:
    """Update franchise details (e.g., name)."""
    franchise = db.session.get(Franchise, franchise_id)
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

    data = request.get_json(silent=True) or {}
    new_name = data.get("name")
    
    if new_name is not None:
        new_name = new_name.strip()
        if not new_name:
            return jsonify({"error": "Franchise name cannot be empty."}), HTTPStatus.BAD_REQUEST
        franchise.name = new_name

    db.session.commit()

    return jsonify({"message": "Franchise updated successfully", "name": franchise.name}), HTTPStatus.OK


@franchise_bp.route("/network", methods=["GET"])
@token_required({"FRANCHISOR"})
def list_franchise_network() -> tuple[list[dict[str, object]], int]:
    """Return a hierarchical view of franchises and their branches."""

    query = Franchise.query.options(
        joinedload(Franchise.branches).joinedload(Branch.address),
        joinedload(Franchise.branches).joinedload(Branch.branch_owner),
        joinedload(Franchise.branches).joinedload(Branch.manager),
        joinedload(Franchise.branches).joinedload(Branch.status),
    )

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
        query = query.filter(Franchise.franchisor_id == franchisor_id)

    franchises = query.order_by(Franchise.name.asc()).all()

    def _branch_location(branch: Branch) -> str:
        if branch.address:
            parts = [branch.address.city, branch.address.state]
            return ", ".join(part for part in parts if part)
        return "Unknown"

    network: list[dict[str, object]] = []
    for franchise in franchises:
        branches_payload = []
        for branch in sorted(
            franchise.branches, key=lambda b: b.name.lower() if b.name else ""
        ):
            branches_payload.append(
                {
                    "branch_id": branch.branch_id,
                    "name": branch.name,
                    "location": _branch_location(branch),
                    "owner_name": branch.branch_owner.name
                    if branch.branch_owner
                    else None,
                    "manager_name": branch.manager.name if branch.manager else None,
                    "status": branch.status.status_name if branch.status else None,
                }
            )

        network.append(
            {
                "franchise_id": franchise.franchise_id,
                "franchise_name": franchise.name,
                "menu_file_url": f"/api/files/{franchise.menu_blob_id}"
                if franchise.menu_blob_id
                else None,
                "branches": branches_payload,
            }
        )

    return jsonify(network), HTTPStatus.OK


@franchise_bp.route("/branches/<int:branch_id>/status", methods=["PUT"])
@token_required({"FRANCHISOR"})
def toggle_branch_status(branch_id: int) -> tuple[dict[str, object], int]:
    """Toggle a branch's active/inactive status."""

    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "")

    if new_status not in ("ACTIVE", "INACTIVE"):
        return jsonify({"error": "status must be ACTIVE or INACTIVE."}), HTTPStatus.BAD_REQUEST

    branch = db.session.get(Branch, branch_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    current_user = getattr(g, "current_user", None)
    franchise = Franchise.query.filter_by(
        franchisor_id=current_user.franchisor_id
    ).first()

    if not franchise or branch.franchise_id != franchise.franchise_id:
        return (
            jsonify({"error": "You do not have permission to manage this branch."}),
            HTTPStatus.FORBIDDEN,
        )

    target_status = BranchStatus.query.filter_by(status_name=new_status).first()
    if not target_status:
        return (
            jsonify({"error": "Branch status configuration missing."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    if branch.status_id == target_status.status_id:
        return (
            jsonify({"error": f"Branch is already {new_status}."}),
            HTTPStatus.BAD_REQUEST,
        )

    branch.status_id = target_status.status_id
    db.session.commit()

    return (
        jsonify(
            {
                "message": f"Branch status updated to {new_status}.",
                "branch_id": branch.branch_id,
                "status": new_status,
            }
        ),
        HTTPStatus.OK,
    )
