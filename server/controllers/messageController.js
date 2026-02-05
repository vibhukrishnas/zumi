const { pool } = require('../config/db');

exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.query;

        let query = 'SELECT * FROM messages WHERE (sender_id = ? OR receiver_id = ?)';
        const params = [userId, userId];

        if (bookingId) {
            query += ' AND booking_id = ?';
            params.push(bookingId);
        }

        query += ' ORDER BY created_at ASC';

        const [messages] = await pool.execute(query, params);
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { text, bookingId } = req.body;

        // User sending message
        await pool.execute(
            'INSERT INTO messages (sender_id, receiver_id, booking_id, message_text, sender_type) VALUES (?, ?, ?, ?, ?)',
            [userId, 0, bookingId || null, text, 'user'] // 0 as placeholder for provider
        );

        // Auto-reply simulation (Mock Provider)
        setTimeout(async () => {
            try {
                const replies = [
                    "Thanks for the message! I'll get back to you shortly.",
                    "Sounds good!",
                    "Can you confirm the time?",
                    "Looking forward to it! 🐾"
                ];
                const randomReply = replies[Math.floor(Math.random() * replies.length)];

                await pool.execute(
                    'INSERT INTO messages (sender_id, receiver_id, booking_id, message_text, sender_type) VALUES (?, ?, ?, ?, ?)',
                    [0, userId, bookingId || null, randomReply, 'provider']
                );
            } catch (err) {
                console.error("Auto-reply error", err);
            }
        }, 2000);

        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending message' });
    }
};
