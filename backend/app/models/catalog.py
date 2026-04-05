"""Catalog and inventory definition models."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import (
    BigInteger, Boolean, DateTime, Integer,
    Numeric, String, Text,
)

from ..extensions import db
from .core import TimestampMixin


class ProductCategory(db.Model):
    __tablename__ = "product_categories"
    category_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    franchise: Mapped["Franchise"] = relationship(
        "Franchise", back_populates="product_categories"
    )
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="category", cascade="all, delete-orphan"
    )


class Product(TimestampMixin, db.Model):
    __tablename__ = "products"
    product_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("product_categories.category_id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    franchise: Mapped["Franchise"] = relationship(
        "Franchise", back_populates="products"
    )
    category: Mapped["ProductCategory"] = relationship(
        "ProductCategory", back_populates="products"
    )
    sale_items: Mapped[list["SaleItem"]] = relationship(
        "SaleItem", back_populates="product"
    )
    ingredients: Mapped[list["ProductIngredient"]] = relationship(
        "ProductIngredient", back_populates="product", cascade="all, delete-orphan"
    )


class StockItem(TimestampMixin, db.Model):
    __tablename__ = "stock_items"
    stock_item_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.unit_id"), nullable=False)

    franchise: Mapped["Franchise"] = relationship(
        "Franchise", back_populates="stock_items"
    )
    unit: Mapped["Unit"] = relationship("Unit", back_populates="stock_items")
    branch_inventories: Mapped[list["BranchInventory"]] = relationship(
        "BranchInventory", back_populates="stock_item", cascade="all, delete-orphan"
    )
    inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(
        "InventoryTransaction",
        back_populates="stock_item",
        cascade="all, delete-orphan",
    )
    purchase_request_items: Mapped[list["StockPurchaseRequestItem"]] = relationship(
        "StockPurchaseRequestItem",
        back_populates="stock_item",
        cascade="all, delete-orphan",
    )
    product_ingredients: Mapped[list["ProductIngredient"]] = relationship(
        "ProductIngredient", back_populates="stock_item", cascade="all, delete-orphan"
    )


class ProductIngredient(TimestampMixin, db.Model):
    __tablename__ = "product_ingredients"

    # NOTE: The schema document names this column 'product_ingredient_id'.
    # We use 'ingredient_id' throughout the codebase for brevity. The
    # column is functionally identical; this is a documented deviation.
    ingredient_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False
    )
    stock_item_id: Mapped[int] = mapped_column(
        ForeignKey("stock_items.stock_item_id", ondelete="CASCADE"), nullable=False
    )
    quantity_required: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="ingredients")
    stock_item: Mapped["StockItem"] = relationship(
        "StockItem", back_populates="product_ingredients"
    )


class BranchInventory(TimestampMixin, db.Model):
    __tablename__ = "branch_inventories"
    branch_inventory_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.branch_id", ondelete="CASCADE"), nullable=False
    )
    stock_item_id: Mapped[int] = mapped_column(
        ForeignKey("stock_items.stock_item_id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(14, 4), nullable=False, default=Decimal("0")
    )
    reorder_level: Mapped[Decimal] = mapped_column(
        Numeric(14, 4), nullable=False, default=Decimal("0")
    )

    branch: Mapped["Branch"] = relationship(
        "Branch", back_populates="branch_inventories"
    )
    stock_item: Mapped["StockItem"] = relationship(
        "StockItem", back_populates="branch_inventories"
    )
