/**
 * Check .env file configuration
 * Run: node check-env.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔍 Checking .env file...\n');

// Check if file exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file NOT FOUND at:', envPath);
  console.log('\n💡 Solution: Run "node create-env.js" to create it');
  process.exit(1);
}

console.log('✅ .env file exists at:', envPath);

// Read and check content
try {
  const content = fs.readFileSync(envPath, 'utf8');
  
  // Check for JWT_SECRET
  if (content.includes('JWT_SECRET=')) {
    const jwtSecretLine = content.split('\n').find(line => line.trim().startsWith('JWT_SECRET='));
    if (jwtSecretLine && jwtSecretLine.split('=')[1] && jwtSecretLine.split('=')[1].trim() !== '') {
      console.log('✅ JWT_SECRET is configured');
    } else {
      console.error('❌ JWT_SECRET is empty or not set');
    }
  } else {
    console.error('❌ JWT_SECRET not found in .env file');
  }
  
  // Check for DB_NAME
  if (content.includes('DB_NAME=')) {
    console.log('✅ DB_NAME is configured');
  } else {
    console.error('❌ DB_NAME not found');
  }
  
  // Test loading with dotenv
  require('dotenv').config({ path: envPath });
  
  if (process.env.JWT_SECRET) {
    console.log('\n✅ Environment variables loaded successfully!');
    console.log('📝 JWT_SECRET length:', process.env.JWT_SECRET.length, 'characters');
    console.log('📝 DB_NAME:', process.env.DB_NAME || 'NOT SET');
  } else {
    console.error('\n❌ JWT_SECRET not loaded from .env file');
    console.log('\n💡 Make sure .env file has: JWT_SECRET=your-secret-key');
  }
  
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  process.exit(1);
}

