-- Add unit_price to inventory_items if not exists
ALTER TABLE inventory_items ADD COLUMN unit_price DECIMAL(10, 2) DEFAULT 0;

-- Update job_card_materials to reference inventory
ALTER TABLE job_card_materials ADD COLUMN inventory_item_id INT;
ALTER TABLE job_card_materials ADD CONSTRAINT fk_jcm_inventory FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE SET NULL;
