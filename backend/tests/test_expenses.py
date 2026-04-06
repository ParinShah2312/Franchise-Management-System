"""Tests for the expense tracking endpoints."""

from decimal import Decimal
from datetime import datetime, timezone
from app.models import Expense


def test_list_expenses_empty(client, setup_franchise_branch):
    """Fetching expenses for a branch with no expenses returns an empty list."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    response = client.get(f"/api/expenses?branch_id={b_id}", headers=branch_auth_headers)
    assert response.status_code == 200
    assert response.get_json() == []


def test_create_expense_success(client, setup_franchise_branch, db_session):
    """Branch owner can log a valid expense."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    payload = {
        "category": "Rent",
        "amount": 5000.00,
        "expense_date": datetime.now(timezone.utc).isoformat(),
        "description": "Monthly rent",
    }
    response = client.post(
        f"/api/expenses?branch_id={b_id}",
        json=payload,
        headers=branch_auth_headers,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["category"] == "Rent"
    assert float(data["amount"]) == 5000.00

    expense = db_session.query(Expense).filter_by(branch_id=b_id).first()
    assert expense is not None
    assert expense.category == "Rent"


def test_create_expense_missing_amount(client, setup_franchise_branch):
    """Creating an expense without amount returns 400."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    payload = {"category": "Utilities", "expense_date": datetime.now(timezone.utc).isoformat()}
    response = client.post(
        f"/api/expenses?branch_id={b_id}",
        json=payload,
        headers=branch_auth_headers,
    )
    assert response.status_code == 400


def test_create_expense_zero_amount(client, setup_franchise_branch):
    """Creating an expense with zero amount returns 400."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    payload = {
        "category": "Other",
        "amount": 0,
        "expense_date": datetime.now(timezone.utc).isoformat(),
    }
    response = client.post(
        f"/api/expenses?branch_id={b_id}",
        json=payload,
        headers=branch_auth_headers,
    )
    assert response.status_code == 400


def test_create_expense_missing_category(client, setup_franchise_branch):
    """Creating an expense without category returns 400."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    payload = {"amount": 1000, "expense_date": datetime.now(timezone.utc).isoformat()}
    response = client.post(
        f"/api/expenses?branch_id={b_id}",
        json=payload,
        headers=branch_auth_headers,
    )
    assert response.status_code == 400


def test_delete_expense(client, setup_franchise_branch, db_session):
    """Branch owner can delete an expense they own."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    expense = Expense(
        branch_id=b_id,
        category="Supplies",
        amount=Decimal("300.00"),
        expense_date=datetime.now(timezone.utc),
    )
    db_session.add(expense)
    db_session.commit()

    response = client.delete(
        f"/api/expenses/{expense.expense_id}",
        headers=branch_auth_headers,
    )
    assert response.status_code == 200

    deleted = db_session.get(Expense, expense.expense_id)
    assert deleted is None


def test_list_expenses_returns_all_for_branch(client, setup_franchise_branch, db_session):
    """List endpoint returns all expenses for the given branch."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    for i in range(3):
        db_session.add(Expense(
            branch_id=b_id,
            category="Transport",
            amount=Decimal(str(100 * (i + 1))),
            expense_date=datetime.now(timezone.utc),
        ))
    db_session.commit()

    response = client.get(f"/api/expenses?branch_id={b_id}", headers=branch_auth_headers)
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 3
