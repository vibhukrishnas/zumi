const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDb() {
    let connection;
    try {
        console.log("Using Env DB Config:", {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            // password hidden
        });

        // Connect without database selected first to create it
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        const schema = fs.readFileSync(path.join(__dirname, '../database_schema.sql'), 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim());

        console.log(`Found ${statements.length} SQL statements to execute.`);

        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
            }
        }

        console.log("✅ Database initialized successfully!");

    } catch (error) {
        console.error("❌ Database initialization failed:", error.message);
        console.log("👉 Tip: Check your DB_PASSWORD in server/.env");
    } finally {
        if (connection) await connection.end();
    }
}

initDb();
