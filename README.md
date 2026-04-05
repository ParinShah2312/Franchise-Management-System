# 🚀 Relay — Franchise Management System

**A production-ready franchise management platform built with React + Vite + Tailwind CSS on the frontend and Flask + SQLAlchemy + SQLite on the backend. Supports four distinct user roles, end-to-end RBAC enforcement, royalty configuration, financial reporting, product catalog management, inventory tracking, and branch lifecycle management — all in a zero-database-server setup.**

---

## ⚡ Quick Start

👉 **[START_HERE.md](START_HERE.md)** — Complete startup guide from a fresh laptop boot. No database server required.

---

## 🌟 What Is Relay?

Relay is a complete franchise operations ecosystem. It models the full hierarchy from brand owner down to shop-floor staff, enforcing role-based access at every layer:

| Role | Who They Are | What They Can Do |
|---|---|---|
| **Franchisor** | Brand owner | Review applications, manage network, configure royalty, run reports, toggle branch status |
| **Branch Owner** | Franchisee | Manage their branch, appoint manager, view performance, manage staff lifecycle |
| **Manager** | Branch operations lead | Oversee stock, fulfil purchase requests, record deliveries, log sales, manage staff |
| **Staff** | Shop-floor employee | Record sales, view inventory, submit purchase requests, record deliveries |

---

## ✨ Feature Catalogue

### 🔐 Authentication & RBAC

- JWT-based authentication (custom HS256 implementation — no third-party JWT library)
- Two principal types: `Franchisor` (brand account) and `User` (all branch roles)
- `token_required` decorator enforces role allow-lists on every protected endpoint
- Inactive user check enforced at the token layer — deactivated accounts receive `403` immediately
- Password strength validation on all registration and reset flows
- Forced password reset on first login for system-created accounts
- Persistent auth state via `AuthContext` with auto-logout on `401`

### 📋 Franchise Application Workflow

- Public 11-field registration form: property size, investment capacity, prior business experience, location, contact details
- Separate Franchisor registration form for brand owners
- Applications land in `PENDING` state; routed to `PendingDashboard` until reviewed
- Franchisor reviews via modal with full applicant detail
- One-click **Approve** — creates branch, assigns branch owner role automatically
- **Reject with reason** — structured rejection modal (minimum 10-character reason enforced client and server side)
- Application status badges: `PENDING` (yellow), `APPROVED` (green), `REJECTED` (red)

### 🏢 Branch Network Management (Franchisor)

- Network tab shows all branches across all franchises in a sortable table
- Per-branch columns: Branch Name, Franchise, Location, Owner, Manager, Status badge
- **Branch status toggle:** Franchisor can activate or deactivate any branch with a confirmation dialog
  - Status badge turns green (ACTIVE) or gray (INACTIVE)
  - Toggle button flips label: "Deactivate" ↔ "Activate"
  - Backend enforces franchise ownership — cross-franchise toggling returns `403`
- Menu file upload per franchise (PDF/image) with file-size limit

### 📦 Product Catalog (Franchisor)

- **Stock Items:** Define raw ingredients/materials with name, unit, and reorder threshold
- **Product Categories:** Organise menu items into named groups
- **Products:** Create sellable items with name, category, description, and price
- **Recipes:** Link products to stock items with quantity-per-unit (e.g. "Cappuccino uses 18g Coffee Beans")
  - Add/remove ingredients inline
  - Recipe view shows all current ingredients per product
- All catalog changes cascade to branch inventory and sales automatically

### 🏪 Branch Inventory Management

- Per-branch inventory tracks current quantity for every stock item
- Low-stock detection: items at or below `reorder_level` trigger a dismissible banner alert visible on all tabs (Manager & Staff dashboards)
- **Record Delivery:** Log incoming stock with quantity and notes — updates inventory instantly
- **Stock Purchase Requests:** Staff submit requests; Manager approves or rejects
  - Request status flow: `PENDING` → `APPROVED` / `REJECTED`
  - Manager can approve with adjusted quantity
  - Pending request count shown as badge on the Requests tab
