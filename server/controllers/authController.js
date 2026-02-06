const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;

        // Input Validation
        if (!email || !password || !fullName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, password, and full name are required' 
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters long' 
            });
        }

        if (password.length > 128) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password is too long' 
            });
        }

        // Name length validation
        if (fullName.length < 2 || fullName.length > 100) {
            return res.status(400).json({ 
                success: false, 
                message: 'Full name must be between 2 and 100 characters' 
            });
        }

        // Phone validation (if provided)
        if (phone && phone.length > 20) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number is too long' 
            });
        }

        // Check if user exists
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?', 
            [email.toLowerCase().trim()]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Start transaction for user creation and subscription
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Insert User
            const [result] = await connection.execute(
                'INSERT INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)',
                [email.toLowerCase().trim(), passwordHash, fullName.trim(), phone?.trim() || null]
            );
            const userId = result.insertId;

            // Create default Free Subscription
            await connection.execute(
                'INSERT INTO subscriptions (user_id, tier, status, start_date, end_date) VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))',
                [userId, 'free', 'active']
            );

            await connection.commit();
            connection.release();

            // Generate Token
            const token = jwt.sign(
                { userId, email: email.toLowerCase().trim() }, 
                process.env.JWT_SECRET, 
                { expiresIn: '7d' }
            );

            res.status(201).json({
                success: true,
                data: { userId, email: email.toLowerCase().trim(), token }
            });
        } catch (dbError) {
            await connection.rollback();
            connection.release();
            throw dbError;
        }

    } catch (error) {
        console.error('Register Error:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // Handle specific database errors
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                success: false, 
                message: 'Email already registered' 
            });
        }

        if (error.code === 'ER_DATA_TOO_LONG') {
            return res.status(400).json({ 
                success: false, 
                message: 'One or more fields exceed maximum length' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Unable to create account. Please try again later.',
            ...(process.env.NODE_ENV === 'development' && { debug: error.message })
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Basic email format check
        if (!email.includes('@')) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Find User (use lowercase for case-insensitive lookup)
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE LOWER(email) = LOWER(?)', 
            [email.trim()]
        );
        
        if (users.length === 0) {
            // Don't reveal that email doesn't exist (security)
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        const user = users[0];

        // Verify Password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            // Same generic message for security
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Get Subscription Status
        const [subs] = await pool.execute(
            'SELECT tier, status FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
            [user.id]
        );
        const subscription = subs[0] || { tier: 'free', status: 'none' };

        // Generate Token
        const token = jwt.sign(
            { userId: user.id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

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
        console.error('Login Error:', {
            message: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // Don't expose internal errors
        res.status(500).json({ 
            success: false, 
            message: 'Unable to process login. Please try again later.',
            ...(process.env.NODE_ENV === 'development' && { debug: error.message })
        });
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
