const pool = require('./config/db');

async function runMigration() {
    const alterQueries = [
        { sql: 'ALTER TABLE job_cards ADD COLUMN quotation_amount DECIMAL(10, 2) DEFAULT 0', field: 'quotation_amount' },
        { sql: 'ALTER TABLE job_cards ADD COLUMN final_amount DECIMAL(10, 2) DEFAULT 0', field: 'final_amount' },
        { sql: 'ALTER TABLE job_card_materials ADD COLUMN cost_at_use DECIMAL(10, 2) DEFAULT 0', field: 'cost_at_use' },
        { sql: 'ALTER TABLE job_card_materials ADD COLUMN stock_deducted TINYINT(1) DEFAULT 0', field: 'stock_deducted' },
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

    console.log('✅ Migration completed');
    process.exit(0);
}

runMigration();
