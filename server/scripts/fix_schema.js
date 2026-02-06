const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('Connected to database.\n');

        // 1. Add weight column to pets
        console.log('1. Adding weight column to pets...');
        try {
            await connection.query('ALTER TABLE pets ADD COLUMN weight DECIMAL(5,2) NULL AFTER age');
            console.log('   ✅ Added');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('   ⏭️  Already exists');
            else throw e;
        }

        // 2. Add notes column to pets
        console.log('2. Adding notes column to pets...');
        try {
            await connection.query('ALTER TABLE pets ADD COLUMN notes TEXT NULL AFTER image_url');
            console.log('   ✅ Added');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('   ⏭️  Already exists');
            else throw e;
        }

        // 3. Fix bookings status enum to include pending_payment and confirmed
        console.log('3. Updating bookings status enum...');
        try {
            await connection.query(
                "ALTER TABLE bookings MODIFY COLUMN status ENUM('initiated','pending_payment','confirmed','completed','cancelled') DEFAULT 'initiated'"
            );
            console.log('   ✅ Updated');
        } catch (e) {
            console.log('   ❌ Error:', e.message);
        }

        // 4. Add coupon_id column to bookings
        console.log('4. Adding coupon_id column to bookings...');
        try {
            await connection.query('ALTER TABLE bookings ADD COLUMN coupon_id INT NULL AFTER pet_id');
            console.log('   ✅ Added');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('   ⏭️  Already exists');
            else throw e;
        }

        // 5. Add payment_intent_id column to bookings
        console.log('5. Adding payment_intent_id column to bookings...');
        try {
            await connection.query('ALTER TABLE bookings ADD COLUMN payment_intent_id VARCHAR(255) NULL AFTER coupon_id');
            console.log('   ✅ Added');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('   ⏭️  Already exists');
            else throw e;
        }

        // 6. Add is_premium to events if not exists
        console.log('6. Adding is_premium column to events...');
        try {
            await connection.query('ALTER TABLE events ADD COLUMN is_premium TINYINT(1) DEFAULT 0');
            console.log('   ✅ Added');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('   ⏭️  Already exists');
            else throw e;
        }

        console.log('\n✅ All migrations complete!');

        // Verify
        console.log('\n--- Verification ---');
        const [petCols] = await connection.query('SHOW COLUMNS FROM pets');
        console.log('pets columns:', petCols.map(c => c.Field).join(', '));

        const [bookCols] = await connection.query('SHOW COLUMNS FROM bookings');
        console.log('bookings columns:', bookCols.map(c => c.Field).join(', '));

        const statusCol = bookCols.find(c => c.Field === 'status');
        console.log('bookings status type:', statusCol.Type);

    } catch (e) {
        console.error('Migration failed:', e.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
