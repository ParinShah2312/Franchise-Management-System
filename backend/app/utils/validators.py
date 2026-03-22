"""Reusable input validation helpers for route handlers."""

from __future__ import annotations

import re

# Pre-compiled regex patterns for performance
_EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_PASSWORD_PATTERN = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")
_DIGITS_ONLY = re.compile(r"\D")


def validate_email(email: str) -> bool:
    """Return True if email matches a basic valid format."""
    return bool(_EMAIL_PATTERN.match(email))


def sanitize_phone(phone_raw: str) -> str:
    """Strip all non-digit characters from a phone string."""
    return _DIGITS_ONLY.sub("", phone_raw)


def validate_phone(phone: str) -> bool:
    """Return True if phone (after sanitization) is exactly 10 digits."""
    return len(sanitize_phone(phone)) == 10


def validate_password_strength(password: str) -> bool:
    """
    Return True if password meets strength requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    return bool(_PASSWORD_PATTERN.match(password))


# Error messages to use alongside these validators
# so error text is consistent across all registration endpoints
EMAIL_ERROR = "Invalid email format."
PHONE_ERROR = "Phone must be exactly 10 digits."
PASSWORD_ERROR = (
    "Password must be 8+ chars with uppercase, lowercase, and a number."
)
