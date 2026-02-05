const { pool } = require('../config/db');

exports.createReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { serviceId, providerId, rating, comment } = req.body;

        if (!rating) return res.status(400).json({ message: 'Rating is required' });

        await pool.execute(
            'INSERT INTO reviews (user_id, service_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [userId, serviceId || null, providerId || 1, rating, comment || '']
        );

        res.json({ success: true, message: 'Review submitted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting review' });
    }
};

exports.getServiceReviews = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const [reviews] = await pool.query(`
            SELECT r.*, u.full_name, u.profile_image 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.service_id = ?
            ORDER BY r.created_at DESC
        `, [serviceId]);

        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};
