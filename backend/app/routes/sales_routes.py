"""Sales management routes for branch-level transactions."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from http import HTTPStatus

from flask import Blueprint, jsonify, request, g
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import (
    Branch,
    BranchInventory,
    InventoryTransaction,
    Product,
    Sale,
    SaleItem,
    SaleStatus,
    StockItem,
    TransactionType,
)
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

    if role.role.name == "SYSTEM_ADMIN":
        if branch_id is None:
            return jsonify({"error": "branch_id is required for this operation."}), HTTPStatus.BAD_REQUEST
        return branch_id

    if role.scope_type == "BRANCH":
        return role.scope_id

    if role.scope_type == "FRANCHISE":
        if branch_id is None:
            return jsonify({"error": "branch_id is required for this operation."}), HTTPStatus.BAD_REQUEST
        branch = Branch.query.get(branch_id)
        if not branch or branch.franchise_id != role.scope_id:
            return jsonify({"error": "Branch not accessible for this franchise scope."}), HTTPStatus.FORBIDDEN
        return branch.branch_id

    return jsonify({"error": "Role scope is not branch aware."}), HTTPStatus.FORBIDDEN


def _parse_datetime(value: object) -> datetime:
    if value is None:
        return datetime.utcnow()
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
        return jsonify({"error": "Sale status 'PAID' is not configured."}), HTTPStatus.INTERNAL_SERVER_ERROR
    return status.sale_status_id


def _get_transaction_type_id(code: str) -> int | tuple[dict[str, object], int]:
    transaction_type = TransactionType.query.filter_by(code=code).first()
    if not transaction_type:
        return (
            jsonify({"error": f"Transaction type '{code}' is not configured."}),
            HTTPStatus.INTERNAL_SERVER_ERROR,
        )
    return transaction_type.transaction_type_id


def _maybe_deduct_inventory(
    *,
    branch: Branch,
    sale_item: SaleItem,
    quantity: int,
    transaction_type_id: int,
) -> None:
    product = sale_item.product
    if not product:
        return

    stock_item = (
        StockItem.query.filter_by(franchise_id=branch.franchise_id, name=product.name).first()
    )
    if not stock_item:
        return

    inventory_record = BranchInventory.query.filter_by(
        branch_id=branch.branch_id, stock_item_id=stock_item.stock_item_id
    ).first()
    if not inventory_record:
        inventory_record = BranchInventory(
            branch_id=branch.branch_id,
            stock_item_id=stock_item.stock_item_id,
            quantity=Decimal("0"),
        )
        db.session.add(inventory_record)
        db.session.flush()

    quantity_decimal = Decimal(quantity)
    inventory_record.quantity = inventory_record.quantity - quantity_decimal

    current_user = getattr(g, "current_user", None)
    db.session.add(
        InventoryTransaction(
            branch_id=branch.branch_id,
            stock_item_id=stock_item.stock_item_id,
            transaction_type_id=transaction_type_id,
            quantity_change=quantity_decimal * Decimal("-1"),
            related_sale_item_id=sale_item.sale_item_id,
            created_by_user_id=current_user.user_id if current_user else None,
            created_at=datetime.utcnow(),
            note=f"Auto deduction for sale {sale_item.sale_id}",
        )
    )


@sales_bp.route("", methods=["POST"])
@token_required({"BRANCH_OWNER", "MANAGER", "STAFF"})
def create_sale() -> tuple[dict[str, object], int]:
    payload = request.get_json(silent=True) or {}

    branch_id_param = request.args.get("branch_id", type=int) or payload.get("branch_id")
    if branch_id_param is not None:
        try:
            branch_id_param = int(branch_id_param)
        except (TypeError, ValueError):
            return jsonify({"error": "branch_id must be numeric."}), HTTPStatus.BAD_REQUEST

    branch_id_result = _ensure_branch_scope(branch_id_param)
    if isinstance(branch_id_result, tuple):
        return branch_id_result

    branch = Branch.query.options(joinedload(Branch.franchise)).get(branch_id_result)
    if not branch:
        return jsonify({"error": "Branch not found."}), HTTPStatus.NOT_FOUND

    try:
        sale_datetime = _parse_datetime(payload.get("sale_date"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), HTTPStatus.BAD_REQUEST

    items_payload = payload.get("sale_items") or payload.get("items") or []
    if not isinstance(items_payload, list) or not items_payload:
        return jsonify({"error": "sale_items must be a non-empty list."}), HTTPStatus.BAD_REQUEST

    status_id = _sale_status_paid_id()
    if isinstance(status_id, tuple):
        return status_id

    current_user = getattr(g, "current_user", None)

    sale = Sale(
        branch_id=branch.branch_id,
        sale_datetime=sale_datetime,
        total_amount=Decimal("0"),
        status_id=status_id,
        sold_by_user_id=current_user.user_id if current_user else None,
    )
    db.session.add(sale)
    db.session.flush()

    out_transaction_type_id = _get_transaction_type_id("OUT")
    if isinstance(out_transaction_type_id, tuple):
        return out_transaction_type_id

    running_total = Decimal("0")
    sale_item_records: list[tuple[SaleItem, Product, int]] = []

    for entry in items_payload:
        product_id = entry.get("product_id")
        quantity_raw = entry.get("quantity")

        if product_id is None:
            return jsonify({"error": "Each item requires a product_id."}), HTTPStatus.BAD_REQUEST

        product = Product.query.get(product_id)
        if not product or product.franchise_id != branch.franchise_id:
            return jsonify({"error": f"Product {product_id} is not available for this branch."}), HTTPStatus.BAD_REQUEST

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

    sale.total_amount = running_total

    for sale_item, _, quantity in sale_item_records:
        _maybe_deduct_inventory(
            branch=branch,
            sale_item=sale_item,
            quantity=quantity,
            transaction_type_id=out_transaction_type_id,
        )

    db.session.commit()

    sale = Sale.query.options(joinedload(Sale.items).joinedload(SaleItem.product)).get(sale.sale_id)
    return jsonify(_serialize_sale(sale)), HTTPStatus.CREATED


@sales_bp.route("", methods=["GET"])
@token_required({"SYSTEM_ADMIN", "BRANCH_OWNER", "MANAGER", "STAFF"})
def list_sales() -> tuple[list[dict[str, object]], int]:
    branch_id_param = request.args.get("branch_id", type=int)
    if branch_id_param is not None:
        try:
            branch_id_param = int(branch_id_param)
        except (TypeError, ValueError):
            return jsonify({"error": "branch_id must be numeric."}), HTTPStatus.BAD_REQUEST

    role = getattr(g, "current_role", None)
    if not role:
        return jsonify({"error": "No role scope attached to request."}), HTTPStatus.FORBIDDEN

    query = Sale.query.options(joinedload(Sale.items).joinedload(SaleItem.product)).order_by(Sale.sale_datetime.desc())

    if role.role.name == "SYSTEM_ADMIN":
        if branch_id_param:
            query = query.filter(Sale.branch_id == branch_id_param)
    else:
        branch_result = _ensure_branch_scope(branch_id_param)
        if isinstance(branch_result, tuple):
            return branch_result
        query = query.filter(Sale.branch_id == branch_result)

    records = query.all()
    return jsonify([_serialize_sale(record) for record in records]), HTTPStatus.OK
