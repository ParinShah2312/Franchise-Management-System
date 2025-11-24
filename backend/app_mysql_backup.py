from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'relay_db')
}

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

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
        cursor = connection.cursor(dictionary=True)
        password_hash = hash_password(password)
        
        query = "SELECT user_id, email, role, franchise_id FROM users WHERE email = %s AND password_hash = %s"
        cursor.execute(query, (email, password_hash))
        user = cursor.fetchone()
        
        if user:
            return jsonify({
                'success': True,
                'user': user
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
            
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/franchises', methods=['GET'])
def get_franchises():
    """Fetch all franchises"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM franchises ORDER BY franchise_id DESC"
        cursor.execute(query)
        franchises = cursor.fetchall()
        
        return jsonify(franchises), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/franchises', methods=['POST'])
def add_franchise():
    """Add a new franchise"""
    data = request.json
    franchise_name = data.get('franchise_name')
    owner_name = data.get('owner_name')
    location = data.get('location')
    
    if not franchise_name or not owner_name or not location:
        return jsonify({'error': 'All fields are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            INSERT INTO franchises (franchise_name, owner_name, location, status)
            VALUES (%s, %s, %s, 'pending')
        """
        cursor.execute(query, (franchise_name, owner_name, location))
        connection.commit()
        
        # Get the newly created franchise
        franchise_id = cursor.lastrowid
        cursor.execute("SELECT * FROM franchises WHERE franchise_id = %s", (franchise_id,))
        new_franchise = cursor.fetchone()
        
        return jsonify(new_franchise), 201
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/franchises/<int:franchise_id>/approve', methods=['PUT'])
def approve_franchise(franchise_id):
    """Approve a franchise by updating its status to 'active'"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "UPDATE franchises SET status = 'active' WHERE franchise_id = %s"
        cursor.execute(query, (franchise_id,))
        connection.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Franchise not found'}), 404
        
        # Get the updated franchise
        cursor.execute("SELECT * FROM franchises WHERE franchise_id = %s", (franchise_id,))
        updated_franchise = cursor.fetchone()
        
        return jsonify(updated_franchise), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
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
        cursor = connection.cursor(dictionary=True)
        
        # Check if email already exists
        cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create franchise first with all details
        franchise_query = """
            INSERT INTO franchises (franchise_name, owner_name, location, phone, 
                                  property_size, investment_capacity, business_experience, 
                                  reason_for_franchise, expected_opening_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
        """
        cursor.execute(franchise_query, (franchise_name, owner_name, location, phone,
                                        property_size, investment_capacity, business_experience,
                                        reason_for_franchise, expected_opening_date))
        franchise_id = cursor.lastrowid
        
        # Create franchisee user
        password_hash = hash_password(password)
        user_query = """
            INSERT INTO users (email, password_hash, role, franchise_id)
            VALUES (%s, %s, 'franchisee', %s)
        """
        cursor.execute(user_query, (email, password_hash, franchise_id))
        connection.commit()
        
        return jsonify({
            'success': True,
            'message': 'Registration successful. Awaiting admin approval.'
        }), 201
        
    except Error as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/franchises/<int:franchise_id>', methods=['PUT'])
def update_franchise(franchise_id):
    """Update franchise details"""
    data = request.json
    franchise_name = data.get('franchise_name')
    owner_name = data.get('owner_name')
    location = data.get('location')
    
    if not franchise_name or not owner_name or not location:
        return jsonify({'error': 'All fields are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            UPDATE franchises 
            SET franchise_name = %s, owner_name = %s, location = %s
            WHERE franchise_id = %s
        """
        cursor.execute(query, (franchise_name, owner_name, location, franchise_id))
        connection.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Franchise not found'}), 404
        
        cursor.execute("SELECT * FROM franchises WHERE franchise_id = %s", (franchise_id,))
        updated_franchise = cursor.fetchone()
        
        return jsonify(updated_franchise), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/franchises/<int:franchise_id>', methods=['DELETE'])
def delete_franchise(franchise_id):
    """Delete a franchise"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        
        # Delete associated user first
        cursor.execute("DELETE FROM users WHERE franchise_id = %s", (franchise_id,))
        
        # Delete franchise
        cursor.execute("DELETE FROM franchises WHERE franchise_id = %s", (franchise_id,))
        connection.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Franchise not found'}), 404
        
        return jsonify({'success': True, 'message': 'Franchise deleted'}), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/sales', methods=['POST'])
def add_sales():
    """Add sales data for a franchisee"""
    data = request.json
    franchise_id = data.get('franchise_id')
    sale_date = data.get('sale_date')
    total_amount = data.get('total_amount')
    
    if not franchise_id or not sale_date or not total_amount:
        return jsonify({'error': 'All fields are required'}), 400
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            INSERT INTO sales (franchise_id, sale_date, total_amount)
            VALUES (%s, %s, %s)
        """
        cursor.execute(query, (franchise_id, sale_date, total_amount))
        connection.commit()
        
        sale_id = cursor.lastrowid
        cursor.execute("SELECT * FROM sales WHERE sale_id = %s", (sale_id,))
        new_sale = cursor.fetchone()
        
        return jsonify(new_sale), 201
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/sales/<int:franchise_id>', methods=['GET'])
def get_franchise_sales(franchise_id):
    """Get all sales for a specific franchise"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM sales WHERE franchise_id = %s ORDER BY sale_date DESC"
        cursor.execute(query, (franchise_id,))
        sales = cursor.fetchall()
        
        return jsonify(sales), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/dashboard/metrics', methods=['GET'])
def get_dashboard_metrics():
    """Get system-wide dashboard metrics"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
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
            WHERE MONTH(sale_date) = MONTH(CURRENT_DATE()) 
            AND YEAR(sale_date) = YEAR(CURRENT_DATE())
        """)
        monthly_revenue = float(cursor.fetchone()['monthly_revenue'])
        
        return jsonify({
            'total_franchises': total_franchises,
            'active_franchises': active_franchises,
            'pending_franchises': pending_franchises,
            'total_revenue': total_revenue,
            'monthly_revenue': monthly_revenue
        }), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/sales/recent', methods=['GET'])
def get_recent_sales():
    """Get recent sales activity across all franchises"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get last 10 sales with franchise information
        query = """
            SELECT s.sale_id, s.sale_date, s.total_amount, s.created_at,
                   f.franchise_name, f.owner_name, f.location
            FROM sales s
            JOIN franchises f ON s.franchise_id = f.franchise_id
            ORDER BY s.created_at DESC
            LIMIT 10
        """
        cursor.execute(query)
        sales = cursor.fetchall()
        
        return jsonify(sales), 200
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
