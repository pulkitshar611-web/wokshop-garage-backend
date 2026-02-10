-- Add quotation_amount and final_amount to job_cards
ALTER TABLE job_cards ADD COLUMN quotation_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE job_cards ADD COLUMN final_amount DECIMAL(10, 2) DEFAULT 0;

-- Add cost_at_use to job_card_materials (to track price at time of use)
ALTER TABLE job_card_materials ADD COLUMN cost_at_use DECIMAL(10, 2) DEFAULT 0;

-- Add deducted flag to prevent double deduction
ALTER TABLE job_card_materials ADD COLUMN stock_deducted TINYINT(1) DEFAULT 0;
