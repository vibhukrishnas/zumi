const { pool } = require('../config/db');

exports.getPets = async (req, res) => {
    try {
        const userId = req.user.id;
        const [pets] = await pool.execute('SELECT * FROM pets WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.json({ success: true, data: pets });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching pets' });
    }
};

exports.addPet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, species, breed, age, image_url } = req.body;

        if (!name) return res.status(400).json({ message: 'Pet name is required' });

        const [result] = await pool.execute(
            'INSERT INTO pets (user_id, name, species, breed, age, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, species || 'Dog', breed, age, image_url]
        );

        res.status(201).json({ success: true, message: 'Pet added', petId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding pet' });
    }
};

exports.deletePet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        await pool.execute('DELETE FROM pets WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ success: true, message: 'Pet deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting pet' });
    }
};
