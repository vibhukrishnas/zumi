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

        // Check if column exists
        const [columns] = await pool.execute("SHOW COLUMNS FROM services LIKE 'is_premium'");
        if (columns.length === 0) {
            console.log('🔄 Adding is_premium column to services table...');
            await pool.execute("ALTER TABLE services ADD COLUMN is_premium BOOLEAN DEFAULT FALSE");
            console.log('✅ Column added.');
        } else {
            console.log('ℹ️ Column is_premium already exists.');
        }

        // Set Grooming services to Premium
        console.log('🔄 Updating Grooming services to be Premium...');
        const [result] = await pool.execute("UPDATE services SET is_premium = TRUE WHERE title LIKE '%Grooming%'");
        console.log(`✅ Updated ${result.changedRows} rows.`);

        pool.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
