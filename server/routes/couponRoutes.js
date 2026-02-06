const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');

// Get all active coupons
router.get('/', verifyToken, async (req, res) => {
    try {
        const [coupons] = await pool.execute(
            `SELECT code, discount_percentage, valid_until, 
                    (usage_limit - used_count) as remaining_uses,
                    applicable_types
             FROM coupons 
             WHERE valid_from <= NOW() 
             AND valid_until >= NOW()
             AND (usage_limit = 0 OR used_count < usage_limit)
             ORDER BY discount_percentage DESC`
        );

        res.json({ success: true, data: coupons });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ success: false, message: 'Error fetching coupons' });
    }
});

// Validate a coupon code
router.post('/validate', verifyToken, async (req, res) => {
    try {
        const { code, itemType } = req.body;

        const [coupons] = await pool.execute(
            `SELECT * FROM coupons 
             WHERE code = ? 
             AND valid_from <= NOW() 
             AND valid_until >= NOW()
             AND (usage_limit = 0 OR used_count < usage_limit)
             AND (applicable_types = 'all' OR applicable_types = ?)`,
            [code.toUpperCase(), itemType]
        );

        if (coupons.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired promo code' 
            });
        }

        const coupon = coupons[0];
        res.json({ 
            success: true, 
            data: {
                code: coupon.code,
                discount: coupon.discount_percentage,
                message: `${coupon.discount_percentage}% discount applied!`
            }
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ success: false, message: 'Error validating coupon' });
    }
});

module.exports = router;
