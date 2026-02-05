/**
 * Migration script to add reward promo code columns to bookings table
 * Run this script to add support for random promo codes on confirmed bookings
 */

const { pool } = require('../config/db');

async function migrate() {
    console.log('Starting migration: Adding reward promo code columns to bookings table...');

    try {
        // Add reward_promo_code column
        await pool.execute(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS reward_promo_code VARCHAR(50) DEFAULT NULL
        `);
        console.log('✅ Added reward_promo_code column');

        // Add reward_promo_discount column
        await pool.execute(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS reward_promo_discount DECIMAL(5, 2) DEFAULT NULL
        `);
        console.log('✅ Added reward_promo_discount column');

        // Add index for quick lookups
        await pool.execute(`
            ALTER TABLE bookings 
            ADD INDEX IF NOT EXISTS idx_reward_promo_code (reward_promo_code)
        `).catch(() => console.log('ℹ️ Index already exists or could not be created'));

        console.log('\n🎉 Migration completed successfully!');
        console.log('New columns added to bookings table:');
        console.log('  - reward_promo_code: VARCHAR(50) - Stores the randomly generated promo code');
        console.log('  - reward_promo_discount: DECIMAL(5,2) - Stores the discount percentage for the promo');

    } catch (error) {
        // MySQL doesn't support IF NOT EXISTS for columns, try alternative approach
        if (error.code === 'ER_PARSE_ERROR' || error.code === 'ER_DUP_FIELDNAME') {
            console.log('Trying alternative migration approach...');
            try {
                // Check if columns exist first
                const [columns] = await pool.execute(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = 'bookings' 
                    AND COLUMN_NAME IN ('reward_promo_code', 'reward_promo_discount')
                `);
                
                const existingColumns = columns.map(c => c.COLUMN_NAME);

                if (!existingColumns.includes('reward_promo_code')) {
                    await pool.execute(`ALTER TABLE bookings ADD COLUMN reward_promo_code VARCHAR(50) DEFAULT NULL`);
                    console.log('✅ Added reward_promo_code column');
                } else {
                    console.log('ℹ️ reward_promo_code column already exists');
                }

                if (!existingColumns.includes('reward_promo_discount')) {
                    await pool.execute(`ALTER TABLE bookings ADD COLUMN reward_promo_discount DECIMAL(5, 2) DEFAULT NULL`);
                    console.log('✅ Added reward_promo_discount column');
                } else {
                    console.log('ℹ️ reward_promo_discount column already exists');
                }

                console.log('\n🎉 Migration completed successfully!');
            } catch (altError) {
                console.error('❌ Migration failed:', altError.message);
                process.exit(1);
            }
        } else {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();
