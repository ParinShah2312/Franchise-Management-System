"""Tests for the franchise application approve/reject workflow."""

import io
from app.models import (
    FranchiseApplication, Branch, UserRole, ApplicationStatus,
    Franchisor, Franchise, User
)
from app.utils.security import hash_password, generate_token


def _make_franchisor(db_session, suffix=""):
    franchisor = Franchisor(
        organization_name=f"App Test Org{suffix}",
        contact_person=f"App Contact{suffix}",
        email=f"apptest{suffix}@org.com",
        phone=f"770000{suffix[:4] if suffix else '0099'}",
        password_hash=hash_password("Password123!"),
    )
    db_session.add(franchisor)
    db_session.flush()
    franchise = Franchise(franchisor_id=franchisor.franchisor_id, name=f"App Franchise{suffix}")
    db_session.add(franchise)
    db_session.commit()
    return franchisor, franchise


def test_list_pending_applications_empty(client, db_session):
    """Listing applications when none are pending returns empty list."""
    franchisor, franchise = _make_franchisor(db_session, suffix="1a")
    token = generate_token(franchisor.franchisor_id, user_type="franchisor")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/franchises/applications", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)


def test_approve_application_creates_branch(client, db_session):
    """Approving an application creates a Branch and assigns BRANCH_OWNER role."""
    franchisor, franchise = _make_franchisor(db_session, suffix="2a")
    token = generate_token(franchisor.franchisor_id, user_type="franchisor")
    headers = {"Authorization": f"Bearer {token}"}

    applicant = User(
        name="App Applicant",
        email="appapplicant@test.com",
        phone="8800100001",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(applicant)
    db_session.commit()

    pending_status = db_session.query(ApplicationStatus).filter_by(status_name="PENDING").first()
    application = FranchiseApplication(
        franchise_id=franchise.franchise_id,
        branch_owner_user_id=applicant.user_id,
        proposed_location="Ahmedabad, Gujarat",
        investment_capacity=1000000,
        status_id=pending_status.status_id,
    )
    db_session.add(application)
    db_session.commit()

    response = client.put(
        f"/api/franchises/applications/{application.application_id}/approve",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.get_json()
    assert "branch_id" in data

    branch = db_session.get(Branch, data["branch_id"])
    assert branch is not None
    assert branch.franchise_id == franchise.franchise_id

    role_assignment = db_session.query(UserRole).filter_by(
        user_id=applicant.user_id,
        scope_type="BRANCH",
        scope_id=branch.branch_id,
    ).first()
    assert role_assignment is not None


def test_reject_application(client, db_session):
    """Rejecting an application updates status to REJECTED."""
    franchisor, franchise = _make_franchisor(db_session, suffix="3a")
    token = generate_token(franchisor.franchisor_id, user_type="franchisor")
    headers = {"Authorization": f"Bearer {token}"}

    applicant = User(
        name="Reject Applicant",
        email="rejectapp@test.com",
        phone="8800100002",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(applicant)
    db_session.commit()

    pending_status = db_session.query(ApplicationStatus).filter_by(status_name="PENDING").first()
    application = FranchiseApplication(
        franchise_id=franchise.franchise_id,
        branch_owner_user_id=applicant.user_id,
        proposed_location="Surat, Gujarat",
        investment_capacity=500000,
        status_id=pending_status.status_id,
    )
    db_session.add(application)
    db_session.commit()

    response = client.put(
        f"/api/franchises/applications/{application.application_id}/reject",
        json={"notes": "Investment below threshold for this location."},
        headers=headers,
    )
    assert response.status_code == 200

    refreshed = db_session.get(FranchiseApplication, application.application_id)
    assert refreshed.status.status_name == "REJECTED"


def test_approve_already_approved_application_fails(client, db_session):
    """Approving an already-approved application returns 400."""
    franchisor, franchise = _make_franchisor(db_session, suffix="4a")
    token = generate_token(franchisor.franchisor_id, user_type="franchisor")
    headers = {"Authorization": f"Bearer {token}"}

    applicant = User(
        name="Double Approve App",
        email="dbl_approve_app@test.com",
        phone="8800100003",
        password_hash=hash_password("Password123!"),
        is_active=True,
    )
    db_session.add(applicant)
    db_session.commit()

    pending_status = db_session.query(ApplicationStatus).filter_by(status_name="PENDING").first()
    application = FranchiseApplication(
        franchise_id=franchise.franchise_id,
        branch_owner_user_id=applicant.user_id,
        proposed_location="Vadodara, Gujarat",
        investment_capacity=900000,
        status_id=pending_status.status_id,
    )
    db_session.add(application)
    db_session.commit()

    client.put(
        f"/api/franchises/applications/{application.application_id}/approve",
        headers=headers,
    )
    second_approve = client.put(
        f"/api/franchises/applications/{application.application_id}/approve",
        headers=headers,
    )
    assert second_approve.status_code == 400


def test_applications_not_accessible_without_auth(client, db_session):
    """Application list endpoint requires authentication."""
    response = client.get("/api/franchises/applications")
    assert response.status_code == 401
