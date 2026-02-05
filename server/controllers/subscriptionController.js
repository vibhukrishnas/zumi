const { pool } = require('../config/db');

exports.upgradeSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { tier } = req.body; // 'premium'

        if (!['basic', 'premium'].includes(tier)) {
            return res.status(400).json({ message: 'Invalid subscription tier' });
        }

        // Logic: Deactivate old active subscriptions, insert new one (or update)
        // For simplicity in this demo, we'll update the existing active one or insert if none

        await pool.execute(
            'UPDATE subscriptions SET status = "inactive" WHERE user_id = ?',
            [userId]
        );

        await pool.execute(
            'INSERT INTO subscriptions (user_id, tier, status, start_date, end_date) VALUES (?, ?, "active", NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))',
            [userId, tier]
        );

        res.json({ success: true, message: `Successfully upgraded to ${tier}!` });

    } catch (error) {
        console.error('Upgrade Error:', error);
        res.status(500).json({ success: false, message: 'Error upgrading subscription' });
    }
};

exports.getSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const [subs] = await pool.execute(
            'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        res.json({ success: true, data: subs[0] || { tier: 'free' } });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subscription' });
    }
};
