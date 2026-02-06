const { pool } = require('../config/db');

// Get user bookings
exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        const [bookings] = await pool.query(`
            SELECT 
                b.*,
                COALESCE(s.title, e.title) as service_title,
                COALESCE(s.title, e.title) as event_title,
                COALESCE(s.provider, e.provider) as provider,
                COALESCE(s.image_url, e.image_url) as image_url
            FROM bookings b
            LEFT JOIN services s ON b.item_id = s.id AND b.item_type = 'service'
            LEFT JOIN events e ON b.item_id = e.id AND b.item_type = 'event'
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        `, [userId]);

        // Add booking date if not present
        const processedBookings = bookings.map(booking => ({
            ...booking,
            booking_date: booking.booking_date || booking.created_at,
        }));

        res.json({ success: true, data: processedBookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: 'Error fetching bookings' });
    }
};

// Calculate price preview (no booking created)
exports.calculatePrice = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId, itemType, couponCode } = req.body;

        // Input Validation
        if (!itemId || !itemType) {
            return res.status(400).json({ success: false, message: 'Item ID and type are required' });
        }
        if (!['service', 'event'].includes(itemType)) {
            return res.status(400).json({ success: false, message: 'Invalid item type' });
        }

        // 1. Get Item Details
        const table = itemType === 'event' ? 'events' : 'services';
        const [items] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [itemId]);
        if (items.length === 0) {
            return res.status(404).json({ success: false, message: `${itemType === 'service' ? 'Service' : 'Event'} not found` });
        }
        const item = items[0];

        // 2. Get User Subscription
        const [subs] = await pool.execute(
            'SELECT tier FROM subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );
        const tier = subs.length > 0 ? subs[0].tier : 'free';

        // Check premium gating
        const isPremiumOnly = item.is_premium === 1 || item.is_premium === true;
        if (isPremiumOnly && tier !== 'premium') {
            return res.status(403).json({
                success: false,
                message: 'This is a premium-only service. Please upgrade your subscription.',
                requiresUpgrade: true,
                requiredTier: 'premium',
                currentTier: tier
            });
        }

        // 3. Calculate Discounts
        let originalPrice = Number(item.price);
        let providerDiscount = Number(item.provider_discount || 0);
        let subscriptionDiscount = 0;
        if (tier === 'basic') subscriptionDiscount = 10;
        if (tier === 'premium') subscriptionDiscount = 20;

        // 4. Validate coupon (if provided)
        let couponDiscount = 0;
        if (couponCode) {
            const [coupons] = await pool.execute(
                `SELECT * FROM coupons 
                 WHERE code = ? 
                 AND valid_from <= NOW() 
                 AND valid_until >= NOW()
                 AND (usage_limit = 0 OR used_count < usage_limit)
                 AND (applicable_types = 'all' OR applicable_types = ?)`,
                [couponCode.toUpperCase(), itemType]
            );
            if (coupons.length > 0) {
                couponDiscount = Number(coupons[0].discount_percentage);
            } else {
                return res.status(400).json({ success: false, message: 'Invalid or expired promo code' });
            }
        }

        let priceAfterProvider = originalPrice * (1 - providerDiscount / 100);
        let maxAdditionalDiscount = Math.max(subscriptionDiscount, couponDiscount);
        let finalPrice = priceAfterProvider * (1 - maxAdditionalDiscount / 100);
        if (finalPrice < 0) finalPrice = 0;

        res.json({
            success: true,
            data: {
                originalPrice: parseFloat(originalPrice.toFixed(2)),
                discounts: {
                    provider: providerDiscount,
                    subscription: subscriptionDiscount,
                    coupon: couponDiscount
                },
                finalPrice: parseFloat(finalPrice.toFixed(2)),
                status: 'preview'
            }
        });
    } catch (error) {
        console.error('Calculate price error:', error);
        res.status(500).json({ success: false, message: 'Error calculating price' });
    }
};

