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
        res.status(500).json({ message: 'Error fetching bookings', error: error.message });
    }
};

// Initiate booking
exports.initiateBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId, itemType, couponCode, bookingDate } = req.body;

        // 1. Get Item Details
        let item;
        const table = itemType === 'event' ? 'events' : 'services';
        const [items] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [itemId]);
        if (items.length === 0) return res.status(404).json({ message: 'Item not found' });
        item = items[0];

        // 2. Get User Subscription
        const [subs] = await pool.execute(
            'SELECT tier FROM subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );
        const tier = subs.length > 0 ? subs[0].tier : 'free';

        // 3. Calculate Discounts
        let originalPrice = Number(item.price);
        let providerDiscount = Number(item.provider_discount || 0);

        let subscriptionDiscount = 0;
        if (tier === 'basic') subscriptionDiscount = 10;
        if (tier === 'premium') subscriptionDiscount = 20;

        let couponDiscount = 0;
        if (couponCode === 'PETS20') {
            couponDiscount = 20;
        } else {
            // Apply Random "Demo" Discount (10% - 30%) for ANY other code (or no code)
            couponDiscount = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
        }

        let priceAfterProvider = originalPrice * (1 - providerDiscount / 100);
        let maxAdditionalDiscount = Math.max(subscriptionDiscount, couponDiscount);
        let finalPrice = priceAfterProvider * (1 - maxAdditionalDiscount / 100);

        // 4. Create Booking Record with date
        const bookingDateValue = bookingDate || new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [result] = await pool.execute(
            `INSERT INTO bookings (user_id, item_id, item_type, original_price, provider_discount, coupon_code, coupon_discount, subscription_discount, final_price, status, booking_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?)`,
            [userId, itemId, itemType, originalPrice, providerDiscount, couponCode || '', couponDiscount, subscriptionDiscount, finalPrice, bookingDateValue]
        );

        res.json({
            success: true,
            data: {
                bookingId: result.insertId,
                originalPrice,
                discounts: {
                    provider: providerDiscount,
                    subscription: subscriptionDiscount,
                    coupon: couponDiscount
                },
                finalPrice: finalPrice.toFixed(2),
                status: 'confirmed'
            }
        });

    } catch (error) {
        console.error('Booking Error:', error);
        res.status(500).json({ success: false, message: 'Server error initiating booking' });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;

        await pool.execute(
            'UPDATE bookings SET status = "cancelled" WHERE id = ? AND user_id = ?',
            [bookingId, userId]
        );

        res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling booking' });
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
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ success: false, message: 'Payment verification failed: No payment ID provided' });
        }

        // Verify with Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ success: false, message: `Payment not successful. Status: ${paymentIntent.status}` });
        }

        // Generate a random reward promo code for future bookings
        const rewardPromo = generatePromoCode();

        // Update booking with confirmed status and reward promo code
        await pool.execute(
            'UPDATE bookings SET status = "confirmed", reward_promo_code = ?, reward_promo_discount = ? WHERE id = ? AND user_id = ?',
            [rewardPromo.code, rewardPromo.discount, bookingId, userId]
        );

        res.json({ 
            success: true, 
            message: 'Booking confirmed and payment verified',
            rewardPromoCode: rewardPromo.code,
            rewardPromoDiscount: rewardPromo.discount
        });
    } catch (error) {
        console.error('Booking Confirmation Error:', error);
        res.status(500).json({ message: 'Error confirming booking' });
    }
};
