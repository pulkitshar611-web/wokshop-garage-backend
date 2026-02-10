/**
 * Database Seed Script
 * Run this to create demo users with proper password hash
 * Usage: node database/seed.js
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'workshop_db'
    });

    console.log('✅ Connected to database');

    // Generate password hash for 'password123'
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('✅ Generated password hash');

    // Demo users to create/update
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@workshop.com',
        phone: '+91 98765 43210',
        role: 'admin',
        login_access: 1
      },
      {
        name: 'Raj Kumar',
        email: 'tech@workshop.com',
        phone: '+91 98765 43211',
        role: 'technician',
        login_access: 1
      },
      {
        name: 'Priya Singh',
        email: 'store@workshop.com',
        phone: '+91 98765 43212',
        role: 'storekeeper',
        login_access: 1
      }
    ];

    // Create or update each user
    for (const user of demoUsers) {
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      );

      if (existingUsers.length > 0) {
        // Update existing user
        await connection.execute(
          'UPDATE users SET name = ?, phone = ?, password = ?, role = ?, login_access = ? WHERE email = ?',
          [user.name, user.phone, passwordHash, user.role, user.login_access, user.email]
        );
        console.log(`✅ Updated ${user.role} user: ${user.email}`);
      } else {
        // Insert new user
        await connection.execute(
          `INSERT INTO users (name, email, phone, password, role, login_access) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [user.name, user.email, user.phone, passwordHash, user.role, user.login_access]
        );
        console.log(`✅ Created ${user.role} user: ${user.email}`);
      }
    }

    console.log('\n📝 Demo User Credentials (all use password: password123):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin:');
    console.log('   Email: admin@workshop.com');
    console.log('   Password: password123');
    console.log('\n🔧 Technician:');
    console.log('   Email: tech@workshop.com');
    console.log('   Password: password123');
    console.log('\n📦 Storekeeper:');
    console.log('   Email: store@workshop.com');
    console.log('   Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Database seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run seed
seedDatabase();

