const { pool } = require('../config/db');

exports.getAllServices = async (req, res) => {
    try {
        const [services] = await pool.execute('SELECT * FROM services ORDER BY title ASC');
        res.json({ success: true, data: services });
    } catch (error) {
        console.error('Get Services Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching services' });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const [services] = await pool.execute('SELECT * FROM services WHERE id = ?', [req.params.id]);
        if (services.length === 0) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        res.json({ success: true, data: services[0] });
    } catch (error) {
        console.error('Get Service Error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching service' });
    }
};
