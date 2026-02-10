const pool = require('./config/db');

async function fixDropdowns() {
    try {
        // Drop and recreate to be sure
        await pool.query('DROP TABLE IF EXISTS dropdown_options');
        console.log('✅ Dropped dropdown_options table');

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS dropdown_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        field_type VARCHAR(100) NOT NULL,
        job_type VARCHAR(100) NOT NULL,
        option_value VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY idx_unique_option (category, field_type, job_type, option_value)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

        await pool.query(createTableQuery);
        console.log('✅ Created dropdown_options table');

        const initialOptions = [
            ['pressure', 'before', 'CRDI Injector', '1200'],
            ['pressure', 'before', 'CRDI Injector', '1500'],
            ['leak', 'before', 'CRDI Injector', 'Pass'],
            ['leak', 'before', 'CRDI Injector', 'Fail'],
        ];

        for (const opt of initialOptions) {
            await pool.query(
                'INSERT IGNORE INTO dropdown_options (category, field_type, job_type, option_value) VALUES (?, ?, ?, ?)',
                opt
            );
        }

        console.log('✅ Added initial options');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fix failed:', error);
        process.exit(1);
    }
}

fixDropdowns();
