"""Database models for the Franchise Management System backend."""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .extensions import db


class TimestampMixin:
    """Reusable timestamp columns."""

    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class UserRole(enum.Enum):
    """Supported application roles."""

    ADMIN = "admin"
    FRANCHISEE = "franchisee"
    STAFF = "staff"


class FranchiseStatus(enum.Enum):
    """Lifecycle states for a franchise."""

    ACTIVE = "active"
    PENDING = "pending"
    REJECTED = "rejected"


class User(TimestampMixin, db.Model):
    """Represents an authenticated user within the system."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(db.String(255), unique=True, nullable=False)
    # ✅ ADDED THIS FIELD
    full_name: Mapped[str] = mapped_column(db.String(100), nullable=False, default="Unknown")
    password_hash: Mapped[str] = mapped_column(db.String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(db.Enum(UserRole, name="user_role"), nullable=False)
    franchise_id: Mapped[int | None] = mapped_column(
        db.ForeignKey("franchises.id", ondelete="SET NULL"),
        nullable=True,
    )

    franchise: Mapped["Franchise | None"] = relationship(
        "Franchise",
        back_populates="users",
        foreign_keys=[franchise_id],
    )
    owned_franchises: Mapped[list["Franchise"]] = relationship(
        "Franchise",
        back_populates="owner",
        foreign_keys="Franchise.owner_id",
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    sales_entries: Mapped[list["Sales"]] = relationship(
        "Sales",
        back_populates="entered_by_user",
        foreign_keys="Sales.entered_by",
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<User {self.email} ({self.role.value})>"


class Franchise(TimestampMixin, db.Model):
    """Captures franchise registration and operational details."""

    __tablename__ = "franchises"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    location: Mapped[str] = mapped_column(db.String(255), nullable=False)
    owner_name: Mapped[str | None] = mapped_column(db.String(255))
    phone: Mapped[str | None] = mapped_column(db.String(20))
    property_size: Mapped[str | None] = mapped_column(db.String(100))
    investment_capacity: Mapped[str | None] = mapped_column(db.String(100))
    business_experience: Mapped[str | None] = mapped_column(db.Text)
    reason_for_franchise: Mapped[str | None] = mapped_column(db.Text)
    expected_opening_date: Mapped[datetime | None] = mapped_column(db.Date)
    application_file: Mapped[str | None] = mapped_column(db.String(255), nullable=True)
    status: Mapped[FranchiseStatus] = mapped_column(
        db.Enum(FranchiseStatus, name="franchise_status"),
        nullable=False,
        default=FranchiseStatus.PENDING,
    )
    owner_id: Mapped[int | None] = mapped_column(
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    owner: Mapped[User | None] = relationship(
        "User",
        back_populates="owned_franchises",
        foreign_keys=[owner_id],
    )
    users: Mapped[list[User]] = relationship(
        "User",
        back_populates="franchise",
        foreign_keys=[User.franchise_id],
    )
    staff_members: Mapped[list["Staff"]] = relationship(
        "Staff",
        back_populates="franchise",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    sales: Mapped[list["Sales"]] = relationship(
        "Sales",
        back_populates="franchise",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    inventory_items: Mapped[list["Inventory"]] = relationship(
        "Inventory",
        back_populates="franchise",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    expenses: Mapped[list["Expense"]] = relationship(
        "Expense",
        back_populates="franchise",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report",
        back_populates="franchise",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Franchise {self.name} ({self.status.value})>"


class Staff(TimestampMixin, db.Model):
    """Staff members employed at a franchise."""

    __tablename__ = "staff"

    id: Mapped[int] = mapped_column(primary_key=True)
    franchise_id: Mapped[int] = mapped_column(
        db.ForeignKey("franchises.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    position: Mapped[str | None] = mapped_column(db.String(100))
    salary: Mapped[float | None] = mapped_column(db.Numeric(10, 2))
    join_date: Mapped[datetime | None] = mapped_column(db.Date)
    email: Mapped[str | None] = mapped_column(db.String(255))
    contact: Mapped[str | None] = mapped_column(db.String(50))

    franchise: Mapped[Franchise] = relationship("Franchise", back_populates="staff_members")

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Staff {self.name} ({self.position})>"


class Sales(TimestampMixin, db.Model):
    """Sales entries recorded for a franchise."""

    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True)
    franchise_id: Mapped[int] = mapped_column(
        db.ForeignKey("franchises.id", ondelete="CASCADE"),
        nullable=False,
    )
    entered_by: Mapped[int | None] = mapped_column(
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    sale_date: Mapped[datetime] = mapped_column(db.Date, nullable=False)
    total_amount: Mapped[float] = mapped_column(db.Numeric(10, 2), nullable=False)
    payment_mode: Mapped[str | None] = mapped_column(db.String(50))

    franchise: Mapped[Franchise] = relationship("Franchise", back_populates="sales")
    entered_by_user: Mapped[User | None] = relationship("User", back_populates="sales_entries")

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Sales {self.sale_date} - {self.total_amount}>"


class Inventory(TimestampMixin, db.Model):
    """Inventory items maintained by a franchise."""

    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(primary_key=True)
    franchise_id: Mapped[int] = mapped_column(
        db.ForeignKey("franchises.id", ondelete="CASCADE"),
        nullable=False,
    )
    item_name: Mapped[str] = mapped_column(db.String(255), nullable=False)
    category: Mapped[str | None] = mapped_column(db.String(100))
    quantity: Mapped[int] = mapped_column(db.Integer, nullable=False, default=0)
    reorder_level: Mapped[int | None] = mapped_column(db.Integer)
    unit_price: Mapped[float | None] = mapped_column(db.Numeric(10, 2))

    franchise: Mapped[Franchise] = relationship("Franchise", back_populates="inventory_items")

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Inventory {self.item_name} (qty={self.quantity})>"


class Expense(TimestampMixin, db.Model):
    """Expense records tracked per franchise."""

    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    franchise_id: Mapped[int] = mapped_column(
        db.ForeignKey("franchises.id", ondelete="CASCADE"),
        nullable=False,
    )
    expense_date: Mapped[datetime] = mapped_column(db.Date, nullable=False)
    description: Mapped[str | None] = mapped_column(db.String(255))
    amount: Mapped[float] = mapped_column(db.Numeric(10, 2), nullable=False)
    category: Mapped[str | None] = mapped_column(db.String(100))

    franchise: Mapped[Franchise] = relationship("Franchise", back_populates="expenses")

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Expense {self.expense_date} - {self.amount}>"


class Report(TimestampMixin, db.Model):
    """Monthly financial summaries for franchises."""

    __tablename__ = "reports"
    __table_args__ = (
        UniqueConstraint("franchise_id", "month_year", name="uq_reports_franchise_month"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    franchise_id: Mapped[int] = mapped_column(
        db.ForeignKey("franchises.id", ondelete="CASCADE"),
        nullable=False,
    )
    month_year: Mapped[str] = mapped_column(db.String(7), nullable=False)  # Format: YYYY-MM
    total_sales: Mapped[float] = mapped_column(db.Numeric(12, 2), nullable=False, default=0)
    total_expenses: Mapped[float] = mapped_column(db.Numeric(12, 2), nullable=False, default=0)
    profit_loss: Mapped[float] = mapped_column(db.Numeric(12, 2), nullable=False, default=0)

    franchise: Mapped[Franchise] = relationship("Franchise", back_populates="reports")

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Report {self.month_year} franchise={self.franchise_id}>"


class Notification(TimestampMixin, db.Model):
    """User-facing notifications."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(db.Text, nullable=False)
    type: Mapped[str | None] = mapped_column(db.String(50))
    is_read: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)

    user: Mapped[User] = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:  # pragma: no cover - debugging helper
        return f"<Notification user={self.user_id} read={self.is_read}>"


__all__ = [
    "db",
    "User",
    "Franchise",
    "Staff",
    "Sales",
    "Inventory",
    "Expense",
    "Report",
    "Notification",
    "UserRole",
    "FranchiseStatus",
]