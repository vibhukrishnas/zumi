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

        // Create Activity Logs Table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                activity_type VARCHAR(50) NOT NULL, -- 'Walk', 'Feeding', 'Playtime'
                duration_minutes INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;

        await pool.execute(createTableQuery);
        console.log('✅ Created activity_logs table.');

        // Seed with sample data for today
        const [users] = await pool.execute("SELECT id FROM users");
        if (users.length > 0) {
            const userId = users[0].id;
            const [existing] = await pool.execute("SELECT * FROM activity_logs WHERE user_id = ?", [userId]);
            if (existing.length === 0) {
                await pool.execute(
                    "INSERT INTO activity_logs (user_id, activity_type, duration_minutes) VALUES (?, 'Walk', 45), (?, 'Feeding', 15), (?, 'Playtime', 30)",
                    [userId, userId, userId]
                );
                console.log('📊 Added mock activity data.');
            }
        }

        pool.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
