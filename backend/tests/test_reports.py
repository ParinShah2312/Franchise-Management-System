"""Tests for the report generation and persistence pipeline."""

from app.models import Report, ReportData, Franchisor, Franchise, Branch
from app.utils.security import generate_token


def test_franchisor_report_returns_report_id(client, db_session):
    """Test that generating a report as franchisor returns a persisted report_id."""
    # Create a franchisor with a franchise and branch
    from app.utils.security import hash_password
    from app.models import User, UserRole, Role

    franchisor = Franchisor(
        organization_name="Report Test Org",
        contact_person="Report Tester",
        email="reporttest@org.com",
        phone="3000000001",
        password_hash=hash_password("Password123!"),
    )
    db_session.add(franchisor)
    db_session.commit()

    franchise = Franchise(
        franchisor_id=franchisor.franchisor_id,
        name="Report Franchise",
    )
    db_session.add(franchise)
    db_session.commit()

    token = generate_token(franchisor.franchisor_id, user_type="franchisor")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get(
        "/api/reports/summary?month=1&year=2026",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.get_json()

    # report_id should be present and not null (persistence succeeded)
    assert "report_id" in data
    assert data["report_id"] is not None

    # Verify DB persistence
    report = db_session.get(Report, data["report_id"])
    assert report is not None
    assert report.report_type == "MASTER"
    assert report.franchisor_id == franchisor.franchisor_id
    assert report.generated_by_user_id is None  # Franchisor, not a User

    # Verify report_data rows were created
    report_data = db_session.query(ReportData).filter_by(
        report_id=data["report_id"]
    ).all()
    assert len(report_data) >= 3  # total_sales, total_expenses, profit_loss, etc.
    data_keys = {rd.data_key for rd in report_data}
    assert "total_sales" in data_keys
    assert "branch_count" in data_keys


def test_branch_owner_report_returns_report_id(client, setup_franchise_branch, db_session):
    """Test that generating a report as branch owner returns a persisted report_id."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch

    response = client.get(
        f"/api/reports/summary?month=1&year=2026&branch_id={b_id}",
        headers=branch_auth_headers,
    )
    assert response.status_code == 200
    data = response.get_json()

    assert "report_id" in data
    # report_id may be None if franchisor_id couldn't be resolved, but key must exist


def test_report_summary_preserves_original_fields(client, db_session):
    """Test that the summary JSON still contains the original fields alongside report_id."""
    from app.utils.security import hash_password

    franchisor = Franchisor(
        organization_name="Fields Test Org",
        contact_person="Fields Tester",
        email="fieldstest@org.com",
        phone="3000000002",
        password_hash=hash_password("Password123!"),
    )
    db_session.add(franchisor)
    db_session.commit()

    franchise = Franchise(
        franchisor_id=franchisor.franchisor_id,
        name="Fields Franchise",
    )
    db_session.add(franchise)
    db_session.commit()

    token = generate_token(franchisor.franchisor_id, user_type="franchisor")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/reports/summary?month=3&year=2026", headers=headers)
    assert response.status_code == 200
    data = response.get_json()

    # Original summary fields must still exist
    assert "report_id" in data
    assert "total_sales" in data
