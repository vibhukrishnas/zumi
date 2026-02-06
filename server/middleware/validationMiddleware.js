// Input validation middleware
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 8 && password.length <= 128;
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
        .replace(/`/g, '&#x60;')
        .trim();
};

// Validate positive number
const validatePositiveNumber = (value, fieldName = 'Value') => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
        return { valid: false, message: `${fieldName} must be a positive number` };
    }
    return { valid: true };
};

// Validate item type
const validateItemType = (type) => {
    return ['service', 'event'].includes(type);
};

// Validation middleware for auth routes
exports.validateRegister = (req, res, next) => {
    const { email, password, fullName, phone } = req.body;
    const errors = [];

    if (!email) errors.push('Email is required');
    else if (!validateEmail(email)) errors.push('Invalid email format');

    if (!password) errors.push('Password is required');
    else if (!validatePassword(password)) errors.push('Password must be at least 8 characters and no more than 128 characters');

    if (!fullName) errors.push('Full name is required');
    else if (fullName.length < 2 || fullName.length > 100) errors.push('Full name must be between 2 and 100 characters');

    if (phone && !validatePhone(phone)) errors.push('Invalid phone number format');

    if (errors.length > 0) {
        return res.status(422).json({ success: false, message: errors.join(', '), errors });
    }

    // Sanitize inputs
    req.body.email = sanitize(email).toLowerCase();
    req.body.fullName = sanitize(fullName);
    req.body.phone = phone ? sanitize(phone) : null;

    next();
};

exports.validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) errors.push('Email is required');
    else if (!validateEmail(email)) errors.push('Invalid email format');
    if (!password) errors.push('Password is required');

    if (errors.length > 0) {
        return res.status(422).json({ success: false, message: errors.join(', '), errors });
    }

    req.body.email = sanitize(email).toLowerCase();
    next();
};

// Validation for booking initiation
exports.validateBookingInitiation = (req, res, next) => {
    const { itemId, itemType, couponCode } = req.body;
    const errors = [];

    if (!itemId) {
        errors.push('Item ID is required');
    } else {
        const idValidation = validatePositiveNumber(itemId, 'Item ID');
        if (!idValidation.valid) errors.push(idValidation.message);
    }

    if (!itemType) {
        errors.push('Item type is required');
    } else if (!validateItemType(itemType)) {
        errors.push('Item type must be either "service" or "event"');
    }

    if (couponCode && (typeof couponCode !== 'string' || couponCode.length > 50)) {
        errors.push('Invalid coupon code format');
    }

    if (errors.length > 0) {
        return res.status(422).json({ success: false, message: errors.join(', '), errors });
    }

    // Sanitize coupon code if provided
    if (couponCode) {
        req.body.couponCode = sanitize(couponCode).toUpperCase();
    }

    next();
};

// Validation for booking confirmation
exports.validateBookingConfirmation = (req, res, next) => {
    const { bookingId } = req.params;
    const { paymentIntentId } = req.body;
    const errors = [];

    if (!bookingId) {
        errors.push('Booking ID is required');
    } else {
        const idValidation = validatePositiveNumber(bookingId, 'Booking ID');
        if (!idValidation.valid) errors.push(idValidation.message);
    }

    if (!paymentIntentId || typeof paymentIntentId !== 'string') {
        errors.push('Valid payment intent ID is required');
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
