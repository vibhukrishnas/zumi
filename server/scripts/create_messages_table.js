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

        // Create Messages Table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,  -- Can be user or provider (for now provider is virtual)
                receiver_id INT NOT NULL, -- The user receiving the message (or provider)
                booking_id INT,           -- Context
                message_text TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                sender_type VARCHAR(20) DEFAULT 'user', -- 'user' or 'provider'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
            )
        `;
        // Note: foreign key for sender/receiver is tricky if providers aren't in users table yet.
        // For simple "User <-> Virtual Provider" chat, we'll store user_id as receiver/sender context and use sender_type.

        await pool.execute(createTableQuery);
        console.log('✅ Created messages table.');

        pool.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
