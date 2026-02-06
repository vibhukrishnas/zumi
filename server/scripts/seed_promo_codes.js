const { pool } = require('../config/db');

async function seedPromoCodes() {
    try {
        console.log('Seeding promo codes...');

        // Check if coupons table exists
        const [tables] = await pool.execute("SHOW TABLES LIKE 'coupons'");
        
        if (tables.length === 0) {
            console.log('Creating coupons table...');
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS coupons (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    discount_percentage DECIMAL(5, 2) NOT NULL,
                    valid_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    valid_until TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    usage_limit INT DEFAULT 0,
                    used_count INT DEFAULT 0,
                    applicable_types ENUM('event', 'service', 'all') DEFAULT 'all',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
        }

        // Define promo codes
        const promoCodes = [
            // Permanent codes
            { code: 'WELCOME10', discount: 10, validDays: 365, limit: 0, type: 'all' },
            { code: 'SAVE15', discount: 15, validDays: 365, limit: 0, type: 'all' },
            { code: 'PETS20', discount: 20, validDays: 365, limit: 0, type: 'all' },
            { code: 'VIP25', discount: 25, validDays: 365, limit: 100, type: 'all' },
            
            // Service-specific codes
            { code: 'GROOMING15', discount: 15, validDays: 365, limit: 0, type: 'service' },
            { code: 'WALKER20', discount: 20, validDays: 365, limit: 0, type: 'service' },
            
            // Event-specific codes
            { code: 'EVENT10', discount: 10, validDays: 365, limit: 0, type: 'event' },
            
            // Limited time offers
            { code: 'FLASH30', discount: 30, validDays: 30, limit: 50, type: 'all' },
            { code: 'SUPERSAVE25', discount: 25, validDays: 60, limit: 0, type: 'all' },
            
            // New user codes
            { code: 'NEWUSER20', discount: 20, validDays: 365, limit: 0, type: 'all' },
            { code: 'FIRST15', discount: 15, validDays: 365, limit: 0, type: 'all' },
        ];

        // Insert promo codes
        for (const promo of promoCodes) {
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + promo.validDays);

            try {
                await pool.execute(
                    `INSERT INTO coupons (code, discount_percentage, valid_from, valid_until, usage_limit, applicable_types)
                     VALUES (?, ?, NOW(), ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        discount_percentage = VALUES(discount_percentage),
                        valid_until = VALUES(valid_until),
                        usage_limit = VALUES(usage_limit),
                        applicable_types = VALUES(applicable_types)`,
                    [promo.code, promo.discount, validUntil, promo.limit, promo.type]
                );
                console.log(`✓ Created/Updated: ${promo.code} (${promo.discount}% off)`);
            } catch (error) {
                console.error(`✗ Error with ${promo.code}:`, error.message);
            }
        }

        console.log('\n✅ Promo codes seeded successfully!');
        console.log('\nAvailable codes:');
        const [codes] = await pool.execute('SELECT code, discount_percentage, valid_until, usage_limit, used_count, applicable_types FROM coupons ORDER BY discount_percentage DESC');
        codes.forEach(code => {
            console.log(`  - ${code.code}: ${code.discount_percentage}% off (${code.applicable_types}) - Valid until: ${code.valid_until.toLocaleDateString()}`);
        });

    } catch (error) {
        console.error('Error seeding promo codes:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

seedPromoCodes()
    .then(() => {
        console.log('\n🎉 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed:', error);
        process.exit(1);
    });
