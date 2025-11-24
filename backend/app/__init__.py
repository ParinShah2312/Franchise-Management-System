"""Flask application factory for the Franchise Management System backend."""

from __future__ import annotations

import os
from typing import Any

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .extensions import db, migrate


def create_app(config_object: str | None = None) -> Flask:
    """Create and configure the Flask application."""

    load_dotenv()

    app = Flask(__name__)

    default_config: dict[str, Any] = {
        "SQLALCHEMY_DATABASE_URI": os.environ.get("DATABASE_URI", "sqlite:///relay.db"),
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
    }

    app.config.from_mapping(default_config)

    upload_folder = os.path.join(app.root_path, "static", "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    app.config.setdefault("UPLOAD_FOLDER", upload_folder)

    if config_object:
        app.config.from_object(config_object)

    register_extensions(app)
    register_blueprints(app)

    return app


def register_extensions(app: Flask) -> None:
    """Initialize third-party extensions for the app."""

    db.init_app(app)
    migrate.init_app(app, db)

    # Import models after extension initialization to register metadata
    from . import models  # noqa: F401  pylint: disable=unused-import


def register_blueprints(app: Flask) -> None:
    """Attach route blueprints to the app."""

    from .routes.auth_routes import auth_bp
    from .routes.dashboard_routes import dashboard_bp
    from .routes.expenses_routes import expenses_bp
    from .routes.franchise_routes import franchise_bp
    from .routes.inventory_routes import inventory_bp
    from .routes.report_routes import report_bp
    from .routes.sales_routes import sales_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(franchise_bp)
    app.register_blueprint(sales_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(expenses_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(dashboard_bp)
    CORS(app)


def shell_context() -> dict[str, Any]:
    """Provide objects to the Flask shell context."""

    from . import models

    context: dict[str, Any] = {"db": db}
    context.update({name: getattr(models, name) for name in dir(models) if name[0].isupper()})
    return context
