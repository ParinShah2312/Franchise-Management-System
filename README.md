# 🚀 Relay — Franchise Management System

**A production-ready franchise management platform built with React 18 + Vite + Tailwind CSS on the frontend and Flask + SQLAlchemy + SQLite on the backend. Supports four distinct user roles with end-to-end RBAC enforcement, royalty configuration, financial reporting with PDF export, expense tracking, product catalog management, inventory tracking with recipe-based stock deductions, branch lifecycle management, and database-backed file storage — all in a zero-database-server setup.**

---

## ⚡ Quick Start

👉 **[START_HERE.md](START_HERE.md)** — Complete startup guide from a fresh laptop boot. No database server required.

🧪 **[TESTING_GUIDE.md](TESTING_GUIDE.md)** — Exhaustive manual feature testing checklist covering all 4 roles, RBAC, edge cases, and PDF verification.

---

## 🌟 What Is Relay?

Relay is a complete franchise operations ecosystem. It models the full hierarchy from brand owner down to shop-floor staff, enforcing role-based access at every layer:

| Role | Who They Are | What They Can Do |
|---|---|---|
| **Franchisor** | Brand owner | Review applications, manage network, configure royalty, run reports, manage product catalog & recipes, toggle branch status, upload menus |
| **Branch Owner** | Franchisee | Manage their branch, appoint manager, view performance, manage staff lifecycle, approve/reject stock requests, log expenses, generate branch reports with PDF export |
| **Manager** | Branch operations lead | Oversee stock, add inventory items, record deliveries, record multi-product sales, submit purchase requests, manage staff, log expenses |
| **Staff** | Shop-floor employee | Record sales, view inventory, record deliveries |

---

## ✨ Feature Catalogue

### 🔐 Authentication & RBAC

- JWT-based authentication (custom HS256 implementation using HMAC-SHA256 — no third-party JWT library); JWT signing consolidated with Flask `SECRET_KEY`
- Two principal types: `Franchisor` (brand account) and `User` (all branch roles)
- `token_required` decorator enforces role allow-lists on every protected endpoint
- Inactive user check enforced at the token layer — deactivated accounts receive `403` immediately
- Password strength validation on all registration and reset flows (8+ chars, uppercase, lowercase, number)
- Forced password reset on first login for system-created accounts (Managers & Staff)
- Persistent auth state via `AuthContext` with auto-logout on `401` or expired token
- Token expiry check on frontend — expired tokens trigger automatic logout
- Login rate limiting via `Flask-Limiter` (5 attempts per minute per IP)
- Request timeouts — all frontend API calls abort after 15 seconds via `AbortController`
- Forgot password modal on login page with support contact info

### 📋 Franchise Application Workflow

- Public 11-field registration form: personal details, franchise brand, preferred branch location, property size, investment capacity, prior business experience, supporting document upload
- Separate Franchisor registration form for brand owners
- Applications land in `PENDING` state; routed to `PendingDashboard` until reviewed
- Franchisor reviews via modal with full applicant detail and document viewer
- One-click **Approve** — creates branch, assigns branch owner role automatically
- **Reject with reason** — structured rejection modal (minimum 10-character reason enforced client and server side)
- Application status badges: `PENDING` (yellow), `APPROVED` (green), `REJECTED` (red)
- Pending applications count shown as badge on the Applications tab

### 🏢 Branch Network Management (Franchisor)

- Network tab shows all branches across all franchises in a sortable table
- Per-branch columns: Branch Name, Franchise, Location, Owner, Manager, Status badge
- **Branch status toggle:** Franchisor can activate or deactivate any branch with a confirmation dialog
  - Status badge turns green (ACTIVE) or gray (INACTIVE)
  - Toggle button flips label: "Deactivate" ↔ "Activate"
  - Backend enforces franchise ownership — cross-franchise toggling returns `403`
- Menu file upload per franchise (PDF/image) with 5MB file-size limit
- Files stored as binary blobs in the database (no filesystem dependency)

### 📦 Product Catalog (Franchisor)

