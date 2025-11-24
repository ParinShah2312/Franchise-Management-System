-- Create the Relay database
CREATE DATABASE IF NOT EXISTS relay_db;
USE relay_db;

-- Create franchises table first (referenced by users table)
CREATE TABLE IF NOT EXISTS franchises (
    franchise_id INT AUTO_INCREMENT PRIMARY KEY,
    franchise_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    property_size VARCHAR(100),
    investment_capacity VARCHAR(100),
    business_experience TEXT,
    reason_for_franchise TEXT,
    expected_opening_date DATE,
    status ENUM('pending', 'active') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'franchisee') DEFAULT 'franchisee',
    franchise_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (franchise_id) REFERENCES franchises(franchise_id) ON DELETE SET NULL
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    franchise_id INT NOT NULL,
    sale_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (franchise_id) REFERENCES franchises(franchise_id) ON DELETE CASCADE
);

-- Insert default admin user
-- Password: admin123 (hashed with SHA-256)
INSERT INTO users (email, password_hash, role, franchise_id) 
VALUES ('admin@relay.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', NULL)
ON DUPLICATE KEY UPDATE role='admin';

-- Insert sample franchises for demonstration
INSERT INTO franchises (franchise_name, owner_name, location, phone, property_size, investment_capacity, business_experience, reason_for_franchise, expected_opening_date, status) VALUES
('Relay Coffee Central', 'John Smith', 'New York, NY', '+1-555-0101', '2000 sq ft', '$100,000 - $200,000', 'Owned 2 coffee shops for 5 years', 'Want to expand my coffee business with a trusted brand', '2024-01-15', 'active'),
('Relay Fitness Hub', 'Sarah Johnson', 'Los Angeles, CA', '+1-555-0102', '5000 sq ft', '$200,000 - $500,000', 'Former gym manager, 8 years experience', 'Passionate about fitness and want to own my own facility', '2024-03-20', 'pending'),
('Relay Tech Store', 'Michael Brown', 'Chicago, IL', '+1-555-0103', '1500 sq ft', '$50,000 - $100,000', 'Worked in retail electronics for 10 years', 'Ready to transition from employee to business owner', '2024-02-01', 'active')
ON DUPLICATE KEY UPDATE franchise_name=franchise_name;

-- Insert sample sales data for demonstration
INSERT INTO sales (franchise_id, sale_date, total_amount) VALUES
(1, '2025-10-15', 1250.00),
(1, '2025-10-16', 1450.50),
(1, '2025-10-17', 1680.75),
(3, '2025-10-15', 2100.00),
(3, '2025-10-16', 1890.25),
(3, '2025-10-17', 2300.50)
ON DUPLICATE KEY UPDATE total_amount=total_amount;
