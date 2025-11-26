"""Seed the database with the Relay franchise demo data set."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from app import create_app
from app.extensions import db
from app.models import (
    Address,
    ApplicationStatus,
    Branch,
    BranchInventory,
    BranchStaff,
    BranchStatus,
    Franchise,
    Franchisor,
    Product,
    ProductCategory,
    RequestStatus,
    Role,
    Sale,
    SaleItem,
    SaleStatus,
    StockItem,
    TransactionType,
    Unit,
    User,
    UserRole,
)
from app.utils.security import hash_password


def seed_database() -> None:
    """Reset and populate the database with the Relay franchise hierarchy."""

    app = create_app(register_blueprints_flag=False)

    with app.app_context():
        print("[reset] Resetting database (drop & create)...")
        db.drop_all()
        db.create_all()
        print("[reset] Database reset complete.\n")

        # ------------------------------------------------------------------
        # Step 1: Reference data (roles, enums, reference tables)
        # ------------------------------------------------------------------
        print("[step1] Seeding reference data...")

        roles = [
            Role(role_id=1, name="BRANCH_OWNER", description="Owns and funds the branch"),
            Role(role_id=2, name="MANAGER", description="Runs daily branch operations"),
            Role(role_id=3, name="STAFF", description="Frontline branch staff"),
        ]
        application_statuses = [
            ApplicationStatus(status_id=1, status_name="PENDING"),
            ApplicationStatus(status_id=2, status_name="APPROVED"),
            ApplicationStatus(status_id=3, status_name="REJECTED"),
        ]
        branch_statuses = [
            BranchStatus(status_id=1, status_name="ACTIVE"),
            BranchStatus(status_id=2, status_name="INACTIVE"),
        ]
        request_statuses = [
            RequestStatus(request_status_id=1, status_name="PENDING"),
            RequestStatus(request_status_id=2, status_name="APPROVED"),
            RequestStatus(request_status_id=3, status_name="REJECTED"),
        ]
        sale_statuses = [
            SaleStatus(sale_status_id=1, status_name="PAID"),
            SaleStatus(sale_status_id=2, status_name="CANCELLED"),
        ]
        transaction_types = [
            TransactionType(transaction_type_id=1, type_name="IN"),
            TransactionType(transaction_type_id=2, type_name="OUT"),
            TransactionType(transaction_type_id=3, type_name="ADJUSTMENT"),
        ]
        units = [
            Unit(unit_id=1, unit_name="kg"),
            Unit(unit_id=2, unit_name="liter"),
            Unit(unit_id=3, unit_name="pcs"),
            Unit(unit_id=4, unit_name="box"),
        ]

        db.session.add_all(
            roles
            + application_statuses
            + branch_statuses
            + request_statuses
            + sale_statuses
            + transaction_types
            + units
        )
        db.session.commit()
        print("[step1] Reference tables ready.\n")

        role_lookup = {role.name: role for role in Role.query.all()}
        branch_status_lookup = {status.status_name: status for status in BranchStatus.query.all()}
        sale_status_lookup = {status.status_name: status for status in SaleStatus.query.all()}
        unit_lookup = {unit.unit_name: unit for unit in Unit.query.all()}

        # ------------------------------------------------------------------
        # Step 2: Franchisor, franchise, catalog & stock items
        # ------------------------------------------------------------------
        print("[step2] Creating franchisor, franchise, and global catalog...")

        franchisor = Franchisor(
            franchisor_id=1,
            organization_name="Relay Corp",
            contact_person="Relay Administrator",
            email="admin@system.com",
            phone="9100000000",
            password_hash=hash_password("admin123"),
        )
        db.session.add(franchisor)
        db.session.flush()

        franchise = Franchise(
            franchise_id=1,
            franchisor_id=franchisor.franchisor_id,
            name="Relay",
            description="Flagship Relay fast-casual brand.",
        )
        db.session.add(franchise)
        db.session.flush()

        burgers = ProductCategory(
            category_id=1,
            franchise_id=franchise.franchise_id,
            name="Burgers",
            description="Signature burgers served across Relay branches.",
        )
        beverages = ProductCategory(
            category_id=2,
            franchise_id=franchise.franchise_id,
            name="Beverages",
            description="Shakes and chilled beverages.",
        )
        db.session.add_all([burgers, beverages])
        db.session.flush()

        relay_burger = Product(
            product_id=1,
            franchise_id=franchise.franchise_id,
            category_id=burgers.category_id,
            name="Relay Burger",
            description="Classic burger with Relay secret sauce.",
            base_price=Decimal("10.00"),
        )
        relay_shake = Product(
            product_id=2,
            franchise_id=franchise.franchise_id,
            category_id=beverages.category_id,
            name="Relay Shake",
            description="Creamy vanilla shake.",
            base_price=Decimal("5.00"),
        )
        db.session.add_all([relay_burger, relay_shake])

        bun_item = StockItem(
            stock_item_id=1,
            franchise_id=franchise.franchise_id,
            name="Burger Bun",
            description="Soft bun used in Relay burgers.",
            unit_id=unit_lookup["pcs"].unit_id,
        )
        patty_item = StockItem(
            stock_item_id=2,
            franchise_id=franchise.franchise_id,
            name="Patty",
            description="Signature Relay burger patty.",
            unit_id=unit_lookup["pcs"].unit_id,
        )
        milk_item = StockItem(
            stock_item_id=3,
            franchise_id=franchise.franchise_id,
            name="Milk",
            description="Full-fat milk for beverages.",
            unit_id=unit_lookup["liter"].unit_id,
        )
        db.session.add_all([bun_item, patty_item, milk_item])
        db.session.commit()
        print("[step2] Franchisor, franchise, menu, and stock items prepared.\n")

        # ------------------------------------------------------------------
        # Step 3: Branch owner (investor) + branch creation
        # ------------------------------------------------------------------
        print("[step3] Creating branch owner and primary branch...")

        owner_user = User(
            user_id=1,
            name="Rahul Patel",
            email="rahul@gmail.com",
            phone="9999999999",
            password_hash=hash_password("rahul123"),
        )
        branch_address = Address(
            address_id=1,
            address_line="101 Akota Road",
            city="Vadodara",
            state="Gujarat",
            country="India",
            pincode="390020",
        )
        db.session.add_all([owner_user, branch_address])
        db.session.flush()

        relay_branch = Branch(
            branch_id=1,
            franchise_id=franchise.franchise_id,
            name="Relay Vadodara",
            code="RELAY-VD",
            address_id=branch_address.address_id,
            branch_owner_user_id=owner_user.user_id,
            status_id=branch_status_lookup["ACTIVE"].status_id,
        )
        db.session.add(relay_branch)
        db.session.flush()

        owner_assignment = UserRole(
            user_id=owner_user.user_id,
            role_id=role_lookup["BRANCH_OWNER"].role_id,
            scope_type="BRANCH",
            scope_id=relay_branch.branch_id,
        )
        db.session.add(owner_assignment)
        db.session.commit()
        print("[step3] Branch owner onboarded and branch created.\n")

        # ------------------------------------------------------------------
        # Step 4: Manager setup
        # ------------------------------------------------------------------
        print("[step4] Adding branch manager...")

        manager_user = User(
            user_id=2,
            name="MCD Manager",
            email="mcd.manager@mcd.com",
            phone="9888888888",
            password_hash=hash_password("manager123"),
        )
        db.session.add(manager_user)
        db.session.flush()

        relay_branch.manager_user_id = manager_user.user_id

        manager_assignment = UserRole(
            user_id=manager_user.user_id,
            role_id=role_lookup["MANAGER"].role_id,
            scope_type="BRANCH",
            scope_id=relay_branch.branch_id,
        )
        db.session.add(manager_assignment)
        db.session.commit()
        print("[step4] Branch manager assigned.\n")

        # ------------------------------------------------------------------
        # Step 5: Staff setup
        # ------------------------------------------------------------------
        print("[step5] Adding frontline staff...")

        staff_user = User(
            user_id=3,
            name="Relay Staff",
            email="relay.staff@relay.com",
            phone="9777777777",
            password_hash=hash_password("staff123"),
        )
        db.session.add(staff_user)
        db.session.flush()

        staff_assignment = UserRole(
            user_id=staff_user.user_id,
            role_id=role_lookup["STAFF"].role_id,
            scope_type="BRANCH",
            scope_id=relay_branch.branch_id,
        )
        branch_staff_link = BranchStaff(
            branch_id=relay_branch.branch_id,
            user_id=staff_user.user_id,
        )
        db.session.add_all([staff_assignment, branch_staff_link])
        db.session.commit()
        print("[step5] Staff member linked to branch.\n")

        # ------------------------------------------------------------------
        # Step 6: Initial operational data (inventory + sample sale)
        # ------------------------------------------------------------------
        print("[step6] Priming inventory and recording a sample sale...")

        initial_inventory = [
            BranchInventory(
                branch_inventory_id=1,
                branch_id=relay_branch.branch_id,
                stock_item_id=bun_item.stock_item_id,
                quantity=Decimal("100"),
                reorder_level=Decimal("25"),
            ),
            BranchInventory(
                branch_inventory_id=2,
                branch_id=relay_branch.branch_id,
                stock_item_id=milk_item.stock_item_id,
                quantity=Decimal("50"),
                reorder_level=Decimal("10"),
            ),
        ]
        db.session.add_all(initial_inventory)
        db.session.flush()

        sale = Sale(
            sale_id=1,
            branch_id=relay_branch.branch_id,
            sold_by_user_id=staff_user.user_id,
            sale_datetime=datetime.utcnow(),
            total_amount=Decimal("0"),
            status_id=sale_status_lookup["PAID"].sale_status_id,
        )
        db.session.add(sale)
        db.session.flush()

        burger_line_total = Decimal("10.00") * Decimal("2")
        shake_line_total = Decimal("5.00") * Decimal("1")

        sale_items = [
            SaleItem(
                sale_item_id=1,
                sale_id=sale.sale_id,
                product_id=relay_burger.product_id,
                quantity=2,
                unit_price=Decimal("10.00"),
                line_total=burger_line_total,
            ),
            SaleItem(
                sale_item_id=2,
                sale_id=sale.sale_id,
                product_id=relay_shake.product_id,
                quantity=1,
                unit_price=Decimal("5.00"),
                line_total=shake_line_total,
            ),
        ]
        db.session.add_all(sale_items)

        sale.total_amount = burger_line_total + shake_line_total
        db.session.commit()
        print("[step6] Inventory stocked and sample sale captured.\n")

        print("[done] Relay franchise seed data ready!")


if __name__ == "__main__":
    seed_database()