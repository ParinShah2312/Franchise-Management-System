"""Database models for the Franchise Management System backend."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import BigInteger, Boolean, Date, DateTime, Numeric, String, Text

from .extensions import db


class TimestampMixin:
    """Reusable timestamp columns."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


# ----------------------------------------------------------------------
# 1. Reference Tables
# ----------------------------------------------------------------------

class ApplicationStatus(db.Model):
    __tablename__ = "application_statuses"
    status_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    status_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    franchise_applications: Mapped[list["FranchiseApplication"]] = relationship(
        "FranchiseApplication", back_populates="status"
    )


class BranchStatus(db.Model):
    __tablename__ = "branch_statuses"
    status_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    status_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    branches: Mapped[list["Branch"]] = relationship("Branch", back_populates="status")


class TransactionType(db.Model):
    __tablename__ = "transaction_types"
    transaction_type_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    type_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(
        "InventoryTransaction", back_populates="transaction_type"
    )


class RequestStatus(db.Model):
    __tablename__ = "request_statuses"
    request_status_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    status_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    stock_purchase_requests: Mapped[list["StockPurchaseRequest"]] = relationship(
        "StockPurchaseRequest", back_populates="status"
    )


class SaleStatus(db.Model):
    __tablename__ = "sale_statuses"
    sale_status_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    status_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="status")


class Unit(db.Model):
    __tablename__ = "units"
    unit_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    unit_name: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    stock_items: Mapped[list["StockItem"]] = relationship("StockItem", back_populates="unit")


# ----------------------------------------------------------------------
# 2. Core Hierarchy
# ----------------------------------------------------------------------

class Franchisor(TimestampMixin, db.Model):
    __tablename__ = "franchisors"
    franchisor_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    franchises: Mapped[list["Franchise"]] = relationship(
        "Franchise", back_populates="franchisor", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="franchisor")
    franchise_applications_decided: Mapped[list["FranchiseApplication"]] = relationship(
        "FranchiseApplication",
        back_populates="decision_by_franchisor",
        foreign_keys="FranchiseApplication.decision_by_franchisor_id",
    )


class Franchise(TimestampMixin, db.Model):
    __tablename__ = "franchises"
    franchise_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    franchisor_id: Mapped[int] = mapped_column(
        ForeignKey("franchisors.franchisor_id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    # ❌ REMOVED STATUS (Not in PDF Schema)

    franchisor: Mapped["Franchisor"] = relationship("Franchisor", back_populates="franchises")
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


class Address(db.Model):
    __tablename__ = "addresses"
    address_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    address_line: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)

    branches: Mapped[list["Branch"]] = relationship("Branch", back_populates="address")


class Branch(TimestampMixin, db.Model):
    __tablename__ = "branches"
    branch_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
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

    franchise: Mapped["Franchise"] = relationship("Franchise", back_populates="branches")
    address: Mapped[Optional["Address"]] = relationship("Address", back_populates="branches")
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
    status: Mapped["BranchStatus"] = relationship("BranchStatus", back_populates="branches")
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


# ----------------------------------------------------------------------
# 3. Users & Roles
# ----------------------------------------------------------------------

class User(TimestampMixin, db.Model):
    __tablename__ = "users"
    user_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
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
    approved_inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(
        "InventoryTransaction",
        foreign_keys="InventoryTransaction.approved_by_user_id",
        back_populates="approved_by_user",
    )
    stock_purchase_requests_requested: Mapped[list["StockPurchaseRequest"]] = relationship(
        "StockPurchaseRequest",
        foreign_keys="StockPurchaseRequest.requested_by_user_id",
        back_populates="requested_by_user",
    )
    stock_purchase_requests_approved: Mapped[list["StockPurchaseRequest"]] = relationship(
        "StockPurchaseRequest",
        foreign_keys="StockPurchaseRequest.approved_by_user_id",
        back_populates="approved_by_user",
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


class Role(db.Model):
    __tablename__ = "roles"
    role_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
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
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    branch: Mapped["Branch"] = relationship("Branch", back_populates="staff_assignments")
    user: Mapped["User"] = relationship("User", back_populates="branch_staff_assignments")


# ----------------------------------------------------------------------
# 4. Catalog & Inventory
# ----------------------------------------------------------------------

class ProductCategory(db.Model):
    __tablename__ = "product_categories"
    category_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    franchise: Mapped["Franchise"] = relationship("Franchise", back_populates="product_categories")
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="category", cascade="all, delete-orphan"
    )


class Product(TimestampMixin, db.Model):
    __tablename__ = "products"
    product_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
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

    franchise: Mapped["Franchise"] = relationship("Franchise", back_populates="products")
    category: Mapped["ProductCategory"] = relationship("ProductCategory", back_populates="products")
    sale_items: Mapped[list["SaleItem"]] = relationship("SaleItem", back_populates="product")


class StockItem(TimestampMixin, db.Model):
    __tablename__ = "stock_items"
    stock_item_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    unit_id: Mapped[int] = mapped_column(
        ForeignKey("units.unit_id"), nullable=False
    )

    franchise: Mapped["Franchise"] = relationship("Franchise", back_populates="stock_items")
    unit: Mapped["Unit"] = relationship("Unit", back_populates="stock_items")
    branch_inventories: Mapped[list["BranchInventory"]] = relationship(
        "BranchInventory", back_populates="stock_item", cascade="all, delete-orphan"
    )
    inventory_transactions: Mapped[list["InventoryTransaction"]] = relationship(
        "InventoryTransaction", back_populates="stock_item", cascade="all, delete-orphan"
    )
    purchase_request_items: Mapped[list["StockPurchaseRequestItem"]] = relationship(
        "StockPurchaseRequestItem", back_populates="stock_item", cascade="all, delete-orphan"
    )


class BranchInventory(TimestampMixin, db.Model):
    __tablename__ = "branch_inventories"
    branch_inventory_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
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

    branch: Mapped["Branch"] = relationship("Branch", back_populates="branch_inventories")
    stock_item: Mapped["StockItem"] = relationship("StockItem", back_populates="branch_inventories")


# ----------------------------------------------------------------------
# 5. Operations
# ----------------------------------------------------------------------

class Sale(TimestampMixin, db.Model):
    __tablename__ = "sales"
    sale_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.branch_id", ondelete="CASCADE"), nullable=False
    )
    sold_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    sale_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status_id: Mapped[int] = mapped_column(
        ForeignKey("sale_statuses.sale_status_id"), nullable=False
    )

    branch: Mapped["Branch"] = relationship("Branch", back_populates="sales")
    sold_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="sales", foreign_keys=[sold_by_user_id]
    )
    status: Mapped["SaleStatus"] = relationship("SaleStatus", back_populates="sales")
    items: Mapped[list["SaleItem"]] = relationship(
        "SaleItem", back_populates="sale", cascade="all, delete-orphan"
    )


