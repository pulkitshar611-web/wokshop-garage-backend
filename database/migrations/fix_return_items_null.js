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
        console.log('Modifying sales_return_items schema...');

        // Make inventory_item_id nullable to support generic materials/services
        await connection.execute(`
      ALTER TABLE sales_return_items 
      MODIFY COLUMN inventory_item_id INT NULL;
    `);

        console.log('Schema modified successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
