"""Seed the database with a rich, realistic multi-franchisor demo dataset."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
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
    Expense,
    Franchise,
    FranchiseApplication,
    Franchisor,
    InventoryTransaction,
    Product,
    ProductCategory,
    ProductIngredient,
    RequestStatus,
    Role,
    RoyaltyConfig,
    Sale,
    SaleItem,
    SaleRoyalty,
    SaleStatus,
    StockItem,
    StockPurchaseRequest,
    StockPurchaseRequestItem,
    TransactionType,
    Unit,
    User,
    UserRole,
)
from app.utils.security import hash_password

# ---------------------------------------------------------------------------
# Payment mode rotation (weighted toward Cash)
# ---------------------------------------------------------------------------
PAYMENT_MODES = ["Cash", "Card", "UPI", "Cash", "Card"]


def _calc_royalty(total: Decimal, config: RoyaltyConfig) -> tuple[Decimal, Decimal]:
    """Compute franchisor / branch-owner split inline (avoids circular imports)."""
    franchisor_amt = (total * config.franchisor_cut_pct / Decimal("100")).quantize(
        Decimal("0.01")
    )
    branch_owner_amt = total - franchisor_amt
    return franchisor_amt, branch_owner_amt


# ===================================================================== #
#  MAIN SEED FUNCTION                                                    #
# ===================================================================== #
def seed_database() -> None:
    """Reset and populate the database with a multi-franchisor demo dataset."""

    app = create_app(register_blueprints_flag=False)

    with app.app_context():
        print("[reset] Resetting database (drop & create)...")
        db.drop_all()
        db.create_all()
        print("[reset] Database reset complete.\n")

        # ==============================================================
        # 1. Reference data
        # ==============================================================
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

        role_lookup = {r.name: r for r in Role.query.all()}
        unit_lookup = {u.unit_name: u for u in Unit.query.all()}

        # ==============================================================
        # 2. Franchisors
        # ==============================================================
        print("[step2] Creating franchisors...")

        franchisor1 = Franchisor(
            franchisor_id=1,
            organization_name="McDonald's India Pvt Ltd",
            contact_person="Vikram Bakshi",
            email="admin@mcd.com",
            phone="9100000001",
            password_hash=hash_password("admin123"),
        )
        franchisor2 = Franchisor(
            franchisor_id=2,
            organization_name="Ajay's Food Ventures",
            contact_person="Ajay Sharma",
            email="admin@ajays.com",
            phone="9100000002",
            password_hash=hash_password("admin123"),
        )
        db.session.add_all([franchisor1, franchisor2])
        db.session.flush()

        franchise1 = Franchise(
            franchise_id=1,
            franchisor_id=franchisor1.franchisor_id,
            name="McDonald's",
            description="Global fast-food brand — burgers, fries, and shakes.",
        )
        franchise2 = Franchise(
            franchise_id=2,
            franchisor_id=franchisor2.franchisor_id,
            name="Ajay's Café",
            description="Popular Indian café chain — chai, coffee, and snacks.",
        )
        db.session.add_all([franchise1, franchise2])
        db.session.flush()
        db.session.commit()
        print("[step2] Franchisors and franchises created.\n")

        # ==============================================================
        # 3. Addresses & Branches
        # ==============================================================
        print("[step3] Creating branches with Indian city locations...")

        addresses = [
            Address(address_id=1, address_line="12 Alkapuri Main Rd", city="Vadodara", state="Gujarat", country="India", pincode="390007"),
            Address(address_id=2, address_line="45 Vesu Canal Rd", city="Surat", state="Gujarat", country="India", pincode="395007"),
            Address(address_id=3, address_line="Linking Road, Bandra West", city="Mumbai", state="Maharashtra", country="India", pincode="400050"),
            Address(address_id=4, address_line="CG Road, Navrangpura", city="Ahmedabad", state="Gujarat", country="India", pincode="380009"),
            Address(address_id=5, address_line="80 Feet Road, Koramangala", city="Bengaluru", state="Karnataka", country="India", pincode="560034"),
        ]
        db.session.add_all(addresses)
        db.session.flush()

        # --- Users: Branch Owners ---
        owners = [
            User(user_id=1, name="Rahul Patel", email="rahul@mcd-alkapuri.com", phone="9200000001", password_hash=hash_password("owner123")),
            User(user_id=2, name="Priya Mehta", email="priya@mcd-vesu.com", phone="9200000002", password_hash=hash_password("owner123")),
            User(user_id=3, name="Arjun Reddy", email="arjun@mcd-bandra.com", phone="9200000003", password_hash=hash_password("owner123")),
            User(user_id=4, name="Sneha Desai", email="sneha@ajays-navrangpura.com", phone="9200000004", password_hash=hash_password("owner123")),
            User(user_id=5, name="Vikram Singh", email="vikram@ajays-koramangala.com", phone="9200000005", password_hash=hash_password("owner123")),
        ]
        db.session.add_all(owners)
        db.session.flush()

        branch_defs = [
            dict(branch_id=1, franchise_id=1, name="McDonald's Alkapuri", code="MCD-ALP", address_id=1, owner_idx=0),
            dict(branch_id=2, franchise_id=1, name="McDonald's Vesu", code="MCD-VSU", address_id=2, owner_idx=1),
            dict(branch_id=3, franchise_id=1, name="McDonald's Bandra", code="MCD-BND", address_id=3, owner_idx=2),
            dict(branch_id=4, franchise_id=2, name="Ajay's Café Navrangpura", code="AJY-NVR", address_id=4, owner_idx=3),
            dict(branch_id=5, franchise_id=2, name="Ajay's Café Koramangala", code="AJY-KRM", address_id=5, owner_idx=4),
        ]
        branches: list[Branch] = []
        for bd in branch_defs:
            b = Branch(
                branch_id=bd["branch_id"],
                franchise_id=bd["franchise_id"],
                name=bd["name"],
                code=bd["code"],
                address_id=bd["address_id"],
                branch_owner_user_id=owners[bd["owner_idx"]].user_id,
                status_id=1,  # ACTIVE
            )
            branches.append(b)
        db.session.add_all(branches)
        db.session.flush()

        # Assign BRANCH_OWNER role to each owner
        for i, owner in enumerate(owners):
            db.session.add(
                UserRole(
                    user_id=owner.user_id,
                    role_id=role_lookup["BRANCH_OWNER"].role_id,
                    scope_type="BRANCH",
                    scope_id=branches[i].branch_id,
                )
            )
        db.session.commit()
        print("[step3] 5 branches created with owners.\n")

        # ==============================================================
        # 4. Managers
        # ==============================================================
        print("[step4] Adding branch managers...")

        manager_defs = [
            dict(name="Ankit Sharma", email="mgr.alkapuri@mcd.com", phone="9300000001", branch_idx=0),
            dict(name="Neha Gupta", email="mgr.vesu@mcd.com", phone="9300000002", branch_idx=1),
            dict(name="Ravi Kumar", email="mgr.bandra@mcd.com", phone="9300000003", branch_idx=2),
            dict(name="Pooja Iyer", email="mgr.navrangpura@ajays.com", phone="9300000004", branch_idx=3),
            dict(name="Karan Joshi", email="mgr.koramangala@ajays.com", phone="9300000005", branch_idx=4),
        ]
        uid = 6  # continue user_id sequence
        managers: list[User] = []
        for md in manager_defs:
            u = User(
                user_id=uid, name=md["name"], email=md["email"], phone=md["phone"],
                password_hash=hash_password("manager123"), must_reset_password=True,
            )
            managers.append(u)
            uid += 1
        db.session.add_all(managers)
        db.session.flush()

        for i, mgr in enumerate(managers):
            branch = branches[manager_defs[i]["branch_idx"]]
            branch.manager_user_id = mgr.user_id
            db.session.add(
                UserRole(
                    user_id=mgr.user_id,
                    role_id=role_lookup["MANAGER"].role_id,
                    scope_type="BRANCH",
                    scope_id=branch.branch_id,
                )
            )
        db.session.commit()
        print("[step4] 5 managers assigned.\n")

        # ==============================================================
        # 5. Staff (2 per branch = 10 total)
        # ==============================================================
        print("[step5] Adding frontline staff...")

        staff_info = [
            # MCD Alkapuri
            dict(name="Amit Prajapati", email="staff1.alkapuri@mcd.com", phone="9400000001", branch_idx=0, position="Cashier", salary=Decimal("18000")),
            dict(name="Deepa Nair", email="staff2.alkapuri@mcd.com", phone="9400000002", branch_idx=0, position="Kitchen Staff", salary=Decimal("16000")),
            # MCD Vesu
            dict(name="Sanjay Verma", email="staff1.vesu@mcd.com", phone="9400000003", branch_idx=1, position="Cashier", salary=Decimal("18000")),
            dict(name="Meena Rao", email="staff2.vesu@mcd.com", phone="9400000004", branch_idx=1, position="Kitchen Staff", salary=Decimal("16000")),
            # MCD Bandra
            dict(name="Rohit Kulkarni", email="staff1.bandra@mcd.com", phone="9400000005", branch_idx=2, position="Cashier", salary=Decimal("20000")),
            dict(name="Kavita Mishra", email="staff2.bandra@mcd.com", phone="9400000006", branch_idx=2, position="Kitchen Staff", salary=Decimal("17000")),
            # Ajay's Navrangpura
            dict(name="Manoj Tiwari", email="staff1.navrangpura@ajays.com", phone="9400000007", branch_idx=3, position="Barista", salary=Decimal("15000")),
            dict(name="Sunita Shah", email="staff2.navrangpura@ajays.com", phone="9400000008", branch_idx=3, position="Counter Staff", salary=Decimal("14000")),
            # Ajay's Koramangala
            dict(name="Praveen Hegde", email="staff1.koramangala@ajays.com", phone="9400000009", branch_idx=4, position="Barista", salary=Decimal("16000")),
            dict(name="Lakshmi Bhat", email="staff2.koramangala@ajays.com", phone="9400000010", branch_idx=4, position="Counter Staff", salary=Decimal("14500")),
        ]

        staff_users: list[User] = []
        for si in staff_info:
            u = User(
                user_id=uid, name=si["name"], email=si["email"], phone=si["phone"],
                password_hash=hash_password("staff123"), must_reset_password=True,
            )
            staff_users.append(u)
            uid += 1
        db.session.add_all(staff_users)
        db.session.flush()

        for i, su in enumerate(staff_users):
            branch = branches[staff_info[i]["branch_idx"]]
            db.session.add(
                UserRole(
                    user_id=su.user_id,
                    role_id=role_lookup["STAFF"].role_id,
                    scope_type="BRANCH",
                    scope_id=branch.branch_id,
                )
            )
            db.session.add(
                BranchStaff(
                    branch_id=branch.branch_id,
                    user_id=su.user_id,
                    position=staff_info[i]["position"],
                    salary=staff_info[i]["salary"],
                )
            )
        db.session.commit()
        print("[step5] 10 staff members linked to branches.\n")

        # ==============================================================
        # 6. Product Catalogs
        # ==============================================================
        print("[step6] Building product catalogs and stock items...")

        # --- McDonald's categories ---
        mcd_cats = {
            "Burgers": ProductCategory(category_id=1, franchise_id=1, name="Burgers", description="Signature burgers"),
            "Beverages": ProductCategory(category_id=2, franchise_id=1, name="Beverages", description="Shakes and chilled beverages"),
            "Sides": ProductCategory(category_id=3, franchise_id=1, name="Sides", description="Fries and sides"),
            "Desserts": ProductCategory(category_id=4, franchise_id=1, name="Desserts", description="Ice cream and desserts"),
        }
        # --- Ajay's categories ---
        ajy_cats = {
            "Hot Drinks": ProductCategory(category_id=5, franchise_id=2, name="Hot Drinks", description="Tea and coffee"),
            "Cold Drinks": ProductCategory(category_id=6, franchise_id=2, name="Cold Drinks", description="Cold beverages"),
            "Snacks": ProductCategory(category_id=7, franchise_id=2, name="Snacks", description="Quick bites"),
            "Combos": ProductCategory(category_id=8, franchise_id=2, name="Combos", description="Value combos"),
        }
        db.session.add_all(list(mcd_cats.values()) + list(ajy_cats.values()))
        db.session.flush()

        # --- McDonald's Products ---
        pid = 1
        mcd_products: dict[str, Product] = {}
        mcd_product_defs = [
            ("McAloo Tikki", "Burgers", Decimal("59")),
            ("McSpicy Paneer", "Burgers", Decimal("189")),
            ("Big Mac", "Burgers", Decimal("249")),
            ("Maharaja Mac", "Burgers", Decimal("279")),
            ("McDouble", "Burgers", Decimal("159")),
            ("Coke", "Beverages", Decimal("69")),
            ("McFlurry Shake", "Beverages", Decimal("129")),
            ("Orange Juice", "Beverages", Decimal("89")),
            ("Medium Fries", "Sides", Decimal("89")),
            ("Hashbrown", "Sides", Decimal("49")),
            ("Soft Serve", "Desserts", Decimal("39")),
            ("McFlurry", "Desserts", Decimal("119")),
        ]
        for pname, cat_key, price in mcd_product_defs:
            p = Product(
                product_id=pid, franchise_id=1,
                category_id=mcd_cats[cat_key].category_id,
                name=pname, base_price=price,
            )
            mcd_products[pname] = p
            pid += 1

        # --- Ajay's Products ---
        ajy_products: dict[str, Product] = {}
        ajy_product_defs = [
            ("Masala Chai", "Hot Drinks", Decimal("30")),
            ("Filter Coffee", "Hot Drinks", Decimal("40")),
            ("Hot Chocolate", "Hot Drinks", Decimal("70")),
            ("Cold Coffee", "Cold Drinks", Decimal("70")),
            ("Cold Coco", "Cold Drinks", Decimal("55")),
            ("Lemonade", "Cold Drinks", Decimal("45")),
            ("Mango Shake", "Cold Drinks", Decimal("65")),
            ("Vada Pav", "Snacks", Decimal("25")),
            ("Samosa", "Snacks", Decimal("20")),
            ("Bread Butter Toast", "Snacks", Decimal("35")),
            ("Chai + Vada Pav Combo", "Combos", Decimal("50")),
            ("Coffee + Samosa Combo", "Combos", Decimal("55")),
        ]
        for pname, cat_key, price in ajy_product_defs:
            p = Product(
                product_id=pid, franchise_id=2,
                category_id=ajy_cats[cat_key].category_id,
                name=pname, base_price=price,
            )
            ajy_products[pname] = p
            pid += 1

        db.session.add_all(list(mcd_products.values()) + list(ajy_products.values()))
        db.session.flush()

        # --- Stock Items ---
        sid = 1
        mcd_stock: dict[str, StockItem] = {}
        mcd_stock_defs = [
            ("Potato", "kg"), ("Burger Bun", "pcs"), ("Paneer", "kg"),
            ("Chicken Patty", "pcs"), ("Milk", "liter"), ("Cocoa Powder", "kg"),
            ("Cooking Oil", "liter"), ("Lettuce", "kg"),
        ]
        for sname, uname in mcd_stock_defs:
            si = StockItem(stock_item_id=sid, franchise_id=1, name=sname, unit_id=unit_lookup[uname].unit_id)
            mcd_stock[sname] = si
            sid += 1

        ajy_stock: dict[str, StockItem] = {}
        ajy_stock_defs = [
            ("Tea Leaves", "kg"), ("Coffee Beans", "kg"), ("Milk", "liter"),
            ("Cocoa Powder", "kg"), ("Bread", "pcs"), ("Potatoes", "kg"),
            ("Mango Pulp", "liter"),
        ]
        for sname, uname in ajy_stock_defs:
            si = StockItem(stock_item_id=sid, franchise_id=2, name=sname, unit_id=unit_lookup[uname].unit_id)
            ajy_stock[sname] = si
            sid += 1

        db.session.add_all(list(mcd_stock.values()) + list(ajy_stock.values()))
        db.session.flush()
        db.session.commit()
        print("[step6] Catalogs and stock items ready.\n")

        # ==============================================================
        # 7. Product Recipes (ProductIngredient)
        # ==============================================================
        print("[step7] Linking product recipes...")

        ingr_id = 1
        mcd_recipes = [
            ("McAloo Tikki", [("Potato", Decimal("0.15")), ("Burger Bun", Decimal("1"))]),
            ("McSpicy Paneer", [("Paneer", Decimal("0.10")), ("Burger Bun", Decimal("1"))]),
            ("Big Mac", [("Burger Bun", Decimal("2")), ("Lettuce", Decimal("0.05")), ("Chicken Patty", Decimal("2"))]),
            ("Maharaja Mac", [("Burger Bun", Decimal("2")), ("Chicken Patty", Decimal("2")), ("Lettuce", Decimal("0.05"))]),
            ("McDouble", [("Burger Bun", Decimal("1")), ("Chicken Patty", Decimal("2"))]),
            ("Medium Fries", [("Potato", Decimal("0.20")), ("Cooking Oil", Decimal("0.05"))]),
            ("Soft Serve", [("Milk", Decimal("0.25"))]),
            ("McFlurry", [("Milk", Decimal("0.30")), ("Cocoa Powder", Decimal("0.02"))]),
            ("McFlurry Shake", [("Milk", Decimal("0.35"))]),
        ]
        for pname, ingredients in mcd_recipes:
            for stock_name, qty in ingredients:
                db.session.add(ProductIngredient(
                    product_ingredient_id=ingr_id,
                    product_id=mcd_products[pname].product_id,
                    stock_item_id=mcd_stock[stock_name].stock_item_id,
                    quantity_required=qty,
                ))
                ingr_id += 1

        ajy_recipes = [
            ("Masala Chai", [("Tea Leaves", Decimal("0.01")), ("Milk", Decimal("0.15"))]),
            ("Filter Coffee", [("Coffee Beans", Decimal("0.015")), ("Milk", Decimal("0.10"))]),
            ("Hot Chocolate", [("Cocoa Powder", Decimal("0.025")), ("Milk", Decimal("0.20"))]),
            ("Cold Coffee", [("Coffee Beans", Decimal("0.02")), ("Milk", Decimal("0.25"))]),
            ("Cold Coco", [("Cocoa Powder", Decimal("0.03")), ("Milk", Decimal("0.25"))]),
            ("Mango Shake", [("Mango Pulp", Decimal("0.15")), ("Milk", Decimal("0.20"))]),
            ("Vada Pav", [("Potatoes", Decimal("0.08")), ("Bread", Decimal("1"))]),
            ("Samosa", [("Potatoes", Decimal("0.06"))]),
            ("Bread Butter Toast", [("Bread", Decimal("2"))]),
        ]
        for pname, ingredients in ajy_recipes:
            for stock_name, qty in ingredients:
                db.session.add(ProductIngredient(
                    product_ingredient_id=ingr_id,
                    product_id=ajy_products[pname].product_id,
                    stock_item_id=ajy_stock[stock_name].stock_item_id,
                    quantity_required=qty,
                ))
                ingr_id += 1

        db.session.commit()
        print("[step7] Product recipes seeded.\n")

        # ==============================================================
        # 8. Branch Inventories
        # ==============================================================
        print("[step8] Stocking branch inventories...")

        mcd_inv = {
            "Potato": (Decimal("200"), Decimal("30")),
            "Burger Bun": (Decimal("500"), Decimal("80")),
            "Paneer": (Decimal("50"), Decimal("10")),
            "Chicken Patty": (Decimal("300"), Decimal("50")),
            "Milk": (Decimal("100"), Decimal("20")),
            "Cocoa Powder": (Decimal("20"), Decimal("5")),
            "Cooking Oil": (Decimal("50"), Decimal("10")),
            "Lettuce": (Decimal("30"), Decimal("8")),
        }
        ajy_inv = {
            "Tea Leaves": (Decimal("25"), Decimal("5")),
            "Coffee Beans": (Decimal("30"), Decimal("5")),
            "Milk": (Decimal("80"), Decimal("15")),
            "Cocoa Powder": (Decimal("15"), Decimal("3")),
            "Bread": (Decimal("400"), Decimal("60")),
            "Potatoes": (Decimal("150"), Decimal("25")),
            "Mango Pulp": (Decimal("40"), Decimal("8")),
        }

        inv_id = 1
        mcd_branches = [branches[0], branches[1], branches[2]]
        ajy_branches = [branches[3], branches[4]]

        for branch in mcd_branches:
            for stock_name, (qty, reorder) in mcd_inv.items():
                db.session.add(BranchInventory(
                    branch_inventory_id=inv_id,
                    branch_id=branch.branch_id,
                    stock_item_id=mcd_stock[stock_name].stock_item_id,
                    quantity=qty,
                    reorder_level=reorder,
                ))
                inv_id += 1

        for branch in ajy_branches:
            for stock_name, (qty, reorder) in ajy_inv.items():
                db.session.add(BranchInventory(
                    branch_inventory_id=inv_id,
                    branch_id=branch.branch_id,
                    stock_item_id=ajy_stock[stock_name].stock_item_id,
                    quantity=qty,
                    reorder_level=reorder,
                ))
                inv_id += 1

        db.session.commit()
        print("[step8] Inventories stocked.\n")

        # ==============================================================
        # 9. Royalty Configs (MUST come before sales)
        # ==============================================================
        print("[step9] Setting up royalty configurations...")

        rc1 = RoyaltyConfig(
            royalty_config_id=1,
            franchise_id=1,
            franchisor_cut_pct=Decimal("8.00"),
            branch_owner_cut_pct=Decimal("92.00"),
            effective_from=date(2025, 1, 1),
            created_by_franchisor_id=franchisor1.franchisor_id,
        )
        rc2 = RoyaltyConfig(
            royalty_config_id=2,
            franchise_id=2,
            franchisor_cut_pct=Decimal("10.00"),
            branch_owner_cut_pct=Decimal("90.00"),
            effective_from=date(2025, 1, 1),
            created_by_franchisor_id=franchisor2.franchisor_id,
        )
        db.session.add_all([rc1, rc2])
        db.session.commit()

        royalty_configs = {1: rc1, 2: rc2}  # franchise_id -> config
        print("[step9] Royalty configs ready.\n")

        # ==============================================================
        # 10. Historical Sales (3 months × 5 branches)
        # ==============================================================
        print("[step10] Generating historical sales (this may take a moment)...")

        now = datetime.now(timezone.utc)
        sale_id = 1
        sale_item_id = 1
        royalty_id = 1

        # Map franchise_id to product list
        franchise_products = {
            1: list(mcd_products.values()),
            2: list(ajy_products.values()),
        }

        # Map branch_idx to a staff user who can be the seller
        # Use the first staff member in each branch
        branch_seller_map = {}
        for si_info in staff_info:
            bidx = si_info["branch_idx"]
            if bidx not in branch_seller_map:
                branch_seller_map[bidx] = staff_users[staff_info.index(si_info)]

        total_sales = 0
        total_items = 0

        for branch_idx, branch in enumerate(branches):
            fid = branch.franchise_id
            products = franchise_products[fid]
            seller = branch_seller_map[branch_idx]
            rc = royalty_configs[fid]

            for month_offset in range(1, 4):  # 1=last month, 2=two months ago, 3=three months ago
                base_day = now - timedelta(days=30 * month_offset)
                num_sales = 12  # 12 sales per branch per month

                for sale_num in range(num_sales):
                    days_back = sale_num * 2  # spread across the month
                    hours_offset = 9 + (sale_num % 12)
                    sale_dt = base_day - timedelta(days=days_back) + timedelta(hours=hours_offset)

                    payment_mode = PAYMENT_MODES[sale_num % len(PAYMENT_MODES)]

                    sale = Sale(
                        sale_id=sale_id,
                        branch_id=branch.branch_id,
                        sold_by_user_id=seller.user_id,
                        sale_datetime=sale_dt,
                        total_amount=Decimal("0"),
                        status_id=1,  # PAID
                        payment_mode=payment_mode,
                    )
                    db.session.add(sale)
                    db.session.flush()

                    # 2-3 items per sale (deterministic by index)
                    num_items = 2 + (sale_num % 2)  # alternates 2 and 3
                    line_total_sum = Decimal("0")

                    for item_idx in range(num_items):
                        product = products[(sale_num + item_idx) % len(products)]
                        qty = 1 + (item_idx % 3)  # 1, 2, or 3
                        unit_price = product.base_price
                        line_total = unit_price * qty

                        db.session.add(SaleItem(
                            sale_item_id=sale_item_id,
                            sale_id=sale.sale_id,
                            product_id=product.product_id,
                            quantity=qty,
                            unit_price=unit_price,
                            line_total=line_total,
                        ))
                        sale_item_id += 1
                        line_total_sum += line_total
                        total_items += 1

                    sale.total_amount = line_total_sum

                    # Create SaleRoyalty
                    f_amt, b_amt = _calc_royalty(line_total_sum, rc)
                    db.session.add(SaleRoyalty(
                        sale_royalty_id=royalty_id,
                        sale_id=sale.sale_id,
                        royalty_config_id=rc.royalty_config_id,
                        franchisor_amount=f_amt,
                        branch_owner_amount=b_amt,
                    ))
                    royalty_id += 1
                    sale_id += 1
                    total_sales += 1

            # Commit per branch to keep memory low
            db.session.commit()

        print(f"[step10] {total_sales} sales with {total_items} line items and royalties seeded.\n")

        # ==============================================================
        # 11. Stock Purchase Requests (3 per branch = 15 total)
        # ==============================================================
        print("[step11] Creating stock purchase requests...")

        req_id = 1
        req_item_id = 1
        txn_id = 1
        request_status_ids = {"APPROVED": 2, "REJECTED": 3, "PENDING": 1}

        for branch_idx, branch in enumerate(branches):
            fid = branch.franchise_id
            stock_items_list = list(mcd_stock.values()) if fid == 1 else list(ajy_stock.values())
            requester = branch_seller_map[branch_idx]  # staff member
            approver = managers[branch_idx]

            # Request 1: APPROVED
            spr1 = StockPurchaseRequest(
                request_id=req_id, branch_id=branch.branch_id,
                requested_by_user_id=requester.user_id,
                approved_by_user_id=approver.user_id,
                status_id=request_status_ids["APPROVED"],
                note="Routine restock", approved_at=now - timedelta(days=5),
            )
            db.session.add(spr1)
            db.session.flush()

            for i in range(2):
                si = stock_items_list[i % len(stock_items_list)]
                qty = Decimal("50") if i == 0 else Decimal("30")
                db.session.add(StockPurchaseRequestItem(
                    request_item_id=req_item_id, request_id=spr1.request_id,
                    stock_item_id=si.stock_item_id, requested_quantity=qty,
                    estimated_unit_cost=Decimal("20.00"),
                ))
                req_item_id += 1

                # Corresponding InventoryTransaction IN
                db.session.add(InventoryTransaction(
                    transaction_id=txn_id, branch_id=branch.branch_id,
                    stock_item_id=si.stock_item_id, transaction_type_id=1,  # IN
                    quantity_change=qty, unit_cost=Decimal("20.00"),
                    created_by_user_id=requester.user_id,
                    approved_by_user_id=approver.user_id,
                    note=f"Approved purchase request #{spr1.request_id}",
                ))
                txn_id += 1
            req_id += 1

            # Request 2: REJECTED
            spr2 = StockPurchaseRequest(
                request_id=req_id, branch_id=branch.branch_id,
                requested_by_user_id=requester.user_id,
                approved_by_user_id=approver.user_id,
                status_id=request_status_ids["REJECTED"],
                note="Budget exceeded", rejected_at=now - timedelta(days=3),
            )
            db.session.add(spr2)
            db.session.flush()
            for i in range(2):
                si = stock_items_list[(i + 2) % len(stock_items_list)]
                db.session.add(StockPurchaseRequestItem(
                    request_item_id=req_item_id, request_id=spr2.request_id,
                    stock_item_id=si.stock_item_id, requested_quantity=Decimal("100"),
                    estimated_unit_cost=Decimal("25.00"),
                ))
                req_item_id += 1
            req_id += 1

            # Request 3: PENDING
            spr3 = StockPurchaseRequest(
                request_id=req_id, branch_id=branch.branch_id,
                requested_by_user_id=requester.user_id,
                status_id=request_status_ids["PENDING"],
                note="Need more supplies",
            )
            db.session.add(spr3)
            db.session.flush()
            for i in range(2):
                si = stock_items_list[(i + 4) % len(stock_items_list)]
                db.session.add(StockPurchaseRequestItem(
                    request_item_id=req_item_id, request_id=spr3.request_id,
                    stock_item_id=si.stock_item_id, requested_quantity=Decimal("40"),
                    estimated_unit_cost=Decimal("15.00"),
                ))
                req_item_id += 1
            req_id += 1

        db.session.commit()
        print("[step11] 15 stock purchase requests seeded.\n")

        # ==============================================================
        # 12. Historical Expenses (3 months × 5 branches)
        # ==============================================================
        print("[step12] Generating historical expenses...")

        expense_id = 1
        expense_categories = [
            'Rent', 'Utilities', 'Salaries', 'Supplies', 'Maintenance',
            'Marketing', 'Insurance', 'Transport', 'Other'
        ]

        total_expenses = 0
        for branch_idx, branch in enumerate(branches):
            manager = managers[branch_idx]
            
            for month_offset in range(1, 4):
                base_day = now - timedelta(days=30 * month_offset)
                num_expenses = 5  # 5 expenses per month
                
                for exp_num in range(num_expenses):
                    days_back = exp_num * 5
                    exp_dt = base_day - timedelta(days=days_back)
                    
                    category = expense_categories[exp_num % len(expense_categories)]
                    amount = Decimal(str(1000 + (exp_num * 500) + (branch_idx * 100)))

                    expense = Expense(
                        expense_id=expense_id,
                        branch_id=branch.branch_id,
                        logged_by_user_id=manager.user_id,
                        expense_date=exp_dt.date(),
                        category=category,
                        description=f"Monthly {category}",
                        amount=amount
                    )
                    db.session.add(expense)
                    expense_id += 1
                    total_expenses += 1
            
        db.session.commit()
        print(f"[step12] {total_expenses} historical expenses seeded.\n")

        # ==============================================================
        # 13. Pending Franchise Application
        # ==============================================================
        print("[step13] Creating pending franchise application...")

        applicant = User(
            user_id=uid, name="Rajan Kapoor", email="applicant@demo.com",
            phone="9100000099", password_hash=hash_password("applicant123"),
        )
        db.session.add(applicant)
        db.session.flush()

        app_entry = FranchiseApplication(
            franchise_id=franchise1.franchise_id,
            branch_owner_user_id=applicant.user_id,
            proposed_location="Pune, Maharashtra",
            business_experience="5 years in food retail",
            reason="Looking to expand into franchise operations",
            investment_capacity=Decimal("1200000"),
            status_id=1,  # PENDING
        )
        db.session.add(app_entry)
        db.session.commit()
        print("[step13] Pending franchise application created.\n")

        # ==============================================================
        # Summary
        # ==============================================================
        print("[done] Relay seed data ready!\n")
        print("=" * 55)
        print("  LOGIN CREDENTIALS")
        print("=" * 55)
        creds = [
            ("Franchisor 1", "admin@mcd.com", "admin123"),
            ("Franchisor 2", "admin@ajays.com", "admin123"),
            ("Branch Owner", "rahul@mcd-alkapuri.com", "owner123"),
            ("Branch Owner", "priya@mcd-vesu.com", "owner123"),
            ("Branch Owner", "arjun@mcd-bandra.com", "owner123"),
            ("Branch Owner", "sneha@ajays-navrangpura.com", "owner123"),
            ("Branch Owner", "vikram@ajays-koramangala.com", "owner123"),
            ("Manager", "mgr.alkapuri@mcd.com", "manager123"),
            ("Manager", "mgr.vesu@mcd.com", "manager123"),
            ("Manager", "mgr.bandra@mcd.com", "manager123"),
            ("Manager", "mgr.navrangpura@ajays.com", "manager123"),
            ("Manager", "mgr.koramangala@ajays.com", "manager123"),
            ("Staff", "staff1.alkapuri@mcd.com", "staff123"),
            ("Staff", "staff2.alkapuri@mcd.com", "staff123"),
            ("Staff", "staff1.vesu@mcd.com", "staff123"),
            ("Staff", "staff2.vesu@mcd.com", "staff123"),
            ("Staff", "staff1.bandra@mcd.com", "staff123"),
            ("Staff", "staff2.bandra@mcd.com", "staff123"),
            ("Staff", "staff1.navrangpura@ajays.com", "staff123"),
            ("Staff", "staff2.navrangpura@ajays.com", "staff123"),
            ("Staff", "staff1.koramangala@ajays.com", "staff123"),
            ("Staff", "staff2.koramangala@ajays.com", "staff123"),
            ("Applicant", "applicant@demo.com", "applicant123"),
        ]
        print(f"{'Role':<16} {'Email':<38} {'Password'}")
        print(f"{'---':<16} {'---':<38} {'---'}")
        for role, email, pw in creds:
            print(f"{role:<16} {email:<38} {pw}")
        print()


if __name__ == "__main__":
    seed_database()
