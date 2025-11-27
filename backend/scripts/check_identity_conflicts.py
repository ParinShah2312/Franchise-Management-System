from __future__ import annotations

import argparse

import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import create_app
from app.models import Franchisor, User


def _format_record(record):
    if record is None:
        return "None"

    fields = []
    for key in ("franchisor_id", "user_id", "organization_name", "name", "email", "phone"):
        if hasattr(record, key):
            fields.append(f"{key}={getattr(record, key)}")
    return f"<{record.__class__.__name__} {'; '.join(fields)}>"


def main(email: str | None, phone: str | None) -> None:
    app = create_app()
    with app.app_context():
        normalized_phone = "".join(filter(str.isdigit, phone)) if phone else None

        print("Email checks:")
        if email:
            print("  franchisor: ", _format_record(Franchisor.query.filter_by(email=email.lower()).first()))
            print("  user      : ", _format_record(User.query.filter_by(email=email.lower()).first()))
        else:
            print("  (skipped) no email provided")

        print("\nPhone checks (digits only):")
        if normalized_phone:
            print(
                "  franchisor: ",
                _format_record(Franchisor.query.filter_by(phone=normalized_phone).first()),
            )
            print("  user      : ", _format_record(User.query.filter_by(phone=normalized_phone).first()))
        else:
            print("  (skipped) no phone provided")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Check for existing franchisor/user records by email and phone.")
    parser.add_argument("--email", help="Email address to search for", default=None)
    parser.add_argument("--phone", help="Phone number to search for", default=None)
    args = parser.parse_args()

    main(args.email, args.phone)
