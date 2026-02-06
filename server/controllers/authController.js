const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;

        // Validation
        if (!email || !password || !fullName) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if user exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert User
        const [result] = await pool.execute(
            'INSERT INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)',
            [email, passwordHash, fullName, phone]
        );
        const userId = result.insertId;

        // Create default Free Subscription
        const [subResult] = await pool.execute(
            'INSERT INTO subscriptions (user_id, tier, status, start_date, end_date) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))',
            [userId, 'free', 'active']
        );

        // Generate Token
        const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            data: { userId, email, token }
        });

    } catch (error) {
        console.error('Register Error Full:', error);
        console.error('Register Error Message:', error.message);
        console.error('Register Error SQL:', error.sql);
        res.status(500).json({ success: false, message: 'Server error during registration: ' + error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing email or password' });
        }

        // Find User
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const user = users[0];

        // Verify Password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Get Subscription Status
        const [subs] = await pool.execute(
            'SELECT tier, status FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
            [user.id]
        );
        const subscription = subs[0] || { tier: 'free', status: 'none' };

        // Generate Token
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                fullName: user.full_name,
                token,
                subscription
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, email, phone, notificationsEnabled } = req.body;

        let updateQuery = 'UPDATE users SET full_name = ?, email = ?, phone = ?';
        let queryParams = [fullName, email, phone];

        if (notificationsEnabled !== undefined) {
            updateQuery += ', notifications_enabled = ?';
            queryParams.push(notificationsEnabled);
        }

        if (req.file) {
            updateQuery += ', profile_image = ?';
            queryParams.push(req.file.filename);
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(userId);

        await pool.execute(updateQuery, queryParams);

        // Fetch updated user to return
        const [users] = await pool.execute('SELECT id, full_name, email, phone, profile_image, notifications_enabled FROM users WHERE id = ?', [userId]);

        const updatedUser = {
            id: users[0].id,
            fullName: users[0].full_name,
            email: users[0].email,
            phone: users[0].phone || '',
            profileImage: users[0].profile_image,
            notificationsEnabled: !!users[0].notifications_enabled
        };

        res.json({
            success: true,
            user: updatedUser,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [users] = await pool.execute(
            'SELECT id, full_name, email, phone, profile_image, notifications_enabled FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];
        const profileData = {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            phone: user.phone || '',
            profileImage: user.profile_image,
            notificationsEnabled: !!user.notifications_enabled
        };

        res.json({
            success: true,
            data: profileData
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const [users] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    // Mock implementation - in partial production we'd use Nodemailer
    const { email } = req.body;
    console.log(`[Mock Email] Sending password reset link to ${email}`);
    // Check if user exists
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
        // Generate mock token (would be saved in DB)
        res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    } else {
        // Same message for security
        res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, token, newPassword } = req.body;
    // Verify token (Mock)
    if (token !== '1234') return res.status(400).json({ message: 'Invalid token' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hashedPassword, email]);

    res.json({ success: true, message: 'Password reset successfully' });
};
