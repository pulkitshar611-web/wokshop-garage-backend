const pool = require('./config/db');

async function checkSchema() {
    try {
        const [rows] = await pool.query('DESCRIBE testing_records');
        console.log('Schema for testing_records:');
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error('Error fetching schema:', err);
        process.exit(1);
    }
}

checkSchema();
