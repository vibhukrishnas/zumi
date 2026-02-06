// Input validation middleware
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

const validatePhone = (phone) => {
    if (!phone) return true; // Optional
    const phoneRegex = /^[\d\s\-+()]{7,20}$/;
    return phoneRegex.test(phone);
};

// Sanitize input to prevent XSS
const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};

// Validation middleware for auth routes
exports.validateRegister = (req, res, next) => {
    const { email, password, fullName, phone } = req.body;
    const errors = [];

    if (!email) errors.push('Email is required');
    else if (!validateEmail(email)) errors.push('Invalid email format');

    if (!password) errors.push('Password is required');
    else if (!validatePassword(password)) errors.push('Password must be at least 6 characters');

    if (!fullName) errors.push('Full name is required');
    else if (fullName.length < 2) errors.push('Full name must be at least 2 characters');

    if (phone && !validatePhone(phone)) errors.push('Invalid phone number format');

    if (errors.length > 0) {
        return res.status(422).json({ success: false, message: errors.join(', '), errors });
    }

    // Sanitize inputs
    req.body.email = sanitize(email).toLowerCase();
    req.body.fullName = sanitize(fullName);
    req.body.phone = sanitize(phone);

    next();
};

exports.validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');

    if (errors.length > 0) {
        return res.status(422).json({ success: false, message: errors.join(', '), errors });
    }

    req.body.email = sanitize(email).toLowerCase();
    next();
};

// Validation for booking
exports.validateBooking = (req, res, next) => {
    const { itemId, itemType } = req.body;
    const errors = [];

    if (!itemId) errors.push('Item ID is required');
    if (!itemType || !['event', 'service'].includes(itemType)) {
        errors.push('Valid item type (event/service) is required');
    }

    if (errors.length > 0) {
        return res.status(422).json({ success: false, message: errors.join(', '), errors });
    }

    next();
};

// Validation for promo code
exports.validatePromoCode = (req, res, next) => {
    const { code, itemType } = req.body;

    if (!code) {
        return res.status(422).json({ success: false, message: 'Promo code is required' });
    }

    req.body.code = sanitize(code).toUpperCase();
    next();
};

// Generic ID parameter validation
exports.validateId = (paramName = 'id') => (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || isNaN(parseInt(id))) {
        return res.status(422).json({ success: false, message: `Invalid ${paramName}` });
    }

    next();
};
