/**
 * Migration Script: Add pets and pet_activities tables
 * Run with: node scripts/migrate_pets_activities.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pet_services'
        });

        console.log('🔌 Connected to database');

        // 1. Create pets table
        console.log('📦 Creating pets table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                species ENUM('Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Other') DEFAULT 'Dog',
                breed VARCHAR(100),
                age INT,
                weight DECIMAL(5,2),
                image_url VARCHAR(500),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            )
        `);
        console.log('✅ pets table created');

        // 2. Create pet_activities table
        console.log('📦 Creating pet_activities table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS pet_activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pet_id INT NOT NULL,
                user_id INT NOT NULL,
                activity_type ENUM('walk', 'feeding', 'grooming', 'vet_visit', 'medication', 'training', 'play', 'booking', 'other') NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                booking_id INT,
                duration_minutes INT,
                activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
                INDEX idx_pet_id (pet_id),
                INDEX idx_activity_date (activity_date)
            )
        `);
        console.log('✅ pet_activities table created');

        // 3. Add pet_id column to bookings if not exists
        console.log('📦 Checking bookings table for pet_id column...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'pet_id'
        `, [process.env.DB_NAME || 'pet_services']);

        if (columns.length === 0) {
            await connection.execute(`
                ALTER TABLE bookings 
                ADD COLUMN pet_id INT,
                ADD FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL
            `);
            console.log('✅ Added pet_id column to bookings table');
        } else {
            console.log('ℹ️ pet_id column already exists in bookings');
        }

        // 4. Ensure booking_date column exists in bookings
        const [bookingDateCol] = await connection.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'booking_date'
        `, [process.env.DB_NAME || 'pet_services']);

        if (bookingDateCol.length === 0) {
            await connection.execute(`
                ALTER TABLE bookings 
                ADD COLUMN booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            console.log('✅ Added booking_date column to bookings table');
        } else {
            console.log('ℹ️ booking_date column already exists in bookings');
        }

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Connection closed');
        }
    }
}

migrate();
