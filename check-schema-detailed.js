const pool = require('./config/db');

async function checkSchema() {
    try {
        console.log('--- Checking inventory_items columns ---');
        const [invRows] = await pool.query('SHOW COLUMNS FROM inventory_items');
        invRows.forEach(row => console.log(`${row.Field}: ${row.Type}`));

        console.log('\n--- Checking invoices columns ---');
        const [invoiceRows] = await pool.query('SHOW COLUMNS FROM invoices');
        invoiceRows.forEach(row => console.log(`${row.Field}: ${row.Type}`));

        console.log('\n--- Checking job_card_materials columns ---');
        const [jcmRows] = await pool.query('SHOW COLUMNS FROM job_card_materials');
        jcmRows.forEach(row => console.log(`${row.Field}: ${row.Type}`));

        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