- Branch inventory view shows current stock, reorder level, and status for every item

### 💰 Sales Tracking

- Staff and Managers record individual sales with: product, quantity, unit price, payment mode (Cash/Card/UPI), and timestamp
- Sales history table shows all past transactions per branch
- Payment mode displayed correctly per sale row
- Timestamps shown with accurate date and time (not defaulted to midnight)
- Manager sees own branch sales; Franchisor sees aggregated data in metrics

### 👥 Staff Management

**Manager Dashboard**
- View all staff assigned to the branch in a table
- Staff listed with name, email, phone, role

**Branch Owner Dashboard — Staff Tab**
- Full staff table with Name, Email, Status badge, and Actions column
- **Deactivate staff:** Branch owner can deactivate any Manager or Staff member
  - Confirmation dialog before action
  - Deactivated row: Name and Email cells dim to `opacity-50`; Status badge turns gray "Inactive"
  - Deactivated users cannot log in (enforced at token layer — returns `403`)
- **Reactivate staff:** Reactivate button shown clearly at full opacity (not dimmed) for inactive rows
  - Confirmation dialog before action
  - Row returns to normal appearance; Status badge turns green "Active"
- Branch owners cannot deactivate themselves or other branch owners (enforced backend + hidden in UI)
- **Appoint Manager:** If no manager exists, Branch Owner can create one via modal (name, email, phone, temporary password)

### 💎 Royalty Configuration (Franchisor)

- Configure royalty as a **percentage of gross sales** per franchise
- Set minimum and maximum monthly royalty caps
- Effective date tracking per configuration version
- **Royalty Summary:** Franchisor can query any month/year to see:
  - Total sales per branch
  - Royalty owed per branch (calculated against config)
  - Aggregate totals for the franchise
- Branch owners see their own royalty breakdown in the Reports tab

### 📊 Financial Reports

**Franchisor Reports**
- Select any month and year to generate a network-wide report
- Report includes per-branch: revenue, royalty owed, transaction count
- Franchise-level totals and averages
- **Download as CSV** — client-side generation, no server round-trip

**Branch Owner Reports**
- Same report scoped to their own branch
- Royalty summary included alongside revenue figures
- CSV download available

### 🌐 Franchisor Overview Dashboard

- Key metrics cards: Total Revenue, Active Branches, Total Franchises, Pending Applications
- Recent activity feed
- Menu file management (upload PDF/image per franchise)
- Quick-access refresh button

### 📱 Franchisee Overview Dashboard

- Branch-level revenue, sales count, and royalty summary for the current month
- Recent sales table
- Quick refresh

### 🧰 Manager Dashboard

- **Overview tab:** Branch metrics, recent sales summary
- **Inventory tab:** Full stock list with low-stock highlighting; record deliveries
- **Requests tab:** Approve or reject pending staff purchase requests with quantity adjustment
- **Sales tab:** Record new sales and view branch sales history
- **Staff tab:** View all assigned staff members

### 🛒 Staff Dashboard

- **Inventory tab:** View current stock levels; submit purchase requests for low-stock items; record deliveries
- **Sales tab:** Record new sale transactions
- Persistent low-stock banner across all tabs when items are at or below reorder level

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Frontend styling | Tailwind CSS |
| Frontend routing | React Router v6 |
| State management | Custom React Hooks + Context API |
| Backend framework | Flask (Python) |
| ORM | SQLAlchemy 2.x (mapped_column / Mapped style) |
| Database | SQLite (auto-configured, zero setup) |
| Auth | Custom JWT (HS256, HMAC-SHA256) |
| Password hashing | bcrypt |
| Migrations | Flask-Migrate (Alembic) |
| CORS | Flask-CORS |
| Testing | Pytest (10 tests, 0 failures) |
| Linting | ESLint (frontend), Ruff (backend) |

---

## 📁 Project Structure

