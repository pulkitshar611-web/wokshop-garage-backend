const pool = require('./config/db');

async function runMigration() {
    const alterQueries = [
        { sql: 'ALTER TABLE inventory_items ADD COLUMN wholesale_price DECIMAL(10, 2) DEFAULT 0', field: 'wholesale_price' },
        { sql: 'ALTER TABLE inventory_items ADD COLUMN sales_price DECIMAL(10, 2) DEFAULT 0', field: 'sales_price' },
        { sql: 'ALTER TABLE inventory_items ADD COLUMN purchase_price DECIMAL(10, 2) DEFAULT 0', field: 'purchase_price' },
    ];

    for (const q of alterQueries) {
        try {
            await pool.query(q.sql);
            console.log(`✅ Added ${q.field}`);
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log(`ℹ️ ${q.field} already exists`);
            } else {
                console.error(`❌ Error adding ${q.field}:`, err.message);
            }
        }
    }

    console.log('✅ Inventory prices migration completed');
    process.exit(0);
}

runMigration();
