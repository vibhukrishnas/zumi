const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seed() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Seed Events
        await connection.execute('DELETE FROM events');
        await connection.execute(`
            INSERT INTO events (title, description, provider, event_date, location, price, image_url, category) VALUES 
            ('Puppy Play Day', 'Socialize your puppy with others!', 'Happy Paws', DATE_ADD(NOW(), INTERVAL 7 DAY), 'Central Park', 15.00, 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b', 'Social'),
            ('Dog Training Workshop', 'Master the basics of obedience.', 'K9 Trainer', DATE_ADD(NOW(), INTERVAL 14 DAY), 'Downtown Center', 50.00, 'https://images.unsplash.com/photo-1587300003388-59208cc962cb', 'Training'),
            ('Cat Yoga', 'Relax with cute kittens.', 'Zen Pets', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Yoga Studio', 20.00, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba', 'Wellness')
        `);

        // Seed Services
        await connection.execute('DELETE FROM services');
        await connection.execute(`
            INSERT INTO services (title, description, provider, service_type, price, image_url) VALUES 
            ('Full Grooming', 'Bath, haircut, and nail trim.', 'Sparkle Pets', 'Grooming', 60.00, 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7'),
            ('Dog Walking', '30 minute walk around the neighborhood.', 'Quick Walkers', 'Walking', 25.00, 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1'),
            ('Vet Consultation', 'General health checkup.', 'City Vet', 'Health', 80.00, 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def')
        `);

        console.log("✅ Database seeded successfully!");

    } catch (error) {
        console.error("❌ Seed failed:", error);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
