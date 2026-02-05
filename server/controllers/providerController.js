const { pool } = require('../config/db');

exports.getProviderBookings = async (req, res) => {
    try {
        // In real app, check if user is provider. For now, show ALL bookings to simulate admin view.
        const [bookings] = await pool.query(`
            SELECT 
                b.*,
                u.full_name as user_name,
                u.email as user_email,
                COALESCE(s.title, e.title) as item_title
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            LEFT JOIN services s ON b.item_id = s.id AND b.item_type = 'service'
            LEFT JOIN events e ON b.item_id = e.id AND b.item_type = 'event'
            ORDER BY b.created_at DESC
        `);

        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching provider bookings' });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body; // 'completed', 'cancelled'

        await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
};

exports.updateAvailability = async (req, res) => {
    try {
        const providerId = req.user.id;
        const { schedule } = req.body;

        await pool.execute('DELETE FROM availability WHERE provider_id = ?', [providerId]);

        for (const slot of schedule) {
            if (slot.active) {
                await pool.execute(
                    'INSERT INTO availability (provider_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
                    [providerId, slot.day, slot.start, slot.end]
                );
            }
        }
        res.json({ success: true, message: 'Availability updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating availability' });
    }
};

exports.getAvailability = async (req, res) => {
    try {
        const providerId = req.user.id;
        const [rows] = await pool.execute('SELECT day_of_week, start_time, end_time FROM availability WHERE provider_id = ?', [providerId]);
        res.json({ success: true, data: rows });
    } catch (e) {
        res.status(500).json({ message: 'Error fetching availability' });
    }
};
