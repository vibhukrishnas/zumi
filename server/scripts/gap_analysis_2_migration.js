const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 1,
            queueLimit: 0
        });

        console.log('🔌 Connected to DB');

        // 1. REVIEWS TABLE
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                provider_id INT NOT NULL,
                service_id INT, -- Optional link to specific service
                rating INT CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                -- provider_id FK skipped if providers table doesn't exist, treating as user_id or generic ID
            )
        `);
        console.log('✅ Created reviews table.');

        // 2. AVAILABILITY TABLE
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS availability (
                id INT AUTO_INCREMENT PRIMARY KEY,
                provider_id INT NOT NULL,
                day_of_week VARCHAR(20) NOT NULL, -- 'Monday', 'Tuesday' etc.
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created availability table.');

        // 3. User Avatar Column
        try {
            await pool.execute("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL");
            console.log('✅ Added profile_image to users.');
        } catch (e) { console.log('ℹ️ profile_image column exists.'); }

        pool.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
