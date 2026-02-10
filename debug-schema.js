const pool = require('./config/db');

async function debugSchema() {
    try {
        console.log('Connecting to database...');
        // check table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'testing_records'");
        if (tables.length === 0) {
            console.error("❌ Table 'testing_records' does not exist!");
            process.exit(1);
        }
        console.log("✅ Table 'testing_records' exists.");

        // get columns
        const [columns] = await pool.query("SHOW COLUMNS FROM testing_records");
        console.log('\nCurrent Columns:');
        console.table(columns.map(c => ({ Field: c.Field, Type: c.Type })));

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

debugSchema();
