# 🚀 RELAY FRANCHISE MANAGEMENT SYSTEM - COMPLETE STARTUP GUIDE

**Start your demo from a fresh laptop boot in 2 minutes!**

> 💡 **Note:** This app uses SQLite (no MySQL server needed!) - everything auto-configures on first run.

---

## 📋 Table of Contents

1. [Quick Start (After Laptop Boot)](#quick-start-after-laptop-boot)
2. [Prerequisites Check](#prerequisites-check)
3. [Test the System](#test-the-system)
4. [Common Issues & Fixes](#common-issues--fixes)

---

## ⚡ Quick Start (After Laptop Boot)

**Every time you start your laptop and want to run the demo:**

### **Step 1: Open Terminal 1 - Start Backend**

```bash
cd /Users/prayag/Desktop/Relay/backend

# Activate virtual environment
source venv/bin/activate

# Start Flask server
python app.py
```

**Expected Output:**
```
✅ Database initialized successfully!
 * Running on http://127.0.0.1:5001
```

✅ **Leave this terminal running!**

---

### **Step 2: Open Terminal 2 - Start Frontend**

**Open a NEW terminal window:**

```bash
cd /Users/prayag/Desktop/Relay/frontend

# Start React development server
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
```

✅ **Browser opens automatically to http://localhost:3000**

---

### **Step 3: Login & Test**

**Login with:**
- Email: `admin@relay.com`
- Password: `admin123`

**That's it! You're running! 🎉**

---

## ✅ Prerequisites Check

**Only needed for first-time setup:**

### **1. Python 3 Installed**

```bash
python3 --version
```

Should show Python 3.8 or higher.

---

### **2. Node.js and npm Installed**

```bash
node --version
npm --version
```

If not installed:
```bash
brew install node
```

---

## 🗄️ Database (SQLite - No Setup Needed!)

**Your app now uses SQLite:**
- ✅ No MySQL server needed
- ✅ No password configuration
- ✅ Database auto-creates on first run
- ✅ Single file: `backend/relay.db`

**To reset database:**
```bash
cd /Users/prayag/Desktop/Relay/backend
rm relay.db
python app.py
```

Database recreates automatically with sample data!


---

## 🧪 Test the System

Now you have both servers running! Let's test everything:

---

### **Test 1: Admin Login & Dashboard**

1. **Login:**
   - Email: `admin@relay.com`
   - Password: `admin123`

2. **✅ You should see:**
   - System Metrics (Total Revenue, Monthly Revenue)
   - Franchise Statistics (Total, Active, Pending)
   - Recent Sales Activity table
   - 3 sample franchises

---

### **Test 2: Register New Franchisee**

1. **Logout** from admin
2. Click **"Apply here"**
3. **Fill the detailed application form:**

**Account Information:**
- Email: `test@franchise.com`
- Password: `test123`

**Personal Information:**
- Full Name: `Test Owner`
- Phone: `+1-555-1234`

**Franchise Details:**
- Franchise Name: `Test Burgers`
- Location: `Austin, TX`
- Expected Opening Date: Select any future date

**Business Information:**
- Property Size: Select `2000 - 3000 sq ft`
- Investment Capacity: Select `$100,000 - $200,000`
- Business Experience: 
  ```
  I have 5 years of restaurant management experience
  ```
- Why Relay:
  ```
  I want to build a successful franchise business
  ```

4. Click **"Submit Franchise Application"**
5. ✅ See success message

---

### **Test 3: Pending Franchisee Login**

1. **Login** with:
   - Email: `test@franchise.com`
   - Password: `test123`

2. **✅ You should see:**
   ```
   ⏰ Application Pending
   
   Your franchise application is awaiting 
   admin approval...
   ```

3. **Logout**

---

### **Test 4: Admin Approves Application**

1. **Login as admin** (`admin@relay.com` / `admin123`)
2. Find **"Test Burgers"** with yellow **Pending** badge
3. Click **"📋 Review Application"**
4. **✅ Modal opens showing:**
   - All franchise details
   - Property size
   - Investment capacity
   - Business experience
   - Motivation/reason
5. Click **"✓ Approve Application"**
6. ✅ Badge turns **green**
7. ✅ Success toast appears
8. **Logout**

---

### **Test 5: Franchisee Gets Dashboard Access**

1. **Login as franchisee** (`test@franchise.com` / `test123`)
2. **✅ You should now see:**
   - Franchise dashboard (NOT pending screen!)
   - Your franchise details
   - "Enter Daily Sales" form
   - Sales history section
   - Total sales: $0.00

---

### **Test 6: Submit Sales Data**

1. **In "Enter Daily Sales" section:**
   - Sale Date: Today's date (auto-filled)
   - Total Amount: `500.00`

2. Click **"Submit Sales"**

3. **✅ You should see:**
   - Green success toast
   - Sale appears in "Recent Sales" list
   - Total Sales updates to **$500.00**

4. **Logout**

---

### **Test 7: Admin Sees Sales Activity**

1. **Login as admin** (`admin@relay.com` / `admin123`)
2. Scroll to **"📊 Recent Sales Activity"**
3. **✅ You should see:**
   - Your $500 sale at the TOP
   - Highlighted in light blue
   - "Latest" badge
   - Shows: Test Burgers, Test Owner, Austin TX, $500.00, date, time
4. **✅ System Metrics updated:**
   - Total Revenue increased by $500

---

## 🎯 Complete Feature List

Your system now has:

✅ **Multi-Role Authentication**
- Admin dashboard
- Franchisee dashboard
- Role-based routing

✅ **Detailed Franchise Registration**
- 11 application fields
- Property size, investment capacity
- Business experience, motivation
- Contact information

✅ **Admin Review Process**
- Review application modal
- Approve/reject workflow
- View all applicant details

✅ **Franchise Management (CRUD)**
- Create franchises
- Read/view details
- Update franchise info
- Delete franchises
- Search & filter

✅ **Sales Tracking**
- Franchisees enter daily sales
- View sales history
- Calculate total revenue
- Recent sales activity feed

✅ **System Metrics Dashboard**
- Total system revenue
- Monthly revenue
- Franchise statistics
- Active vs pending counts

✅ **Recent Sales Activity**
- Last 10 sales across all franchises
- Shows franchise name, owner, location
- Sale amount, date, submission time
- Latest sale highlighted

---

## 🐛 Common Issues & Fixes

### **Issue 1: "Port 5001 already in use"**

**Fix:**
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Restart backend
cd /Users/prayag/Desktop/Relay/backend
source venv/bin/activate
python app.py
```

---

### **Issue 2: "Port 3000 already in use"**

**Fix:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart frontend
cd /Users/prayag/Desktop/Relay/frontend
npm run dev
```

---

### **Issue 3: Database seems corrupted or has wrong data**

**Fix - Reset Database:**
```bash
cd /Users/prayag/Desktop/Relay/backend

# Delete old database
rm relay.db

# Restart backend (auto-creates fresh database)
python app.py
```

---

### **Issue 4: "Module not found" errors**

**Fix - Reinstall Dependencies:**

**Backend:**
```bash
cd /Users/prayag/Desktop/Relay/backend
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd /Users/prayag/Desktop/Relay/frontend
npm install
```

---

## ✅ Daily Startup Checklist

**Every time you start your laptop and want to run the demo:**

### **Terminal 1 (Backend):**
```bash
cd /Users/prayag/Desktop/Relay/backend
source venv/bin/activate
python app.py
```
Wait for: `✅ Database initialized successfully!`

### **Terminal 2 (Frontend):**
```bash
cd /Users/prayag/Desktop/Relay/frontend
npm run dev
```
Wait for: Browser opens to `http://localhost:3000`

### **Login:**
- Email: `admin@relay.com`
- Password: `admin123`

✅ **Ready to demo! 🎯**

---

## 🔑 Default Login Credentials

### **Admin:**
- Email: `admin@relay.com`
- Password: `admin123`

### **Franchisees:**
Create them via registration form!

---

## 🎉 You're All Set!

Your Relay Franchise Management System is:
- ✅ Professional and production-ready
- ✅ Feature-complete with multi-role support
- ✅ Ready to demo to stakeholders
- ✅ Fully documented and maintainable

**Enjoy your impressive prototype! 🚀**

---

**Last Updated:** October 19, 2025  
**Version:** 2.0 (Enhanced with Sales Tracking)