# 🚀 Relay Franchise Management System — Start Here

> **From a fresh laptop boot to a fully running demo in under 2 minutes.**
> No MySQL, no Postgres, no database server of any kind — SQLite auto-configures itself.

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
  VITE v5.x.x  ready in XXX ms
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
| **Franchisor** | `admin@relay.com` | `admin123` | Full admin dashboard |
| **Branch Owner** | *(register via application form)* | *(your choice)* | Franchisee dashboard |
| **Manager** | *(created by branch owner)* | *(temporary, reset on first login)* | Manager dashboard |
| **Staff** | *(register via staff registration)* | *(your choice)* | Staff dashboard |

> **Tip:** To reset everything and start fresh, delete `backend/relay.db` and restart `python run.py`. All seed data regenerates automatically.

---

## 5. Complete Feature Walkthrough

Work through these tests in order to see every feature in the system.

---

### 🔐 Test 1 — Franchisor Login & Overview Dashboard

1. Go to `http://localhost:3000`
2. Log in: `admin@relay.com` / `admin123`
3. You land on the **Franchisor Dashboard → Overview tab**
4. You should see metrics cards: Total Revenue, Active Branches, Total Franchises, Pending Applications
5. Click **Refresh Data** — metrics reload from the live API

---

### 📋 Test 2 — Franchise Application Workflow

1. **Log out** from the franchisor
2. On the login page, click **"Apply here"** to start a franchisee registration
3. Fill in the 11-field form:
   - Personal details (name, email, phone, password)
   - Business details (franchise brand, preferred branch location)
   - Background (property size, investment capacity, prior business experience)
4. Submit — you receive a success toast and are redirected to the **Pending Dashboard**
5. **Log back in as Franchisor** → open the **Applications tab**
6. Find the yellow `PENDING` badge row → click **"Review"**
7. The Application Modal shows full applicant detail
8. Click **"Approve"** — the application is accepted, a branch and branch-owner role are created automatically, and the row turns green `APPROVED`
9. **Try rejection too:** Create another application, then click "Reject" — enter a reason (minimum 10 characters) and submit

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
   - Click "Add Stock Item" → enter a name (e.g. "Coffee Beans"), unit (e.g. "grams"), and reorder level
   - The new item appears in the list
3. **Categories subtab:**
   - Click "Add Category" → enter a name (e.g. "Hot Drinks")
4. **Products subtab:**
   - Click "Add Product" → fill in name, category, price, description
   - Click "Edit" on any product → modify fields and save
5. **Recipes subtab:**
   - Select a product → click "Manage Ingredients"
   - Link stock items to the product with quantities (e.g. "Cappuccino needs 18g Coffee Beans")
   - Add and remove ingredients in real time

---

### 💎 Test 5 — Royalty Configuration

1. Franchisor → **Royalty tab**
2. If no config exists, fill in:
   - Royalty percentage (e.g. `8`)
   - Minimum monthly royalty (e.g. `500`)
   - Maximum monthly royalty (e.g. `5000`)
   - Click **"Save Configuration"**
3. Scroll down to **Royalty Summary**
4. Select a month and year → click **"Generate Summary"**
5. The table shows per-branch: total sales, royalty owed (capped to min/max), and transaction count

---

### 📊 Test 6 — Financial Reports & CSV Export

1. Franchisor → **Reports tab**
2. Select a month and year → click **"Generate Report"**
3. A report table appears with per-branch revenue, royalty, and transaction counts
4. Click **"Download CSV"** → a `.csv` file downloads immediately (client-side generation)

---

### 🏢 Test 7 — Branch Owner (Franchisee) Dashboard

1. Log in as a branch owner (an approved applicant from Test 2)
2. You land on the **Franchisee Dashboard → Overview tab**
3. See branch revenue, sales count, and current month royalty summary
4. Click the **Requests tab** — see any pending stock requests from staff
5. Approve or reject a request with adjusted quantities

---

### 👥 Test 8 — Staff Management & Deactivation

1. Branch Owner → **My Staff tab**
2. If no manager exists, click **"Appoint Manager"** → fill the form → a manager account is created and force-resets password on first login
3. You see a table of all staff with: Name, Email, Status badge, Actions
4. Active staff rows show a green **"Active"** badge and a red **"Deactivate"** button
5. Click **"Deactivate"** on a staff member → confirm → the Name and Email cells dim but the row stays readable; the badge changes to gray "Inactive" and the button changes to green **"Reactivate"**
6. Click **"Reactivate"** → the row returns to full brightness, badge goes green again
7. Note: the branch owner's own row shows `—` in the Actions column — owners cannot deactivate themselves

**Verify the deactivated account is blocked:**
8. Copy the email of a deactivated staff member
9. Log out → attempt to log in as that user
10. You receive: `"Account is inactive. Contact administrator."` — access is denied at the server level

---

### 👔 Test 9 — Manager Dashboard

1. Log in as a Manager (created in Test 8)
2. On first login: forced password reset page — enter and confirm a new password
3. You land on the **Manager Dashboard → Overview tab** with branch metrics
4. **Inventory tab:**
   - See all stock items for this branch with current quantities
   - Items below reorder level show a low-stock banner at the top of the page
   - Click **"Record Delivery"** → enter stock item, quantity, and notes → inventory updates
5. **Requests tab:**
   - See all pending purchase requests from staff
   - Approve or reject, optionally adjusting the quantity
6. **Sales tab:**
   - Click **"Record Sale"** → select product, quantity, price, payment mode (Cash / Card / UPI)
   - The new sale appears in the sales history table with the correct date/time and payment mode
7. **Staff tab:** View all branch staff with their details

---

### 🛒 Test 10 — Staff Dashboard

1. Log in as a Staff member
2. You land on the **Staff Dashboard → Inventory tab**
3. See current stock levels; items below reorder threshold highlight in red
4. If any items are low, a dismissible banner appears at the top of every tab
5. Click **"Request Stock"** → select item, enter quantity and reason → submit
6. Switch to the **Sales tab** → click **"Record Sale"** → fill in product, qty, price, payment mode
7. Log in as Manager and confirm the request appears in the Requests tab

---

### 🏪 Test 11 — Franchisee Reports

1. Log in as Branch Owner → **Reports tab**
2. Select month/year → **"Generate Report"**
3. See branch-level: revenue, transactions, royalty owed
4. Download CSV

---

## 6. Running the Test Suite

```bash
cd backend

# Make sure venv is active
venv\Scripts\activate    # Windows

python -m pytest tests/ -v
```

Expected result:
```
test_auth.py::test_login_success              PASSED
test_auth.py::test_inactive_user_blocked      PASSED
test_models.py::test_reference_data_seeded    PASSED
test_models.py::test_hierarchy_creation       PASSED
test_inventory.py::test_list_stock_items      PASSED
...
10 passed, 12 warnings in 3.xx s
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

The JWT secret resets between runs in development. Log out and log back in — this clears the stale token.

---

### Deactivated user still seems to have access

The token check happens server-side on every request. If a logged-in session was open when the account was deactivated, the next API call will return `403 — Account is inactive` and the frontend will auto-logout. No manual action needed.

---

## 🎉 You're Ready

Every feature is live, every test passes, and the system is ready to demo.

**Relay — Phase 15 Complete | March 2026**