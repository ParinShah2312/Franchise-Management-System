import pytest
import os

from app import create_app
from app.extensions import db
from app.models import (
    User,
    Role,
    UserRole,
    Franchisor,
    Franchise,
    Branch,
    BranchStatus,
    ApplicationStatus,
    RequestStatus,
    TransactionType,
    SaleStatus,
    Unit,
)
from app.utils.security import hash_password


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "test_secret_key"
    JWT_SECRET = "test_jwt_secret"
    WTF_CSRF_ENABLED = False


@pytest.fixture(scope="session")
def app():
    # Set necessary environment variables for testing just in case
    os.environ["SECRET_KEY"] = "test_secret_key"
    os.environ["JWT_SECRET"] = "test_jwt_secret"

    app = create_app(TestConfig)

    with app.app_context():
        yield app


@pytest.fixture(scope="function")
def db_session(app):
    """Fixture to provide a clean database for each test."""
    db.create_all()

    # Insert required reference data
    _seed_reference_data()
    db.session.commit()

    yield db.session

    db.session.remove()
    db.drop_all()


@pytest.fixture(scope="function")
def client(app, db_session):
    return app.test_client()


@pytest.fixture(scope="function")
def auth_headers(client, db_session):
    """Fixture that creates a franchisor, logs in, and returns auth headers."""
    payload = {
        "organization_name": "Fixture Org",
        "contact_person": "Fixture User",
        "email": "fixture@org.com",
        "phone": "9999999999",
        "password": "Password123!",
    }
    client.post("/api/auth/register-franchisor", json=payload)

    login_resp = client.post(
        "/api/auth/login", json={"email": "fixture@org.com", "password": "Password123!"}
    )
    token = login_resp.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def setup_franchise_branch(client, db_session):
    """Fixture to setup a franchise, branch, and branch owner auth headers."""
    from app.models import Role
    from app.utils.security import generate_token

    franchisor = db_session.query(Franchisor).first()
    if not franchisor:
        franchisor = Franchisor(
            organization_name="Setup Org",
            contact_person="Setup User",
            email="setup@org.com",
            phone="0000000000",
            password_hash=hash_password("Password123!"),
        )
        db_session.add(franchisor)
        db_session.commit()

    franchise = Franchise(franchisor_id=franchisor.franchisor_id, name="Test Franchise")
    db_session.add(franchise)
    db_session.commit()

    user = User(
        name="Branch Owner Test",
        email="owner@branch.com",
        phone="1112223333",
        password_hash=hash_password("Password123!"),
        is_active=True,
        must_reset_password=False,
    )
    db_session.add(user)
    db_session.commit()

    branch = Branch(
        franchise_id=franchise.franchise_id,
        name="Test Branch",
        code="TB01",
        status_id=1,
        branch_owner_user_id=user.user_id,
    )
    db_session.add(branch)
    db_session.commit()

    owner_role = db_session.query(Role).filter_by(name="BRANCH_OWNER").first()
    user_role = UserRole(
        user_id=user.user_id,
        role_id=owner_role.role_id,
        scope_type="BRANCH",
        scope_id=branch.branch_id,
    )
    db_session.add(user_role)
    db_session.commit()

    token = generate_token(user.user_id, user_type="user")
    branch_auth_headers = {"Authorization": f"Bearer {token}"}

    return franchise.franchise_id, branch.branch_id, branch_auth_headers


def _seed_reference_data():
    """Seed bare-minimum reference data needed for tests."""
    roles = [
        Role(role_id=1, name="BRANCH_OWNER", description="Owns the branch"),
        Role(role_id=2, name="MANAGER", description="Manages branch daily ops"),
        Role(role_id=3, name="STAFF", description="Frontline staff"),
    ]
    db.session.add_all(roles)

    statuses = [
        ApplicationStatus(status_id=1, status_name="PENDING"),
        ApplicationStatus(status_id=2, status_name="APPROVED"),
        ApplicationStatus(status_id=3, status_name="REJECTED"),
        BranchStatus(status_id=1, status_name="ACTIVE"),
        BranchStatus(status_id=2, status_name="INACTIVE"),
        RequestStatus(request_status_id=1, status_name="PENDING"),
        RequestStatus(request_status_id=2, status_name="APPROVED"),
        RequestStatus(request_status_id=3, status_name="REJECTED"),
        SaleStatus(sale_status_id=1, status_name="PAID"),
        SaleStatus(sale_status_id=2, status_name="CANCELLED"),
        TransactionType(transaction_type_id=1, type_name="IN"),
        TransactionType(transaction_type_id=2, type_name="OUT"),
        TransactionType(transaction_type_id=3, type_name="ADJUSTMENT"),
        Unit(unit_id=1, unit_name="kg"),
        Unit(unit_id=2, unit_name="liter"),
        Unit(unit_id=3, unit_name="pcs"),
    ]
    db.session.add_all(statuses)
