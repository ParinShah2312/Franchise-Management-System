# Relay FMS — Complete Feature Testing Guide

> Use this guide to manually verify every feature in the system. Works after running `python run.py` (backend) and `npm run dev` (frontend). Open **http://localhost:3000** in your browser.

---

## Quick Login Reference

| Role | Email | Password | Notes |
|---|---|---|---|
| Franchisor (McDonald's) | `admin@mcd.com` | `admin123` | Full admin dashboard |
| Franchisor (Ajay's Café) | `admin@ajays.com` | `admin123` | Full admin dashboard |
| Branch Owner (MCD Alkapuri) | `rahul@mcd-alkapuri.com` | `owner123` | Franchisee dashboard |
| Branch Owner (MCD Vesu) | `priya@mcd-vesu.com` | `owner123` | Franchisee dashboard |
| Branch Owner (Ajay's Navrangpura) | `sneha@ajays-navrangpura.com` | `owner123` | Franchisee dashboard |
| Manager (MCD Alkapuri) | `mgr.alkapuri@mcd.com` | `manager123` | Force password reset on first login |
| Manager (Ajay's Navrangpura) | `mgr.navrangpura@ajays.com` | `manager123` | Force password reset on first login |
| Staff (MCD Alkapuri) | `staff1.alkapuri@mcd.com` | `staff123` | Force password reset on first login |
| Staff (Ajay's Navrangpura) | `staff1.navrangpura@ajays.com` | `staff123` | Force password reset on first login |
| Pending Applicant | `applicant@demo.com` | `applicant123` | Lands on Pending Dashboard |

> **To reset:** Delete `backend/relay.db` and restart `python run.py`. All accounts above regenerate automatically.

---

## 1. Authentication

| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 1.1 | Franchisor login | Log in as `admin@mcd.com` / `admin123` | Redirected to `/admin` Franchisor Dashboard |
| 1.2 | Branch owner login | Log in as `rahul@mcd-alkapuri.com` / `owner123` | Redirected to `/franchisee` Franchisee Dashboard |
| 1.3 | Manager login (first time) | Log in as `mgr.alkapuri@mcd.com` / `manager123` | Redirected to `/reset-password` forced reset page |
| 1.4 | Manager forced reset | On reset page, enter new password meeting strength rules | Redirected to `/manager` dashboard |
| 1.5 | Staff login (first time) | Log in as `staff1.alkapuri@mcd.com` / `staff123` | Redirected to `/reset-password` page |
| 1.6 | Wrong password | Enter wrong password for any account | Error: "Invalid email or password." |
| 1.7 | Pending applicant | Log in as `applicant@demo.com` / `applicant123` | Redirected to `/pending` with "Application Pending" screen |
| 1.8 | Logout | Click Logout button on any dashboard | Redirected to home page, session cleared |
| 1.9 | Expired session | Manually clear localStorage and reload a protected page | Redirected to `/` login |
| 1.10 | Forgot password modal | On login page, click "Forgot password?" | Modal appears with support contact info |

---

## 2. Franchisor Dashboard

### 2.1 Overview Tab
| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 2.1.1 | Metrics cards | Log in as franchisor, view Overview tab | Cards show Total Revenue, Active Branches, Pending Applications |
| 2.1.2 | Pending apps banner | If pending applications exist | Yellow alert banner with "Review now →" link appears |
| 2.1.3 | Dismiss banner | Click ✕ on the banner | Banner disappears for the session |
| 2.1.4 | Menu upload | Click "Upload menu", select any PDF or image ≤5MB | Toast: "Menu uploaded successfully!" and "View menu" link appears |
| 2.1.5 | View menu | Click "View menu" link | File opens in a new browser tab |
| 2.1.6 | Refresh data | Click "Refresh Data" button | Metrics reload without page navigation |
| 2.1.7 | FAQ accordion | Scroll down, click any FAQ item | Answer expands; click again to collapse |

### 2.2 Network Tab
| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 2.2.1 | Branch list | Switch to Network tab | Table shows all branches with Name, Franchise, Location, Owner, Manager, Status columns |
| 2.2.2 | ACTIVE badge | Check any active branch | Green "ACTIVE" badge in Status column |
| 2.2.3 | Deactivate branch | Click "Deactivate" on any active branch, confirm | Branch status badge turns gray "INACTIVE"; button changes to "Activate" |
| 2.2.4 | Reactivate branch | Click "Activate" on an inactive branch | Branch badge returns to green "ACTIVE" |

### 2.3 Applications Tab
| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 2.3.1 | Pending list | Switch to Applications tab | Table shows pending applications with badge count in tab |
| 2.3.2 | Review modal | Click "Review" on any application | Full-detail modal opens with applicant info, investment, location, document link |
| 2.3.3 | View document | Click "📄 View document" in modal | Supporting document opens in new tab |
| 2.3.4 | Approve application | Click "Approve" in modal | Toast: success. Application row disappears from pending list. A new branch is created. |
| 2.3.5 | Reject application | Click "Reject" in modal | Rejection reason modal opens |
| 2.3.6 | Reject: reason too short | Enter fewer than 10 characters and submit | Error: reason must be at least 10 characters |
| 2.3.7 | Reject: valid reason | Enter 10+ character reason and confirm | Application removed from pending list |

### 2.4 Catalog Tab
| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 2.4.1 | View categories | Switch to Catalog tab | List of product categories with product counts |
| 2.4.2 | Add category | Click "Add Category", enter name, submit | New category appears in list |
| 2.4.3 | Duplicate category | Try to add a category with the same name | Error: "A category with this name already exists." |
| 2.4.4 | View products | Scroll to Products section | Table of products with category, price, status |
| 2.4.5 | Add product | Click "Add Product", fill all fields including category and price | Product appears in list |
| 2.4.6 | Edit product | Click "Edit" on a product, change price, save | Price updates in the table |
| 2.4.7 | Toggle active | Click the green "Active" badge on a product, confirm | Badge changes to gray "Inactive" |
| 2.4.8 | Product recipes | Scroll to Product Recipes, click "View Ingredients" on any product | Ingredient list expands; shows stock item, unit, quantity |
| 2.4.9 | Add ingredient | In expanded recipe, select a stock item, enter quantity, click Add | Ingredient appears in the list |
| 2.4.10 | Remove ingredient | Click "Remove" on any ingredient | Ingredient removed from list |
| 2.4.11 | Stock items | Scroll to Stock Items section | List of raw materials with name, unit, description |
| 2.4.12 | Add stock item | Click "Add Stock Item", fill name and unit | New stock item appears in list |
| 2.4.13 | View products using stock | Click "View Products" on any stock item | Expands to show which products use that item |

### 2.5 Royalty Tab
| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 2.5.1 | View config | Switch to Royalty tab | Current config shows Franchisor Cut % and Branch Owner Cut % |
| 2.5.2 | Set/edit config | Click "Edit Configuration" (or "Set Configuration"), enter percentage, save | Config updates; percentages sum to 100% |
| 2.5.3 | Invalid percentage | Enter a percentage > 100 | Error message shown |
| 2.5.4 | Load royalty summary | Select month and year, click "Load Summary" | Table shows per-branch: Total Sales, Franchisor Earned, Branch Owner Earned, Cut % |
| 2.5.5 | Royalty in INR | Check amounts in royalty table | All amounts shown in ₹ format (Indian locale) |

### 2.6 Reports Tab
| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 2.6.1 | Generate report | Select a month/year with sales data, click "Generate Report" | Summary cards show Total Sales, Total Expenses, Profit/Loss |
| 2.6.2 | Bar chart | After generating, scroll to chart section | Interactive bar chart shows sales by branch |
| 2.6.3 | Branch breakdown table | Scroll to Branch Breakdown | Table with per-branch sales; click "View Sales Breakdown" to expand product details |
| 2.6.4 | Royalty columns | If royalty is configured, check the Branch Breakdown table | Franchisor Earned and Branch Owner Earned columns appear |
| 2.6.5 | Expense breakdown | Scroll to Expense Breakdown | Per-branch expense categories and amounts listed |
| 2.6.6 | Download PDF | Click "Download PDF" | PDF downloads; opens in viewer showing header, stats, charts, tables |
| 2.6.7 | Empty month | Select a future month with no data, generate | Report shows all zeros without error |

---

## 3. Franchisee (Branch Owner) Dashboard

| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 3.1 | Metrics overview | Log in as branch owner, view Overview tab | Cards: Revenue (MTD), Inventory Value, Pending Requests, Pending Quantity, Royalty Earned (MTD) |
| 3.2 | Recent sales table | Scroll down on Overview tab | Table of most recent sales with date, amount, payment mode |
| 3.3 | Royalty Earned (MTD) | Check "Royalty Earned (MTD)" card | Shows branch owner's share of this month's sales in ₹ |
| 3.4 | Stock Requests tab | Switch to Stock Requests tab | Lists all stock requests with status |
| 3.5 | Approve request | Click "✓ Approve" on a PENDING request | Request status changes to APPROVED optimistically; inventory updates |
| 3.6 | Reject request | Click "✕ Reject" on a PENDING request | Request status changes to REJECTED |
| 3.7 | My Staff tab | Switch to My Staff tab | Branch Manager section and Support Staff table visible |
| 3.8 | No manager state | If no manager assigned | "Appoint Manager" button appears |
| 3.9 | Appoint manager | Click "Appoint Manager", fill form, submit | Manager appears in Branch Manager section; toast success |
| 3.10 | Deactivate staff | Click "Deactivate" on any active staff, confirm | Name and email dim (opacity-50); Status badge turns gray "Inactive"; button changes to "Reactivate" |
| 3.11 | Reactivate staff | Click "Reactivate" on inactive staff, confirm | Row brightens; Status badge turns green "Active" |
| 3.12 | Force reset password | Click "Reset Password" on manager or staff, confirm | Toast: user will be prompted to reset on next login |
| 3.13 | Cannot deactivate self | Verify own row has "—" in Actions column | No deactivate button for the branch owner's own account |
| 3.14 | Expenses tab | Switch to Expenses tab | Table of logged expenses with category, date, amount, logged by, delete button |
| 3.15 | Delete expense | Click "Delete" on any expense, confirm | Expense removed from table |
| 3.16 | Reports tab | Switch to Reports tab | Month/year picker and "Generate Report" button |
| 3.17 | Branch report | Select month, generate | Shows product sales breakdown (not branch breakdown) and expense section |
| 3.18 | Download PDF (branch) | Click "Download PDF" | PDF downloads with product sales table and expense section |

---

## 4. Manager Dashboard

| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 4.1 | Overview tab | Log in as manager (after forced reset), view Overview | Cards: Today's Sales, Low Stock Items, Pending Requests |
| 4.2 | Low stock banner | If any items are at or below reorder level | Amber banner at top of every tab listing affected items |
| 4.3 | Dismiss banner | Click ✕ on low stock banner | Banner hides for the session |
| 4.4 | My Staff tab | Switch to My Staff tab | Branch Owner section and Support Staff table with Reset Password buttons |
| 4.5 | Add staff | Click "Add Staff", fill form, submit | Staff member appears in table; toast success |
| 4.6 | Inventory tab | Switch to Inventory tab | Full inventory table with item name, unit, quantity, reorder level |
| 4.7 | Low stock rows | Items at or below reorder level | Row background turns amber |
| 4.8 | Add inventory item | Click "Add Item", select stock item, set quantity and reorder level, submit | Item appears in inventory table |
| 4.9 | Duplicate item error | Try to add the same stock item twice | Toast: "This item already exists in inventory. Use Record Delivery..." |
| 4.10 | Record delivery | Click "Record Delivery", select item, enter quantity, submit | Inventory quantity increases; toast success |
| 4.11 | Sales tab | Switch to Sales tab | Sales history table with date, amount, payment mode |
| 4.12 | Log sale | Click "Log Sale", select products and quantities, choose payment mode, submit | Sale appears in history table with correct date/time and payment mode |
| 4.13 | Multi-product sale | Add multiple products using "+ Add Product" | Each product row is included; total is sum of all line items |
| 4.14 | Stock Requests tab | Switch to Stock Requests tab | Table of all stock requests with status |
| 4.15 | New request | Click "New Request", fill form (item, quantity, unit cost), submit | Request appears as PENDING |
| 4.16 | Expenses tab | Switch to Expenses tab | Expense table with total shown in header |
| 4.17 | Log expense | Click "Log Expense", select category, enter amount and date, submit | Expense appears in table |
| 4.18 | Delete expense | Click "Delete" on any expense | Expense removed |

---

## 5. Staff Dashboard

| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 5.1 | Landing page | Log in as staff (after forced reset) | Staff Dashboard with Inventory and Sales tabs |
| 5.2 | Low stock banner | If items at/below reorder level | Amber banner visible on both tabs |
| 5.3 | Inventory tab | View inventory items | Table with stock quantities and reorder levels; low-stock rows are amber |
| 5.4 | Record delivery | Click "Record Delivery", select item, enter quantity | Inventory quantity updates; item row briefly pulses |
| 5.5 | Sales tab | Switch to Sales tab | Sales history table |
| 5.6 | Log sale | Click "Log Sale", select product and quantity, choose payment mode | Sale logged; appears in history with correct payment mode |
| 5.7 | Insufficient stock | Log a sale for a product with ingredient below threshold | Error: "Insufficient stock for [item]." — no sale is created |
| 5.8 | No delete/edit | Verify no delete or edit buttons on sales or inventory | Staff can only create, not modify existing records |

---

## 6. Public Pages

| # | Feature | Steps | Expected Result |
|---|---|---|---|
| 6.1 | Home page | Go to `http://localhost:3000` | Hero section, stats, feature highlights, role cards, CTA banner all visible |
| 6.2 | Features page | Click "Features" in navbar | Features grid with 6 feature cards |
| 6.3 | Contact page | Click "Contact" in navbar | Contact form; submit returns success toast |
| 6.4 | Signup selection | Click "Sign Up" | Two cards: "Register as Franchisor" and "Apply for a Branch" |
| 6.5 | Franchisor registration | Click "Start a New Brand", fill all fields, submit | New franchisor account created; redirected to `/admin` |
| 6.6 | Franchise application | Click "Apply as Branch Owner", fill 11-field form including file upload, submit | Redirected to `/pending` Pending Dashboard |
| 6.7 | Back navigation | Click "← Back" on any registration form | Returns to signup selection page |
| 6.8 | Mobile navbar | Resize browser to mobile width | Hamburger menu appears; all links accessible |
| 6.9 | Navbar login button | Click "Log In" in navbar | Redirected to login page |

---

## 7. RBAC (Role-Based Access Control)

| # | Check | Expected Result |
|---|---|---|
| 7.1 | Access `/admin` as branch owner | Redirected away (not authorized) |
| 7.2 | Access `/franchisee` as manager | Redirected away |
| 7.3 | Access `/manager` as staff | Redirected away |
| 7.4 | Access `/staff` as franchisor | Redirected away |
| 7.5 | Deactivated user login | Log in as a deactivated account | Error: "Account is inactive. Contact administrator." |
| 7.6 | Token without auth header | Call any protected API endpoint without Authorization header | 401 response |
| 7.7 | Cross-branch inventory access | Try to access inventory for a different branch | 403 response |

---

## 8. Edge Cases and Error Handling

| # | Scenario | Steps | Expected Result |
|---|---|---|---|
| 8.1 | Empty states | Visit any data tab with no records | "No records yet" empty state message (not a crash) |
| 8.2 | Loading skeletons | Slow network or hard refresh | Skeleton cards/tables visible while data loads |
| 8.3 | Network error | Stop backend server, click Refresh Data | ErrorState component appears with "Try Again" button |
| 8.4 | Password strength | Enter weak password on any registration form | Inline error: "Password must be 8+ chars with uppercase, lowercase, and a number." |
| 8.5 | Invalid phone | Enter fewer than 10 digits on phone field | Inline error: "Phone must be exactly 10 digits." |
| 8.6 | Large file upload | Try uploading a file > 5MB as menu or document | Error response from server |
| 8.7 | Duplicate email registration | Register twice with the same email | Error: "Email is already registered." |
| 8.8 | Sale with zero quantity | Attempt a sale item with quantity 0 | Validation error — cannot submit |
| 8.9 | Negative amount expense | Try logging expense with negative amount | Validation fails; error shown |

---

## 9. Data Integrity Checks

| # | Check | How to verify |
|---|---|---|
| 9.1 | Sales totals | Log a sale with 2x Item A (₹100) and 1x Item B (₹50) | Total should be ₹250 in sales history |
| 9.2 | Inventory deduction | Log a sale for a product with a recipe | Check inventory — ingredient quantities decrease |
| 9.3 | Royalty on sale | Log a sale after setting royalty config | Royalty summary (Royalty tab) reflects new amounts |
| 9.4 | Expense in report | Log an expense, then generate a report for that month | Expense appears in the report's expense breakdown section |
| 9.5 | Request approval → inventory | Approve a stock request | Inventory quantity for that stock item increases by requested amount |
| 9.6 | Payment mode preserved | Log sale with "UPI" as payment mode | Sales history shows "UPI" — not defaulting to Cash |

---

## 10. PDF Report Content Verification

After downloading a PDF report, verify:

| # | Item to check |
|---|---|
| 10.1 | Header shows "Relay — Franchise Management System" |
| 10.2 | Report title shows correct month and year |
| 10.3 | Total Sales, Total Expenses, Profit/Loss cards are present |
| 10.4 | Branch Breakdown table (admin) or Product Sales table (branch owner) is present |
| 10.5 | Expense Breakdown section is present |
| 10.6 | Bar chart appears (admin report only) |
| 10.7 | Royalty columns appear if royalty is configured (admin report) |
| 10.8 | Footer shows page numbers |
| 10.9 | All monetary values are in ₹ format |

---

## 11. Resetting the Demo Environment
```bash
# Windows
cd backend
del relay.db
python run.py

# Mac / Linux
cd backend
rm relay.db
python run.py
```

All seed accounts, branches, sales, expenses, and requests will regenerate. Default passwords are restored.