- **Stock Items:** Define raw ingredients/materials with name, unit, description, and reorder threshold
- **Product Categories:** Organise menu items into named groups; duplicate name guard enforced
- **Products:** Create sellable items with name, category, description, and price; edit and toggle active/inactive status
- **Recipes:** Link products to stock items with quantity-per-unit (e.g. "Cappuccino uses 18g Coffee Beans")
  - Add/remove ingredients inline
  - Recipe view shows all current ingredients per product
- **Stock Item Usage:** View which products use a given stock item via "View Products" button
- All catalog changes cascade to branch inventory and sales automatically

### 🏪 Branch Inventory Management

- Per-branch inventory tracks current quantity for every stock item
- Low-stock detection: items at or below `reorder_level` trigger a persistent, dismissible amber banner visible on all tabs (Manager & Staff dashboards)
- Low-stock rows highlighted with amber background color
- **Add Inventory Item:** Manager can add stock items to branch inventory with initial quantity and reorder level; duplicate item guard prevents re-adding
- **Record Delivery:** Staff and Manager log incoming stock with quantity and notes — updates inventory instantly; row briefly pulses on update
- **Stock Purchase Requests:** Manager submits requests with item, quantity, and estimated unit cost; Branch Owner approves or rejects
  - Request status flow: `PENDING` → `APPROVED` / `REJECTED`
  - Approved requests automatically update branch inventory
  - Pending request count shown as badge on the Requests tab
- **Recipe-based stock deduction:** Sales automatically deduct ingredient quantities based on product recipes
- **Insufficient stock guard:** Sales are rejected server-side if any ingredient is below the required quantity

### 💰 Sales Tracking

- Staff and Managers record individual sales with: product(s), quantity, unit price, payment mode (Cash/Card/UPI), and timestamp
- **Multi-product sales:** Add multiple products per sale using "+ Add Product" button; total is sum of all line items
- Sales history table shows all past transactions per branch with correct date/time and payment mode
- Manager sees own branch sales; Franchisor sees aggregated data in reports
- Timestamps shown with IST timezone formatting (Asia/Kolkata)

### 💸 Expense Tracking

- Branch Owners and Managers can log expenses with: category, date, amount, and optional description
- **9 expense categories:** Rent, Utilities, Salaries, Supplies, Maintenance, Marketing, Insurance, Transport, Other
- Expenses table shows logged-by name, category, date, amount, and delete option
- Amount validation: must be positive numeric value; negative amounts are rejected
- Expenses are scoped to branch — cross-branch access is prevented
- Expenses are included in monthly financial reports under the Expense Breakdown section

### 👥 Staff Management

**Branch Owner Dashboard — My Staff Tab**
- Full staff table with Name, Email, Status badge, and Actions column
- **Branch Manager section** and **Support Staff table** displayed separately
- **Appoint Manager:** If no manager exists, Branch Owner can create one via modal (name, email, phone, temporary password)
- **Add Staff (Manager):** Manager can add new staff members with name, email, phone, and temporary password
- **Deactivate staff:** Branch owner can deactivate any Manager or Staff member
  - Confirmation dialog before action
  - Deactivated row: Name and Email cells dim to `opacity-50`; Status badge turns gray "Inactive"
  - Deactivated users cannot log in (enforced at token layer — returns `403`)
- **Reactivate staff:** Reactivate button shown clearly at full opacity (not dimmed) for inactive rows
  - Confirmation dialog before action
  - Row returns to normal appearance; Status badge turns green "Active"
- Branch owners cannot deactivate themselves or other branch owners (enforced backend + hidden in UI)
- **Force Reset Password:** Branch Owner or Manager can trigger a forced password reset for any staff member; user is prompted to change password on next login

### 💎 Royalty Configuration (Franchisor)

- Configure royalty as a **percentage split** between franchisor and branch owner (percentages sum to 100%)
- Effective date tracking per configuration version
- **Royalty Summary:** Franchisor can query any month/year to see:
  - Total sales per branch
  - Franchisor earned amount and Branch Owner earned amount per branch
  - Cut % per branch
- Branch owners see their own royalty earnings on the Overview tab ("Royalty Earned MTD") and in the Reports tab

