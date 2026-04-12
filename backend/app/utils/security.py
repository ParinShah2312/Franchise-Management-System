"""Security helpers for authentication, hashing, and authorization."""

from __future__ import annotations

import base64
import json
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from hashlib import sha256
from hmac import compare_digest, new as hmac_new

import bcrypt
from http import HTTPStatus
from typing import Iterable, Optional
from types import SimpleNamespace

from flask import current_app, g, jsonify, request
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import Franchisor, User, UserRole

def hash_password(password: str) -> str:
    """Return a bcrypt hash of the provided password."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed: str) -> bool:
    """Check if the provided password matches the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False

def _get_jwt_secret() -> bytes:
    """Retrieve the JWT secret key safely from app config.
    
    This consolidates the JWT secret with the Flask SECRET_KEY.
    """
    secret = current_app.config.get("SECRET_KEY")
    if not secret:
        raise RuntimeError("SECRET_KEY must be set in app configuration.")
    return secret.encode("utf-8")

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)

def generate_token(
    user_id: int, *, role: str, expires_in_minutes: int = 60 * 24
) -> str:
    """
    Generate a signed JWT for the given subject id and declared role.

    Args:
        user_id: Primary Key of User or Franchisor.
        role: e.g., 'FRANCHISOR', 'BRANCH_OWNER', 'MANAGER', 'STAFF', 'PENDING_APPLICANT'.
    """
    if not role:
        raise ValueError("role must be provided.")

    header = {"alg": "HS256", "typ": "JWT"}
    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=expires_in_minutes)

    payload = {
        "sub": user_id,
        "exp": int(expires_at.timestamp()),
        "role": role,  # Crucial for authorization and table routing
    }

    header_segment = _b64url_encode(
        json.dumps(header, separators=(",", ":")).encode("utf-8")
    )
    payload_segment = _b64url_encode(
        json.dumps(payload, separators=(",", ":")).encode("utf-8")
    )
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")

    signature = hmac_new(_get_jwt_secret(), signing_input, sha256).digest()
    signature_segment = _b64url_encode(signature)

    return "".join((header_segment, ".", payload_segment, ".", signature_segment))

def _extract_token() -> Optional[str]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None

def _decode_token(token: str | None) -> Optional[dict[str, object]]:
    if not token:
        return None

    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_segment, payload_segment, signature_segment = parts
    except ValueError:
        return None

    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    expected_signature = hmac_new(_get_jwt_secret(), signing_input, sha256).digest()

    try:
        provided_signature = _b64url_decode(signature_segment)
    except (ValueError, TypeError):
        return None

    if not compare_digest(expected_signature, provided_signature):
        return None

    try:
        payload_bytes = _b64url_decode(payload_segment)
        payload = json.loads(payload_bytes)
    except (ValueError, TypeError, json.JSONDecodeError):
        return None

    exp = payload.get("exp")
    if isinstance(exp, (int, float)):
        if datetime.now(tz=timezone.utc).timestamp() > exp:
            return None

    return payload

def _load_principal_from_token(token: str | None):
    payload = _decode_token(token)
    if not payload:
        return None, None, None, None

    user_id = payload.get("sub")
    role = payload.get("role")

    if not isinstance(user_id, int) or not role:
        return None, None, None, None

    # Path A: Franchisor (Brand Owner)
    if role == "FRANCHISOR":
        principal = db.session.get(Franchisor, user_id)
        if not principal:
            return None, None, None, None

        # Create a fake "Role" object so existing code doesn't break
        role_stub = SimpleNamespace(
            role=SimpleNamespace(name="FRANCHISOR"),
            scope_type="GLOBAL",
            scope_id=None,
        )
        setattr(principal, "is_franchisor", True)
        return principal, role_stub, "FRANCHISOR", "franchisor"

    # Path B: User (Owner, Manager, Staff)
    user = db.session.get(
        User, user_id,
        options=[joinedload(User.user_roles).joinedload(UserRole.role)]
    )
    if not user:
        return None, None, None, None

    primary_role = _select_primary_role(user)
    role_name = (
        primary_role.role.name if primary_role and primary_role.role else "UNKNOWN"
    )
    setattr(user, "is_franchisor", False)
    return user, primary_role, role_name, "user"

def _select_primary_role(user: User) -> Optional[UserRole]:
    """Pick the most privileged role for this user using a priority map."""
    roles = user.user_roles  # Already eagerly loaded via joinedload
    if not roles:
        return None

    # Priority: Lower number = higher privilege
    PRIORITY = {
        "FRANCHISOR": 1,
        "BRANCH_OWNER": 2,
        "MANAGER": 3,
        "STAFF": 4
    }

    def _priority(ur):
        return PRIORITY.get(ur.role.name if ur.role else "", 99)

    return min(roles, key=_priority)

def token_required(allowed_roles: Iterable[str] | None = None):
    """Decorator ensuring the request has a valid token and optional role restriction."""

    allowed_set = {role for role in allowed_roles} if allowed_roles else None

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if request.method == "OPTIONS":
                return current_app.make_default_options_response()

            token = _extract_token()
            principal, primary_role, role_name, user_type = _load_principal_from_token(
                token
            )

            if not principal:
                return jsonify(
                    {"error": "Authentication required."}
                ), HTTPStatus.UNAUTHORIZED

            # Active check for regular users
            if (
                user_type == "user"
                and hasattr(principal, "is_active")
                and not principal.is_active
            ):
                return jsonify({"error": "Account is inactive."}), HTTPStatus.FORBIDDEN

            # Role Permission Check
            if allowed_set:
                is_allowed = role_name in allowed_set

                if not is_allowed:
                    return (
                        jsonify(
                            {
                                "error": "You do not have permission to perform this action."
                            }
                        ),
                        HTTPStatus.FORBIDDEN,
                    )

            g.current_user = principal
            g.current_role = primary_role
            g.current_user_type = user_type

            return func(*args, **kwargs)

        return wrapper

    return decorator
