"""Application-wide extension instances."""

from __future__ import annotations

from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()
migrate = Migrate()

__all__ = ["db", "migrate"]