// Initiate booking
exports.initiateBooking = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { itemId, itemType, couponCode, bookingDate, petId } = req.body;

        // Input Validation
        if (!itemId || !itemType) {
            return res.status(400).json({ 
                success: false, 
                message: 'Item ID and type are required' 
            });
        }

        if (!['service', 'event'].includes(itemType)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid item type. Must be "service" or "event"' 
            });
        }

        if (itemId <= 0 || !Number.isInteger(Number(itemId))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid item ID' 
            });
        }

        await connection.beginTransaction();

        // 1. Get Item Details
        let item;
        const table = itemType === 'event' ? 'events' : 'services';
        const [items] = await connection.execute(`SELECT * FROM ${table} WHERE id = ?`, [itemId]);
        if (items.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: `${itemType === 'service' ? 'Service' : 'Event'} not found` 
            });
        }
        item = items[0];

        // 2. Get User Subscription
        const [subs] = await connection.execute(
            'SELECT tier FROM subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );
        const tier = subs.length > 0 ? subs[0].tier : 'free';

        // SUBSCRIPTION GATING: Check if user has required tier for premium content
        const isPremiumOnly = item.is_premium === 1 || item.is_premium === true;
        if (isPremiumOnly && tier !== 'premium') {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: 'This is a premium-only service. Please upgrade your subscription.',
                requiresUpgrade: true,
                requiredTier: 'premium',
                currentTier: tier
            });
        }

        // 3. Calculate Discounts
        let originalPrice = Number(item.price);
        let providerDiscount = Number(item.provider_discount || 0);

        let subscriptionDiscount = 0;
        if (tier === 'basic') subscriptionDiscount = 10;
        if (tier === 'premium') subscriptionDiscount = 20;

        // 4. Validate and Apply Coupon Code
        let couponDiscount = 0;
        let validCoupon = null;

        if (couponCode) {
            // Validate coupon code format
            if (typeof couponCode !== 'string' || couponCode.length > 50) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Invalid coupon code format'
                });
            }

            const [coupons] = await connection.execute(
                `SELECT * FROM coupons 
                 WHERE code = ? 
                 AND valid_from <= NOW() 
                 AND valid_until >= NOW()
                 AND (usage_limit = 0 OR used_count < usage_limit)
                 AND (applicable_types = 'all' OR applicable_types = ?)`,
                [couponCode.toUpperCase(), itemType]
            );

            if (coupons.length > 0) {
                validCoupon = coupons[0];
                couponDiscount = Number(validCoupon.discount_percentage);
                
                // Validate discount percentage
                if (couponDiscount < 0 || couponDiscount > 100) {
                    await connection.rollback();
                    return res.status(500).json({
                        success: false,
                        message: 'Invalid coupon configuration. Please contact support.'
                    });
                }
            } else {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired promo code'
                });
            }
        }

        // Validate prices
        if (originalPrice <= 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid item price'
            });
        }

        let priceAfterProvider = originalPrice * (1 - providerDiscount / 100);
        let maxAdditionalDiscount = Math.max(subscriptionDiscount, couponDiscount);
        let finalPrice = priceAfterProvider * (1 - maxAdditionalDiscount / 100);

        // Ensure final price is not negative
        if (finalPrice < 0) {
            finalPrice = 0;
        }

        // 5. Create Booking Record with date
        const bookingDateValue = bookingDate || new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [result] = await connection.execute(
            `INSERT INTO bookings (user_id, item_id, item_type, original_price, provider_discount, coupon_code, coupon_discount, subscription_discount, final_price, status, booking_date, pet_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?)`,
            [userId, itemId, itemType, originalPrice, providerDiscount, couponCode ? couponCode.toUpperCase() : '', couponDiscount, subscriptionDiscount, finalPrice, bookingDateValue, petId || null]
        );

        // 6. Reserve coupon (don't increment used_count until payment confirmed)
        // This prevents coupon reuse during pending payment state
        if (validCoupon) {
            // Store coupon ID in booking for later confirmation
            await connection.execute(
                'UPDATE bookings SET coupon_id = ? WHERE id = ?',
                [validCoupon.id, result.insertId]
            );
        }

        await connection.commit();

        res.json({
            success: true,
            data: {
                bookingId: result.insertId,
                originalPrice: parseFloat(originalPrice.toFixed(2)),
                discounts: {
                    provider: providerDiscount,
                    subscription: subscriptionDiscount,
                    coupon: couponDiscount
                },
                finalPrice: parseFloat(finalPrice.toFixed(2)),
                status: 'pending_payment'
            }
        });

    } catch (error) {
        // Rollback transaction on any error
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
        }

        console.error('Booking Error:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        // User-friendly error messages
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                success: false, 
                message: 'A booking for this item already exists' 
            });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid reference data provided' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Unable to create booking. Please try again later.',
            ...(process.env.NODE_ENV === 'development' && { debug: error.message })
        });
    } finally {
        connection.release();
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;

        if (!bookingId) {
            return res.status(400).json({ success: false, message: 'Booking ID is required' });
        }

        // Check booking exists and belongs to user
        const [existing] = await pool.execute(
            'SELECT id, status FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (existing[0].status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
        }

        if (existing[0].status === 'completed') {
            return res.status(400).json({ success: false, message: 'Cannot cancel a completed booking' });
        }

        const [result] = await pool.execute(
            'UPDATE bookings SET status = "cancelled" WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ success: false, message: 'Error cancelling booking' });
    }
};

