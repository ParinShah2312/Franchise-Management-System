"""
Package for Flask route blueprints.

Route files:
- auth_routes.py         → /api/auth         (login, profile, reset-password)
- registration_routes.py → /api/auth         (all registration endpoints)
- branch_routes.py       → /api/branch       (branch staff helpers)
- franchise_routes.py    → /api/franchises   (brands, network, menu upload, branch status)
- application_routes.py  → /api/franchises   (application review workflow)
- inventory_routes.py    → /api/inventory    (stock management)
- request_routes.py      → /api/requests     (stock purchase requests)
- sales_routes.py        → /api/sales        (sales and products)
- report_routes.py       → /api/reports      (reporting)
- dashboard_routes.py    → /api/dashboard    (metrics)
- catalog_routes.py      → /api/catalog      (recipe management)
- royalty_routes.py      → /api/royalty      (royalty configuration and summaries)
- user_routes.py         → /api/users        (user activation and deactivation)
- expense_routes.py      → /api/expenses     (expense logging and management)
"""