```
Relay/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── reference.py      # Lookup tables (BranchStatus, ApplicationStatus, etc.)
│   │   │   ├── core.py           # Franchisor, Franchise, Address, Branch
│   │   │   ├── users.py          # User, Role, UserRole, BranchStaff
│   │   │   ├── catalog.py        # ProductCategory, Product, StockItem, ProductIngredient, BranchInventory
│   │   │   ├── operations.py     # Sale, SaleItem, InventoryTransaction, StockPurchaseRequest, RoyaltyConfig, SaleRoyalty
│   │   │   └── business.py       # FranchiseApplication, Report, ReportData
│   │   ├── routes/
│   │   │   ├── auth_routes.py          # /api/auth — login, profile, reset-password
│   │   │   ├── registration_routes.py  # /api/auth — all registration endpoints
│   │   │   ├── branch_routes.py        # /api/branch — branch staff helpers
│   │   │   ├── franchise_routes.py     # /api/franchises — network, menu upload, branch status toggle
│   │   │   ├── application_routes.py   # /api/franchises — application approve/reject workflow
│   │   │   ├── catalog_routes.py       # /api/catalog — stock items, products, categories, recipes
│   │   │   ├── inventory_routes.py     # /api/inventory — deliveries, stock levels
│   │   │   ├── request_routes.py       # /api/requests — purchase request lifecycle
│   │   │   ├── sales_routes.py         # /api/sales — record and retrieve sales
│   │   │   ├── report_routes.py        # /api/reports — financial report generation
│   │   │   ├── royalty_routes.py       # /api/royalty — royalty config and summaries
│   │   │   ├── dashboard_routes.py     # /api/dashboard — aggregated metrics
│   │   │   └── user_routes.py          # /api/users — user activation and deactivation
│   │   ├── services/                   # Business logic (royalty calculation, report assembly)
│   │   ├── utils/
│   │   │   ├── security.py       # token_required decorator, JWT encode/decode, bcrypt
│   │   │   ├── validators.py     # Password strength, input validators
│   │   │   └── file_helpers.py   # Secure file upload helpers
│   │   └── extensions.py         # db, migrate singletons
│   ├── tests/
│   │   ├── conftest.py           # Pytest fixtures (test app, seeded DB)
│   │   ├── test_auth.py          # Login, inactive user, token validation
│   │   ├── test_models.py        # Model creation and relationship tests
│   │   ├── test_inventory.py     # Stock item and inventory tests
│   │   └── test_sales.py         # Sale creation tests
│   ├── run.py                    # App entry point (auto-seeds DB on first run)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api.js                # Fetch wrapper with auth headers and 401 auto-logout
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state, role/scope helpers
│   │   ├── hooks/
│   │   │   ├── useAdminDashboard.js      # Franchisor dashboard state + toggleBranchStatus
│   │   │   ├── useFranchiseeDashboard.js # Branch owner dashboard composer
│   │   │   ├── useManagerDashboard.js    # Manager dashboard composer
│   │   │   ├── useStaffDashboard.js      # Staff dashboard composer
│   │   │   ├── useCatalog.js             # Stock items, products, categories, recipes
│   │   │   ├── useFranchiseMetrics.js    # Branch-level metrics
│   │   │   ├── useFranchiseStaff.js      # Branch owner staff + deactivate/activate
│   │   │   ├── useInventory.js           # Inventory levels and deliveries
│   │   │   ├── useReport.js              # Report generation and CSV download
│   │   │   ├── useRequests.js            # Purchase request management
│   │   │   ├── useRoyalty.js             # Royalty config and summaries
│   │   │   ├── useSales.js               # Sales fetch
│   │   │   └── useStaff.js               # Manager staff view + deactivate/activate
│   │   ├── components/
│   │   │   ├── admin/            # AdminNetwork, AdminCatalog, AdminRoyalty, AdminReports, AdminApplications, AdminOverview, modals
│   │   │   ├── franchisee/       # FranchiseeOverview, FranchiseeStaff, FranchiseeRequests, FranchiseeReports
│   │   │   ├── manager/          # Manager-specific views and modals
│   │   │   ├── staff/            # Staff-specific views
│   │   │   ├── register/         # Decomposed registration form sections
│   │   │   ├── shared/           # Shared cross-role components
│   │   │   └── ui/               # Table, Tabs, StatCard, Toast, ProtectedRoute, ErrorBoundary
│   │   ├── pages/                # Route-level containers (AdminDashboard, FranchiseeDashboard, ManagerDashboard, StaffDashboard, Login, Register…)
│   │   ├── layouts/              # PublicLayout wrapper
│   │   └── utils/                # Currency formatting, date helpers, phone sanitizer
│   └── vite.config.js
├── START_HERE.md                 # Complete startup and demo guide ⭐
└── README.md                     # This file
```

