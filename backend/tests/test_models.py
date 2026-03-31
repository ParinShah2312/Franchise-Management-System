from app.extensions import db
from app.models import Franchisor, Franchise, Role, User, Branch


def test_franchisor_creation(db_session):
    """Test creating a franchisor."""
    franchisor = Franchisor(
        organization_name="Model Test Org",
        contact_person="Model Test Person",
        email="modeltest@org.com",
        phone="5551234567",
        password_hash="testhash",
    )
    db_session.add(franchisor)
    db_session.commit()

    assert franchisor.franchisor_id is not None
    assert franchisor.organization_name == "Model Test Org"


def test_franchise_branch_hierarchy(db_session):
    """Test creating a franchise and a branch underneath it."""
    franchisor = Franchisor(
        organization_name="Hierarchy Org",
        contact_person="Hierarchy Person",
        email="hierarchy@org.com",
        phone="5559876543",
        password_hash="testhash",
    )
    db_session.add(franchisor)
    db_session.commit()

    franchise = Franchise(
        franchisor_id=franchisor.franchisor_id, name="Hierarchy Franchise"
    )
    db_session.add(franchise)
    db_session.commit()

    assert franchise.franchise_id is not None

    # Needs a User to be owner
    owner = User(
        name="Branch Owner User",
        email="owner@hierarchy.com",
        phone="5550001111",
        password_hash="testhash",
    )
    db_session.add(owner)
    db_session.commit()

    branch = Branch(
        franchise_id=franchise.franchise_id,
        name="Main Branch",
        code="MB001",
        status_id=1,
        branch_owner_user_id=owner.user_id,
    )
    db_session.add(branch)
    db_session.commit()

    assert branch.branch_id is not None

    # Test relationships — use db.session.get instead of Query.get
    fetched_franchise = db.session.get(Franchise, franchise.franchise_id)
    assert len(fetched_franchise.branches) == 1
    assert fetched_franchise.branches[0].name == "Main Branch"


def test_reference_data_seeded(db_session):
    """Test that reference data was correctly seeded by conftest.py."""
    roles = db_session.query(Role).all()
    assert len(roles) >= 3
    role_names = [r.name for r in roles]
    assert "BRANCH_OWNER" in role_names
    assert "MANAGER" in role_names
    assert "STAFF" in role_names