// Generate a random promo code for rewards
const generatePromoCode = () => {
    const prefixes = ['ZUMI', 'PET', 'SAVE', 'LUCKY', 'BONUS', 'VIP'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const discount = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return {
        code: `${prefix}${discount}${randomStr}`,
        discount: discount
    };
};

exports.confirmBooking = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;
        const { paymentIntentId } = req.body;

        // Input validation
        if (!bookingId || bookingId <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid booking ID' 
            });
        }

        if (!paymentIntentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment verification failed: No payment ID provided' 
            });
        }

        await connection.beginTransaction();

        // Check if booking exists and belongs to user
        const [bookings] = await connection.execute(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'Booking not found' 
            });
        }

        const booking = bookings[0];

        // Check if already confirmed
        if (booking.status === 'confirmed') {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Booking already confirmed' 
            });
        }

        // Verify with Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        let paymentIntent;
        
        try {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (stripeError) {
            await connection.rollback();
            console.error('Stripe verification error:', stripeError);
            return res.status(400).json({ 
                success: false, 
                message: 'Payment verification failed. Please contact support.' 
            });
        }

        if (paymentIntent.status !== 'succeeded') {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: `Payment not successful. Status: ${paymentIntent.status}` 
            });
        }

        // Verify payment amount matches booking amount
        const expectedAmount = Math.round(booking.final_price * 100); // Stripe uses cents
        if (paymentIntent.amount !== expectedAmount) {
            await connection.rollback();
            console.error('Payment amount mismatch:', { 
                expected: expectedAmount, 
                received: paymentIntent.amount 
            });
            return res.status(400).json({ 
                success: false, 
                message: 'Payment amount mismatch. Please contact support.' 
            });
        }

        // Now increment coupon usage count (only after payment confirmed)
        if (booking.coupon_id) {
            await connection.execute(
                'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
                [booking.coupon_id]
            );
        }

        // Generate a random reward promo code for future bookings
        const rewardPromo = generatePromoCode();

        // Update booking with confirmed status and reward promo code
        await connection.execute(
            'UPDATE bookings SET status = "confirmed", reward_promo_code = ?, reward_promo_discount = ?, payment_intent_id = ? WHERE id = ? AND user_id = ?',
            [rewardPromo.code, rewardPromo.discount, paymentIntentId, bookingId, userId]
        );

        // Get booking details to create pet activity
        const [bookingDetails] = await connection.execute(
            `SELECT b.*, COALESCE(s.title, e.title) as service_title, b.pet_id
             FROM bookings b
             LEFT JOIN services s ON b.item_id = s.id AND b.item_type = 'service'
             LEFT JOIN events e ON b.item_id = e.id AND b.item_type = 'event'
             WHERE b.id = ?`,
            [bookingId]
        );

        // Log activity for the pet if a pet was linked to the booking
        if (bookingDetails.length > 0 && bookingDetails[0].pet_id) {
            const bookingDetail = bookingDetails[0];
            try {
                await connection.execute(
                    `INSERT INTO pet_activities (pet_id, user_id, activity_type, title, description, booking_id, activity_date)
                     VALUES (?, ?, 'booking', ?, ?, ?, ?)`,
                    [
                        bookingDetail.pet_id,
                        userId,
                        bookingDetail.service_title || 'Service Booking',
                        `Booked ${bookingDetail.item_type} service for $${bookingDetail.final_price}`,
                        bookingId,
                        bookingDetail.booking_date || new Date()
                    ]
                );
            } catch (activityError) {
                // Log but don't fail the booking confirmation
                console.error('Pet activity logging error:', activityError);
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Booking confirmed and payment verified',
            rewardPromoCode: rewardPromo.code,
            rewardPromoDiscount: rewardPromo.discount
        });
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
        }

        console.error('Booking Confirmation Error:', {
            message: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        res.status(500).json({ 
            success: false,
            message: 'Unable to confirm booking. Please contact support if payment was charged.',
            ...(process.env.NODE_ENV === 'development' && { debug: error.message })
        });
    } finally {
        connection.release();
    }
};
