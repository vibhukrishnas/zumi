const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Normalize user object: JWT stores 'userId' but controllers expect 'id'
        req.user = {
            id: decoded.userId || decoded.id,
            email: decoded.email
        };
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token.' });
    }
};

// Optional auth - doesn't require token but attaches user if present
exports.optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Normalize user object: JWT stores 'userId' but controllers expect 'id'
            req.user = {
                id: decoded.userId || decoded.id,
                email: decoded.email
            };
        } catch (error) {
            // Token invalid, continue without user
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};
