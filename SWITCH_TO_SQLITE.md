# ✅ SWITCH TO SQLITE - NO MORE MYSQL HEADACHES!

## 🎉 What Changed

Your app now uses **SQLite** instead of MySQL:
- ✅ No MySQL server needed
- ✅ No password issues
- ✅ Works instantly
- ✅ Perfect for development
- ✅ Single file database

---

## 🚀 Quick Start (3 Steps)

### **Step 1: Backup Old File (Optional)**

```bash
cd /Users/prayag/Desktop/Relay/backend
mv app.py app_mysql_backup.py
```

---

### **Step 2: Use SQLite Version**

```bash
cd /Users/prayag/Desktop/Relay/backend
mv app_sqlite.py app.py
```

---

### **Step 3: Start Everything**

**Terminal 1 - Backend:**
```bash
cd /Users/prayag/Desktop/Relay/backend
source venv/bin/activate
python app.py
```

**You'll see:**
```
✅ Database initialized successfully!
 * Running on http://127.0.0.1:5001
```

**Terminal 2 - Frontend:**
```bash
cd /Users/prayag/Desktop/Relay/frontend
npm run dev
```

---

## 🧪 Test It

1. Go to `http://localhost:3000`
2. Login:
   - Email: `admin@relay.com`
   - Password: `admin123`

**Should work perfectly!** ✅

---

## 📊 What You Get

Same features, zero MySQL hassle:
- ✅ Admin dashboard
- ✅ Franchise management
- ✅ Sales tracking
- ✅ Recent sales activity
- ✅ All 3 sample franchises
- ✅ Sample sales data

---

## 🗄️ Database File

Your database is now a single file:
```
/Users/prayag/Desktop/Relay/backend/relay.db
```

**To reset database:**
```bash
cd /Users/prayag/Desktop/Relay/backend
rm relay.db
python app.py
```

Database recreates automatically with sample data!

---

## 🔄 Want to Go Back to MySQL?

```bash
cd /Users/prayag/Desktop/Relay/backend
mv app.py app_sqlite.py
mv app_mysql_backup.py app.py
```

---

## ✨ Benefits of SQLite

**For Development:**
- No server to manage
- No password issues
- Works everywhere
- Easy to reset
- Fast and simple

**For Production:**
- Can upgrade to PostgreSQL later
- SQLite handles thousands of users
- Perfect for prototypes

---

**That's it! Run the 3 steps above and you're done! 🎉**
