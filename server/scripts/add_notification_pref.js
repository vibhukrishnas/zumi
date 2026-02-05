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

        // Add notifications_enabled column if not exists
        try {
            await pool.execute("ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE");
            console.log('✅ Added notifications_enabled column.');
        } catch (e) {
            console.log('ℹ️ Column likely exists or error:', e.message);
        }

        pool.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
