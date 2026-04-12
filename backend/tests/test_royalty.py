"""Tests for royalty configuration, split calculation, and summaries."""

from decimal import Decimal
from datetime import date, datetime, timezone
from app.models import RoyaltyConfig, SaleRoyalty, Branch, Franchise
from app.services.royalty_service import (
    get_active_royalty_config,
    calculate_royalty_split,
    record_sale_royalty,
    get_royalty_summary,
)


def test_get_active_royalty_config_none(app, db_session, setup_franchise_branch):
    """Returns None when no royalty config exists."""
    f_id, b_id, _ = setup_franchise_branch
    with app.app_context():
        config = get_active_royalty_config(f_id)
    assert config is None


def test_create_royalty_config(client, setup_franchise_branch, db_session):
    """Franchisor can create a royalty configuration via the API."""
    from app.models import Franchisor, Franchise
    from app.utils.security import generate_token, hash_password

    franchisor = Franchisor(
        organization_name="Royalty Org",
        contact_person="Royalty Person",
        email="royaltyfranchisor@org.com",
        phone="7700000001",
        password_hash=hash_password("Password123!"),
    )
    db_session.add(franchisor)
    db_session.flush()
    franchise = Franchise(franchisor_id=franchisor.franchisor_id, name="Royalty Franchise")
    db_session.add(franchise)
    db_session.commit()

    token = generate_token(franchisor.franchisor_id, role="FRANCHISOR")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {"franchisor_cut_pct": 10.0, "effective_from": "2025-01-01"}
    response = client.post("/api/royalty/config", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.get_json()
    assert float(data["franchisor_cut_pct"]) == 10.0
    assert float(data["branch_owner_cut_pct"]) == 90.0


def test_royalty_config_invalid_pct(client, setup_franchise_branch, db_session):
    """Royalty config endpoint rejects percentages outside 0-100."""
    from app.models import Franchisor, Franchise
    from app.utils.security import generate_token, hash_password

    franchisor = Franchisor(
        organization_name="Bad Pct Org",
        contact_person="Bad Pct",
        email="badpct@org.com",
        phone="7700000002",
        password_hash=hash_password("Password123!"),
    )
    db_session.add(franchisor)
    db_session.flush()
    franchise = Franchise(franchisor_id=franchisor.franchisor_id, name="Bad Pct Franchise")
    db_session.add(franchise)
    db_session.commit()

    token = generate_token(franchisor.franchisor_id, role="FRANCHISOR")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/royalty/config", json={"franchisor_cut_pct": 150}, headers=headers)
    assert response.status_code == 400


def test_calculate_royalty_split_correctness(app, db_session):
    """Calculate royalty split produces correct franchisor and branch owner amounts."""
    config = RoyaltyConfig(
        franchise_id=1,
        franchisor_cut_pct=Decimal("8.00"),
        branch_owner_cut_pct=Decimal("92.00"),
        effective_from=date(2025, 1, 1),
    )
    total = Decimal("1000.00")
    franchisor_amt, branch_owner_amt = calculate_royalty_split(total, config)
    assert franchisor_amt == Decimal("80.00")
    assert branch_owner_amt == Decimal("920.00")
    assert franchisor_amt + branch_owner_amt == total


def test_calculate_royalty_split_rounding(app, db_session):
    """Royalty split amounts always sum to exactly the total amount."""
    config = RoyaltyConfig(
        franchise_id=1,
        franchisor_cut_pct=Decimal("7.50"),
        branch_owner_cut_pct=Decimal("92.50"),
        effective_from=date(2025, 1, 1),
    )
    total = Decimal("333.33")
    franchisor_amt, branch_owner_amt = calculate_royalty_split(total, config)
    assert franchisor_amt + branch_owner_amt == total


def test_royalty_summary_endpoint_requires_franchisor(client, setup_franchise_branch):
    """Royalty summary endpoint is forbidden to branch-scoped roles."""
    f_id, b_id, branch_auth_headers = setup_franchise_branch
    response = client.get("/api/royalty/summary?month=1&year=2026", headers=branch_auth_headers)
    assert response.status_code == 403


def test_royalty_branch_summary_requires_branch_owner(client, franchisor_auth_headers):
    """Branch royalty summary endpoint is forbidden to franchisors."""
    headers, franchisor, franchise = franchisor_auth_headers
    response = client.get(
        f"/api/royalty/branch-summary?branch_id=1&month=1&year=2026",
        headers=headers,
    )
    assert response.status_code == 403
