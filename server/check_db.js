const { pool } = require('./config/db');

async function checkSchema() {
    try {
        const [rows] = await pool.execute("SHOW TABLES;");
        console.log("Tables in database:", rows);
        process.exit(0);
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
}

checkSchema();
