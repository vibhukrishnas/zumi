const { pool } = require('../config/db');

async function addNotificationsColumn() {
    try {
        console.log('Adding notifications_enabled column to users table...');
        
        // Check if column already exists
        const [columns] = await pool.execute(
            "SHOW COLUMNS FROM users LIKE 'notifications_enabled'"
        );
        
        if (columns.length > 0) {
            console.log('notifications_enabled column already exists. Skipping...');
            return;
        }
        
        // Add the column
        await pool.execute(
            'ALTER TABLE users ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE'
        );
        
        console.log('Successfully added notifications_enabled column!');
        
    } catch (error) {
        console.error('Error adding notifications_enabled column:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

addNotificationsColumn()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
