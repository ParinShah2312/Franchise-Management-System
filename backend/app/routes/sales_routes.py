"""Sales management routes for branch-level transactions."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from http import HTTPStatus

from flask import Blueprint, jsonify, request, g, current_app
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    Branch,
    Product,
    Sale,
    SaleItem,
    SaleStatus,
)
from ..services.inventory_service import deduct_ingredients_for_sale, get_transaction_type_id, InsufficientStockError
from ..utils.security import token_required


sales_bp = Blueprint("sales", __name__, url_prefix="/api/sales")


def _current_role():
    role = getattr(g, "current_role", None)
    if not role:
        raise PermissionError("No role scope attached to request.")
    return role


def _ensure_branch_scope(branch_id: int | None) -> int | tuple[dict[str, object], int]:
    try:
        role = _current_role()
    except PermissionError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.FORBIDDEN

    if role.scope_type == "BRANCH":
        return role.scope_id

    if role.scope_type == "FRANCHISE":
        if branch_id is None:
            return jsonify(
                {"error": "branch_id is required for this operation."}
            ), HTTPStatus.BAD_REQUEST
        branch = db.session.get(Branch, branch_id)
        if not branch or branch.franchise_id != role.scope_id:
            return jsonify(
                {"error": "Branch not accessible for this franchise scope."}
            ), HTTPStatus.FORBIDDEN
        return branch.branch_id

    return jsonify({"error": "Role scope is not branch aware."}), HTTPStatus.FORBIDDEN


def _parse_datetime(value: object) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(str(value))
    except (TypeError, ValueError):
        raise ValueError("sale_date must be ISO formatted.")


def _parse_quantity(value: object) -> int:
    try:
        quantity = int(value)
    except (TypeError, ValueError):
        raise ValueError("quantity must be an integer.")
    if quantity <= 0:
        raise ValueError("quantity must be greater than zero.")
    return quantity


def _serialize_sale(sale: Sale) -> dict[str, object]:
    return {
        "sale_id": sale.sale_id,
        "branch_id": sale.branch_id,
        "total_amount": float(sale.total_amount),
        "sale_datetime": sale.sale_datetime.isoformat() if sale.sale_datetime else None,
        "status_id": sale.status_id,
        "payment_mode": sale.payment_mode,
        "items": [
            {
                "sale_item_id": item.sale_item_id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "line_total": float(item.line_total),
            }
            for item in sale.items
        ],
    }


def _sale_status_paid_id() -> int | tuple[dict[str, object], int]:
    status = SaleStatus.query.filter_by(status_name="PAID").first()
    if not status:
        return jsonify(
            {"error": "Sale status 'PAID' is not configured."}
        ), HTTPStatus.INTERNAL_SERVER_ERROR
    return status.sale_status_id




@sales_bp.route("", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def create_sale() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}

    branch_id_param = request.args.get("branch_id", type=int) or payload.get(
        "branch_id"
    )
    if branch_id_param is not None:
        try:
            branch_id_param = int(branch_id_param)
        except (TypeError, ValueError):
            return jsonify(
                {"error": "branch_id must be numeric."}
            ), HTTPStatus.BAD_REQUEST

    branch_id_result = _ensure_branch_scope(branch_id_param)
    if isinstance(branch_id_result, tuple):
        return branch_id_result

    branch = db.session.get(
        Branch, branch_id_result,
        options=[joinedload(Branch.franchise)]
    )
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    try:
        sale_datetime = _parse_datetime(payload.get("sale_date"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    items_payload = payload.get("sale_items") or payload.get("items") or []
    if not isinstance(items_payload, list) or not items_payload:
        return jsonify(
            {"error": "sale_items must be a non-empty list."}
        ), HTTPStatus.BAD_REQUEST

    status_id = _sale_status_paid_id()
    if isinstance(status_id, tuple):
        return status_id

    current_user = getattr(g, "current_user", None)

    sale = Sale(
        branch_id=branch.branch_id,
        sale_datetime=sale_datetime,
        total_amount=Decimal("0"),
        status_id=status_id,
        payment_mode=payload.get("payment_mode", "Cash"),
        sold_by_user_id=current_user.user_id if current_user else None,
    )
    db.session.add(sale)
    db.session.flush()

    running_total = Decimal("0")
    sale_item_records: list[tuple[SaleItem, Product, int]] = []

    for entry in items_payload:
        product_id = entry.get("product_id")
        quantity_raw = entry.get("quantity")

        if product_id is None:
            return jsonify(
                {"error": "Each item requires a product_id."}
            ), HTTPStatus.BAD_REQUEST

        product = db.session.get(Product, product_id)
        if not product or product.franchise_id != branch.franchise_id:
            return jsonify(
                {"error": f"Product {product_id} is not available for this branch."}
            ), HTTPStatus.BAD_REQUEST

        try:
            quantity = _parse_quantity(quantity_raw)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

        unit_price = product.base_price
        line_total = unit_price * quantity
        running_total += line_total

        sale_item = SaleItem(
            sale_id=sale.sale_id,
            product_id=product.product_id,
            quantity=quantity,
            unit_price=unit_price,
            line_total=line_total,
        )
        db.session.add(sale_item)
        db.session.flush()
        sale_item_records.append((sale_item, product, quantity))

    try:
        transaction_type_out_id = get_transaction_type_id("OUT")
    except LookupError as exc:
        db.session.rollback()
        return jsonify({"error": str(exc)}), HTTPStatus.INTERNAL_SERVER_ERROR

    try:
        deduct_ingredients_for_sale(
            branch_id=branch.branch_id,
            sale_items=sale_item_records,
            transaction_type_out_id=transaction_type_out_id,
            created_by_user_id=current_user.user_id if current_user else None,
            sale_id=sale.sale_id,
        )
    except InsufficientStockError as exc:
        db.session.rollback()
        return jsonify({"error": f"Insufficient stock for {exc.stock_item_name}."}), HTTPStatus.BAD_REQUEST

    sale.total_amount = running_total

    db.session.commit()

    # Best-effort royalty recording — sale is already committed at this point
    try:
        from ..services.royalty_service import (
            get_active_royalty_config,
            calculate_royalty_split,
            record_sale_royalty,
        )
        royalty_config = get_active_royalty_config(branch.franchise_id)
        if royalty_config:
            franchisor_amount, branch_owner_amount = calculate_royalty_split(
                sale.total_amount, royalty_config
            )
            record_sale_royalty(
                sale_id=sale.sale_id,
                config=royalty_config,
                franchisor_amount=franchisor_amount,
                branch_owner_amount=branch_owner_amount,
            )
            db.session.commit()
    except Exception as exc:
        current_app.logger.warning(
            "Royalty recording failed for sale %s: %s", sale.sale_id, exc
        )
        db.session.rollback()

    sale = db.session.get(
        Sale, sale.sale_id,
        options=[joinedload(Sale.items).joinedload(SaleItem.product)]
    )
    return jsonify(_serialize_sale(sale)), HTTPStatus.CREATED


@sales_bp.route("", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def list_sales() -> tuple[list[dict[str, object]], int]:
    branch_id_param = request.args.get("branch_id", type=int)
    if branch_id_param is not None:
        try:
            branch_id_param = int(branch_id_param)
        except (TypeError, ValueError):
            return jsonify(
                {"error": "branch_id must be numeric."}
            ), HTTPStatus.BAD_REQUEST

    role = getattr(g, "current_role", None)
    if not role:
        return jsonify(
            {"error": "No role scope attached to request."}
        ), HTTPStatus.FORBIDDEN

    query = Sale.query.options(
        joinedload(Sale.items).joinedload(SaleItem.product)
    ).order_by(Sale.sale_datetime.desc())

    branch_result = _ensure_branch_scope(branch_id_param)
    if isinstance(branch_result, tuple):
        return branch_result
    query = query.filter(Sale.branch_id == branch_result)

    records = query.all()
    return jsonify([_serialize_sale(record) for record in records]), HTTPStatus.OK


@sales_bp.route("/products", methods=["GET"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def list_products() -> tuple[list[dict[str, object]], int]:
    branch_id_param = request.args.get("branch_id", type=int)
    branch_result = _ensure_branch_scope(branch_id_param)
    if isinstance(branch_result, tuple):
        return branch_result

    branch = db.session.get(Branch, branch_result)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    products = (
        Product.query.filter_by(franchise_id=branch.franchise_id, is_active=True)
        .order_by(Product.name.asc())
        .all()
    )

    payload = [
        {
            "id": product.product_id,
            "name": product.name,
            "base_price": float(product.base_price),
        }
        for product in products
    ]

    return jsonify(payload), HTTPStatus.OK
