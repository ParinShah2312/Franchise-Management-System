"""Utility script to verify the database schema by listing created tables."""

from __future__ import annotations

from sqlalchemy import inspect

from app import create_app
from app.extensions import db

def main() -> None:
    """Create all tables and print their names for verification."""

    app = create_app(register_blueprints_flag=False)
    with app.app_context():
        db.create_all()
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print("Created tables (sorted):")
        for name in sorted(tables):
            print(f"- {name}")


if __name__ == "__main__":
    main()
