const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Starting migration...');

        // 1. Create sales_return_items table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sales_return_id INT NOT NULL,
        inventory_item_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2),
        total_price DECIMAL(10, 2),
        FOREIGN KEY (sales_return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

        // 2. Add flags to sales_returns to track if stock/accounting was updated
        await connection.execute(`
      ALTER TABLE sales_returns 
      ADD COLUMN IF NOT EXISTS stock_updated TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS accounting_updated TINYINT(1) DEFAULT 0;
    `);

        // 3. Add supplier_id to payment_vouchers for better tracking
        // But first check if suppliers table exists. It doesn't seem to. 
        // I'll add paid_to_type (Supplier, Expense, Other)
        await connection.execute(`
      ALTER TABLE payment_vouchers
      ADD COLUMN IF NOT EXISTS paid_to_type ENUM('Supplier', 'Expense', 'Employee', 'Other') DEFAULT 'Other' AFTER paid_to;
    `);

        // 4. Add received_from_type to receipt_vouchers
        await connection.execute(`
      ALTER TABLE receipt_vouchers
      ADD COLUMN IF NOT EXISTS received_from_type ENUM('Customer', 'Advance', 'Internal', 'Other') DEFAULT 'Other' AFTER received_from;
    `);

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
