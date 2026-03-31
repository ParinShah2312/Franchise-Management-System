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

    token = generate_token(user.user_id, user_type="user")
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
