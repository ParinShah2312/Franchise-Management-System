"""Reference tables — lookup values and status codes."""

from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import BigInteger, Integer, String

from ..extensions import db


class ApplicationStatus(db.Model):
    __tablename__ = "application_statuses"
    status_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    status_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    franchise_applications: Mapped[list["FranchiseApplication"]] = relationship(
        "FranchiseApplication", back_populates="status"
    )


class BranchStatus(db.Model):
    __tablename__ = "branch_statuses"
    status_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    status_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    branches: Mapped[list["Branch"]] = relationship("Branch", back_populates="status")


class TransactionType(db.Model):
    __tablename__ = "transaction_types"
    transaction_type_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    type_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(
        "InventoryTransaction", back_populates="transaction_type"
    )


class RequestStatus(db.Model):
    __tablename__ = "request_statuses"
    request_status_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    status_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    stock_purchase_requests: Mapped[list["StockPurchaseRequest"]] = relationship(
        "StockPurchaseRequest", back_populates="status"
    )


class SaleStatus(db.Model):
    __tablename__ = "sale_statuses"
    sale_status_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    status_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="status")


class Unit(db.Model):
    __tablename__ = "units"
    unit_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    unit_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    stock_items: Mapped[list["StockItem"]] = relationship(
        "StockItem", back_populates="unit"
    )
