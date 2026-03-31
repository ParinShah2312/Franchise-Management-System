"""Core hierarchy models — Franchisor, Franchise, Address, Branch."""

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


class TimestampMixin:
    """Reusable timestamp columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Franchisor(TimestampMixin, db.Model):
    __tablename__ = "franchisors"
    franchisor_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    franchises: Mapped[list["Franchise"]] = relationship(
        "Franchise", back_populates="franchisor", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report", back_populates="franchisor"
    )
    franchise_applications_decided: Mapped[list["FranchiseApplication"]] = relationship(
        "FranchiseApplication",
        back_populates="decision_by_franchisor",
        foreign_keys="FranchiseApplication.decision_by_franchisor_id",
    )


class Franchise(TimestampMixin, db.Model):
    __tablename__ = "franchises"
    franchise_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    franchisor_id: Mapped[int] = mapped_column(
        ForeignKey("franchisors.franchisor_id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    menu_file_path: Mapped[str | None] = mapped_column(String(255))

    franchisor: Mapped["Franchisor"] = relationship(
        "Franchisor", back_populates="franchises"
    )
    branches: Mapped[list["Branch"]] = relationship(
        "Branch", back_populates="franchise", cascade="all, delete-orphan"
    )
    product_categories: Mapped[list["ProductCategory"]] = relationship(
        "ProductCategory", back_populates="franchise", cascade="all, delete-orphan"
    )
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="franchise", cascade="all, delete-orphan"
    )
    stock_items: Mapped[list["StockItem"]] = relationship(
        "StockItem", back_populates="franchise", cascade="all, delete-orphan"
    )
    franchise_applications: Mapped[list["FranchiseApplication"]] = relationship(
        "FranchiseApplication", back_populates="franchise", cascade="all, delete-orphan"
    )
    royalty_configs: Mapped[list["RoyaltyConfig"]] = relationship(
        "RoyaltyConfig", back_populates="franchise", cascade="all, delete-orphan"
    )


class Address(db.Model):
    __tablename__ = "addresses"
    address_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    address_line: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)

    branches: Mapped[list["Branch"]] = relationship("Branch", back_populates="address")


class Branch(TimestampMixin, db.Model):
    __tablename__ = "branches"
    branch_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(100), nullable=False)
    address_id: Mapped[int | None] = mapped_column(
        ForeignKey("addresses.address_id", ondelete="SET NULL"), nullable=True
    )
    branch_owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    manager_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    status_id: Mapped[int] = mapped_column(
        ForeignKey("branch_statuses.status_id"), nullable=False
    )

    franchise: Mapped["Franchise"] = relationship(
        "Franchise", back_populates="branches"
    )
    address: Mapped[Optional["Address"]] = relationship(
        "Address", back_populates="branches"
    )
    branch_owner: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[branch_owner_user_id],
        back_populates="owned_branches",
    )
    manager: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[manager_user_id],
        back_populates="managed_branches",
    )
    status: Mapped["BranchStatus"] = relationship(
        "BranchStatus", back_populates="branches"
    )
    staff_assignments: Mapped[list["BranchStaff"]] = relationship(
        "BranchStaff", back_populates="branch", cascade="all, delete-orphan"
    )
    branch_inventories: Mapped[list["BranchInventory"]] = relationship(
        "BranchInventory", back_populates="branch", cascade="all, delete-orphan"
    )
    sales: Mapped[list["Sale"]] = relationship(
        "Sale", back_populates="branch", cascade="all, delete-orphan"
    )
    stock_purchase_requests: Mapped[list["StockPurchaseRequest"]] = relationship(
        "StockPurchaseRequest", back_populates="branch", cascade="all, delete-orphan"
    )
    inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(
        "InventoryTransaction", back_populates="branch", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="branch")
