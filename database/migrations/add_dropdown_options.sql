
CREATE TABLE IF NOT EXISTS dropdown_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_type VARCHAR(50) NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  option_value VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_option (category_type, field_key, option_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
