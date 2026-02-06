/**
 * Database Migration Runner
 * Runs all necessary schema migrations
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    console.log('🔄 Starting database migration...\n');

    try {
        // Add notifications_enabled to users
        console.log('📝 Updating users table...');
        try {
            await connection.execute(`
                ALTER TABLE users 
                ADD COLUMN notifications_enabled TINYINT(1) DEFAULT 1
            `);
            console.log('   ✅ Added notifications_enabled column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('   ⏭️  notifications_enabled already exists');
            } else {
                throw e;
            }
        }

        // Add booking columns
        console.log('\n📝 Updating bookings table...');
        const bookingColumns = [
            { name: 'booking_date', sql: 'ADD COLUMN booking_date DATETIME' },
            { name: 'coupon_code', sql: 'ADD COLUMN coupon_code VARCHAR(50)' },
            { name: 'coupon_discount', sql: 'ADD COLUMN coupon_discount DECIMAL(5,2) DEFAULT 0' },
            { name: 'subscription_discount', sql: 'ADD COLUMN subscription_discount DECIMAL(5,2) DEFAULT 0' },
            { name: 'reward_promo_code', sql: 'ADD COLUMN reward_promo_code VARCHAR(50)' },
            { name: 'reward_promo_discount', sql: 'ADD COLUMN reward_promo_discount DECIMAL(5,2) DEFAULT 0' },
            { name: 'provider_discount', sql: 'ADD COLUMN provider_discount DECIMAL(5,2) DEFAULT 0' },
        ];

        for (const col of bookingColumns) {
            try {
                await connection.execute(`ALTER TABLE bookings ${col.sql}`);
                console.log(`   ✅ Added ${col.name} column`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`   ⏭️  ${col.name} already exists`);
                } else {
                    console.error(`   ❌ Error adding ${col.name}:`, e.message);
                }
            }
        }

        // Create coupons table
        console.log('\n📝 Creating coupons table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS coupons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                description VARCHAR(255),
                discount_percentage DECIMAL(5,2) NOT NULL,
                valid_from DATETIME NOT NULL,
                valid_until DATETIME NOT NULL,
                usage_limit INT DEFAULT 0,
                used_count INT DEFAULT 0,
                applicable_types ENUM('all', 'event', 'service') DEFAULT 'all',
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_code (code),
                INDEX idx_valid_dates (valid_from, valid_until)
            )
        `);
        console.log('   ✅ Coupons table ready');

        // Create pets table
        console.log('\n📝 Creating pets table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                species VARCHAR(50) DEFAULT 'dog',
                breed VARCHAR(100),
                age INT,
                weight DECIMAL(5,2),
                notes TEXT,
                image_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('   ✅ Pets table ready');

        // Create messages table
        console.log('\n📝 Creating messages table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                content TEXT NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_conversation (sender_id, receiver_id)
            )
        `);
        console.log('   ✅ Messages table ready');

        // Create activity_logs table
        console.log('\n📝 Creating activity_logs table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(100) NOT NULL,
                details JSON,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_action (user_id, action),
                INDEX idx_created (created_at)
            )
        `);
        console.log('   ✅ Activity logs table ready');

        // Add service/event columns
        console.log('\n📝 Updating services table...');
        try {
            await connection.execute(`ALTER TABLE services ADD COLUMN provider_discount DECIMAL(5,2) DEFAULT 0`);
            console.log('   ✅ Added provider_discount column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('   ⏭️  provider_discount already exists');
        }

        console.log('\n📝 Updating events table...');
        try {
            await connection.execute(`ALTER TABLE events ADD COLUMN provider_discount DECIMAL(5,2) DEFAULT 0`);
            console.log('   ✅ Added provider_discount column');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('   ⏭️  provider_discount already exists');
        }

        console.log('\n✅ Migration completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
