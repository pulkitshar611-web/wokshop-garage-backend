ALTER TABLE testing_records
  ADD COLUMN category_type ENUM('turbocharger','crdi_injector','mechanical_pump_injector') NULL AFTER test_date,
  ADD COLUMN schema_version INT NOT NULL DEFAULT 1 AFTER category_type,
  ADD COLUMN before_data JSON NULL AFTER leak_test,
  ADD COLUMN after_data JSON NULL AFTER before_data,
  ADD COLUMN attachments JSON NULL AFTER after_data,
  ADD COLUMN tested_by VARCHAR(255) NULL AFTER attachments,
  ADD COLUMN approved_by VARCHAR(255) NULL AFTER tested_by,
  ADD COLUMN approval_date DATE NULL AFTER approved_by,
  ADD INDEX idx_category_type (category_type);
