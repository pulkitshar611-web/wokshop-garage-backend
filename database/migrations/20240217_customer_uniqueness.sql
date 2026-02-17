-- Migration to enforce customer uniqueness
-- Adds unique constraints to phone and email fields in customers table

USE workshop_db;

-- 1. Create a temporary procedure to handle existing duplicates to avoid migration failure
DELIMITER //

CREATE PROCEDURE FixCustomerDuplicates()
BEGIN
    -- Fix duplicate phones by appending ID to the non-first occurrences
    -- This is a safety measure so the UNIQUE constraint doesn't fail
    UPDATE customers c1
    INNER JOIN (
        SELECT MIN(id) as min_id, phone
        FROM customers
        WHERE phone IS NOT NULL AND phone != '' AND is_deleted = 0
        GROUP BY phone
        HAVING COUNT(*) > 1
    ) c2 ON c1.phone = c2.phone
    SET c1.phone = CONCAT(c1.phone, '_DUP_', c1.id)
    WHERE c1.id != c2.min_id AND c1.is_deleted = 0;

    -- Fix duplicate emails by appending ID to the non-first occurrences
    UPDATE customers c1
    INNER JOIN (
        SELECT MIN(id) as min_id, email
        FROM customers
        WHERE email IS NOT NULL AND email != '' AND is_deleted = 0
        GROUP BY email
        HAVING COUNT(*) > 1
    ) c3 ON c1.email = c3.email
    SET c1.email = CONCAT(c1.email, '_DUP_', c1.id)
    WHERE c1.id != c3.min_id AND c1.is_deleted = 0;
END //

DELIMITER ;

-- Run the fix
CALL FixCustomerDuplicates();
DROP PROCEDURE IF EXISTS FixCustomerDuplicates;

-- 2. Add UNIQUE constraints
-- Note: Phone is now treated as mandatory unique for active customers.
-- Since MySQL doesn't natively support filtered unique indexes easily, 
-- we will use application level logic for is_deleted, 
-- and a standard UNIQUE index for global uniqueness (including soft-deleted).
-- This means once a number is used, it's used unless it's genuinely changed.

ALTER TABLE customers MODIFY phone VARCHAR(50) NOT NULL;
ALTER TABLE customers ADD CONSTRAINT UNIQUE (phone);
ALTER TABLE customers ADD CONSTRAINT UNIQUE (email);

-- 3. Optimization indexes
CREATE INDEX idx_customers_phone ON customers(phone);
