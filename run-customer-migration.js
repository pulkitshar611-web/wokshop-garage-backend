const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function runMigration() {
    try {
        console.log('🔄 Running Customer Uniqueness Migration...');

        // 1. Manually fix duplicates first using queries
        const [dupes] = await pool.execute(`
      SELECT phone, COUNT(*) as count 
      FROM customers 
      WHERE phone IS NOT NULL AND phone != '' AND is_deleted = 0 
      GROUP BY phone 
      HAVING count > 1
    `);

        for (const dupe of dupes) {
            const [records] = await pool.execute(
                'SELECT id FROM customers WHERE phone = ? AND is_deleted = 0 ORDER BY id ASC',
                [dupe.phone]
            );
            // Keep the first one, rename others
            for (let i = 1; i < records.length; i++) {
                await pool.execute(
                    'UPDATE customers SET phone = CONCAT(phone, "_DUP_", id) WHERE id = ?',
                    [records[i].id]
                );
            }
        }

        const [emailDupes] = await pool.execute(`
      SELECT email, COUNT(*) as count 
      FROM customers 
      WHERE email IS NOT NULL AND email != '' AND is_deleted = 0 
      GROUP BY email 
      HAVING count > 1
    `);

        for (const dupe of emailDupes) {
            const [records] = await pool.execute(
                'SELECT id FROM customers WHERE email = ? AND is_deleted = 0 ORDER BY id ASC',
                [dupe.email]
            );
            for (let i = 1; i < records.length; i++) {
                await pool.execute(
                    'UPDATE customers SET email = CONCAT(email, "_DUP_", id) WHERE id = ?',
                    [records[i].id]
                );
            }
        }

        // 2. Apply constraints
        console.log('adding phone not null constraint...');
        try {
            await pool.execute("DELETE FROM customers WHERE phone IS NULL OR phone = ''"); // Ensure no empty phones exist or handle them
        } catch (e) { }

        console.log('Altering table...');
        try { await pool.execute('ALTER TABLE customers MODIFY phone VARCHAR(50) NOT NULL'); } catch (e) { console.log(e.message); }
        try { await pool.execute('ALTER TABLE customers ADD UNIQUE INDEX idx_unique_phone (phone)'); } catch (e) { console.log(e.message); }
        try { await pool.execute('ALTER TABLE customers ADD UNIQUE INDEX idx_unique_email (email)'); } catch (e) { console.log(e.message); }

        console.log('✅ Migration Finished!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
}

runMigration();
