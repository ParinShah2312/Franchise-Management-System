"""
Inventory business logic service.

Handles all inventory transaction creation and stock deduction operations.
All functions in this module must be called within an active Flask
application context and database session. Callers are responsible for
committing or rolling back the session.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from ..extensions import db
from ..models import (
    BranchInventory,
    InventoryTransaction,
    Product,
    ProductIngredient,
    SaleItem,
    TransactionType,
)
from ..utils.db_helpers import get_or_create_inventory


class InsufficientStockError(Exception):
    """
    Raised when a sale cannot be completed due to insufficient
    raw material stock for one or more ingredients.

    Attributes:
        stock_item_name: Human-readable name of the item that is short
        required: How much was needed
        available: How much is actually in stock
    """
    def __init__(
        self,
        stock_item_name: str,
        required: Decimal,
        available: Decimal,
    ) -> None:
        self.stock_item_name = stock_item_name
        self.required = required
        self.available = available
        super().__init__(
            f"Insufficient stock for {stock_item_name}. "
            f"Required: {required}, Available: {available}"
        )


def apply_inventory_transaction(
    *,
    branch_id: int,
    stock_item_id: int,
    quantity_delta: Decimal,
    transaction_type_id: int,
    created_by_user_id: Optional[int] = None,
    approved_by_user_id: Optional[int] = None,
    related_sale_item_id: Optional[int] = None,
    unit_cost: Optional[Decimal] = None,
    note: Optional[str] = None,
) -> tuple[InventoryTransaction, BranchInventory]:
    """
    Apply a quantity change to a branch inventory record and create
    a corresponding InventoryTransaction audit record.

    Updates the BranchInventory quantity in place.
    Flushes both the inventory record and transaction to the session.
    Does NOT commit — the caller must commit.

    Args:
        branch_id: The branch whose inventory is being updated
        stock_item_id: The stock item being updated
        quantity_delta: Amount to add (positive) or subtract (negative)
        transaction_type_id: FK to TransactionType (IN=1, OUT=2, ADJUSTMENT=3)
        created_by_user_id: User who initiated the transaction
        approved_by_user_id: User who approved (for purchase requests)
        related_sale_item_id: FK to SaleItem if triggered by a sale
        unit_cost: Cost per unit if known (for purchase transactions)
        note: Optional human-readable note for the audit log

    Returns:
        Tuple of (InventoryTransaction, BranchInventory)
    """
    inventory_record = get_or_create_inventory(branch_id, stock_item_id)
    inventory_record.quantity = inventory_record.quantity + quantity_delta

    transaction = InventoryTransaction(
        branch_id=branch_id,
        stock_item_id=stock_item_id,
        transaction_type_id=transaction_type_id,
        quantity_change=quantity_delta,
        unit_cost=unit_cost,
        related_sale_item_id=related_sale_item_id,
        created_by_user_id=created_by_user_id,
        approved_by_user_id=approved_by_user_id,
        note=note,
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(transaction)
    db.session.flush()

    return transaction, inventory_record


def get_transaction_type_id(type_name: str) -> int:
    """
    Look up the transaction_type_id for the given type name.
    Raises LookupError if the type is not configured in the database.

    Args:
        type_name: One of "IN", "OUT", "ADJUSTMENT"

    Returns:
        The integer transaction_type_id
    """
    transaction_type = TransactionType.query.filter_by(
        type_name=type_name
    ).first()
    if not transaction_type:
        raise LookupError(
            f"Transaction type '{type_name}' is not configured in the database."
        )
    return transaction_type.transaction_type_id


def deduct_ingredients_for_sale(
    *,
    branch_id: int,
    sale_items: list[tuple[SaleItem, Product, int]],
    transaction_type_out_id: int,
    created_by_user_id: Optional[int] = None,
    sale_id: Optional[int] = None,
) -> None:
    """
    Deduct raw material ingredients from branch inventory for a completed sale.

    For each sale item, looks up the product's ingredient recipe via
    ProductIngredient records. For each ingredient, calculates the total
    quantity required (quantity_sold * quantity_per_unit) and deducts it
    from BranchInventory.

    If any ingredient has insufficient stock, raises InsufficientStockError
    BEFORE making any changes. This ensures the check is atomic — either
    all ingredients can be deducted or none are.

    Args:
        branch_id: The branch where the sale occurred
        sale_items: List of (SaleItem, Product, quantity_sold) tuples
        transaction_type_out_id: FK to TransactionType for OUT transactions
        created_by_user_id: User who logged the sale
        sale_id: The sale ID for note generation

    Raises:
        InsufficientStockError: If any required ingredient is below needed qty
    """
    # Build the full deduction plan first — check all before touching anything
    deductions: list[dict] = []

    for sale_item, product, quantity_sold in sale_items:
        ingredients = ProductIngredient.query.filter_by(
            product_id=product.product_id
        ).all()

        if not ingredients:
            continue

        for ingredient in ingredients:
            total_required = Decimal(quantity_sold) * ingredient.quantity_required

            inventory_record = BranchInventory.query.filter_by(
                branch_id=branch_id,
                stock_item_id=ingredient.stock_item_id,
            ).first()

            stock_name = (
                ingredient.stock_item.name
                if ingredient.stock_item
                else f"Stock Item {ingredient.stock_item_id}"
            )

            available = inventory_record.quantity if inventory_record else Decimal("0")

            if not inventory_record or available < total_required:
                raise InsufficientStockError(
                    stock_item_name=stock_name,
                    required=total_required,
                    available=available,
                )

            deductions.append({
                "stock_item_id": ingredient.stock_item_id,
                "stock_name": stock_name,
                "total_required": total_required,
                "sale_item_id": sale_item.sale_item_id,
            })

    # All checks passed — now apply all deductions
    for deduction in deductions:
        apply_inventory_transaction(
            branch_id=branch_id,
            stock_item_id=deduction["stock_item_id"],
            quantity_delta=-deduction["total_required"],
            transaction_type_id=transaction_type_out_id,
            created_by_user_id=created_by_user_id,
            related_sale_item_id=deduction["sale_item_id"],
            note=f"Sale #{sale_id}" if sale_id else "Sale deduction",
        )
