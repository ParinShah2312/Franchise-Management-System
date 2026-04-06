"""Tests for stock purchase request workflows (create, approve, reject)."""

from decimal import Decimal
from app.models import (
    StockPurchaseRequest, StockItem, BranchInventory, RequestStatus
)


def test_create_request_requires_manager(client, setup_franchise_branch):
    """Branch owners cannot create stock requests (MANAGER-only endpoint)."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    payload = {"items": [{"stock_item_id": 1, "requested_quantity": 10}]}
    response = client.post(
        f"/api/requests?branch_id={b_id}",
        json=payload,
        headers=branch_auth_headers,
    )
    assert response.status_code == 403


def test_list_requests_empty(client, setup_franchise_branch):
    """Listing requests for a branch with none returns an empty list."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    response = client.get(
        f"/api/requests?branch_id={b_id}",
        headers=branch_auth_headers,
    )
    assert response.status_code == 200
    assert response.get_json() == []


def test_approve_request_adds_to_inventory(client, setup_franchise_branch, db_session):
    """Approving a pending request updates branch inventory quantity."""
    from app.models import Franchise, Role, UserRole, User
    from app.utils.security import hash_password, generate_token

    f_id, b_id, branch_auth_headers = setup_franchise_branch

    # Create a manager user for this branch
    manager = User(
        name="Test Manager",
        email="req_manager@branch.com",
        phone="6600000001",
        password_hash=hash_password("Password123!"),
        is_active=True,
        must_reset_password=False,
    )
    db_session.add(manager)
    db_session.commit()

    manager_role = db_session.query(Role).filter_by(name="MANAGER").first()
    db_session.add(UserRole(
        user_id=manager.user_id,
        role_id=manager_role.role_id,
        scope_type="BRANCH",
        scope_id=b_id,
    ))
    db_session.commit()

    stock = StockItem(franchise_id=f_id, name="Request Test Stock", unit_id=1)
    db_session.add(stock)
    db_session.commit()

    # Manager creates request
    manager_token = generate_token(manager.user_id, user_type="user")
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    payload = {
        "items": [{"stock_item_id": stock.stock_item_id, "requested_quantity": 25.0}]
    }
    create_resp = client.post(
        f"/api/requests?branch_id={b_id}",
        json=payload,
        headers=manager_headers,
    )
    assert create_resp.status_code == 201
    request_id = create_resp.get_json()["request_id"]

    # Owner approves
    approve_resp = client.put(
        f"/api/requests/{request_id}/approve",
        headers=branch_auth_headers,
    )
    assert approve_resp.status_code == 200
    data = approve_resp.get_json()
    assert data["status"] == "APPROVED"

    # Confirm inventory was updated
    inv = db_session.query(BranchInventory).filter_by(
        branch_id=b_id, stock_item_id=stock.stock_item_id
    ).first()
    assert inv is not None
    assert float(inv.quantity) == 25.0


def test_reject_request(client, setup_franchise_branch, db_session):
    """Branch owner can reject a pending request."""
    from app.models import Role, UserRole, User
    from app.utils.security import hash_password, generate_token

    f_id, b_id, branch_auth_headers = setup_franchise_branch

    manager = User(
        name="Reject Manager",
        email="reject_mgr@branch.com",
        phone="6600000002",
        password_hash=hash_password("Password123!"),
        is_active=True,
        must_reset_password=False,
    )
    db_session.add(manager)
    db_session.commit()
    manager_role = db_session.query(Role).filter_by(name="MANAGER").first()
    db_session.add(UserRole(
        user_id=manager.user_id,
        role_id=manager_role.role_id,
        scope_type="BRANCH",
        scope_id=b_id,
    ))
    db_session.commit()

    stock = StockItem(franchise_id=f_id, name="Reject Test Stock", unit_id=1)
    db_session.add(stock)
    db_session.commit()

    manager_token = generate_token(manager.user_id, user_type="user")
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    payload = {"items": [{"stock_item_id": stock.stock_item_id, "requested_quantity": 10.0}]}
    create_resp = client.post(
        f"/api/requests?branch_id={b_id}",
        json=payload,
        headers=manager_headers,
    )
    assert create_resp.status_code == 201
    request_id = create_resp.get_json()["request_id"]

    reject_resp = client.put(
        f"/api/requests/{request_id}/reject",
        headers=branch_auth_headers,
    )
    assert reject_resp.status_code == 200
    assert reject_resp.get_json()["status"] == "REJECTED"


def test_cannot_approve_already_approved_request(client, setup_franchise_branch, db_session):
    """Approving an already-approved request returns 400."""
    from app.models import Role, UserRole, User
    from app.utils.security import hash_password, generate_token

    f_id, b_id, branch_auth_headers = setup_franchise_branch
    manager = User(
        name="Double Approve Manager",
        email="dbl_approve@branch.com",
        phone="6600000003",
        password_hash=hash_password("Password123!"),
        is_active=True,
        must_reset_password=False,
    )
    db_session.add(manager)
    db_session.commit()
    manager_role = db_session.query(Role).filter_by(name="MANAGER").first()
    db_session.add(UserRole(
        user_id=manager.user_id,
        role_id=manager_role.role_id,
        scope_type="BRANCH",
        scope_id=b_id,
    ))
    db_session.commit()
    stock = StockItem(franchise_id=f_id, name="Double Approve Stock", unit_id=1)
    db_session.add(stock)
    db_session.commit()

    manager_token = generate_token(manager.user_id, user_type="user")
    manager_headers = {"Authorization": f"Bearer {manager_token}"}

    payload = {"items": [{"stock_item_id": stock.stock_item_id, "requested_quantity": 5.0}]}
    create_resp = client.post(
        f"/api/requests?branch_id={b_id}", json=payload, headers=manager_headers
    )
    request_id = create_resp.get_json()["request_id"]
    client.put(f"/api/requests/{request_id}/approve", headers=branch_auth_headers)
    second_approve = client.put(
        f"/api/requests/{request_id}/approve", headers=branch_auth_headers
    )
    assert second_approve.status_code == 400
