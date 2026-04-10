"""
Models package for the Relay franchise management system.

This package re-exports all model classes so that existing imports
of the form ``from .models import X`` or ``from ..models import X``
continue to work without modification throughout the codebase.

Domain organization:
    reference.py  -> ApplicationStatus, BranchStatus, TransactionType,
                     RequestStatus, SaleStatus, Unit
    core.py       -> TimestampMixin, Franchisor, Franchise, Address, Branch
    users.py      -> User, Role, UserRole, BranchStaff
    catalog.py    -> ProductCategory, Product, StockItem,
                     ProductIngredient, BranchInventory
    operations.py -> Sale, SaleItem, InventoryTransaction,
                     Expense, StockPurchaseRequest,
                     StockPurchaseRequestItem,
                     RoyaltyConfig, SaleRoyalty, FileBlob
    business.py   -> FranchiseApplication, Report, ReportData
"""

from __future__ import annotations

# Reference tables
from .reference import (
    ApplicationStatus,
    BranchStatus,
    TransactionType,
    RequestStatus,
    SaleStatus,
    Unit,
)

# Core hierarchy
from .core import (
    TimestampMixin,
    Franchisor,
    Franchise,
    Address,
    Branch,
)

# User management
from .users import (
    User,
    Role,
    UserRole,
    BranchStaff,
)

# Catalog and inventory definitions
from .catalog import (
    ProductCategory,
    Product,
    StockItem,
    ProductIngredient,
    BranchInventory,
)

# Operational transactions
from .operations import (
    Sale,
    SaleItem,
    InventoryTransaction,
    StockPurchaseRequest,
    StockPurchaseRequestItem,
    RoyaltyConfig,
    SaleRoyalty,
    Expense,
    FileBlob,
)

# Business processes
from .business import (
    FranchiseApplication,
    Report,
    ReportData,
)

# Explicit __all__ so static analysis tools and wildcard imports
# see the full public surface of this package
__all__ = [
    # Reference
    "ApplicationStatus",
    "BranchStatus",
    "TransactionType",
    "RequestStatus",
    "SaleStatus",
    "Unit",
    # Core
    "TimestampMixin",
    "Franchisor",
    "Franchise",
    "Address",
    "Branch",
    # Users
    "User",
    "Role",
    "UserRole",
    "BranchStaff",
    # Catalog
    "ProductCategory",
    "Product",
    "StockItem",
    "ProductIngredient",
    "BranchInventory",
    # Operations
    "Sale",
    "SaleItem",
    "InventoryTransaction",
    "StockPurchaseRequest",
    "StockPurchaseRequestItem",
    "RoyaltyConfig",
    "SaleRoyalty",
    "Expense",
    "FileBlob",
    # Business
    "FranchiseApplication",
    "Report",
    "ReportData",
]
