# 🚀 Relay Franchise Management System — Start Here

**Welcome to Relay!** If you are completely new to this project, don't worry. This guide will walk you through exactly what this project is and how to run it step-by-step.

### What is Relay?
Relay is a web-based **Franchise Management System**. It acts as the central hub for a business brand (like McDonald's or a local cafe chain) to manage their entire network. 
- **The Brand (Franchisor)** can approve new people who want to open a branch, track total revenue across their network, manage a master catalog of products and recipes, configure royalty splits, upload menus, and download professional PDF reports.
- **The Branch Owners (Franchisees)** can monitor their branch's revenue and inventory, manage their staff lifecycle (appoint, deactivate, reactivate), approve or reject stock requests, log branch expenses, and download their own financial reports.
- **The Managers** can record daily sales (multi-product with payment mode), manage inventory (add items, record deliveries), submit stock purchase requests, add new staff members, and log operational expenses.
- **The Staff** can record sales, view inventory levels, and record stock deliveries.

> **Our Promise:** From a fresh laptop boot to a fully running demo in under 2 minutes. No complicated database servers to install — everything auto-configures itself!

---

## 📋 Contents

1. [Prerequisites](#1-prerequisites)
2. [First-Time Setup](#2-first-time-setup)
3. [Daily Startup (After First Setup)](#3-daily-startup-after-first-setup)
4. [All Login Credentials](#4-all-login-credentials)
5. [Complete Feature Walkthrough](#5-complete-feature-walkthrough)
6. [Running the Test Suite](#6-running-the-test-suite)
7. [Common Issues & Fixes](#7-common-issues--fixes)

---

## 1. Prerequisites

Check these once before anything else:

```bash
python --version    # Must be 3.8 or higher
node --version      # Must be 18 or higher
npm --version       # Comes with Node
```

If either is missing, install from [python.org](https://python.org) and [nodejs.org](https://nodejs.org).

---

## 2. First-Time Setup

Only run these steps once — the first time you clone or receive this project.

### Step 1 — Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac / Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create the environment file
# Windows:
copy .env.example .env
# Mac / Linux:
cp .env.example .env

# Start the server (this auto-creates and seeds the database)
python run.py
```

**Expected output:**
```
✅ Database initialized successfully!
 * Running on http://127.0.0.1:5000
```

✅ Leave this terminal running. **Do not close it.**

---

### Step 2 — Frontend

Open a **new** terminal window:

```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
  VITE v7.x.x  ready in XXX ms
  ➜  Local:   http://localhost:3000/
```

✅ Open your browser to **http://localhost:3000**

---

## 3. Daily Startup (After First Setup)

Every time you restart your laptop, just do this — no installation needed:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate    # Windows
# source venv/bin/activate  (Mac/Linux)
python run.py
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** and you're running.

---

## 4. All Login Credentials

These accounts are auto-seeded the very first time `python run.py` runs:

| Role | Email | Password | Access |
|---|---|---|---|
| **Franchisor (McDonald's)** | `admin@mcd.com` | `admin123` | Full admin dashboard — 3 branches |
| **Franchisor (Ajay's Café)** | `admin@ajays.com` | `admin123` | Full admin dashboard — 2 branches |
| **Branch Owner (MCD Alkapuri)** | `rahul@mcd-alkapuri.com` | `owner123` | Franchisee dashboard |
| **Branch Owner (MCD Vesu)** | `priya@mcd-vesu.com` | `owner123` | Franchisee dashboard |
| **Branch Owner (MCD Bandra)** | `arjun@mcd-bandra.com` | `owner123` | Franchisee dashboard |
| **Branch Owner (Ajay's Navrangpura)** | `sneha@ajays-navrangpura.com` | `owner123` | Franchisee dashboard |
| **Branch Owner (Ajay's Koramangala)** | `vikram@ajays-koramangala.com` | `owner123` | Franchisee dashboard |
| **Manager (MCD Alkapuri)** | `mgr.alkapuri@mcd.com` | `manager123` | Manager dashboard |
| **Manager (Ajay's Navrangpura)** | `mgr.navrangpura@ajays.com` | `manager123` | Manager dashboard |
| **Staff (MCD Alkapuri)** | `staff1.alkapuri@mcd.com` | `staff123` | Staff dashboard |
| **Staff (Ajay's Navrangpura)** | `staff1.navrangpura@ajays.com` | `staff123` | Staff dashboard |

> **Note:** Other manager accounts follow the pattern `mgr.{branchslug}@{brand}.com` / `manager123`. Other staff accounts follow `staff{N}.{branchslug}@{brand}.com` / `staff123`. Managers and staff are prompted to reset their password on first login.

> **Tip:** To reset everything and start fresh, delete `backend/relay.db` and restart `python run.py`. All seed data regenerates automatically.

---

## 5. Complete Feature Walkthrough

Work through these tests in order to see every feature in the system.

---

### 🔐 Test 1 — Franchisor Login & Overview Dashboard

1. Go to `http://localhost:3000`
2. Log in: `admin@mcd.com` / `admin123`
3. You land on the **Franchisor Dashboard → Overview tab**
4. You should see metrics cards: Total Revenue, Active Branches, Pending Applications
5. Click **Refresh Data** — metrics reload from the live API
6. If pending applications exist, a yellow alert banner appears with **"Review now →"** link
7. Scroll down to see the **FAQ Accordion** — click any question to expand/collapse the answer

---

### 📋 Test 2 — Franchise Application Workflow

1. **Log out** from the franchisor
2. On the login page, click **"Apply here"** to start a franchisee registration
3. Fill in the 11-field form:
   - Personal details (name, email, phone, password)
   - Business details (franchise brand, preferred branch location)
   - Background (property size, investment capacity, prior business experience)
   - Upload a supporting document (PDF/image, max 5MB)
4. Submit — you receive a success toast and are redirected to the **Pending Dashboard**
5. **Log back in as Franchisor** → open the **Applications tab**
6. Notice the pending count badge on the Applications tab
7. Find the yellow `PENDING` badge row → click **"Review"**
8. The Application Modal shows full applicant detail — click **"📄 View document"** to open the uploaded file in a new tab
9. Click **"Approve"** — the application is accepted, a branch and branch-owner role are created automatically, and the row turns green `APPROVED`
10. **Try rejection too:** Create another application, then click "Reject" — enter a reason (minimum 10 characters) and submit

---

### 🏢 Test 3 — Network Tab & Branch Status Toggle

1. Log in as Franchisor → open the **Network tab**
2. You see a table of all branches with columns: Branch, Franchise, Location, Owner, Manager, Status, Actions
3. The **Status** column shows a green `ACTIVE` or gray `INACTIVE` badge
4. Click **"Deactivate"** on any active branch → confirm the dialog → the status badge turns gray and the button changes to "Activate"
5. Click **"Activate"** → the branch returns to green `ACTIVE`

---

### 📦 Test 4 — Product Catalog Management

1. Franchisor → **Catalog tab**
2. **Stock Items subtab:**
   - Click "Add Stock Item" → enter a name (e.g. "Coffee Beans"), unit (e.g. "grams"), description, and reorder level
   - The new item appears in the list
   - Click **"View Products"** on any stock item to see which products use it
3. **Categories subtab:**
   - Click "Add Category" → enter a name (e.g. "Hot Drinks")
   - Duplicate names are rejected with an error message
4. **Products subtab:**
   - Click "Add Product" → fill in name, category, price, description
   - Click "Edit" on any product → modify fields and save
   - Click the green "Active" badge on a product → confirm → badge changes to gray "Inactive"
5. **Recipes subtab:**
   - Select a product → click "View Ingredients"
   - Link stock items to the product with quantities (e.g. "Cappuccino needs 18g Coffee Beans")
   - Add and remove ingredients in real time

---

### 💎 Test 5 — Royalty Configuration

1. Franchisor → **Royalty tab**
2. Current config shows Franchisor Cut % and Branch Owner Cut % (must sum to 100%)
3. Click **"Edit Configuration"** (or "Set Configuration" if none exists):
   - Enter the franchisor cut percentage
   - Click **"Save Configuration"**
4. Scroll down to **Royalty Summary**
5. Select a month and year → click **"Load Summary"**
6. The table shows per-branch: Total Sales, Franchisor Earned, Branch Owner Earned, Cut %
7. All amounts shown in ₹ (INR) format

---

### 📊 Test 6 — Financial Reports & PDF Export

1. Franchisor → **Reports tab**
2. Select a month and year → click **"Generate Report"**
3. Summary cards appear: Total Sales, Total Expenses, Profit/Loss
4. An interactive **bar chart** shows sales by branch (hover for tooltips)
5. **Branch Breakdown** table — click "View Sales Breakdown" to expand product-level details
6. If royalty is configured, **Franchisor Earned** and **Branch Owner Earned** columns appear
7. **Expense Breakdown** section shows per-branch expenses grouped by category
8. Click **"Download PDF"** → a professionally formatted PDF downloads with:
   - Header: "Relay — Franchise Management System"
   - Stats cards, charts, branch breakdown table, expense section
   - Page numbers in footer
   - All monetary values in ₹ format
9. Select a future month with no data → generate → report shows all zeros without error

---

### 🏢 Test 7 — Branch Owner (Franchisee) Dashboard

1. Log in as a branch owner (e.g. `rahul@mcd-alkapuri.com` / `owner123`)
2. You land on the **Franchisee Dashboard → Overview tab**
3. See metrics: Revenue (MTD), Inventory Value, Pending Requests, Pending Quantity, Royalty Earned (MTD)
4. Recent sales table below with date, amount, payment mode
5. **FAQ Accordion** at the bottom — 6 Q&A items for branch owner operations

---

### 📦 Test 8 — Stock Request Approval (Branch Owner)

1. Branch Owner → **Stock Requests tab**
2. See all pending stock requests with status badges
3. Click **"✓ Approve"** on a PENDING request → status changes to APPROVED; inventory updates automatically
4. Click **"✕ Reject"** on a PENDING request → status changes to REJECTED

---

### 👥 Test 9 — Staff Management & Deactivation

1. Branch Owner → **My Staff tab**
2. **Branch Manager section** and **Support Staff table** displayed separately
3. If no manager exists, click **"Appoint Manager"** → fill the form → a manager account is created and force-resets password on first login
4. Active staff rows show a green **"Active"** badge and a red **"Deactivate"** button
5. Click **"Deactivate"** on a staff member → confirm → the Name and Email cells dim but the row stays readable; the badge changes to gray "Inactive" and the button changes to green **"Reactivate"**
6. Click **"Reactivate"** → the row returns to full brightness, badge goes green again
7. Click **"Reset Password"** on any staff member → confirm → toast: user will be prompted to reset on next login
8. Note: the branch owner's own row shows `—` in the Actions column — owners cannot deactivate themselves

**Verify the deactivated account is blocked:**
9. Copy the email of a deactivated staff member
10. Log out → attempt to log in as that user
11. You receive: `"Account is inactive. Contact administrator."` — access is denied at the server level

---

### 💸 Test 10 — Expense Tracking (Branch Owner)

1. Branch Owner → **Expenses tab**
2. See the expense table with: Category, Date, Amount, Logged By, Delete button
3. Click **"Log Expense"** (via the manager or directly) → select category (Rent, Utilities, Salaries, etc.), enter date, amount, and optional description
4. The expense appears in the table
5. Click **"Delete"** on any expense → confirm → expense is removed
6. Verify: negative amounts and zero amounts are rejected with validation errors

---

### 📊 Test 11 — Franchisee Reports & PDF

1. Branch Owner → **Reports tab**
2. Select month/year → **"Generate Report"**
3. Summary cards: Total Sales, Total Expenses, Profit/Loss
4. **Product Sales Breakdown** table shows per-product quantity and revenue (not branch breakdown)
5. **Expense Breakdown** section shows expense categories and amounts
6. Click **"Download PDF"** → PDF downloads with product sales table and expense section

---

### 👔 Test 12 — Manager Dashboard

1. Log in as a Manager (e.g. `mgr.alkapuri@mcd.com` / `manager123`)
2. On first login: forced password reset page — enter and confirm a new password (must meet strength rules)
3. You land on the **Manager Dashboard → Overview tab** with metric cards: Today's Sales, Low Stock Items, Pending Requests
4. **FAQ Accordion** below with 6 Q&A items

**My Staff tab:**

5. Branch Owner section and Support Staff table visible
6. Click **"Add Staff"** → fill form (name, email, phone, temporary password) → staff member appears in table
7. Click **"Reset Password"** on any staff member to force password reset on next login

**Inventory tab:**

8. See all stock items for this branch with current quantities and reorder levels
9. Items below reorder level show amber background; a **low-stock banner** appears at the top of every tab
10. Click **"Add Item"** → select stock item, set quantity and reorder level → item appears in inventory
11. Try adding the same item twice → error: "This item already exists in inventory. Use Record Delivery..."
12. Click **"Record Delivery"** → enter stock item, quantity, and notes → inventory updates; row briefly pulses

**Sales tab:**

13. Click **"Log Sale"** → select product, quantity, price
14. Click **"+ Add Product"** to add multiple products to the same sale
15. Choose payment mode (Cash / Card / UPI) and confirm
16. The new sale appears in the sales history table with the correct date/time and payment mode

**Stock Requests tab:**

17. Click **"New Request"** → select stock item, enter quantity and estimated unit cost → submitted as PENDING
18. View all existing requests with status badges

**Expenses tab:**

19. Click **"Log Expense"** → select category, enter date, amount, and optional description
20. Total expenses shown in header
21. Click **"Delete"** on any expense → expense removed

---

### 🛒 Test 13 — Staff Dashboard

1. Log in as a Staff member (e.g. `staff1.alkapuri@mcd.com` / `staff123`)
2. On first login: forced password reset page
3. You land on the **Staff Dashboard → Inventory tab**
4. See current stock levels; items below reorder threshold highlight in amber
5. If any items are low, a **persistent amber banner** appears at the top of every tab (dismissible with ✕)
6. Click **"Record Delivery"** → select item, enter quantity → inventory updates; row briefly pulses
7. Switch to the **Sales tab** → click **"Log Sale"** → fill in product, quantity, payment mode
8. Try logging a sale when an ingredient is below required quantity → error: "Insufficient stock for [item]."
9. Staff cannot edit or delete existing records — no edit/delete buttons visible

---

### 🌍 Test 14 — Public Pages & Navigation

1. **Home page** (`http://localhost:3000/`): Hero section, stats, feature highlights, role cards, CTA banner
2. **Features page** (click "Features" in navbar): Grid of 6 feature cards
3. **Contact page** (click "Contact"): Contact form labeled **"Demo Only"** — submit returns success toast but nothing is sent
4. **Signup Selection** (click "Sign Up"): Two cards — "Register as Franchisor" and "Apply for a Branch"
5. Click **"← Back"** on any registration form → returns to signup selection page
6. Resize browser to mobile width → **hamburger menu** appears; all links accessible
7. Click **"Log In"** in navbar → redirected to login page
8. Click **"Forgot password?"** on login page → modal appears with support contact info

---

## 6. Running the Test Suite

### Backend Tests (58 tests)
```bash
cd backend

# Make sure venv is active
venv\Scripts\activate    # Windows

python -m pytest tests/ -v
```

Expected result:
```
test_auth.py::test_login_success                          PASSED
test_auth.py::test_inactive_user_blocked                  PASSED
... (58 Pytest integration/DB tests — ALL PASSING)
```

### Frontend Tests (42 tests)
```bash
cd frontend
npm test
```

Expected result:
```
✓ utils.formatters.test.js (4 tests)
✓ utils.validators.test.js (9 tests)
✓ utils.auth.test.js (3 tests)
Test Files: 7 total
Tests: 42 passed
```

---

## 7. Common Issues & Fixes

### Port 5000 already in use (Backend)

**Windows:**
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

**Mac / Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

---

### Port 3000 already in use (Frontend)

**Windows:**
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```

**Mac / Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

---

### Database seems wrong / want a clean slate

```bash
cd backend
del relay.db           # Windows
# rm relay.db          (Mac/Linux)
python run.py          # Re-creates and re-seeds everything
```

Default admin password resets to `admin123`.

---

### "Module not found" errors

Backend:
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

Frontend:
```bash
cd frontend
npm install
```

---

### Frontend shows blank page or auth errors after backend restart

The `SECRET_KEY` is consistent across runs in development (set in `.env`). If you changed the secret between runs, existing tokens become invalid. Log out and log back in to get a fresh token.

---

### Deactivated user still seems to have access

The token check happens server-side on every request. If a logged-in session was open when the account was deactivated, the next API call will return `403 — Account is inactive` and the frontend will auto-logout. No manual action needed.

---

### PDF download shows "Loading Document…" for a long time

The first PDF generation takes a few seconds as the renderer initializes. Subsequent downloads are faster. If it stays stuck, check the browser console for errors and ensure all API data loaded correctly.

---

## 🎉 You're Ready

Every feature is live, every test passes, and the system is ready to demo.

**Relay — 100 Tests Passing | April 2026**