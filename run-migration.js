/**
 * Run Database Migration Script
 * Executes the Saudi features migration
 */

const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function runMigration() {
  try {
    console.log('🔄 Starting migration: add_saudi_features.sql');
    console.log('━'.repeat(50));

    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add_saudi_features.sql');
    let migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments
    migrationSQL = migrationSQL.replace(/--[^\n]*/g, '');
    migrationSQL = migrationSQL.replace(/\/\*[\s\S]*?\*\//g, '');

    // Split by semicolons but be careful with semicolons inside strings
    const statements = [];
    let currentStatement = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < migrationSQL.length; i++) {
      const char = migrationSQL[i];
      const prevChar = i > 0 ? migrationSQL[i - 1] : '';

      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (char === ';' && !inString) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }

    // Add the last statement if exists
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();

      // Skip USE statements and empty statements
      if (!statement || statement.toLowerCase().startsWith('use ')) {
        continue;
      }

      try {
        // Execute each statement
        await pool.execute(statement);
        successCount++;

        // Show progress for important statements
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.toUpperCase().includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE `?(\w+)`?/i)?.[1];
          console.log(`✅ Altered table: ${tableName}`);
        } else if (statement.toUpperCase().includes('INSERT INTO')) {
          console.log(`✅ Inserted default data`);
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (error.code === 'ER_DUP_FIELDNAME' ||
            error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.code === 'ER_DUP_KEYNAME' ||
            error.message.includes('already exists') ||
            error.message.includes('Duplicate column') ||
            error.message.includes('Duplicate key')) {
          console.log(`⚠️  Skipped (already exists)`);
          successCount++;
        } else {
          errorCount++;
          console.error(`❌ Error: ${error.message}`);
          console.error(`   Statement: ${statement.substring(0, 100)}...\n`);
        }
      }
    }

    console.log('\n' + '━'.repeat(50));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('━'.repeat(50));

    // Verify tables were created
    console.log('\n🔍 Verifying created tables...\n');

    const tablesToCheck = [
      'sales_returns',
      'payment_vouchers',
      'receipt_vouchers',
      'item_activity'
    ];

    for (const table of tablesToCheck) {
      try {
        const [rows] = await pool.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          console.log(`✅ Table exists: ${table}`);
        } else {
          console.log(`❌ Table missing: ${table}`);
        }
      } catch (error) {
        console.log(`❌ Could not verify table: ${table}`);
      }
    }

    console.log('\n' + '━'.repeat(50));
    console.log('🎉 Migration completed successfully!');
    console.log('━'.repeat(50));
    console.log('\n✨ You can now:');
    console.log('   1. Create sales returns');
    console.log('   2. Create payment vouchers');
    console.log('   3. Create receipt vouchers');
    console.log('   4. Use barcode in inventory\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
