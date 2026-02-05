const { pool } = require('../config/db');

exports.getAllEvents = async (req, res) => {
    try {
        const [events] = await pool.execute('SELECT * FROM events ORDER BY event_date ASC');
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Get Events Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching events' });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const [events] = await pool.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (events.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, data: events[0] });
    } catch (error) {
        console.error('Get Event Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching event' });
    }
};
