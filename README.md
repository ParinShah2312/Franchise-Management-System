# 🚀 Relay - Franchise Management System

**A professional, production-ready franchise management platform with multi-role support, detailed application workflows, and comprehensive sales tracking.**

---

## ⚡ Quick Start

👉 **[START_HERE.md](START_HERE.md)** - Complete startup guide from fresh laptop boot

---

## 🌟 What This Is

Relay is a complete franchise management system that allows:
- **Franchisors (Admin)** to review applications, approve franchises, and monitor sales activity
- **Franchisees** to apply for franchises, submit daily sales, and track their performance

---

## ✨ Key Features

### **Multi-Role System**
- Admin dashboard with system-wide metrics
- Franchisee dashboard with personal data
- Pending approval workflow

### **Detailed Application Process**
- 11-field registration form
- Property size & investment capacity
- Business experience & motivation
- Admin review with detailed modal

### **Sales Tracking**
- Franchisees submit daily sales
- Admin sees recent sales activity
- System-wide revenue tracking

### **Professional UI & Architecture**
- Modern, responsive design with Tailwind CSS
- Modular React components (Shared UI, Dashboard Partials)
- Custom React Hooks (`useAuth`, `useInventory`, `useSales`) for clean data fetching
- Toast notifications & error boundaries

**[See FEATURES.md](FEATURES.md)** for complete feature list

---

## 🛠️ Tech Stack

**Frontend:** React + Vite + Tailwind CSS  
**Backend:** Flask (Python)  
**Database:** SQLite (auto-configured)

---

## 🚀 Quick Setup

**👉 For complete setup instructions, see [START_HERE.md](START_HERE.md)**

**Short version:**

1. **Setup Database:**
   ```bash
   mysql -u root -pYOUR_PASSWORD < database/init_db.sql
   ```

2. **Start Backend:**
   ```bash
   cd backend && source venv/bin/activate && python run.py
   ```

3. **Start Frontend:**
   ```bash
   cd frontend && npm run dev
   ```

4. **Open Browser:**
   - Go to `http://localhost:3000`
   - Login: `admin@relay.com` / `admin123`

---

## 🎯 Default Credentials

**Admin:**
- Email: `admin@relay.com`
- Password: `admin123`

**Franchisees:** Create via registration form!

## 📁 Project Structure

```
Relay/
├── backend/
│   ├── app/                  # Flask application package (modular blueprints)
│   ├── run.py                # Application entry point
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React application (all components)
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Global styles and Tailwind imports
│   ├── index.html            # HTML template
│   ├── package.json          # Node dependencies
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind CSS configuration
├── database/
│   └── init_db.sql           # Database schema + sample data
├── START_HERE.md             # Complete startup guide ⭐
├── FEATURES.md               # Full feature list
└── README.md                 # This file (project overview)
```

---

## 📚 Documentation

- **[START_HERE.md](START_HERE.md)** ⭐ - Complete startup guide (start here!)
- **[FEATURES.md](FEATURES.md)** - Full feature list
- **README.md** - This file (project overview)

---

## 🎯 Sample Data

After database setup, you'll have:
- 3 sample franchises
- 6 sample sales transactions  
- Total revenue: ~$10,672
- 1 admin account

---

## 🤝 Support

Having issues? Check [START_HERE.md](START_HERE.md) for common problems and fixes!

---

**Built with React, Flask, and SQLite | Version 3.0 (Modular Refactor) | March 2026**