### 📊 Financial Reports & PDF Export

**Franchisor Reports**
- Select any month and year to generate a network-wide report
- Summary cards: Total Sales, Total Expenses, Profit/Loss
- **Interactive bar chart** (Recharts) shows sales by branch with tooltips
- **Branch Breakdown table** with expandable product sales detail per branch
- Royalty columns (Franchisor Earned, Branch Owner Earned) appear when royalty is configured
- **Expense Breakdown section** with per-branch expenses grouped by category
- **Download PDF** — professional formatted PDF report via `@react-pdf/renderer` with header, stats, charts, tables, and page numbers; all amounts in ₹ (INR) format

**Branch Owner Reports**
- Same report scoped to own branch
- **Product Sales Breakdown** table (instead of branch breakdown)
- Expense section and PDF download available

### 🌐 Franchisor Overview Dashboard

- Key metrics cards: Total Revenue, Active Branches, Pending Applications
- Pending applications banner with "Review now →" link (dismissible)
- Menu file management (upload PDF/image per franchise; view uploaded menu in new tab)
- Quick-access Refresh Data button
- **FAQ Accordion** — 6 curated Q&A items for franchisor operations

### 📱 Franchisee Overview Dashboard

- Branch-level metrics: Revenue (MTD), Inventory Value, Pending Requests, Pending Quantity, Royalty Earned (MTD)
- Recent sales table with date, amount, payment mode
- Quick Refresh Data button
- **FAQ Accordion** — 6 curated Q&A items for branch owner operations

### 🧰 Manager Dashboard

- **Overview tab:** Today's Sales, Low Stock Items, Pending Requests metric cards
- **My Staff tab:** Branch Owner section and Support Staff table; Add Staff and Force Reset Password actions
- **Inventory tab:** Full stock list with low-stock highlighting; add inventory items; record deliveries; duplicate item guard
- **Sales tab:** Record multi-product sales with payment mode selection; sales history table
- **Stock Requests tab:** Submit new purchase requests with item, quantity, and estimated unit cost; view all request statuses
- **Expenses tab:** Log expenses with category picker and date selector; delete expenses; running total in header
- **FAQ Accordion** — 6 curated Q&A items for manager operations
- **Persistent low-stock banner** across all tabs when items are at or below reorder level

### 🛒 Staff Dashboard

- **Inventory tab:** View current stock levels; record deliveries with quantity and notes
- **Sales tab:** Record sales with product, quantity, and payment mode selection
- Persistent low-stock amber banner across all tabs when items are at or below reorder level
- Staff cannot edit or delete existing records (create-only permissions)
- **FAQ Accordion** — 4 curated Q&A items for staff operations

### 🌍 Public Pages

- **Home page:** Hero section, stats counters, feature highlights, role cards, CTA banner
- **Features page:** Grid of 6 feature cards describing platform capabilities
- **Contact page:** Contact form labeled as demo-only (no backend endpoint); shows success toast on submit
- **Signup Selection page:** Two cards — "Register as Franchisor" and "Apply for a Branch"
- **Login page:** Email/password form with Forgot Password modal
- Back arrow navigation ("← Back") on all authentication/registration forms
- Responsive mobile hamburger navigation menu
- Public layout wrapper with Navbar and Footer

### 🎨 UX & Loading States

- **Skeleton screens:** `DashboardSkeleton`, `SkeletonCard`, `SkeletonTable` replace text-based loading for all dashboard tabs
- **Error recovery:** `ErrorState` component shows error message with "Try Again" retry button
- **Toast notifications:** Success/error toasts for all user actions across every dashboard
- **Confirmation dialogs:** Shared `ConfirmDialog` component replaces all native `window.confirm` calls
- **Alert banners:** Shared `AlertBanner` component for dismissible status messages
- **Animations:** `animate-fade-in` transitions on tab switches; row pulse on delivery record
- **Responsive design:** Full usability on mobile (≥320px) and tablet (≥768px) without horizontal scrolling
- **Error boundary:** Global `ErrorBoundary` component wraps the entire app
- **Keyboard accessibility:** Modals close on `Escape` key press
- **PropTypes:** Type safety enforced via `PropTypes` across all shared UI components (no TypeScript)

