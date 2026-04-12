"""Operational transaction models — sales, inventory movements, purchase requests."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import (
    BigInteger, Date, DateTime, Integer,
    Numeric, String, Text,
)

from ..extensions import db
from .core import TimestampMixin

if TYPE_CHECKING:
    from .catalog import Product, StockItem
    from .core import Branch, Franchise, Franchisor
    from .reference import RequestStatus, SaleStatus, TransactionType
    from .users import User

class Sale(TimestampMixin, db.Model):
    __tablename__ = "sales"
    sale_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.branch_id", ondelete="CASCADE"), nullable=False
    )
    sold_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    sale_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status_id: Mapped[int] = mapped_column(
        ForeignKey("sale_statuses.sale_status_id", ondelete="RESTRICT"), nullable=False
    )
    payment_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)

    branch: Mapped["Branch"] = relationship("Branch", back_populates="sales")
    sold_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="sales", foreign_keys=[sold_by_user_id]
    )
    status: Mapped["SaleStatus"] = relationship("SaleStatus", back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship(
        "SaleItem", back_populates="sale", cascade="all, delete-orphan"
    )
    royalty: Mapped[Optional["SaleRoyalty"]] = relationship(
        "SaleRoyalty", back_populates="sale", uselist=False
    )

class SaleItem(db.Model):
    __tablename__ = "sale_items"
    sale_item_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.sale_id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(db.Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    sale: Mapped["Sale"] = relationship("Sale", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="sale_items")
    inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(
        "InventoryTransaction", back_populates="related_sale_item"
    )

class InventoryTransaction(db.Model):
    __tablename__ = "inventory_transactions"
    transaction_id: Mapped[int] = mapped_column(
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
    transaction_type_id: Mapped[int] = mapped_column(
        ForeignKey("transaction_types.transaction_type_id", ondelete="RESTRICT"), nullable=False
    )
    quantity_change: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    related_sale_item_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("sale_items.sale_item_id", ondelete="SET NULL")
    )
    created_by_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id", ondelete="SET NULL")
    )
    approved_by_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id", ondelete="SET NULL")
    )
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    branch: Mapped["Branch"] = relationship(
        "Branch", back_populates="inventory_transactions"
    )
    stock_item: Mapped["StockItem"] = relationship(
        "StockItem", back_populates="inventory_transactions"
    )
    transaction_type: Mapped["TransactionType"] = relationship(
        "TransactionType", back_populates="inventory_transactions"
    )
    related_sale_item: Mapped[Optional["SaleItem"]] = relationship(
        "SaleItem", back_populates="inventory_transactions"
    )
    created_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[created_by_user_id],
        back_populates="created_inventory_transactions",
    )
    approved_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[approved_by_user_id],
        back_populates="approved_inventory_transactions",
    )

class StockPurchaseRequest(db.Model):
    __tablename__ = "stock_purchase_requests"
    request_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.branch_id", ondelete="CASCADE"), nullable=False
    )
    requested_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    approved_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    status_id: Mapped[int] = mapped_column(
        ForeignKey("request_statuses.request_status_id", ondelete="RESTRICT"), nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime)

    branch: Mapped["Branch"] = relationship(
        "Branch", back_populates="stock_purchase_requests"
    )
    requested_by_user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[requested_by_user_id],
        back_populates="stock_purchase_requests_requested",
    )
    approved_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[approved_by_user_id],
        back_populates="stock_purchase_requests_approved",
    )
    status: Mapped["RequestStatus"] = relationship(
        "RequestStatus", back_populates="stock_purchase_requests"
    )
    items: Mapped[list["StockPurchaseRequestItem"]] = relationship(
        "StockPurchaseRequestItem",
        back_populates="request",
        cascade="all, delete-orphan",
    )

class StockPurchaseRequestItem(db.Model):
    __tablename__ = "stock_purchase_request_items"
    request_item_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    request_id: Mapped[int] = mapped_column(
        ForeignKey("stock_purchase_requests.request_id", ondelete="CASCADE"),
        nullable=False,
    )
    stock_item_id: Mapped[int] = mapped_column(
        ForeignKey("stock_items.stock_item_id", ondelete="RESTRICT"), nullable=False
    )
    requested_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    estimated_unit_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))

    request: Mapped["StockPurchaseRequest"] = relationship(
        "StockPurchaseRequest", back_populates="items"
    )
    stock_item: Mapped["StockItem"] = relationship(
        "StockItem", back_populates="purchase_request_items"
    )

class RoyaltyConfig(db.Model):
    __tablename__ = "royalty_configs"
    royalty_config_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    franchisor_cut_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )
    branch_owner_cut_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False
    )
    effective_from: Mapped[date] = mapped_column(db.Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    created_by_franchisor_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("franchisors.franchisor_id"), nullable=True
    )

    franchise: Mapped["Franchise"] = relationship(
        "Franchise", back_populates="royalty_configs"
    )
    created_by_franchisor: Mapped[Optional["Franchisor"]] = relationship(
        "Franchisor", foreign_keys=[created_by_franchisor_id]
    )

class SaleRoyalty(db.Model):
    __tablename__ = "sale_royalties"
    sale_royalty_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    sale_id: Mapped[int] = mapped_column(
        ForeignKey("sales.sale_id", ondelete="CASCADE"), nullable=False, unique=True
    )
    royalty_config_id: Mapped[int] = mapped_column(
        ForeignKey("royalty_configs.royalty_config_id", ondelete="RESTRICT"),
        nullable=False,
    )
    franchisor_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    branch_owner_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    sale: Mapped["Sale"] = relationship("Sale", back_populates="royalty")
    royalty_config: Mapped["RoyaltyConfig"] = relationship("RoyaltyConfig")

class Expense(TimestampMixin, db.Model):
    __tablename__ = "expenses"
    expense_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.branch_id", ondelete="CASCADE"), nullable=False
    )
    logged_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    branch: Mapped["Branch"] = relationship("Branch", back_populates="expenses")
    logged_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="expenses_logged", foreign_keys=[logged_by_user_id]
    )

class FileBlob(db.Model):
    __tablename__ = "file_blobs"
    blob_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_data: Mapped[bytes] = mapped_column(db.LargeBinary, nullable=False)
    file_size: Mapped[int] = mapped_column(db.Integer, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
