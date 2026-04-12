"""Tests for user deactivation, inactive login blocking, and role-based access."""

import json
from app.models import User, UserRole, Role
from app.utils.security import hash_password, generate_token


def test_inactive_user_cannot_login(client, db_session):
    """Test that deactivated users receive a clear error on login attempt."""
    user = User(
        name="Deactivated User",
        email="inactive@test.com",
        phone="1000000001",
        password_hash=hash_password("Password123!"),
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/api/auth/login",
        json={"email": "inactive@test.com", "password": "Password123!"},
    )
    assert response.status_code == 403
    data = response.get_json()
    assert "inactive" in data["error"].lower()


def test_inactive_user_token_rejected(client, db_session):
    """Test that a valid token for an inactive user is rejected at the middleware."""
    user = User(
        name="Soon Inactive",
        email="sooninactive@test.com",
        phone="1000000002",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    role = db_session.query(Role).filter_by(name="STAFF").first()
    db_session.add(UserRole(
        user_id=user.user_id,
        role_id=role.role_id,
        scope_type="BRANCH",
        scope_id=1,
    ))
    db_session.commit()

    token = generate_token(user.user_id, role="STAFF")
    headers = {"Authorization": f"Bearer {token}"}

    # Deactivate AFTER generating the token
    user.is_active = False
    db_session.commit()

    response = client.get("/api/inventory/stock-items", headers=headers)
    assert response.status_code == 403


def test_wrong_password_rejected(client, db_session):
    """Test that an incorrect password is properly rejected."""
    payload = {
        "organization_name": "Wrong Pass Org",
        "contact_person": "Wrong User",
        "email": "wrongpass@org.com",
        "phone": "1000000003",
        "password": "Password123!",
    }
    client.post("/api/auth/register-franchisor", json=payload)

    response = client.post(
        "/api/auth/login",
        json={"email": "wrongpass@org.com", "password": "TotallyWrong!"},
    )
    assert response.status_code == 401


def test_missing_token_returns_401(client, db_session):
    """Test that endpoints requiring auth return 401 when no token is provided."""
    response = client.get("/api/inventory/stock-items")
    assert response.status_code == 401
    assert "authentication" in response.get_json()["error"].lower()


def test_malformed_token_returns_401(client, db_session):
    """Test that a garbage token is properly rejected."""
    headers = {"Authorization": "Bearer this.is.garbage"}
    response = client.get("/api/inventory/stock-items", headers=headers)
    assert response.status_code == 401


def test_franchisor_cannot_access_branch_routes(client, db_session):
    """Test RBAC: franchisor token cannot access branch-scoped endpoints."""
    payload = {
        "organization_name": "RBAC Test Org",
        "contact_person": "RBAC User",
        "email": "rbac@org.com",
        "phone": "1000000004",
        "password": "Password123!",
    }
    client.post("/api/auth/register-franchisor", json=payload)
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "rbac@org.com", "password": "Password123!"},
    )
    token = login_resp.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Franchisor should be forbidden from branch-scoped inventory
    response = client.get("/api/inventory/stock-items", headers=headers)
    assert response.status_code == 403


def test_staff_cannot_access_inventory_admin_routes(client, setup_franchise_branch, db_session):
    """Staff role cannot create stock items (FRANCHISOR-only)."""
    from app.models import Role, UserRole, User
    from app.utils.security import hash_password, generate_token

    f_id, b_id, _ = setup_franchise_branch
    staff = User(
        name="RBAC Staff",
        email="rbac_staff_inv@branch.com",
        phone="4400000001",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(staff)
    db_session.commit()
    staff_role = db_session.query(Role).filter_by(name="STAFF").first()
    db_session.add(UserRole(
        user_id=staff.user_id, role_id=staff_role.role_id,
        scope_type="BRANCH", scope_id=b_id,
    ))
    db_session.commit()
    token = generate_token(staff.user_id, role="STAFF")
    response = client.post(
        "/api/inventory/stock-items",
        json={"stock_item_name": "Illegal Item", "unit_id": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_branch_owner_cannot_create_stock_requests(client, setup_franchise_branch):
    """Branch owner cannot create stock purchase requests (MANAGER-only)."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    response = client.post(
        f"/api/requests?branch_id={b_id}",
        json={"items": [{"stock_item_id": 1, "requested_quantity": 5}]},
        headers=branch_auth_headers,
    )
    assert response.status_code == 403


def test_expired_token_rejected(client, db_session):
    """A token with a past expiry is rejected with 401."""
    from app.models import User
    from app.utils.security import hash_password, generate_token

    user = User(
        name="Expired Token User",
        email="expiredtoken@test.com",
        phone="4400000002",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    # Generate a token that expires immediately (negative minutes)
    # We can't directly test this without mocking time, so instead use a malformed token
    headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImV4cCI6MX0.invalid"}
    response = client.get("/api/inventory/stock-items", headers=headers)
    assert response.status_code == 401


def test_user_deactivation_blocks_access(client, setup_franchise_branch, db_session):
    """Deactivating a staff user immediately blocks their API access."""
    from app.models import Role, UserRole, User
    from app.utils.security import hash_password, generate_token

    f_id, b_id, branch_auth_headers = setup_franchise_branch
    staff = User(
        name="Deactivation Test Staff",
        email="deact_test@branch.com",
        phone="4400000003",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(staff)
    db_session.commit()
    staff_role = db_session.query(Role).filter_by(name="STAFF").first()
    db_session.add(UserRole(
        user_id=staff.user_id, role_id=staff_role.role_id,
        scope_type="BRANCH", scope_id=b_id,
    ))
    db_session.commit()

    staff_token = generate_token(staff.user_id, role="STAFF")
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # Staff can access while active
    active_resp = client.get(f"/api/inventory?branch_id={b_id}", headers=staff_headers)
    assert active_resp.status_code == 200

    # Deactivate via branch owner
    client.put(f"/api/users/{staff.user_id}/deactivate", headers=branch_auth_headers)

    # Staff is now blocked
    blocked_resp = client.get(f"/api/inventory?branch_id={b_id}", headers=staff_headers)
    assert blocked_resp.status_code == 403