### 🗄️ Database File Storage

- All uploaded files (menus, application documents) stored as binary blobs in the `file_blobs` database table
- No filesystem dependency — fully portable database-backed storage
- Files served via `/api/files/{blob_id}` endpoint with proper MIME type and cache headers
- `FileBlob` model stores: original filename, MIME type, binary data, file size, upload timestamp

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite 7 |
| Frontend styling | Tailwind CSS 3 |
| Frontend routing | React Router v7 |
| State management | Custom React Hooks + Context API |
| Charts | Recharts 3 |
| PDF export | @react-pdf/renderer 4 |
| Backend framework | Flask 3.0 (Python) |
| ORM | SQLAlchemy 2.x (mapped_column / Mapped style) |
| Database | SQLite (auto-configured, zero setup) |
| Auth | Custom JWT (HS256, HMAC-SHA256) |
| Password hashing | bcrypt |
| Migrations | Flask-Migrate 4 (Alembic) |
| CORS | Flask-CORS 5 |
| Rate limiting | Flask-Limiter 3.8 |
| Backend testing | Pytest 8 + pytest-cov |
| Frontend testing | Vitest 4 + Testing Library |
| Linting | ESLint (frontend), pytest (backend) |

---

## 📁 Project Structure

```
Relay/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory (create_app, register_blueprints)
│   │   ├── extensions.py        # db, migrate, limiter singletons
│   │   ├── models/
│   │   │   ├── __init__.py      # Re-exports all 22 model classes
│   │   │   ├── reference.py     # ApplicationStatus, BranchStatus, TransactionType, RequestStatus, SaleStatus, Unit
│   │   │   ├── core.py          # TimestampMixin, Franchisor, Franchise, Address, Branch
│   │   │   ├── users.py         # User, Role, UserRole, BranchStaff
│   │   │   ├── catalog.py       # ProductCategory, Product, StockItem, ProductIngredient, BranchInventory
│   │   │   ├── operations.py    # Sale, SaleItem, InventoryTransaction, StockPurchaseRequest, StockPurchaseRequestItem, RoyaltyConfig, SaleRoyalty, Expense, FileBlob
│   │   │   └── business.py      # FranchiseApplication, Report, ReportData
│   │   ├── routes/
│   │   │   ├── auth_routes.py          # /api/auth — login, profile, reset-password
│   │   │   ├── registration_routes.py  # /api/auth — franchisor, franchisee, manager, staff registration
│   │   │   ├── branch_routes.py        # /api/branch — branch staff helpers
│   │   │   ├── franchise_routes.py     # /api/franchises — brands, network, menu upload, branch status toggle
│   │   │   ├── application_routes.py   # /api/franchises — application approve/reject workflow
│   │   │   ├── catalog_routes.py       # /api/catalog — stock items, products, categories, recipes/ingredients
│   │   │   ├── inventory_routes.py     # /api/inventory — deliveries, stock levels, add inventory items
│   │   │   ├── request_routes.py       # /api/requests — purchase request lifecycle
│   │   │   ├── sales_routes.py         # /api/sales — record and retrieve sales, product listing
│   │   │   ├── report_routes.py        # /api/reports — financial report generation
│   │   │   ├── royalty_routes.py       # /api/royalty — royalty config and summaries
│   │   │   ├── dashboard_routes.py     # /api/dashboard — aggregated metrics
│   │   │   ├── user_routes.py          # /api/users — user activation, deactivation, force reset
│   │   │   ├── expense_routes.py       # /api/expenses — expense CRUD with branch scoping
│   │   │   └── file_routes.py          # /api/files — blob file serving from database
│   │   ├── services/
│   │   │   ├── inventory_service.py    # Recipe-based inventory deduction logic
│   │   │   ├── report_service.py       # Financial report assembly with expense and royalty aggregation
│   │   │   └── royalty_service.py      # Royalty split calculation engine
│   │   └── utils/
│   │       ├── security.py       # token_required decorator, JWT encode/decode, bcrypt password hashing
│   │       ├── validators.py     # Password strength validation, input validators
│   │       ├── file_helpers.py   # Secure file upload helpers with size/type validation
│   │       ├── db_helpers.py     # Date serialization, database utility helpers
│   │       └── branch_helpers.py # Branch resolution and scope validation helpers
│   ├── tests/
│   │   ├── conftest.py           # Pytest fixtures (test app, seeded DB, auth helpers)
│   │   ├── test_auth.py          # Login, inactive user block, token validation
│   │   ├── test_models.py        # Model creation and FK relationship tests
│   │   ├── test_inventory.py     # Stock item and inventory tests
│   │   ├── test_sales.py         # Sale creation tests
│   │   ├── test_reports.py       # Report generation, profit/loss, role scoping
│   │   ├── test_royalty.py       # Config creation, split calculation, endpoint RBAC
│   │   ├── test_requests.py      # Create, approve, reject workflow, double-approve guard
│   │   ├── test_expenses.py      # CRUD, amount validation, category validation, branch scoping
│   │   ├── test_applications.py  # Full approve workflow, reject, duplicate guard, auth guard
│   │   ├── test_catalog.py       # Category CRUD, product CRUD, ingredient add/remove, duplicates, RBAC
│   │   └── test_rbac.py          # Cross-role access denial, deactivation enforcement, token checks
│   ├── seed.py                   # Comprehensive demo data seeder (~38KB)
│   ├── run.py                    # App entry point (auto-seeds DB on first run)
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Route definitions and role-based route protection
│   │   ├── api.js                # Fetch wrapper with auth headers, 401 auto-logout, AbortController timeout, base URL config
│   │   ├── main.jsx              # React entry point
│   │   ├── index.css             # Global styles and Tailwind base
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state, role/scope helpers, token expiry check
│   │   ├── hooks/
│   │   │   ├── useAdminDashboard.js      # Franchisor dashboard state + all tab data
│   │   │   ├── useFranchiseeDashboard.js # Branch owner dashboard composer
│   │   │   ├── useManagerDashboard.js    # Manager dashboard composer
│   │   │   ├── useStaffDashboard.js      # Staff dashboard composer
│   │   │   ├── useCatalog.js             # Stock items, products, categories, recipes
│   │   │   ├── useExpenses.js            # Expense CRUD operations
│   │   │   ├── useFranchiseMetrics.js    # Branch-level metrics
│   │   │   ├── useFranchiseStaff.js      # Branch owner staff + deactivate/activate
│   │   │   ├── useInventory.js           # Inventory levels and deliveries
│   │   │   ├── useReport.js              # Report generation
│   │   │   ├── useRequests.js            # Purchase request management
│   │   │   ├── useRoyalty.js             # Royalty config and summaries
│   │   │   ├── useSales.js               # Sales fetch and logging
│   │   │   └── useStaff.js               # Manager staff view + manage
│   │   ├── components/
│   │   │   ├── admin/            # AdminOverview, AdminNetwork, AdminApplications, AdminCatalog (5 subtabs), AdminRoyalty, AdminReports, ApplicationModal, RejectionModal, Catalog modals (Add/Edit)
│   │   │   ├── franchisee/       # FranchiseeOverview, FranchiseeStaff, FranchiseeRequests, FranchiseeReports, FranchiseeExpenses
│   │   │   ├── manager/          # ManagerOverview, ManagerStaff, ManagerInventory, ManagerSales, ManagerRequests, ManagerExpenses
│   │   │   ├── staff/            # StaffInventory, StaffSales
│   │   │   ├── shared/           # FaqAccordion, ReportCard, ReportPDF, ReportPDFChart, ReportBranchTable
│   │   │   ├── register/         # AccountInfoSection, BusinessInfoSection, ContactInfoSection, FranchiseDetailsSection, OrgInfoSection, PersonalInfoSection
│   │   │   ├── layout/           # Navbar, Footer
│   │   │   ├── ui/               # Table, Tabs, StatCard, Modal, ConfirmDialog, AlertBanner, Toast, LowStockBanner, SkeletonCard, SkeletonTable, DashboardSkeleton, ErrorState
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── Toast.jsx
│   │   ├── pages/                # AdminDashboard, FranchiseeDashboard, ManagerDashboard, StaffDashboard, PendingDashboard, Home, Features, Contact, Login, ResetPassword, RegisterFranchise, RegisterFranchisor, SignupSelection
│   │   ├── layouts/              # PublicLayout (Navbar + Outlet + Footer wrapper)
│   │   └── utils/
│   │       ├── formatters.js     # formatINR, formatINRDecimal, formatDateTime, formatDate, formatNumber, formatRole, getNowString, getTodayString
│   │       ├── validators.js     # sanitizePhone, isValidPhone, isValidEmail, isValidPassword, hasEmailTypo
│   │       ├── auth.js           # parseToken, isTokenExpired
│   │       ├── constants.js      # STORAGE_KEYS and app constants
│   │       ├── indianLocations.js # Indian state/city location data
│   │       └── index.js          # Re-exports
│   ├── vite.config.js            # Vite dev server config (port 3000, API proxy to 5000)
│   ├── tailwind.config.js        # Tailwind theme customisation
│   ├── postcss.config.js         # PostCSS plugins
│   └── package.json              # NPM dependencies and scripts
├── .gitignore                    # Comprehensive gitignore (Python, Node, IDE, DB, cache)
├── START_HERE.md                 # Complete startup and demo guide ⭐
├── TESTING_GUIDE.md              # Exhaustive manual feature testing checklist ⭐
└── README.md                     # This file
```

