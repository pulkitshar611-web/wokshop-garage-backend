const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        const query = `
      ALTER TABLE testing_records
      ADD COLUMN category_type VARCHAR(50) NULL AFTER test_date,
      ADD COLUMN schema_version INT DEFAULT 1 AFTER category_type,
      ADD COLUMN before_data JSON NULL,
      ADD COLUMN after_data JSON NULL,
      ADD COLUMN attachments JSON NULL,
      ADD COLUMN tested_by VARCHAR(100) NULL,
      ADD COLUMN approved_by VARCHAR(100) NULL,
      ADD COLUMN approval_date DATE NULL;
    `;
        await pool.query(query);
        console.log('✅ Migration successful: Added missing columns to testing_records');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Columns already exist, skipping migration.');
            process.exit(0);
        }
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
