"""Catalog and recipe management routes for franchisors."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
from http import HTTPStatus

from flask import Blueprint, jsonify, request, g
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    Franchise,
    Product,
    ProductCategory,
    ProductIngredient,
    StockItem,
)
from ..utils.security import token_required


catalog_bp = Blueprint("catalog", __name__, url_prefix="/api/catalog")


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
        Product.query.options(joinedload(Product.category))
        .filter_by(franchise_id=franchise.franchise_id)
        .order_by(Product.name.asc())
        .all()
    )

    payload = [
        {
            "product_id": p.product_id,
            "name": p.name,
            "base_price": float(p.base_price),
            "category_id": p.category_id,
            "category_name": p.category.name if p.category else None,
            "is_active": p.is_active
        }
        for p in products
    ]

    return jsonify(payload), HTTPStatus.OK


@catalog_bp.route("/products/<int:product_id>/ingredients", methods=["GET"])
@token_required({"FRANCHISOR"})
def get_product_ingredients(product_id: int) -> tuple[list[dict[str, object]], int]:
    franchisor = getattr(g, "current_user", None)
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    product = Product.query.get(product_id)
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
            "quantity_required": float(ingredient.quantity_required)
        }
        for ingredient in ingredients
    ]

    return jsonify(payload), HTTPStatus.OK


@catalog_bp.route("/products/<int:product_id>/ingredients", methods=["POST"])
@token_required({"FRANCHISOR"})
def add_product_ingredient(product_id: int) -> tuple[dict[str, object], int]:
    franchisor = getattr(g, "current_user", None)
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    product = Product.query.get(product_id)
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

    stock_item = StockItem.query.get(stock_item_id)
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
    db.session.commit()

    refreshed_ingredient = ProductIngredient.query.options(
        joinedload(ProductIngredient.stock_item).joinedload(StockItem.unit)
    ).get(ingredient.ingredient_id)

    return jsonify({
        "ingredient_id": refreshed_ingredient.ingredient_id,
        "product_id": refreshed_ingredient.product_id,
        "stock_item_id": refreshed_ingredient.stock_item_id,
        "stock_item_name": refreshed_ingredient.stock_item.name,
        "unit_name": refreshed_ingredient.stock_item.unit.unit_name,
        "quantity_required": float(refreshed_ingredient.quantity_required)
    }), HTTPStatus.CREATED


@catalog_bp.route("/products/<int:product_id>/ingredients/<int:ingredient_id>", methods=["DELETE"])
@token_required({"FRANCHISOR"})
def remove_product_ingredient(product_id: int, ingredient_id: int) -> tuple[dict[str, object], int]:
    franchisor = getattr(g, "current_user", None)
    
    franchise = Franchise.query.filter_by(franchisor_id=franchisor.franchisor_id).first()
    if not franchise:
        return jsonify({"error": "No franchise found."}), HTTPStatus.NOT_FOUND

    product = Product.query.get(product_id)
    if not product or product.franchise_id != franchise.franchise_id:
        return jsonify({"error": "Product not found or unauthorized."}), HTTPStatus.FORBIDDEN

    ingredient = ProductIngredient.query.get(ingredient_id)
    if not ingredient or ingredient.product_id != product_id:
        return jsonify({"error": "Ingredient not found."}), HTTPStatus.NOT_FOUND

    db.session.delete(ingredient)
    db.session.commit()

    return jsonify({"message": "Ingredient removed."}), HTTPStatus.OK
