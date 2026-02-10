
-- Add quantity to job_cards
ALTER TABLE job_cards ADD COLUMN quantity INT DEFAULT 1;

-- Create job_card_materials table
CREATE TABLE IF NOT EXISTS job_card_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_card_id INT NOT NULL,
  material_name VARCHAR(255) NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE,
  INDEX idx_job_card (job_card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
