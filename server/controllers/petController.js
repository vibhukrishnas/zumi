const { pool } = require('../config/db');

// Get all pets for user
exports.getPets = async (req, res) => {
    try {
        const userId = req.user.id;
        const [pets] = await pool.execute(
            'SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json({ success: true, data: pets });
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ success: false, message: 'Error fetching pets' });
    }
};

// Get single pet by ID
exports.getPetById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [pets] = await pool.execute(
            'SELECT * FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        res.json({ success: true, data: pets[0] });
    } catch (error) {
        console.error('Error fetching pet:', error);
        res.status(500).json({ success: false, message: 'Error fetching pet' });
    }
};

// Add new pet
exports.addPet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, species, breed, age, weight, image_url, notes } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Pet name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO pets (user_id, name, species, breed, age, weight, image_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, name, species || 'Dog', breed || null, age || null, weight || null, image_url || null, notes || null]
        );

        res.status(201).json({
            success: true,
            message: 'Pet added successfully',
            petId: result.insertId
        });
    } catch (error) {
        console.error('Error adding pet:', error);
        res.status(500).json({ success: false, message: 'Error adding pet' });
    }
};

// Update pet
exports.updatePet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, species, breed, age, weight, image_url, notes } = req.body;

        // Check if pet exists and belongs to user
        const [existing] = await pool.execute(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        await pool.execute(
            `UPDATE pets SET 
                name = COALESCE(?, name),
                species = COALESCE(?, species),
                breed = COALESCE(?, breed),
                age = COALESCE(?, age),
                weight = COALESCE(?, weight),
                image_url = COALESCE(?, image_url),
                notes = COALESCE(?, notes)
            WHERE id = ? AND user_id = ?`,
            [name, species, breed, age, weight, image_url, notes, id, userId]
        );

        res.json({ success: true, message: 'Pet updated successfully' });
    } catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).json({ success: false, message: 'Error updating pet' });
    }
};

// Delete pet
exports.deletePet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        res.json({ success: true, message: 'Pet deleted successfully' });
    } catch (error) {
        console.error('Error deleting pet:', error);
        res.status(500).json({ success: false, message: 'Error deleting pet' });
    }
};

// Get pet activities
exports.getPetActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { limit = 20 } = req.query;

        // Verify pet belongs to user
        const [pets] = await pool.execute(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const [activities] = await pool.execute(
            `SELECT pa.*, b.final_price, b.status as booking_status,
                    COALESCE(s.title, e.title) as service_title
             FROM pet_activities pa
             LEFT JOIN bookings b ON pa.booking_id = b.id
             LEFT JOIN services s ON b.item_id = s.id AND b.item_type = 'service'
             LEFT JOIN events e ON b.item_id = e.id AND b.item_type = 'event'
             WHERE pa.pet_id = ? AND pa.user_id = ?
             ORDER BY pa.activity_date DESC
             LIMIT ?`,
            [id, userId, String(parseInt(limit))]
        );

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Error fetching pet activities:', error);
        res.status(500).json({ success: false, message: 'Error fetching activities' });
    }
};

// Add pet activity
exports.addPetActivity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { activity_type, title, description, duration_minutes, activity_date, booking_id } = req.body;

        // Verify pet belongs to user
        const [pets] = await pool.execute(
            'SELECT id FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        if (!activity_type || !title) {
            return res.status(400).json({ success: false, message: 'Activity type and title are required' });
        }

        const [result] = await pool.execute(
            `INSERT INTO pet_activities 
             (pet_id, user_id, activity_type, title, description, duration_minutes, activity_date, booking_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                userId,
                activity_type,
                title,
                description || null,
                duration_minutes || null,
                activity_date || new Date(),
                booking_id || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Activity logged successfully',
            activityId: result.insertId
        });
    } catch (error) {
        console.error('Error adding activity:', error);
        res.status(500).json({ success: false, message: 'Error logging activity' });
    }
};

// Get pet stats (summary)
exports.getPetStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify pet belongs to user
        const [pets] = await pool.execute(
            'SELECT * FROM pets WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        // Get activity counts by type
        const [activityCounts] = await pool.execute(
            `SELECT activity_type, COUNT(*) as count 
             FROM pet_activities 
             WHERE pet_id = ? 
             GROUP BY activity_type`,
            [id]
        );

        // Get total bookings for this pet
        const [bookingStats] = await pool.execute(
            `SELECT COUNT(*) as total_bookings, SUM(final_price) as total_spent
             FROM bookings 
             WHERE pet_id = ? AND user_id = ? AND status = 'confirmed'`,
            [id, userId]
        );

        // Get recent activity count (last 7 days)
        const [recentCount] = await pool.execute(
            `SELECT COUNT(*) as count 
             FROM pet_activities 
             WHERE pet_id = ? AND activity_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [id]
        );

        res.json({
            success: true,
            data: {
                pet: pets[0],
                activityCounts: activityCounts.reduce((acc, curr) => {
                    acc[curr.activity_type] = curr.count;
                    return acc;
                }, {}),
                totalBookings: bookingStats[0]?.total_bookings || 0,
                totalSpent: bookingStats[0]?.total_spent || 0,
                recentActivities: recentCount[0]?.count || 0
            }
        });
    } catch (error) {
        console.error('Error fetching pet stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
};
