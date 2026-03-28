# 🚀 Relay - Franchise Management System

**A professional, production-ready franchise management platform with a fully modular React architecture, 4 distinct user roles, automated daily sales tracking, and comprehensive inventory management.**

---

## ⚡ Quick Start

👉 **[START_HERE.md](START_HERE.md)** - Complete startup guide from a fresh laptop boot. No database server configuration necessary!

---

## 🌟 What This Is

Relay is a complete end-to-end franchise management ecosystem designed to streamline operations across an entire franchise network. It empowers:
- **Franchisors (Admin)** to review applications, approve franchises, manage global inventory, and monitor system-wide sales activity.
- **Franchisees (Owners)** to apply for franchises, manage their specific branch, oversee local staff, and track branch performance.
- **Managers** to oversee day-to-day operations, approve staff requests, handle inventory restocks, and submit daily sales data.
- **Staff** to process daily transactions, check local stock levels, and submit inventory requests to their managers.

---

## ✨ Key Features

### **Dynamic Multi-Role Ecosystem**
- **Admin Dashboard:** System-wide metrics, franchise application review, and global sales oversight.
- **Franchisee Dashboard:** Personal branch data, manager oversight, and branch-level analytics.
- **Manager Dashboard:** Day-to-day operations, local staff management, and inventory fulfillment.
- **Staff Dashboard:** Point-of-sale data entry, low-stock alerts, and direct inventory requests.

### **Detailed Application Workflow**
- Comprehensive 11-field registration form supporting property size, investment capacity, and business experience.
- Automated routing for pending applications.
- Admin review modal with full applicant background checks and one-click approvals.

### **Sales & Inventory Tracking**
- Staff and Managers submit daily sales which instantly update global revenue tracking.
- Local inventory tracking with configurable low-stock thresholds.
- Hierarchical inventory requests (Staff -> Manager -> Admin).

### **Professional Modular UI & Architecture**
- Designed with **Tailwind CSS** for a responsive, modern interface.
- Built on a highly modular **React Component Architecture** featuring abstracted UI elements (Tabs, Tables, Modals, StatCards).
- Intelligent state management via **Custom React Hooks** (`useAuth`, `useInventory`, `useSales`, `useStaff`, `useFranchiseMetrics`, `useRequests`).
- Global toast notifications and robust error boundaries.

---

## 🛠️ Tech Stack

**Frontend:** React + Vite + Tailwind CSS + React Router  
**Backend:** Flask (Python) + SQLAlchemy + bcrypt  
**Database:** SQLite (Auto-configured, zero-setup required)  
**Code Quality:** Strictly linted (ESLint + Ruff)  

---

## 🚀 Quick Setup

**👉 For complete setup instructions, see [START_HERE.md](START_HERE.md)**

**Short version:**

1. **Start Backend (Auto-creates SQLite DB!):**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # (On Windows use: venv\Scripts\activate)
   pip install -r requirements.txt
   copy .env.example .env    # (On Mac/Linux use: cp .env.example .env)
   python run.py
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Open Browser:**
   - Go to `http://localhost:3000`
   - Default Admin Login: `admin@relay.com` / `admin123`

---

## 📁 Project Structure

```
Relay/
├── backend/
│   ├── app/                  # Flask application (Modular logic)
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── routes/           # Blueprint API Endpoints
│   │   ├── services/         # Business Logic & DB Interactions
│   │   └── utils/            # Shared Decorators & Validation
│   ├── tests/                # Pytest unit & integration tests
│   ├── run.py                # Application entry point
│   ├── requirements.txt      # Python dependencies
│   └── relay.db              # SQLite Database (Auto-generated)
├── frontend/
│   ├── src/
│   │   ├── api.js            # Axios/Fetch wrapper (Global Interceptors & Error Handling)
│   │   ├── components/       # Modular UI blocks
│   │   │   ├── admin/        # Franchisor Dashboard Modals & Sections
│   │   │   ├── franchisee/   # Franchisee Dashboard Features
│   │   │   ├── layout/       # Navbar & Footer Partials
│   │   │   ├── manager/      # Manager Dashboard Modals & Sections
│   │   │   ├── register/     # Extracted Multi-Step Registration Forms
│   │   │   ├── staff/        # Staff Dashboard Views
│   │   │   └── ui/           # Generic Reusable Components (Tabs, Stats)
│   │   ├── context/          # Global State (AuthContext)
│   │   ├── hooks/            # Custom React Hooks (Data Fetching abstracted)
│   │   ├── layouts/          # Top-Level Layout Wrappers (PublicLayout)
│   │   ├── pages/            # Top-level route container orchestrators
│   │   └── utils/            # Extracted UI Helpers (Calculations, Currencies, Dates)
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
├── START_HERE.md             # Complete startup guide ⭐
└── README.md                 # This file (project overview)
```

---

## 🤝 Support & Maintenance

Having issues? Check the common issues section in **[START_HERE.md](START_HERE.md)**.
Whenever new features are added to this repository, this documentation will be updated to reflect the latest state.

---

**Built with React, Flask, and SQLite | Version 3.0 (Modular Refactor) | March 2026**
