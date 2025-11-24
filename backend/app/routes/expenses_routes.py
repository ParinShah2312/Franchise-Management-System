"""Expense management routes."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Expense, Franchise, FranchiseStatus, UserRole
from ..utils.auth import current_user, login_required


expenses_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")


def _serialize_expense(expense: Expense) -> dict[str, object]:
    if isinstance(expense.expense_date, (datetime, date)):
        expense_date = expense.expense_date.isoformat()
    else:
        expense_date = str(expense.expense_date)

    return {
        "id": expense.id,
        "franchise_id": expense.franchise_id,
        "expense_date": expense_date,
        "description": expense.description,
        "amount": float(expense.amount),
        "category": expense.category,
    }


def _resolve_franchise(user, requested_franchise_id: int | None, require_assignment: bool = False):
    if user.role == UserRole.ADMIN:
        if require_assignment and not requested_franchise_id:
            return None, (jsonify({"error": "franchise_id is required."}), HTTPStatus.BAD_REQUEST)
        return requested_franchise_id, None

    if not user.franchise_id:
        return None, (jsonify({"error": "User is not associated with a franchise."}), HTTPStatus.BAD_REQUEST)

    if requested_franchise_id and requested_franchise_id != user.franchise_id:
        return None, (jsonify({"error": "Unauthorized franchise access."}), HTTPStatus.FORBIDDEN)

    return user.franchise_id, None


@expenses_bp.route("", methods=["GET"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE, UserRole.STAFF])
def list_expenses() -> tuple[list[dict[str, object]], int]:
    """List expenses scoped to the user's franchise context."""

    user = current_user()
    requested_franchise_id = request.args.get("franchise_id", type=int)
    franchise_id, error = _resolve_franchise(user, requested_franchise_id)
    if error:
        return error

    query = Expense.query
    if franchise_id:
        query = query.filter_by(franchise_id=franchise_id)

    expenses = query.order_by(Expense.expense_date.desc()).all()
    return jsonify([_serialize_expense(expense) for expense in expenses]), HTTPStatus.OK


@expenses_bp.route("", methods=["POST"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE])
def create_expense() -> tuple[dict[str, object], int]:
    """Create a new expense record."""

    user = current_user()
    payload = request.get_json(silent=True) or {}

    franchise_id, error = _resolve_franchise(user, payload.get("franchise_id"), require_assignment=True)
    if error:
        return error

    franchise = Franchise.query.get(franchise_id)
    if not franchise or franchise.status != FranchiseStatus.ACTIVE:
        return jsonify({"error": "Franchise must exist and be active."}), HTTPStatus.BAD_REQUEST

    required_fields = ["expense_date", "amount"]
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        return (
            jsonify({"error": f"Missing required fields: {', '.join(sorted(set(missing)))}"}),
            HTTPStatus.BAD_REQUEST,
        )

    try:
        expense_date = datetime.fromisoformat(payload["expense_date"]).date()
    except (ValueError, TypeError):
        return jsonify({"error": "expense_date must be ISO formatted (YYYY-MM-DD)."}), HTTPStatus.BAD_REQUEST

    try:
        amount = Decimal(str(payload["amount"]))
    except (InvalidOperation, TypeError):
        return jsonify({"error": "amount must be numeric."}), HTTPStatus.BAD_REQUEST

    expense = Expense(
        franchise_id=franchise_id,
        expense_date=expense_date,
        description=payload.get("description"),
        amount=amount,
        category=payload.get("category"),
    )

    db.session.add(expense)
    db.session.commit()

    return jsonify(_serialize_expense(expense)), HTTPStatus.CREATED


@expenses_bp.route("/<int:expense_id>", methods=["PUT"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE])
def update_expense(expense_id: int) -> tuple[dict[str, object], int]:
    """Update an existing expense."""

    user = current_user()
    payload = request.get_json(silent=True) or {}

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found."}), HTTPStatus.NOT_FOUND

    franchise_id, error = _resolve_franchise(user, payload.get("franchise_id"))
    if error:
        return error

    if user.role != UserRole.ADMIN and expense.franchise_id != user.franchise_id:
        return jsonify({"error": "Unauthorized expense access."}), HTTPStatus.FORBIDDEN

    if franchise_id and expense.franchise_id != franchise_id:
        return jsonify({"error": "Expense does not belong to the specified franchise."}), HTTPStatus.FORBIDDEN

    if "expense_date" in payload:
        try:
            expense.expense_date = datetime.fromisoformat(payload["expense_date"]).date()
        except (ValueError, TypeError):
            return jsonify({"error": "expense_date must be ISO formatted (YYYY-MM-DD)."}), HTTPStatus.BAD_REQUEST

    if "amount" in payload:
        try:
            expense.amount = Decimal(str(payload["amount"]))
        except (InvalidOperation, TypeError):
            return jsonify({"error": "amount must be numeric."}), HTTPStatus.BAD_REQUEST

    if "description" in payload:
        expense.description = payload.get("description")

    if "category" in payload:
        expense.category = payload.get("category")

    db.session.commit()

    return jsonify(_serialize_expense(expense)), HTTPStatus.OK


@expenses_bp.route("/<int:expense_id>", methods=["DELETE"])
@login_required(roles=[UserRole.ADMIN, UserRole.FRANCHISEE])
def delete_expense(expense_id: int) -> tuple[dict[str, object], int]:
    """Delete an expense record."""

    user = current_user()

    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({"error": "Expense not found."}), HTTPStatus.NOT_FOUND

    if user.role != UserRole.ADMIN and expense.franchise_id != user.franchise_id:
        return jsonify({"error": "Unauthorized expense access."}), HTTPStatus.FORBIDDEN

    db.session.delete(expense)
    db.session.commit()

    return jsonify({"message": "Expense deleted."}), HTTPStatus.OK
