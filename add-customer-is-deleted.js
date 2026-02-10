const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration to add is_deleted to customers...');

        // Check if column exists
        const [columns] = await pool.execute(
            "SHOW COLUMNS FROM customers LIKE 'is_deleted'"
        );

        if (columns.length === 0) {
            await pool.execute(
                "ALTER TABLE customers ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE"
            );
            console.log('✅ Added is_deleted column to customers table');
        } else {
            console.log('ℹ️ is_deleted column already exists');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
