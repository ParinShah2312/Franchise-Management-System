"""Authentication helpers and decorators for route protection."""

from __future__ import annotations

from functools import wraps
from http import HTTPStatus
from typing import Iterable

from flask import g, jsonify, request

from ..models import User, UserRole


def _extract_token() -> str | None:
    """Retrieve the bearer token from the Authorization header."""

    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def _load_user_from_token(token: str | None) -> User | None:
    """Resolve the current user from a simple bearer token (user id)."""

    if not token:
        return None

    try:
        user_id = int(token)
    except (ValueError, TypeError):
        return None

    return User.query.get(user_id)


def login_required(roles: Iterable[UserRole] | None = None):
    """Decorator ensuring the request is authenticated and optionally role-gated."""

    role_values = {role.value if isinstance(role, UserRole) else str(role) for role in roles} if roles else None

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = _extract_token()
            user = _load_user_from_token(token)
            if not user:
                return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED

            if role_values and user.role.value not in role_values:
                return jsonify({"error": "You do not have permission to perform this action."}), HTTPStatus.FORBIDDEN

            g.current_user = user
            return func(*args, **kwargs)

        return wrapper

    return decorator


def current_user() -> User:
    """Return the user attached to the current request context."""

    user = getattr(g, "current_user", None)
    if not user:
        raise RuntimeError("No user is bound to the current context. Did you forget @login_required?")
    return user