---

## 🗺️ API Reference (All 15 Route Files)

| Prefix | File | Key Endpoints |
|---|---|---|
| `/api/auth` | `auth_routes.py` | `POST /login`, `GET /profile`, `POST /reset-password` |
| `/api/auth` | `registration_routes.py` | `POST /register-franchisor`, `POST /register-franchisee`, `POST /register-manager`, `POST /register-staff` |
| `/api/branch` | `branch_routes.py` | `GET /staff` |
| `/api/franchises` | `franchise_routes.py` | `GET /brands`, `GET /network`, `GET /active-branches`, `POST /{id}/menu`, `PUT /branches/{id}/status` |
| `/api/franchises` | `application_routes.py` | `GET /applications`, `PUT /applications/{id}/approve`, `PUT /applications/{id}/reject` |
| `/api/catalog` | `catalog_routes.py` | CRUD for stock items, categories, products; `GET/POST/DELETE /{id}/ingredients` |
| `/api/inventory` | `inventory_routes.py` | `GET /branch-stock`, `POST /record-delivery`, `GET /low-stock`, `POST /add-item` |
| `/api/requests` | `request_routes.py` | `GET /`, `POST /`, `PUT /{id}/approve`, `PUT /{id}/reject` |
| `/api/sales` | `sales_routes.py` | `GET /`, `POST /`, `GET /products` |
| `/api/reports` | `report_routes.py` | `GET /summary` |
| `/api/royalty` | `royalty_routes.py` | `GET /config`, `POST /config`, `GET /summary`, `GET /branch-summary` |
| `/api/dashboard` | `dashboard_routes.py` | `GET /franchisor/metrics`, `GET /branch/metrics` |
| `/api/users` | `user_routes.py` | `PUT /{id}/deactivate`, `PUT /{id}/activate`, `PUT /{id}/force-reset` |
| `/api/expenses` | `expense_routes.py` | `GET /`, `POST /`, `DELETE /{id}` |
| `/api/files` | `file_routes.py` | `GET /{blob_id}` |

