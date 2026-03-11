import json
from app.models import Franchisor


def test_register_franchisor(client, db_session):
    """Test successful registration of a new franchisor."""
    payload = {
        "organization_name": "Test Org",
        "contact_person": "Test User",
        "email": "test@org.com",
        "phone": "9988776655",
        "password": "Password123!",
    }

    response = client.post(
        "/api/auth/register-franchisor",
        data=json.dumps(payload),
        content_type="application/json",
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "Franchisor registered successfully."
    assert "franchisor_id" in data

    # Verify in DB
    franchisor = db_session.query(Franchisor).filter_by(email="test@org.com").first()
    assert franchisor is not None
    assert franchisor.organization_name == "Test Org"


def test_register_franchisor_duplicate(client, db_session):
    """Test that duplicate emails error out cleanly."""
    payload = {
        "organization_name": "Test Org",
        "contact_person": "Test User",
        "email": "test@org.com",
        "phone": "9988776655",
        "password": "Password123!",
    }

    client.post("/api/auth/register-franchisor", json=payload)

    # Try again
    response = client.post("/api/auth/register-franchisor", json=payload)
    assert response.status_code == 409
    assert (
        "already registered" in response.get_json()["error"].lower()
        or "duplicate" in response.get_json()["error"].lower()
    )


def test_login_franchisor(client, db_session):
    """Test login returns a valid JWT."""
    payload = {
        "organization_name": "Test Org",
        "contact_person": "Test User",
        "email": "test@org.com",
        "phone": "9988776655",
        "password": "Password123!",
    }
    client.post("/api/auth/register-franchisor", json=payload)

    login_payload = {"email": "test@org.com", "password": "Password123!"}

    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == "test@org.com"
