"""Security helpers, including password hashing and verification."""

from __future__ import annotations

from hashlib import sha256


def hash_password(password: str) -> str:
    """Return the SHA-256 hash of the provided password."""

    return sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Check if the provided password matches the stored hash."""

    return hash_password(password) == hashed
