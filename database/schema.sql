-- Workshop Management System Database Schema
-- MySQL Database Schema with seed data

-- Create database
CREATE DATABASE IF NOT EXISTS workshop_db;
USE workshop_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'technician', 'storekeeper') NOT NULL DEFAULT 'technician',
  login_access TINYINT(1) DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Job Cards table
CREATE TABLE IF NOT EXISTS job_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_no VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  technician_id INT,
  vehicle_type VARCHAR(50),
  vehicle_number VARCHAR(100),
  engine_model VARCHAR(255),
  job_type VARCHAR(100),
  job_sub_type VARCHAR(100),
  brand VARCHAR(100),
  pump_injector_serial VARCHAR(255),
  status ENUM('Received', 'Under Repair', 'Testing', 'Completed', 'Delivered') DEFAULT 'Received',
  received_date DATE,
  expected_delivery_date DATE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_job_no (job_no),
  INDEX idx_status (status),
  INDEX idx_customer (customer_id),
  INDEX idx_technician (technician_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Testing Records table
CREATE TABLE IF NOT EXISTS testing_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_card_id INT NOT NULL,
  test_date DATE,
  before_pressure VARCHAR(50),
  before_leak VARCHAR(50),
  before_calibration VARCHAR(50),
  before_pass_fail ENUM('Pass', 'Fail') DEFAULT 'Fail',
  after_pressure VARCHAR(50),
  after_leak VARCHAR(50),
  after_calibration VARCHAR(50),
  after_pass_fail ENUM('Pass', 'Fail') DEFAULT 'Fail',
  pilot_injection VARCHAR(50),
  main_injection VARCHAR(50),
  return_flow VARCHAR(50),
  injector_pressure VARCHAR(50),
  leak_test ENUM('Pass', 'Fail') DEFAULT 'Fail',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
  INDEX idx_job_card (job_card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory Items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  part_name VARCHAR(255) NOT NULL,
  part_code VARCHAR(100) UNIQUE,
  category VARCHAR(100),
  supplier VARCHAR(255),
  available_stock INT DEFAULT 0,
  min_stock_level INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_part_code (part_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Stock Transactions table (for tracking stock in/out)
CREATE TABLE IF NOT EXISTS stock_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_item_id INT NOT NULL,
  transaction_type ENUM('Stock In', 'Stock Out') NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  notes TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inventory_item (inventory_item_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_no VARCHAR(50) UNIQUE NOT NULL,
  job_card_id INT,
  labour_charges DECIMAL(10, 2) DEFAULT 0,
  parts_charges DECIMAL(10, 2) DEFAULT 0,
  vat_percentage DECIMAL(5, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  valid_until DATE,
  status ENUM('Draft', 'Sent', 'Approved', 'Rejected') DEFAULT 'Draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL,
  INDEX idx_quotation_no (quotation_no),
  INDEX idx_status (status),
  INDEX idx_job_card (job_card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  job_card_id INT,
  quotation_id INT,
  labour_amount DECIMAL(10, 2) DEFAULT 0,
  parts_amount DECIMAL(10, 2) DEFAULT 0,
  vat_percentage DECIMAL(5, 2) DEFAULT 0,
  grand_total DECIMAL(10, 2) DEFAULT 0,
  status ENUM('Paid', 'Partially Paid', 'Unpaid') DEFAULT 'Unpaid',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
  INDEX idx_invoice_no (invoice_no),
  INDEX idx_status (status),
  INDEX idx_job_card (job_card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_id INT NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_mode ENUM('Cash', 'Bank Transfer', 'Credit') DEFAULT 'Cash',
  payment_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX idx_payment_no (payment_no),
  INDEX idx_invoice (invoice_id),
  INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data
-- Note: After running schema.sql, run: node database/seed.js
-- This will properly hash the password 'password123' using bcrypt for all users

-- Demo Users (passwords will be properly hashed by seed.js script)
-- Using a valid bcrypt hash format as placeholder (will be replaced by seed.js)
INSERT INTO users (name, email, phone, password, role, login_access) VALUES
('Admin User', 'admin@workshop.com', '+91 98765 43210', '$2a$10$placeholder_hash_will_be_replaced_by_seed_script', 'admin', 1),
('Raj Kumar', 'tech@workshop.com', '+91 98765 43211', '$2a$10$placeholder_hash_will_be_replaced_by_seed_script', 'technician', 1),
('Priya Singh', 'store@workshop.com', '+91 98765 43212', '$2a$10$placeholder_hash_will_be_replaced_by_seed_script', 'storekeeper', 1)
ON DUPLICATE KEY UPDATE email=email;

-- Demo Customers
INSERT INTO customers (name, email, phone, company, address) VALUES
('Rajesh Kumar', 'rajesh@example.com', '+91 98765 43210', 'Kumar Transport', '123 Main Street, Mumbai')
ON DUPLICATE KEY UPDATE email=email;

-- Demo Job Card (linked to customer and technician)
INSERT INTO job_cards (job_no, customer_id, technician_id, vehicle_type, vehicle_number, engine_model, job_type, job_sub_type, brand, pump_injector_serial, status, received_date, expected_delivery_date, description) VALUES
('JC-001', 1, 2, 'Truck', 'MH-01-AB-1234', 'Cummins ISX', 'Injector', 'CRDI', 'BOSCH', 'BOSCH-12345', 'Received', '2025-01-15', '2025-01-20', 'Injector cleaning and calibration')
ON DUPLICATE KEY UPDATE job_no=job_no;

-- Demo Testing Record (linked to job card)
INSERT INTO testing_records (job_card_id, test_date, before_pressure, before_leak, before_calibration, before_pass_fail, after_pressure, after_leak, after_calibration, after_pass_fail, pilot_injection, main_injection, return_flow, injector_pressure, leak_test) VALUES
(1, '2025-01-15', '1200', '5', '95', 'Fail', '1500', '2', '98', 'Pass', '2.5', '15.0', '50', '1500', 'Pass')
ON DUPLICATE KEY UPDATE job_card_id=job_card_id;

-- Demo Inventory Items
INSERT INTO inventory_items (part_name, part_code, category, supplier, available_stock, min_stock_level) VALUES
('Plunger Set', 'PLG-001', 'Plunger', 'BOSCH India', 25, 10)
ON DUPLICATE KEY UPDATE part_code=part_code;

-- Demo Quotation (linked to job card)
INSERT INTO quotations (quotation_no, job_card_id, labour_charges, parts_charges, vat_percentage, total_amount, valid_until, status) VALUES
('QT-001', 1, 5000.00, 3000.00, 18.00, 9440.00, '2025-02-15', 'Draft')
ON DUPLICATE KEY UPDATE quotation_no=quotation_no;

-- Demo Invoice (linked to job card and quotation)
INSERT INTO invoices (invoice_no, job_card_id, quotation_id, labour_amount, parts_amount, vat_percentage, grand_total, status) VALUES
('INV-001', 1, 1, 5000.00, 3000.00, 18.00, 9440.00, 'Unpaid')
ON DUPLICATE KEY UPDATE invoice_no=invoice_no;

-- Demo Payment (linked to invoice)
INSERT INTO payments (payment_no, invoice_id, amount_paid, payment_mode, payment_date) VALUES
('PAY-001', 1, 5000.00, 'Cash', '2025-01-15')
ON DUPLICATE KEY UPDATE payment_no=payment_no;

