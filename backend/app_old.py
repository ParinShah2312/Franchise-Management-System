from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database configuration
DB_FILE = 'relay.db'

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = sqlite3.connect(DB_FILE)
        connection.row_factory = sqlite3.Row  # Return rows as dictionaries
        return connection
    except Exception as e:
        print(f"Error connecting to SQLite: {e}")
        return None

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def init_database():
    """Initialize database with tables and sample data"""
    connection = get_db_connection()
    if not connection:
        return
    
    cursor = connection.cursor()
    
    # Create franchises table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS franchises (
            franchise_id INTEGER PRIMARY KEY AUTOINCREMENT,
            franchise_name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            location TEXT NOT NULL,
            phone TEXT,
            property_size TEXT,
            investment_capacity TEXT,
            business_experience TEXT,
            reason_for_franchise TEXT,
            expected_opening_date TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'franchisee',
            franchise_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (franchise_id) REFERENCES franchises(franchise_id) ON DELETE CASCADE
        )
    ''')
    
    # Create sales table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
            franchise_id INTEGER NOT NULL,
            sale_date TEXT NOT NULL,
            total_amount REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (franchise_id) REFERENCES franchises(franchise_id) ON DELETE CASCADE
        )
    ''')
    
    # Check if admin exists
    cursor.execute("SELECT * FROM users WHERE email = 'admin@relay.com'")
    if not cursor.fetchone():
        # Insert admin user
        admin_password = hash_password('admin123')
        cursor.execute(
            "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
            ('admin@relay.com', admin_password, 'admin')
        )
        
        # Insert sample franchises
        franchises = [
            ('Relay Coffee Central', 'John Smith', 'New York, NY', '+1-555-0101', 
             '2000 sq ft', '$100,000 - $200,000', 'Owned 2 coffee shops for 5 years', 
             'Want to expand my coffee business with a trusted brand', '2024-01-15', 'active'),
            ('Relay Fitness Hub', 'Sarah Johnson', 'Los Angeles, CA', '+1-555-0102',
             '5000 sq ft', '$200,000 - $500,000', 'Former gym manager, 8 years experience',
             'Passionate about fitness and want to own my own facility', '2024-03-20', 'pending'),
            ('Relay Tech Store', 'Michael Brown', 'Chicago, IL', '+1-555-0103',
             '1500 sq ft', '$50,000 - $100,000', 'Worked in retail electronics for 10 years',
             'Ready to transition from employee to business owner', '2024-02-01', 'active')
        ]
        
        for franchise in franchises:
            cursor.execute('''
                INSERT INTO franchises (franchise_name, owner_name, location, phone, 
                                      property_size, investment_capacity, business_experience,
                                      reason_for_franchise, expected_opening_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', franchise)
        
        # Insert sample sales
        sales = [
            (1, '2024-10-15', 1250.00),
            (1, '2024-10-16', 1450.50),
            (1, '2024-10-17', 1680.75),
            (3, '2024-10-15', 2100.00),
            (3, '2024-10-16', 1890.25),
            (3, '2024-10-17', 2300.50)
        ]
        
        for sale in sales:
            cursor.execute(
                "INSERT INTO sales (franchise_id, sale_date, total_amount) VALUES (?, ?, ?)",
                sale
            )
    
    connection.commit()
    connection.close()
    print("✅ Database initialized successfully!")

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user login"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        password_hash = hash_password(password)
        
        cursor.execute(
            "SELECT * FROM users WHERE email = ? AND password_hash = ?",
            (email, password_hash)
        )
        user = cursor.fetchone()
        
        if user:
            user_dict = dict(user)
            return jsonify({
                'success': True,
                'user': {
                    'user_id': user_dict['user_id'],
                    'email': user_dict['email'],
                    'role': user_dict['role'],
                    'franchise_id': user_dict['franchise_id']
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new franchisee"""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    franchise_name = data.get('franchise_name')
    owner_name = data.get('owner_name')
    location = data.get('location')
    phone = data.get('phone')
    property_size = data.get('property_size')
    investment_capacity = data.get('investment_capacity')
    business_experience = data.get('business_experience')
    reason_for_franchise = data.get('reason_for_franchise')
    expected_opening_date = data.get('expected_opening_date')
    
    # Required fields
    if not all([email, password, franchise_name, owner_name, location, phone, 
                property_size, investment_capacity, business_experience, 
                reason_for_franchise, expected_opening_date]):
        return jsonify({'error': 'All fields are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT email FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create franchise first with all details
        cursor.execute('''
            INSERT INTO franchises (franchise_name, owner_name, location, phone, 
                                  property_size, investment_capacity, business_experience, 
                                  reason_for_franchise, expected_opening_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ''', (franchise_name, owner_name, location, phone,
              property_size, investment_capacity, business_experience,
              reason_for_franchise, expected_opening_date))
        franchise_id = cursor.lastrowid
        
        # Create franchisee user
        password_hash = hash_password(password)
        cursor.execute('''
            INSERT INTO users (email, password_hash, role, franchise_id)
            VALUES (?, ?, 'franchisee', ?)
        ''', (email, password_hash, franchise_id))
        
        connection.commit()
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Awaiting admin approval.'
        }), 201
        
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/franchises', methods=['GET'])
def get_franchises():
    """Get all franchises"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM franchises ORDER BY created_at DESC")
        franchises = [dict(row) for row in cursor.fetchall()]
        return jsonify(franchises), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/franchises', methods=['POST'])
def add_franchise():
    """Add a new franchise"""
    data = request.json
    franchise_name = data.get('franchise_name')
    owner_name = data.get('owner_name')
    location = data.get('location')
    
    if not all([franchise_name, owner_name, location]):
        return jsonify({'error': 'All fields are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute('''
            INSERT INTO franchises (franchise_name, owner_name, location, status)
            VALUES (?, ?, ?, 'pending')
        ''', (franchise_name, owner_name, location))
        franchise_id = cursor.lastrowid
        connection.commit()
        
        cursor.execute("SELECT * FROM franchises WHERE franchise_id = ?", (franchise_id,))
        new_franchise = dict(cursor.fetchone())
        return jsonify(new_franchise), 201
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/franchises/<int:franchise_id>', methods=['PUT'])
def update_franchise(franchise_id):
    """Update franchise details"""
    data = request.json
    franchise_name = data.get('franchise_name')
    owner_name = data.get('owner_name')
    location = data.get('location')
    
    if not all([franchise_name, owner_name, location]):
        return jsonify({'error': 'All fields are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute('''
            UPDATE franchises 
            SET franchise_name = ?, owner_name = ?, location = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE franchise_id = ?
        ''', (franchise_name, owner_name, location, franchise_id))
        connection.commit()
        
        cursor.execute("SELECT * FROM franchises WHERE franchise_id = ?", (franchise_id,))
        updated_franchise = dict(cursor.fetchone())
        return jsonify(updated_franchise), 200
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/franchises/<int:franchise_id>', methods=['DELETE'])
def delete_franchise(franchise_id):
    """Delete a franchise"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM franchises WHERE franchise_id = ?", (franchise_id,))
        connection.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/franchises/<int:franchise_id>/approve', methods=['PUT'])
def approve_franchise(franchise_id):
    """Approve a pending franchise"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute('''
            UPDATE franchises 
            SET status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE franchise_id = ?
        ''', (franchise_id,))
        connection.commit()
        
        cursor.execute("SELECT * FROM franchises WHERE franchise_id = ?", (franchise_id,))
        updated_franchise = dict(cursor.fetchone())
        return jsonify(updated_franchise), 200
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/sales/<int:franchise_id>', methods=['GET'])
def get_sales(franchise_id):
    """Get sales for a specific franchise"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute('''
            SELECT * FROM sales 
            WHERE franchise_id = ? 
            ORDER BY sale_date DESC
        ''', (franchise_id,))
        sales = [dict(row) for row in cursor.fetchall()]
        return jsonify(sales), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/sales', methods=['POST'])
def add_sale():
    """Add a new sale"""
    data = request.json
    franchise_id = data.get('franchise_id')
    sale_date = data.get('sale_date')
    total_amount = data.get('total_amount')
    
    if not all([franchise_id, sale_date, total_amount]):
        return jsonify({'error': 'All fields are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute('''
            INSERT INTO sales (franchise_id, sale_date, total_amount)
            VALUES (?, ?, ?)
        ''', (franchise_id, sale_date, total_amount))
        sale_id = cursor.lastrowid
        connection.commit()
        
        cursor.execute("SELECT * FROM sales WHERE sale_id = ?", (sale_id,))
        new_sale = dict(cursor.fetchone())
        return jsonify(new_sale), 201
    except Exception as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/dashboard/metrics', methods=['GET'])
def get_dashboard_metrics():
    """Get system-wide dashboard metrics"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Get total franchises
        cursor.execute("SELECT COUNT(*) as total FROM franchises")
        total_franchises = cursor.fetchone()['total']
        
        # Get active franchises
        cursor.execute("SELECT COUNT(*) as active FROM franchises WHERE status='active'")
        active_franchises = cursor.fetchone()['active']
        
        # Get pending franchises
        cursor.execute("SELECT COUNT(*) as pending FROM franchises WHERE status='pending'")
        pending_franchises = cursor.fetchone()['pending']
        
        # Get total revenue
        cursor.execute("SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM sales")
        total_revenue = float(cursor.fetchone()['total_revenue'])
        
        # Get monthly revenue (current month)
        cursor.execute("""
            SELECT COALESCE(SUM(total_amount), 0) as monthly_revenue 
            FROM sales 
            WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')
        """)
        monthly_revenue = float(cursor.fetchone()['monthly_revenue'])
        
        return jsonify({
            'total_franchises': total_franchises,
            'active_franchises': active_franchises,
            'pending_franchises': pending_franchises,
            'total_revenue': total_revenue,
            'monthly_revenue': monthly_revenue
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/sales/recent', methods=['GET'])
def get_recent_sales():
    """Get recent sales activity across all franchises"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Get last 10 sales with franchise information
        cursor.execute("""
            SELECT s.sale_id, s.sale_date, s.total_amount, s.created_at,
                   f.franchise_name, f.owner_name, f.location
            FROM sales s
            JOIN franchises f ON s.franchise_id = f.franchise_id
            ORDER BY s.created_at DESC
            LIMIT 10
        """)
        sales = [dict(row) for row in cursor.fetchall()]
        
        return jsonify(sales), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'database': 'SQLite'}), 200

if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    app.run(debug=True, port=5001)
