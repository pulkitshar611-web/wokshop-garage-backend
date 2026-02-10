/**
 * Create .env file if it doesn't exist
 * Run: node create-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists');
  console.log('📝 Current .env file location:', envPath);
  console.log('🔄 Overwriting with default values...');
}

// Default .env content
const envContent = `# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=workshop_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=workshop-management-secret-key-2025-change-in-production
JWT_EXPIRES_IN=7d
`;

try {
  // Create .env file
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ .env file created successfully!');
  console.log('📝 File location:', envPath);
  console.log('\n⚠️  IMPORTANT: Update DB_PASSWORD with your MySQL password');
  console.log('⚠️  IMPORTANT: Change JWT_SECRET in production!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