class SaleItem(db.Model):
    __tablename__ = "sale_items"
    sale_item_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
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
    transaction_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    branch_id: Mapped[int] = mapped_column(
        ForeignKey("branches.branch_id", ondelete="CASCADE"), nullable=False
    )
    stock_item_id: Mapped[int] = mapped_column(
        ForeignKey("stock_items.stock_item_id", ondelete="CASCADE"), nullable=False
    )
    transaction_type_id: Mapped[int] = mapped_column(
        ForeignKey("transaction_types.transaction_type_id"), nullable=False
    )
    quantity_change: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    related_sale_item_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("sale_items.sale_item_id"))
    created_by_user_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.user_id"))
    approved_by_user_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.user_id"))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    branch: Mapped["Branch"] = relationship("Branch", back_populates="inventory_transactions")
    stock_item: Mapped["StockItem"] = relationship("StockItem", back_populates="inventory_transactions")
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
    request_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
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
        ForeignKey("request_statuses.request_status_id"), nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime)

    branch: Mapped["Branch"] = relationship("Branch", back_populates="stock_purchase_requests")
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
    status: Mapped["RequestStatus"] = relationship("RequestStatus", back_populates="stock_purchase_requests")
    items: Mapped[list["StockPurchaseRequestItem"]] = relationship(
        "StockPurchaseRequestItem", back_populates="request", cascade="all, delete-orphan"
    )


class StockPurchaseRequestItem(db.Model):
    __tablename__ = "stock_purchase_request_items"
    request_item_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
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


class FranchiseApplication(TimestampMixin, db.Model):
    __tablename__ = "franchise_applications"
    application_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    franchise_id: Mapped[int] = mapped_column(
        ForeignKey("franchises.franchise_id", ondelete="CASCADE"), nullable=False
    )
    branch_owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    proposed_location: Mapped[str] = mapped_column(String(255), nullable=False)
    business_experience: Mapped[str | None] = mapped_column(Text)
    reason: Mapped[str | None] = mapped_column(Text)
    investment_capacity: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    status_id: Mapped[int] = mapped_column(
        ForeignKey("application_statuses.status_id"), nullable=False
    )
    decision_by_franchisor_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("franchisors.franchisor_id"))
    decision_notes: Mapped[str | None] = mapped_column(Text)
    document_path: Mapped[str | None] = mapped_column(String(255))

    franchise: Mapped["Franchise"] = relationship(
        "Franchise", back_populates="franchise_applications"
    )
    branch_owner_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[branch_owner_user_id],
        back_populates="franchise_applications",
    )
    status: Mapped["ApplicationStatus"] = relationship(
        "ApplicationStatus", back_populates="franchise_applications"
    )
    decision_by_franchisor: Mapped[Optional["Franchisor"]] = relationship(
        "Franchisor", back_populates="franchise_applications_decided"
    )


class Report(db.Model):
    __tablename__ = "reports"
    report_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    generated_by_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    franchisor_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("franchisors.franchisor_id"), nullable=False)
    branch_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("branches.branch_id"))
    report_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'MASTER', 'BRANCH'
    period_start: Mapped[Date] = mapped_column(Date, nullable=False)
    period_end: Mapped[Date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    generated_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="reports", foreign_keys=[generated_by_user_id]
    )
    franchisor: Mapped[Optional["Franchisor"]] = relationship(
        "Franchisor", back_populates="reports"
    )
    branch: Mapped[Optional["Branch"]] = relationship("Branch", back_populates="reports")
    data_entries: Mapped[list["ReportData"]] = relationship(
        "ReportData", back_populates="report", cascade="all, delete-orphan"
    )


class ReportData(db.Model):
    __tablename__ = "report_data"
    report_data_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    report_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("reports.report_id"), nullable=False)
    data_key: Mapped[str] = mapped_column(String(100), nullable=False)
    data_value: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    report: Mapped["Report"] = relationship("Report", back_populates="data_entries")


__all__ = [
    "TimestampMixin",
    "ApplicationStatus",
    "BranchStatus",
    "TransactionType",
    "RequestStatus",
    "SaleStatus",
    "Unit",
    "Franchisor",
    "Franchise",
    "Address",
    "Branch",
    "User",
    "Role",
    "UserRole",
    "BranchStaff",
    "ProductCategory",
    "Product",
    "StockItem",
    "BranchInventory",
    "Sale",
    "SaleItem",
    "InventoryTransaction",
    "StockPurchaseRequest",
    "StockPurchaseRequestItem",
    "FranchiseApplication",
    "Report",
    "ReportData",
]