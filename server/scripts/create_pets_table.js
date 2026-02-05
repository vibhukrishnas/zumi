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

        // Create Pets Table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS pets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                species VARCHAR(50) DEFAULT 'Dog',
                breed VARCHAR(100),
                age INT,
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;

        await pool.execute(createTableQuery);
        console.log('✅ Created pets table.');

        // Insert Mock Pet for existing users if none exist
        const [users] = await pool.execute("SELECT id FROM users");
        if (users.length > 0) {
            const userId = users[0].id;
            const [existing] = await pool.execute("SELECT * FROM pets WHERE user_id = ?", [userId]);
            if (existing.length === 0) {
                await pool.execute(
                    "INSERT INTO pets (user_id, name, species, breed, age) VALUES (?, ?, ?, ?, ?)",
                    [userId, 'Buddy', 'Dog', 'Golden Retriever', 3]
                );
                console.log('🐶 Added mock pet for testing.');
            }
        }

        pool.end();
    } catch (error) {
        console.error('❌ Migration Error:', error);
    }
}

migrate();
