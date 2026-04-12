"""User management models — User, Role, UserRole, BranchStaff."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import (
    BigInteger, Boolean, DateTime, Integer, Numeric, String, Text,
)

from ..extensions import db
from .core import TimestampMixin

if TYPE_CHECKING:
    from .business import FranchiseApplication, Report
    from .core import Branch
    from .operations import (
        Expense, InventoryTransaction, Sale, StockPurchaseRequest,
    )

class User(TimestampMixin, db.Model):
    __tablename__ = "users"
    user_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    must_reset_password: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    owned_branches: Mapped[list["Branch"]] = relationship(
        "Branch",
        foreign_keys="Branch.branch_owner_user_id",
        back_populates="branch_owner",
    )
    managed_branches: Mapped[list["Branch"]] = relationship(
        "Branch",
        foreign_keys="Branch.manager_user_id",
        back_populates="manager",
    )
    branch_staff_assignments: Mapped[list["BranchStaff"]] = relationship(
        "BranchStaff", back_populates="user", cascade="all, delete-orphan"
    )
    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole", back_populates="user", cascade="all, delete-orphan"
    )
    sales: Mapped[list["Sale"]] = relationship(
        "Sale", back_populates="sold_by_user", foreign_keys="Sale.sold_by_user_id"
    )
    created_inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(
        "InventoryTransaction",
        foreign_keys="InventoryTransaction.created_by_user_id",
        back_populates="created_by_user",
    )
    approved_inventory_transactions: Mapped[list["InventoryTransaction"]] = (
        relationship(
            "InventoryTransaction",
            foreign_keys="InventoryTransaction.approved_by_user_id",
            back_populates="approved_by_user",
        )
    )
    stock_purchase_requests_requested: Mapped[list["StockPurchaseRequest"]] = (
        relationship(
            "StockPurchaseRequest",
            foreign_keys="StockPurchaseRequest.requested_by_user_id",
            back_populates="requested_by_user",
        )
    )
    stock_purchase_requests_approved: Mapped[list["StockPurchaseRequest"]] = (
        relationship(
            "StockPurchaseRequest",
            foreign_keys="StockPurchaseRequest.approved_by_user_id",
            back_populates="approved_by_user",
        )
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report",
        foreign_keys="Report.generated_by_user_id",
        back_populates="generated_by_user",
    )
    franchise_applications: Mapped[list["FranchiseApplication"]] = relationship(
        "FranchiseApplication",
        foreign_keys="FranchiseApplication.branch_owner_user_id",
        back_populates="branch_owner_user",
    )
    expenses_logged: Mapped[list["Expense"]] = relationship(
        "Expense",
        foreign_keys="Expense.logged_by_user_id",
        back_populates="logged_by_user",
    )

class Role(db.Model):
    __tablename__ = "roles"
    role_id: Mapped[int] = mapped_column(
        BigInteger().with_variant(Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    user_roles: Mapped[list["UserRole"]] = relationship(
        "UserRole", back_populates="role", cascade="all, delete-orphan"
    )

class UserRole(db.Model):
    __tablename__ = "user_roles"
    __table_args__ = (
        db.PrimaryKeyConstraint(
            "user_id", "role_id", "scope_type", "scope_id", name="pk_user_roles"
        ),
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.role_id", ondelete="CASCADE"), nullable=False
    )
    scope_type: Mapped[str] = mapped_column(
        db.Enum("FRANCHISE", "BRANCH", name="user_role_scope"), nullable=False
    )
    scope_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="user_roles")
    role: Mapped["Role"] = relationship("Role", back_populates="user_roles")

class BranchStaff(db.Model):
    __tablename__ = "branch_staff"
    __table_args__ = (
        db.PrimaryKeyConstraint("branch_id", "user_id", name="pk_branch_staff"),
    )

    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.branch_id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[str | None] = mapped_column(String(100), nullable=True)
    salary: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    branch: Mapped["Branch"] = relationship(
        "Branch", back_populates="staff_assignments"
    )
    user: Mapped["User"] = relationship(
        "User", back_populates="branch_staff_assignments"
    )
