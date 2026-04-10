"""Flask application factory for the Franchise Management System backend."""

from __future__ import annotations

import os
from typing import Any

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from .extensions import db, migrate, limiter


def create_app(
    config_object: str | None = None,
    *,
    register_blueprints_flag: bool = True,
) -> Flask:
    """Create and configure the Flask application."""

    load_dotenv()

    _backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app = Flask(__name__, instance_path=_backend_dir, instance_relative_config=True)

    flask_secret = os.environ.get("SECRET_KEY", "dev-flask-secret")
    if flask_secret == "dev-flask-secret" and not app.debug:
        raise RuntimeError(
            "SECRET_KEY must be set in production. "
            "Set the SECRET_KEY environment variable."
        )

    _default_db_uri = "sqlite:///relay.db"
    default_config: dict[str, Any] = {
        "SECRET_KEY": flask_secret,
        "SQLALCHEMY_DATABASE_URI": os.environ.get("DATABASE_URI", _default_db_uri),
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "MAX_CONTENT_LENGTH": 5 * 1024 * 1024,  # 5 MB upload limit
    }

    app.config.from_mapping(default_config)

    if config_object:
        app.config.from_object(config_object)

    register_extensions(app)
    if register_blueprints_flag:
        register_blueprints(app)

    return app


def register_extensions(app: Flask) -> None:
    """Initialize third-party extensions for the app."""

    db.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    CORS(app)

    # Import models after extension initialization to register metadata
    from . import models  # noqa: F401  pylint: disable=unused-import


def register_blueprints(app: Flask) -> None:
    """Attach route blueprints to the app."""

    from .routes.auth_routes import auth_bp
    from .routes.registration_routes import registration_bp
    from .routes.branch_routes import branch_bp
    from .routes.dashboard_routes import dashboard_bp
    from .routes.franchise_routes import franchise_bp
    from .routes.application_routes import application_bp
    from .routes.inventory_routes import inventory_bp
    from .routes.request_routes import request_bp
    from .routes.report_routes import report_bp
    from .routes.sales_routes import sales_bp
    from .routes.catalog_routes import catalog_bp
    from .routes.royalty_routes import royalty_bp
    from .routes.user_routes import user_bp
    from .routes.expense_routes import expense_bp
    from .routes.file_routes import file_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(registration_bp)
    app.register_blueprint(branch_bp)
    app.register_blueprint(franchise_bp)
    app.register_blueprint(application_bp)
    app.register_blueprint(sales_bp)
    app.register_blueprint(catalog_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(request_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(royalty_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(expense_bp)
    app.register_blueprint(file_bp)


def shell_context() -> dict[str, Any]:
    """Provide objects to the Flask shell context."""

    from . import models

    context: dict[str, Any] = {"db": db}
    context.update(
        {name: getattr(models, name) for name in dir(models) if name[0].isupper()}
    )
    return context
