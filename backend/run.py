from app import create_app
from app.extensions import db

app = create_app()

# Auto-seed the database on first run if it is empty
with app.app_context():
    db.create_all()
    from app.models import Franchisor
    if not Franchisor.query.first():
        print("[startup] Empty database detected — running seed script...")
        from seed import seed_database
        seed_database()
        print("[startup] Seed complete. Default login: admin@mcd.com or admin@ajays.com / admin123")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
