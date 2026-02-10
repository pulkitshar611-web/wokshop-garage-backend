const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');

async function checkSchema() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'garage_workshop'
        });

        const results = {};

        const tables = ['item_activity', 'stock_transactions', 'job_card_materials', 'sales_return_items', 'inventory_items'];

        for (const table of tables) {
            try {
                const [cols] = await pool.execute(`DESCRIBE ${table}`);
                results[table] = cols;
            } catch (e) {
                results[table] = 'Not found';
            }
        }

        fs.writeFileSync('schema_info.json', JSON.stringify(results, null, 2));
        console.log('Schema info written to schema_info.json');

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkSchema();
