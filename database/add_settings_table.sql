-- Add Settings Table
-- Run this SQL to create the settings table for workshop configuration

USE workshop_db;

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  workshop_name VARCHAR(255) DEFAULT 'ABC Workshop',
  workshop_address TEXT DEFAULT '123 Main Street, Mumbai',
  workshop_phone VARCHAR(50) DEFAULT '+91 98765 43210',
  workshop_email VARCHAR(255) DEFAULT 'info@workshop.com',
  vat_percentage DECIMAL(5, 2) DEFAULT 18,
  invoice_format VARCHAR(50) DEFAULT 'Standard',
  language VARCHAR(50) DEFAULT 'English',
  data_backup VARCHAR(50) DEFAULT 'Enabled',
  job_status_received VARCHAR(50) DEFAULT 'Received',
  job_status_under_repair VARCHAR(50) DEFAULT 'Under Repair',
  job_status_testing VARCHAR(50) DEFAULT 'Testing',
  job_status_completed VARCHAR(50) DEFAULT 'Completed',
  job_status_delivered VARCHAR(50) DEFAULT 'Delivered',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT settings_single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings if table is empty
INSERT INTO settings (id) 
SELECT 1 
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

