-- Migration: Add Saudi Arabia Workshop Features
-- Date: 2026-01-13
-- Description: Add barcode, cost price, profit tracking, and company branding features

USE workshop_db;

-- 1. Add barcode field to inventory_items
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS barcode VARCHAR(255) UNIQUE AFTER part_code,
ADD INDEX idx_barcode (barcode);

-- 2. Add cost price fields to inventory for profit calculation
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) DEFAULT 0 AFTER min_stock_level,
ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10, 2) DEFAULT 0 AFTER unit_price,
ADD COLUMN IF NOT EXISTS sales_price DECIMAL(10, 2) DEFAULT 0 AFTER wholesale_price,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2) DEFAULT 0 AFTER sales_price;

-- 3. Add cost and profit fields to invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS labour_cost DECIMAL(10, 2) DEFAULT 0 AFTER labour_amount,
ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(10, 2) DEFAULT 0 AFTER parts_amount,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) DEFAULT 0 AFTER grand_total,
ADD COLUMN IF NOT EXISTS profit_amount DECIMAL(10, 2) DEFAULT 0 AFTER total_cost;

-- 4. Add profit visibility flag to invoices (admin can control visibility)
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS show_cost TINYINT(1) DEFAULT 0 AFTER profit_amount;

-- 5. Add company logo and location barcode to settings
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS company_logo VARCHAR(500) AFTER workshop_email,
ADD COLUMN IF NOT EXISTS location_name VARCHAR(255) DEFAULT 'Buraydah / Arkan Motors Co.' AFTER company_logo,
ADD COLUMN IF NOT EXISTS location_barcode VARCHAR(500) AFTER location_name,
ADD COLUMN IF NOT EXISTS show_profit_to_roles VARCHAR(255) DEFAULT 'admin' AFTER location_barcode;

-- 6. Create Sales Returns table
CREATE TABLE IF NOT EXISTS sales_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_no VARCHAR(50) UNIQUE NOT NULL,
  invoice_id INT,
  job_card_id INT,
  return_date DATE NOT NULL,
  return_amount DECIMAL(10, 2) DEFAULT 0,
  reason TEXT,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_return_no (return_no),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Create Payment Vouchers table
CREATE TABLE IF NOT EXISTS payment_vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_no VARCHAR(50) UNIQUE NOT NULL,
  voucher_date DATE NOT NULL,
  paid_to VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_mode ENUM('Cash', 'Bank Transfer', 'Cheque') DEFAULT 'Cash',
  reference_no VARCHAR(100),
  description TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_voucher_no (voucher_no),
  INDEX idx_voucher_date (voucher_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Create Receipt Vouchers table
CREATE TABLE IF NOT EXISTS receipt_vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_no VARCHAR(50) UNIQUE NOT NULL,
  voucher_date DATE NOT NULL,
  received_from VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_mode ENUM('Cash', 'Bank Transfer', 'Cheque') DEFAULT 'Cash',
  reference_no VARCHAR(100),
  description TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_voucher_no (voucher_no),
  INDEX idx_voucher_date (voucher_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Create Item Activity Tracking table (comprehensive history)
CREATE TABLE IF NOT EXISTS item_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_item_id INT NOT NULL,
  activity_type ENUM('Purchase', 'Sale', 'Stock In', 'Stock Out', 'Job Usage', 'Return') NOT NULL,
  activity_date DATE NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) DEFAULT 0,
  reference_type VARCHAR(50), -- 'invoice', 'job_card', 'purchase_order', etc.
  reference_id INT,
  reference_no VARCHAR(100),
  supplier_name VARCHAR(255),
  customer_name VARCHAR(255),
  notes TEXT,
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_inventory_item (inventory_item_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_activity_date (activity_date),
  INDEX idx_reference (reference_type, reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Add purchase bill details to stock_transactions
ALTER TABLE stock_transactions
ADD COLUMN IF NOT EXISTS bill_no VARCHAR(100) AFTER notes,
ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255) AFTER bill_no,
ADD COLUMN IF NOT EXISTS purchase_date DATE AFTER supplier_name,
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) DEFAULT 0 AFTER purchase_date;

-- 11. Add quantity and material costs to job_card_materials
ALTER TABLE job_card_materials
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10, 2) DEFAULT 0 AFTER unit_price,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) DEFAULT 0 AFTER total_price;

-- 12. Add quotation and final amount fields to job_cards if not exists
ALTER TABLE job_cards
ADD COLUMN IF NOT EXISTS quotation_amount DECIMAL(10, 2) DEFAULT 0 AFTER description,
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2) DEFAULT 0 AFTER quotation_amount,
ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1 AFTER final_amount;

-- 13. Insert default settings values
INSERT INTO settings (id, workshop_name, workshop_address, workshop_phone, workshop_email, vat_percentage, location_name)
VALUES (1, 'Arkan Motors Co.', 'Buraydah, Saudi Arabia', '+966XXXXXXXXX', 'info@arkanmotors.sa', 15, 'Buraydah / Arkan Motors Co.')
ON DUPLICATE KEY UPDATE
  vat_percentage = 15,
  location_name = 'Buraydah / Arkan Motors Co.';

-- Success message
SELECT 'Saudi Arabia Workshop Features Migration Completed Successfully!' AS status;