---

## 🗄️ Database Models (22 classes across 6 files)

| Domain | Models |
|---|---|
| **Reference** | `ApplicationStatus`, `BranchStatus`, `TransactionType`, `RequestStatus`, `SaleStatus`, `Unit` |
| **Core** | `TimestampMixin`, `Franchisor`, `Franchise`, `Address`, `Branch` |
| **Users** | `User`, `Role`, `UserRole`, `BranchStaff` |
| **Catalog** | `ProductCategory`, `Product`, `StockItem`, `ProductIngredient`, `BranchInventory` |
| **Operations** | `Sale`, `SaleItem`, `InventoryTransaction`, `StockPurchaseRequest`, `StockPurchaseRequestItem`, `RoyaltyConfig`, `SaleRoyalty`, `Expense`, `FileBlob` |
| **Business** | `FranchiseApplication`, `Report`, `ReportData` |

---

## 🔑 Default Login Credentials (Seeded on First Run)

| Role | Email | Password |
|---|---|---|
| Franchisor (McDonald's) | `admin@mcd.com` | `admin123` |
| Franchisor (Ajay's Café) | `admin@ajays.com` | `admin123` |
| Branch Owner (MCD Alkapuri) | `rahul@mcd-alkapuri.com` | `owner123` |
| Branch Owner (MCD Vesu) | `priya@mcd-vesu.com` | `owner123` |
| Branch Owner (MCD Bandra) | `arjun@mcd-bandra.com` | `owner123` |
| Branch Owner (Ajay's Navrangpura) | `sneha@ajays-navrangpura.com` | `owner123` |
| Branch Owner (Ajay's Koramangala) | `vikram@ajays-koramangala.com` | `owner123` |
| Manager (MCD Alkapuri) | `mgr.alkapuri@mcd.com` | `manager123` |
| Manager (Ajay's Navrangpura) | `mgr.navrangpura@ajays.com` | `manager123` |
| Staff (MCD Alkapuri) | `staff1.alkapuri@mcd.com` | `staff123` |
| Staff (Ajay's Navrangpura) | `staff1.navrangpura@ajays.com` | `staff123` |

> **Note:** Managers and Staff are prompted to reset their password on first login.

> **Tip:** To reset everything and start fresh, delete `backend/relay.db` and restart `python run.py`. All seed data regenerates automatically.

---

## 🧪 Test Suite

### Backend Tests (58 tests)

```bash
cd backend
python -m pytest tests/ -v
```

| File | Coverage |
|---|---|
| `test_auth.py` | Login, inactive user block, duplicate registration, token validation |
| `test_models.py` | Model creation, FK relationships, reference data seeding |
| `test_inventory.py` | Stock item creation, branch inventory listing, transaction creation |
| `test_sales.py` | Sale record creation and retrieval, payment_mode field |
| `test_reports.py` | Report generation, persistence, profit/loss calculation, role scoping, invalid inputs |
| `test_royalty.py` | Config creation, split calculation, rounding correctness, endpoint RBAC |
| `test_requests.py` | Create, approve, reject workflow, double-approve guard, RBAC enforcement |
| `test_expenses.py` | CRUD operations, amount validation, category validation, branch scoping |
| `test_applications.py` | Full approve workflow (branch + role creation), reject, duplicate-approve guard, auth guard |
| `test_catalog.py` | Category CRUD, product CRUD, ingredient add/remove, duplicate name guard, RBAC |
| `test_rbac.py` | Cross-role access denial, deactivation enforcement, expired/malformed tokens |

**Result: 58 tests, 0 failures.**

### Frontend Tests (42 tests)

```bash
cd frontend
npm test
```

| File | Coverage |
|---|---|
| `utils.formatters.test.js` | formatINR, formatINRDecimal, formatDate, formatRole |
| `utils.validators.test.js` | sanitizePhone, isValidPhone, isValidEmail, isValidPassword |
| `utils.auth.test.js` | parseToken, isTokenExpired |
| `ui/StatCard.test.jsx` | Render mapping for StatCard component |
| `ui/LowStockBanner.test.jsx` | Render and dismiss interaction for LowStockBanner |
| `hooks/useAuth.test.jsx` | Context provider tests for auth logic and storage handlers |
| `integration/RegistrationFlow.test.jsx` | Full DOM mount registration flow bypassing network calls |

**Result: 42 tests across 7 test files.**

---

## 🤝 Support

Having issues? See the **[START_HERE.md](START_HERE.md)** troubleshooting section or the **[TESTING_GUIDE.md](TESTING_GUIDE.md)** for comprehensive feature verification.

---

**Built with React 18 + Flask 3 + SQLite | 100 Tests Passing | April 2026**
