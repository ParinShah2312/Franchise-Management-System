# 🌟 Relay Franchise Management System - Features

## Complete Feature List

### 🔐 **Multi-Role Authentication System**
- Admin dashboard with full system access
- Franchisee dashboard with personal data view
- Role-based routing and access control
- Secure password hashing (SHA-256)
- Pending approval state for new franchisees

---

### 📝 **Detailed Franchise Registration**
**11 comprehensive application fields:**
- Email & password (account creation)
- Full name & phone number
- Franchise name & location
- Expected opening date
- Property size (dropdown selection)
- Investment capacity (dropdown selection)
- Business experience (detailed text)
- Motivation & goals (detailed text)

---

### 👨‍💼 **Admin Dashboard Features**

**System Metrics:**
- Total system revenue (all-time)
- Monthly revenue (current month)
- Total franchises count
- Active franchises count
- Pending franchises count

**Franchise Management (CRUD):**
- ✅ Create new franchises
- ✅ Read/view franchise details
- ✅ Update franchise information
- ✅ Delete franchises
- ✅ Approve pending applications
- ✅ Search franchises (by name, owner, location)
- ✅ Filter by status (All, Active, Pending)

**Application Review:**
- Detailed review modal showing:
  - Franchise information
  - Owner contact details
  - Property size & investment capacity
  - Business experience
  - Motivation/reason for franchise
  - Application submission date/time
- Approve directly from review modal

**Recent Sales Activity:**
- Last 10 sales across all franchises
- Shows franchise name, owner, location
- Sale amount, date, submission time
- Latest sale highlighted with badge
- Track which franchises are active

---

### 👥 **Franchisee Dashboard Features**

**Pending State:**
- Clear "Application Pending" message
- No dashboard access until approved
- Can login but restricted view

**Active State (After Approval):**
- View personal franchise details
- Enter daily sales data
- View sales history
- See total sales amount
- Professional dashboard layout

**Sales Entry:**
- Date picker (auto-filled with today)
- Amount input (validated)
- Submit button with loading state
- Success notifications
- Immediate reflection in history

---

### 📊 **Sales Tracking System**

**For Franchisees:**
- Easy sales entry form
- Sales history table
- Total sales calculation
- Date and amount display

**For Admin:**
- System-wide sales visibility
- Recent sales activity feed
- Revenue attribution by franchise
- Real-time metrics updates

---

### 🎨 **User Interface Features**

**Professional Design:**
- Modern gradient backgrounds
- Clean card-based layouts
- Smooth hover effects
- Responsive design (mobile-friendly)
- Color-coded status badges

**Interactive Elements:**
- Toast notifications (success, error, info)
- Loading spinners
- Modal dialogs
- Confirmation prompts
- Form validation

**Visual Feedback:**
- Green badges for active status
- Yellow badges for pending status
- Blue highlighting for latest activity
- Hover effects on cards
- Smooth transitions

---

### 🔔 **Notifications & Feedback**

**Toast Messages:**
- Auto-dismiss after 3 seconds
- Slide-in animation
- Color-coded by type (green, red, blue)
- Shows on all CRUD operations

**Success Messages:**
- Franchise approved
- Sales submitted
- Application registered
- Updates saved

**Error Handling:**
- Database connection errors
- Validation errors
- Duplicate email detection
- Network error messages

---

### 🔍 **Search & Filter**

**Search Functionality:**
- Real-time search bar
- Search by franchise name
- Search by owner name
- Search by location
- Case-insensitive matching

**Filter Options:**
- All franchises
- Active only
- Pending only
- Combined with search

---

### 📱 **Workflow Features**

**Complete Registration Flow:**
1. User fills detailed application
2. Account created with "pending" status
3. User can login but sees pending screen
4. Admin reviews application details
5. Admin approves or rejects
6. User gets full dashboard access

**Sales Reporting Flow:**
1. Franchisee logs in
2. Enters daily sales data
3. Submits to system
4. Appears in personal history
5. Visible in admin's recent activity
6. System metrics update automatically

---

## 🛠️ Technical Stack

**Backend:**
- Flask (Python web framework)
- MySQL (Database)
- REST API architecture
- JSON data exchange
- SHA-256 password hashing

**Frontend:**
- React (JavaScript library)
- Vite (Build tool)
- Tailwind CSS (Styling)
- Fetch API (HTTP requests)
- Modern ES6+ syntax

**Database:**
- 3 tables: users, franchises, sales
- Foreign key relationships
- CASCADE delete operations
- Timestamp tracking
- ENUM types for status

---

## 📊 Sample Data Included

**Franchises:**
- Relay Coffee Central (Active) - $4,381.25 in sales
- Relay Fitness Hub (Pending) - No sales yet
- Relay Tech Store (Active) - $6,290.75 in sales

**Users:**
- 1 admin account (admin@relay.com)
- No default franchisee accounts (create via registration)

**Sales:**
- 6 sample sales transactions
- Total system revenue: ~$10,672
- Dates: Recent (October 2025)

---

## 🎯 Use Cases

**For Franchisors (Admin):**
- Monitor system-wide performance
- Review franchise applications
- Approve qualified candidates
- Track sales across network
- Identify top performers
- Manage franchise database

**For Franchisees:**
- Apply for franchise
- Submit daily sales
- View performance history
- Track personal revenue
- Access franchise details

---

## 🔒 Security Features

- Password hashing (SHA-256)
- Role-based access control
- SQL injection prevention (parameterized queries)
- Input validation
- Error message sanitization
- Session-based authentication

---

## ✨ Professional Touches

- Auto-refresh functionality
- Loading states everywhere
- Empty state handling
- Responsive error messages
- Consistent UI patterns
- Modern design language
- Smooth animations
- Professional color scheme

---

**This is a complete, production-ready franchise management prototype! 🚀**
