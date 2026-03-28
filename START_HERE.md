# 🚀 RELAY FRANCHISE MANAGEMENT SYSTEM - COMPLETE STARTUP GUIDE

**Start your demo from a fresh laptop boot in under 2 minutes!**

> 💡 **Note:** This app uses SQLite (no MySQL server needed!) - everything auto-configures on the very first run. The codebase is fully modular and built with custom React Hooks!

---

## 📋 Table of Contents

1. [Quick Start (After Laptop Boot)](#1-quick-start-after-laptop-boot)
2. [Prerequisites Check](#2-prerequisites-check)
3. [Test the System](#3-test-the-system)
4. [Complete Feature List](#4-complete-feature-list)
5. [Common Issues & Fixes](#5-common-issues--fixes)

---

## 1. ⚡ Quick Start (After Laptop Boot)

**Every time you start your laptop and want to run the demo:**

### **Step 1: Open Terminal 1 - Start Backend**

```bash
cd backend

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Create environment variables file (first time only)
# On Mac/Linux: cp .env.example .env
# On Windows: copy .env.example .env

# Start Flask server
python run.py
```

**Expected Output:**
```text
✅ Database initialized successfully!
 * Running on http://127.0.0.1:5000
```
✅ **Leave this terminal running!**

---

### **Step 2: Open Terminal 2 - Start Frontend**

**Open a NEW terminal window:**

```bash
cd frontend

# Start React development server
npm run dev
```

**Expected Output:**
```text
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
```
✅ **Browser opens automatically to http://localhost:3000**

---

### **Step 3: Login & Test**

**Login with the Default Admin:**
- Email: `admin@relay.com`
- Password: `admin123`

**That's it! You're running! 🎉**

---

## 2. ✅ Prerequisites Check

**Only needed for first-time setup or if you switched laptops:**

1. **Python 3 Installed:** `python --version` (Should be 3.8+)
2. **Node.js and npm Installed:** `npm --version` (Should be 18+)

### 🗄️ Database (SQLite - No Setup Needed!)
- ✅ No MySQL server needed
- ✅ No password configuration
- ✅ Single file: `backend/relay.db`
- **To reset the database, simply delete `backend/relay.db` and run `python run.py` again. Sample data will automatically regenerate.**

---

## 3. 🧪 Test the System

With both servers running, you can test the 4 major user roles!

### **Test 1: Admin Login & System Metrics**
1. **Login:** `admin@relay.com` / `admin123`
2. **You should see:**
   - System Metrics (Total Revenue, Active Franchises)
   - Recent Sales Activity mapping
   - Pending Applicant Approvals
   - Global Inventory Oversight

### **Test 2: Register New Franchisee**
1. **Logout** from admin, click **"Apply here"** on the login screen.
2. Fill the detailed 11-field application form (Property Size, Investment Capacity, Location, etc.)
3. Submit and receive a success toast notification!
4. **Log back in as Admin** -> Find the yellow "Pending" application -> Click "Review" -> Click **"Approve"**.

### **Test 3: The 4-Role Dashboard Ecosystem**
Relay supports four distinct dashboards. You can test them by creating users via the application or checking the database for auto-seeded users:
- **Admin (Franchisor):** Global oversight, approvals.
- **Franchisee (Owner):** Oversees a specific branch, views branch analytics, manages local managers.
- **Manager:** Oversees staff within a branch, fulfills local inventory requests, handles daily branch operations.
- **Staff:** Submits daily pos sales, checks local stock, requests inventory from the manager.

### **Test 4: Sales & Inventory Flow**
1. Log in as a **Staff** or **Manager**.
2. Navigate to the **Sales** tab to submit daily revenue numbers.
3. Navigate to the **Inventory** tab to view your branch's current stock levels and submit a request for low-stock items.
4. Log in as **Admin** to see those sales instantly reflected in the Global Revenue chart!

---

## 4. 🎯 Complete Feature List

**Version 3.0 Architecture (Current Refactored State):**
✅ **Fully Modular Backend:** Application logic segmented into `routes/`, `services/`, `models/`, and `utils/` for massive scalability.
✅ **Decoupled API Layer:** Frontend API interactions centralized in `api.js` with structured global error boundaries and automatic 401 logouts.
✅ **Modular React Frontend:** Large dashboards and registration pages are extracted into clean, context-specific components (`admin/`, `manager/`, `staff/`, `register/`).
✅ **Shared Utility Layer:** Repeated layout wrappers, currency handling, date formatting, and input sanitization abstracted into `utils/` and `layouts/`.
✅ **Custom React Hooks:** All data fetching decoupled from components into `useAuth`, `useInventory`, `useSales`, `useStaff`, `useFranchiseMetrics`, and `useRequests`.
✅ **Zero-Warning Codebase:** Strictly linted using `eslint` and `ruff`.
✅ **Multi-Role Authentication:** Admin, Franchisee, Manager, Staff.
✅ **Detailed Franchise Registration:** Segmented registration flow for investment capacity, business experience, file uploads.
✅ **Admin Review Process:** Modal-based approve/reject workflow.
✅ **Hierarchical Inventory Management:** Stock limits, low-stock warnings, request tracking.
✅ **Sales Tracking:** Daily submission, historical graphs, system-wide revenue tracking.

---

## 5. 🐛 Common Issues & Fixes

### **Issue 1: "Port 5000 already in use" (Backend)**
**Fix (Windows):**
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```
**Fix (Mac/Linux):**
```bash
lsof -ti:5000 | xargs kill -9
```

### **Issue 2: "Port 3000 already in use" (Frontend)**
**Fix (Windows):**
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force
```
**Fix (Mac/Linux):**
```bash
lsof -ti:3000 | xargs kill -9
```

### **Issue 3: Database seems corrupted / Forgot Passwords**
**Fix - Hard Reset Database:**
```bash
cd backend
rm relay.db   # On Windows: del relay.db
python run.py # Auto-creates fresh database with admin password 'admin123'
```

### **Issue 4: "Module not found" errors**
**Fix - Reinstall Dependencies:**
- Backend: `pip install -r requirements.txt`
- Frontend: `npm install`

---

## 🎉 You're All Set!

Your Relay Franchise Management System is fully verified, refactored, and ready to impress stakeholders.

**Enjoy your polished prototype! 🚀**