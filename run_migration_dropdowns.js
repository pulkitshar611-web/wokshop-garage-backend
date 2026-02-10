const pool = require('./config/db');

async function runMigration() {
    try {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS dropdown_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL, -- e.g., 'pressure', 'leak', 'calibration'
        field_type VARCHAR(100) NOT NULL, -- 'before' or 'after' or 'general'
        job_type VARCHAR(100) NOT NULL, -- e.g., 'Turbocharger', 'Mechanical Pump'
        option_value VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY idx_unique_option (category, field_type, job_type, option_value)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

        await pool.query(createTableQuery);
        console.log('✅ Created dropdown_options table');

        // Add some initial options if needed
        const initialOptions = [
            ['pressure', 'before', 'CRDI Injector', '1200'],
            ['pressure', 'before', 'CRDI Injector', '1500'],
            ['leak', 'before', 'CRDI Injector', 'Pass'],
            ['leak', 'before', 'CRDI Injector', 'Fail'],
        ];

        for (const opt of initialOptions) {
            try {
                await pool.query(
                    'INSERT IGNORE INTO dropdown_options (category, field_type, job_type, option_value) VALUES (?, ?, ?, ?)',
                    opt
                );
            } catch (err) {
                console.error('Error inserting initial option:', err.message);
            }
        }

        console.log('✅ Migration completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
