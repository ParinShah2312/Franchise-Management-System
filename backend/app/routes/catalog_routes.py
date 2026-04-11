"""Catalog and recipe management routes for franchisors."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, current_app, jsonify, request, g
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    Branch,
    Franchise,
    Product,
    ProductCategory,
    ProductIngredient,
    StockItem,
)
from ..utils.security import token_required
from ..utils.branch_helpers import _current_role


catalog_bp = Blueprint("catalog", __name__, url_prefix="/api/catalog")


@catalog_bp.route("/branch-products", methods=["GET"])
@token_required({"BRANCH_OWNER"})
def list_branch_catalog_products() -> tuple[list[dict[str, object]], int]:
    """Read-only product listing for branch owners, scoped to their franchise."""
    role = _current_role()
    if role.scope_type != "BRANCH":
        return jsonify({"error": "Branch-scoped role required."}), HTTPStatus.FORBIDDEN

    branch = db.session.get(Branch, role.scope_id)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    products = (
        Product.query.options(joinedload(Product.category))
        .filter_by(franchise_id=branch.franchise_id, is_active=True)
        .order_by(Product.name.asc())
        .all()
    )

    payload = [
        {
            "product_id": p.product_id,
            "name": p.name,
            "description": p.description,
            "base_price": float(p.base_price) if p.base_price is not None else 0.0,
            "category_name": p.category.name if p.category else None,
        }
        for p in products
    ]

    return jsonify(payload), HTTPStatus.OK


@catalog_bp.route("/products", methods=["GET"])
@token_required({"FRANCHISOR"})
def list_catalog_products() -> tuple[list[dict[str, object]], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED

    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found for this franchisor."}), HTTPStatus.NOT_FOUND

    products = (
        Product.query.options(joinedload(Product.category), joinedload(Product.ingredients))
        .filter_by(franchise_id=franchise.franchise_id)
        .order_by(Product.name.asc())
        .all()
    )

    payload = [
        {
            "product_id": p.product_id,
            "name": p.name,
            "description": p.description,
            "base_price": float(p.base_price) if p.base_price is not None else 0.0,
            "category_id": p.category_id,
            "category_name": p.category.name if p.category else None,
            "is_active": p.is_active,
            "ingredient_count": len(p.ingredients)
        }
        for p in products
    ]

    return jsonify(payload), HTTPStatus.OK


@catalog_bp.route("/categories", methods=["GET"])
@token_required({"FRANCHISOR"})
def list_catalog_categories() -> tuple[list[dict[str, object]], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found for this franchisor."}), HTTPStatus.NOT_FOUND

    categories = (
        ProductCategory.query.options(joinedload(ProductCategory.products))
        .filter_by(franchise_id=franchise.franchise_id)
        .order_by(ProductCategory.name.asc())
        .all()
    )

    payload = [
        {
            "category_id": c.category_id,
            "name": c.name,
            "description": c.description,
            "franchise_id": c.franchise_id,
            "product_count": len([p for p in c.products if p.is_active])
        }
        for c in categories
    ]
    return jsonify(payload), HTTPStatus.OK


@catalog_bp.route("/categories", methods=["POST"])
@token_required({"FRANCHISOR"})
def create_category() -> tuple[dict[str, object], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    description = payload.get("description")

    if not name:
        return jsonify({"error": "name is required."}), HTTPStatus.BAD_REQUEST

    existing = ProductCategory.query.filter(
        ProductCategory.franchise_id == franchise.franchise_id,
        db.func.lower(ProductCategory.name) == name.lower()
    ).first()

    if existing:
        return jsonify({"error": "A category with this name already exists."}), HTTPStatus.CONFLICT

    category = ProductCategory(
        franchise_id=franchise.franchise_id,
        name=name,
        description=description
    )
    db.session.add(category)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A category with this name already exists."}), HTTPStatus.CONFLICT

    return jsonify({
        "category_id": category.category_id,
        "name": category.name,
        "description": category.description,
        "franchise_id": category.franchise_id,
        "product_count": 0
    }), HTTPStatus.CREATED


@catalog_bp.route("/products", methods=["POST"])
@token_required({"FRANCHISOR"})
def create_product() -> tuple[dict[str, object], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    category_id = payload.get("category_id")
    base_price_raw = payload.get("base_price")
    description = payload.get("description")

    if not name:
        return jsonify({"error": "name is required."}), HTTPStatus.BAD_REQUEST
    if not category_id:
        return jsonify({"error": "category_id is required."}), HTTPStatus.BAD_REQUEST
    if base_price_raw is None:
        return jsonify({"error": "base_price is required."}), HTTPStatus.BAD_REQUEST

    try:
        base_price = Decimal(str(base_price_raw))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"error": "base_price must be numeric."}), HTTPStatus.BAD_REQUEST

    if base_price <= 0:
        return jsonify({"error": "base_price must be a positive number."}), HTTPStatus.BAD_REQUEST

    category = db.session.get(ProductCategory, category_id)
    if not category or category.franchise_id != franchise.franchise_id:
        return jsonify({"error": "Invalid category for this franchise."}), HTTPStatus.BAD_REQUEST

    existing = Product.query.filter(
        Product.franchise_id == franchise.franchise_id,
        db.func.lower(Product.name) == name.lower()
    ).first()

    if existing:
        return jsonify({"error": "A product with this name already exists."}), HTTPStatus.CONFLICT

    product = Product(
        franchise_id=franchise.franchise_id,
        category_id=category_id,
        name=name,
        base_price=base_price,
        description=description,
        is_active=True
    )
    db.session.add(product)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Unable to create product due to duplicate data."}), HTTPStatus.CONFLICT

    return jsonify({
        "product_id": product.product_id,
        "name": product.name,
        "description": product.description,
        "base_price": float(product.base_price) if product.base_price is not None else 0.0,
        "is_active": product.is_active,
        "category_id": product.category_id,
        "category_name": category.name,
        "franchise_id": product.franchise_id
    }), HTTPStatus.CREATED


@catalog_bp.route("/products/<int:product_id>", methods=["PUT"])
@token_required({"FRANCHISOR"})
def update_product(product_id: int) -> tuple[dict[str, object], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found."}), HTTPStatus.NOT_FOUND
    if product.franchise_id != franchise.franchise_id:
        return jsonify({"error": "Unauthorized to edit this product."}), HTTPStatus.FORBIDDEN

    payload = request.get_json(silent=True) or {}
    
    if "name" in payload:
        name = (payload["name"] or "").strip()
        if not name:
            return jsonify({"error": "name cannot be empty."}), HTTPStatus.BAD_REQUEST
        if name.lower() != product.name.lower():
            existing = Product.query.filter(
                Product.franchise_id == franchise.franchise_id,
                db.func.lower(Product.name) == name.lower()
            ).first()
            if existing:
                return jsonify({"error": "A product with this name already exists."}), HTTPStatus.CONFLICT
        product.name = name

    if "category_id" in payload:
        category_id = payload["category_id"]
        if category_id != product.category_id:
            category = db.session.get(ProductCategory, category_id)
            if not category or category.franchise_id != franchise.franchise_id:
                return jsonify({"error": "Invalid category for this franchise."}), HTTPStatus.BAD_REQUEST
            product.category_id = category_id

    if "base_price" in payload:
        try:
            base_price = Decimal(str(payload["base_price"]))
        except (InvalidOperation, TypeError, ValueError):
            return jsonify({"error": "base_price must be numeric."}), HTTPStatus.BAD_REQUEST
        if base_price <= 0:
            return jsonify({"error": "base_price must be a positive number."}), HTTPStatus.BAD_REQUEST
        product.base_price = base_price

    if "description" in payload:
        product.description = payload["description"]

    if "is_active" in payload:
        product.is_active = bool(payload["is_active"])

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Unable to update product due to duplicate data."}), HTTPStatus.CONFLICT

    category = db.session.get(ProductCategory, product.category_id)
    return jsonify({
        "product_id": product.product_id,
        "name": product.name,
        "description": product.description,
        "base_price": float(product.base_price) if product.base_price is not None else 0.0,
        "is_active": product.is_active,
        "category_id": product.category_id,
        "category_name": category.name if category else None,
        "franchise_id": product.franchise_id
    }), HTTPStatus.OK


@catalog_bp.route("/products/<int:product_id>/ingredients", methods=["GET"])
@token_required({"FRANCHISOR"})
def get_product_ingredients(product_id: int) -> tuple[list[dict[str, object]], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    product = db.session.get(Product, product_id)
    if not product or product.franchise_id != franchise.franchise_id:
        return jsonify({"error": "Product not found or unauthorized."}), HTTPStatus.FORBIDDEN

    ingredients = (
        ProductIngredient.query.options(
            joinedload(ProductIngredient.stock_item).joinedload(StockItem.unit)
        )
        .filter_by(product_id=product_id)
        .all()
    )

    payload = [
        {
            "ingredient_id": ingredient.ingredient_id,
            "product_id": ingredient.product_id,
            "stock_item_id": ingredient.stock_item_id,
            "stock_item_name": ingredient.stock_item.name,
            "unit_name": ingredient.stock_item.unit.unit_name,
            "quantity_required": float(ingredient.quantity_required) if ingredient.quantity_required is not None else 0.0
        }
        for ingredient in ingredients
    ]

    return jsonify(payload), HTTPStatus.OK


@catalog_bp.route("/products/<int:product_id>/ingredients", methods=["POST"])
@token_required({"FRANCHISOR"})
def add_product_ingredient(product_id: int) -> tuple[dict[str, object], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    product = db.session.get(Product, product_id)
    if not product or product.franchise_id != franchise.franchise_id:
        return jsonify({"error": "Product not found or unauthorized."}), HTTPStatus.FORBIDDEN

    payload = request.get_json(silent=True) or {}
    stock_item_id = payload.get("stock_item_id")
    quantity_required_raw = payload.get("quantity_required")

    if not stock_item_id:
        return jsonify({"error": "stock_item_id is required."}), HTTPStatus.BAD_REQUEST

    try:
        quantity_required = Decimal(str(quantity_required_raw))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"error": "quantity_required must be numeric."}), HTTPStatus.BAD_REQUEST

    if quantity_required <= 0:
        return jsonify({"error": "quantity_required must be a positive number."}), HTTPStatus.BAD_REQUEST

    stock_item = db.session.get(StockItem, stock_item_id)
    if not stock_item or stock_item.franchise_id != franchise.franchise_id:
        return jsonify({"error": "Invalid stock item."}), HTTPStatus.BAD_REQUEST

    existing = ProductIngredient.query.filter_by(
        product_id=product_id, stock_item_id=stock_item_id
    ).first()

    if existing:
        return jsonify({"error": "This ingredient is already linked to the product."}), HTTPStatus.CONFLICT

    ingredient = ProductIngredient(
        product_id=product_id,
        stock_item_id=stock_item_id,
        quantity_required=quantity_required
    )
    db.session.add(ingredient)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Unable to add ingredient due to a data conflict."}), HTTPStatus.CONFLICT

    refreshed_ingredient = db.session.query(ProductIngredient).options(
        joinedload(ProductIngredient.stock_item).joinedload(StockItem.unit)
    ).filter(ProductIngredient.ingredient_id == ingredient.ingredient_id).first()

    return jsonify({
        "ingredient_id": refreshed_ingredient.ingredient_id,
        "product_id": refreshed_ingredient.product_id,
        "stock_item_id": refreshed_ingredient.stock_item_id,
        "stock_item_name": refreshed_ingredient.stock_item.name,
        "unit_name": refreshed_ingredient.stock_item.unit.unit_name,
        "quantity_required": float(refreshed_ingredient.quantity_required) if refreshed_ingredient.quantity_required is not None else 0.0
    }), HTTPStatus.CREATED


@catalog_bp.route("/products/<int:product_id>/ingredients/<int:ingredient_id>", methods=["DELETE"])
@token_required({"FRANCHISOR"})
def remove_product_ingredient(product_id: int, ingredient_id: int) -> tuple[dict[str, object], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    product = db.session.get(Product, product_id)
    if not product or product.franchise_id != franchise.franchise_id:
        return jsonify({"error": "Product not found or unauthorized."}), HTTPStatus.FORBIDDEN

    ingredient = db.session.get(ProductIngredient, ingredient_id)
    if not ingredient or ingredient.product_id != product_id:
        return jsonify({"error": "Ingredient not found."}), HTTPStatus.NOT_FOUND

    db.session.delete(ingredient)
    try:
        db.session.commit()
    except Exception as exc:  # pragma: no cover
        db.session.rollback()
        current_app.logger.exception("Failed to remove ingredient: %s", exc)
        return jsonify({"error": "Unable to remove ingredient."}), HTTPStatus.INTERNAL_SERVER_ERROR

    return jsonify({"message": "Ingredient removed."}), HTTPStatus.OK


@catalog_bp.route("/stock-items/<int:stock_item_id>/products", methods=["GET"])
@token_required({"FRANCHISOR"})
def get_stock_item_products(stock_item_id: int) -> tuple[list[dict[str, object]], int]:
    franchisor = getattr(g, "current_user", None)
    if not franchisor:
        return jsonify({"error": "Authentication required."}), HTTPStatus.UNAUTHORIZED
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    stock_item = db.session.get(StockItem, stock_item_id)
    if not stock_item or stock_item.franchise_id != franchise.franchise_id:
        return jsonify({"error": "Stock item not found or unauthorized."}), HTTPStatus.FORBIDDEN

    ingredients = (
        ProductIngredient.query.options(joinedload(ProductIngredient.product))
        .filter_by(stock_item_id=stock_item_id)
        .all()
    )

    payload = [
        {
            "product_id": ingredient.product_id,
            "product_name": ingredient.product.name,
            "quantity_required": float(ingredient.quantity_required) if ingredient.quantity_required is not None else 0.0
        }
        for ingredient in ingredients
    ]

    return jsonify(payload), HTTPStatus.OK
