"""Utility script to seed the database with initial users and franchises."""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta

from app import create_app
from app.extensions import db
from app.models import Franchise, FranchiseStatus, Staff, User, UserRole
from app.utils.security import hash_password


def seed_database(admin_email: str, admin_password: str) -> None:
    """
    Populate the database with an Admin, a Branch Owner (Parin), 
    and a Staff Member (Prayag).
    """
    app = create_app()
    with app.app_context():
        print("🔄 Creating database tables...")
        db.create_all()

        # --- 1. Create Admin User ---
        admin = User.query.filter_by(email=admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                full_name="System Admin",
                password_hash=hash_password(admin_password),
                role=UserRole.ADMIN,
            )
            db.session.add(admin)
            db.session.flush() # Flush to get admin.id
            print(f"✅ Admin user created: {admin_email}")
        else:
            print(f"ℹ️  Admin user already exists: {admin_email}")

        # --- 2. Create Franchisee (Parin) & Vadodara Branch ---
        # We create the Franchisee User first or simultaneously
        franchisee_email = "parin@relay.com"
        parin = User.query.filter_by(email=franchisee_email).first()
        
        if not parin:
            # Create the Branch First (Vadodara)
            vadodara_branch = Franchise(
                name="Relay",
                location="Vadodara",
                owner_name="Parin",
                status=FranchiseStatus.ACTIVE, # Active so Staff can join
                phone="9876543210",
                property_size="2000 - 3000 sq ft",
                investment_capacity="$100k - $250k",
                business_experience="5 Years in Retail Management",
                reason_for_franchise="Expansion in Gujarat Market",
                expected_opening_date=datetime.utcnow() + timedelta(days=30)
            )
            db.session.add(vadodara_branch)
            db.session.flush() # Get ID

            # Create Parin (User)
            parin = User(
                email=franchisee_email,
                full_name="Parin",
                password_hash=hash_password("parin123"),
                role=UserRole.FRANCHISEE,
                franchise_id=vadodara_branch.id 
            )
            db.session.add(parin)
            db.session.flush()

            # Link Branch back to Owner
            vadodara_branch.owner_id = parin.id
            print(f"✅ Franchisee 'Parin' and Branch 'Relay Vadodara' created.")
        else:
            print(f"ℹ️  Franchisee 'Parin' already exists.")
            vadodara_branch = Franchise.query.filter_by(location="Vadodara", owner_id=parin.id).first()

        # --- 3. Create Staff Member (Prayag) ---
        if vadodara_branch:
            staff_email = "prayag@relay.com"
            prayag = User.query.filter_by(email=staff_email).first()
            
            if not prayag:
                # Create User Account for Login
                prayag = User(
                    email=staff_email,
                    full_name="Prayag",
                    password_hash=hash_password("prayag123"),
                    role=UserRole.STAFF,
                    franchise_id=vadodara_branch.id
                )
                db.session.add(prayag)

                # Create Staff Profile (for HR/Management)
                staff_profile = Staff(
                    franchise_id=vadodara_branch.id,
                    name="Prayag",
                    position="Branch Manager",
                    salary=45000.00,
                    join_date=datetime.utcnow(),
                    email=staff_email,
                    contact="9123456789"
                )
                db.session.add(staff_profile)
                print(f"✅ Staff Member 'Prayag' created for Vadodara Branch.")
            else:
                print(f"ℹ️  Staff 'Prayag' already exists.")

        # --- Final Commit ---
        db.session.commit()
        print("\n🌱 Database seeding completed successfully!")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Seed the database with initial data.")
    parser.add_argument(
        "--email",
        default=os.environ.get("ADMIN_EMAIL", "admin@relay.com"),
        help="Email address for the admin user.",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("ADMIN_PASSWORD", "admin123"),
        help="Password for the admin user.",
    )
    args = parser.parse_args(argv)

    try:
        seed_database(args.email.lower(), args.password)
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())