---

## 🗺️ API Reference (All 13 Route Files)

| Prefix | File | Key Endpoints |
|---|---|---|
| `/api/auth` | `auth_routes.py` | `POST /login`, `GET /profile`, `POST /reset-password` |
| `/api/auth` | `registration_routes.py` | `POST /register-franchisor`, `POST /register-franchisee`, `POST /register-manager`, `POST /register-staff` |
| `/api/branch` | `branch_routes.py` | `GET /staff` |
| `/api/franchises` | `franchise_routes.py` | `GET /brands`, `GET /network`, `GET /active-branches`, `POST /{id}/menu`, `PUT /branches/{id}/status` |
| `/api/franchises` | `application_routes.py` | `GET /applications`, `PUT /applications/{id}/approve`, `PUT /applications/{id}/reject` |
| `/api/catalog` | `catalog_routes.py` | CRUD for stock items, categories, products; `GET/POST/DELETE /{id}/ingredients` |
| `/api/inventory` | `inventory_routes.py` | `GET /branch-stock`, `POST /record-delivery`, `GET /low-stock` |
| `/api/requests` | `request_routes.py` | `GET /`, `POST /`, `PUT /{id}/approve`, `PUT /{id}/reject` |
| `/api/sales` | `sales_routes.py` | `GET /`, `POST /`, `GET /products` |
| `/api/reports` | `report_routes.py` | `GET /summary` |
| `/api/royalty` | `royalty_routes.py` | `GET /config`, `POST /config`, `GET /summary`, `GET /branch-summary` |
| `/api/dashboard` | `dashboard_routes.py` | `GET /franchisor/metrics`, `GET /branch/metrics` |
| `/api/users` | `user_routes.py` | `PUT /{id}/deactivate`, `PUT /{id}/activate` |

---

## 🔑 Default Login Credentials (Seeded on First Run)

| Role | Email | Password |
|---|---|---|
| Franchisor (McDonald's) | `admin@mcd.com` | `admin123` |
| Franchisor (Ajay's Café) | `admin@ajays.com` | `admin123` |
| Branch Owner (MCD Alkapuri) | `rahul@mcd-alkapuri.com` | `owner123` |
| Branch Owner (Ajay's Navrangpura) | `sneha@ajays-navrangpura.com` | `owner123` |
| Manager (MCD Alkapuri) | `mgr.alkapuri@mcd.com` | `manager123` |
| Staff (MCD Alkapuri) | `staff1.alkapuri@mcd.com` | `staff123` |

---

## 🧪 Test Suite

```bash
cd backend
python -m pytest tests/ -v
```

| File | Coverage |
|---|---|
| `test_auth.py` | Login success/failure, inactive user block, token validation |
| `test_models.py` | Model creation, FK relationships, reference data seeding |
| `test_inventory.py` | Stock item creation, branch inventory listing |
| `test_sales.py` | Sale record creation and retrieval |

**Result: 10 passed, 0 failed.**

---

## 🤝 Support

Having issues? See the **[START_HERE.md](START_HERE.md)** troubleshooting section.

---

**Built with React + Flask + SQLite | Phase 15 Complete | March 2026**
