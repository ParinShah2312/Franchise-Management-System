"""
Business logic service layer for the Relay backend.

Services contain all core domain logic and are called by route handlers.
Route handlers are responsible only for HTTP request parsing and response
formatting. Services are responsible for all business rules and database
operations.

Service modules:
- inventory_service.py  → inventory transaction and deduction logic
- report_service.py     → report data aggregation and generation
- royalty_service.py    → royalty split calculation (placeholder)
"""
