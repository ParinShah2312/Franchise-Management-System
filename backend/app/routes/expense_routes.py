"""Expense tracking routes for branch-level financial management."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, g, jsonify, request
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import Branch, Expense
from ..utils.security import token_required
from ..utils.db_helpers import serialize_dt
from ..utils.branch_helpers import _current_role, resolve_branch_id_from_request

expense_bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")

VALID_CATEGORIES = [
    "Rent", "Utilities", "Salaries", "Supplies", "Maintenance",
    "Marketing", "Insurance", "Transport", "Other"
]





def _serialize_expense(expense: Expense) -> dict:
    return {
        "expense_id": expense.expense_id,
        "branch_id": expense.branch_id,
        "logged_by_user_id": expense.logged_by_user_id,
        "logged_by_name": expense.logged_by_user.name if expense.logged_by_user else None,
        "expense_date": serialize_dt(expense.expense_date),
        "category": expense.category,
        "description": expense.description,
        "amount": float(expense.amount),
        "created_at": serialize_dt(expense.created_at),
    }


@expense_bp.route("", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def list_expenses() -> tuple[list[dict], int]:
    branch_id_param = request.args.get("branch_id", type=int)
    try:
        branch_id = resolve_branch_id_from_request(branch_id_param)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    records = (
        Expense.query.options(joinedload(Expense.logged_by_user))
        .filter(Expense.branch_id == branch_id)
        .order_by(Expense.expense_date.desc())
        .all()
    )
    return jsonify([_serialize_expense(r) for r in records]), HTTPStatus.OK


@expense_bp.route("", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def create_expense() -> tuple[dict, int]:
    payload = request.get_json(silent=True) or {}
    branch_id_param = request.args.get("branch_id", type=int) or payload.get("branch_id")

    try:
        branch_id = resolve_branch_id_from_request(branch_id_param)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    category = (payload.get("category") or "").strip()
    if not category:
        return jsonify({"error": "category is required."}), HTTPStatus.BAD_REQUEST
    
    if category not in VALID_CATEGORIES:
        return (
            jsonify({"error": f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}"}),
            HTTPStatus.BAD_REQUEST
        )

    description = (payload.get("description") or "").strip() or None

    amount_raw = payload.get("amount")
    if amount_raw is None:
        return jsonify({"error": "amount is required."}), HTTPStatus.BAD_REQUEST
    try:
        amount = Decimal(str(amount_raw))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"error": "amount must be numeric."}), HTTPStatus.BAD_REQUEST
    if amount <= 0:
        return jsonify({"error": "amount must be greater than zero."}), HTTPStatus.BAD_REQUEST

    expense_date_raw = payload.get("expense_date")
    if expense_date_raw:
        try:
            # Accept both "YYYY-MM-DD" and full ISO datetime strings
            raw = str(expense_date_raw)
            expense_date = date.fromisoformat(raw[:10])
        except (TypeError, ValueError):
            return jsonify({"error": "expense_date must be a valid ISO date (YYYY-MM-DD)."}), HTTPStatus.BAD_REQUEST
    else:
        expense_date = date.today()

    current_user = getattr(g, "current_user", None)

    expense = Expense(
        branch_id=branch_id,
        logged_by_user_id=current_user.user_id if current_user else None,
        expense_date=expense_date,
        category=category,
        description=description,
        amount=amount,
    )
    db.session.add(expense)
    db.session.commit()

    expense = db.session.get(
        Expense, expense.expense_id,
        options=[joinedload(Expense.logged_by_user)]
    )
    return jsonify(_serialize_expense(expense)), HTTPStatus.CREATED


@expense_bp.route("/<int:expense_id>", methods=["DELETE"])
@token_required({"BRANCH_OWNER", "MANAGER"})
def delete_expense(expense_id: int) -> tuple[dict, int]:
    expense = db.session.get(Expense, expense_id, options=[joinedload(Expense.logged_by_user)])
    if not expense:
        return jsonify({"error": "Expense not found."}), HTTPStatus.NOT_FOUND

    try:
        resolve_branch_id_from_request(expense.branch_id)
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    current_user = getattr(g, "current_user", None)
    current_role = _current_role()

    if current_user and current_role and current_role.role.name == "MANAGER":
        if expense.logged_by_user_id != current_user.user_id:
            return jsonify({"error": "Managers can only delete expenses logged by themselves."}), HTTPStatus.FORBIDDEN

    db.session.delete(expense)
    db.session.commit()
    return jsonify({"message": "Expense deleted."}), HTTPStatus.OK
