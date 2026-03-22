"""Public-facing franchise routes."""

from __future__ import annotations
import os
from http import HTTPStatus
from ..utils.file_helpers import save_uploaded_file, MENU_EXTENSIONS
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
                jsonify(
                    {"error": "You do not have permission to manage this franchise."}
                ),
                HTTPStatus.FORBIDDEN,
            )

    upload = request.files.get("menu_file")
    if upload is None or not upload.filename:
        return jsonify({"error": "menu_file is required."}), HTTPStatus.BAD_REQUEST

    try:
        stored_path, relative_path = save_uploaded_file(
            upload, allowed_extensions=MENU_EXTENSIONS
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST
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
        old_full_path = os.path.join(
            current_app.root_path, "static", previous_menu_path
        )
        try:
            if os.path.exists(old_full_path):
                os.remove(old_full_path)
        except OSError:
            current_app.logger.warning(
                "Failed to remove previous menu file at %s", old_full_path
            )

    return (
        jsonify(
            {
                "message": "Menu uploaded successfully",
                "file_path": f"/static/{relative_path}",
            }
        ),
        HTTPStatus.CREATED,
    )


@franchise_bp.route("/network", methods=["GET"])
@token_required({"SYSTEM_ADMIN", "FRANCHISOR"})
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
                "menu_file_url": f"/static/{franchise.menu_file_path}"
                if franchise.menu_file_path
                else None,
                "branches": branches_payload,
            }
        )

    return jsonify(network), HTTPStatus.OK


