const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [columns] = await connection.execute('SHOW COLUMNS FROM inventory_items');
        console.log('Columns in inventory_items:');
        columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

checkSchema();
