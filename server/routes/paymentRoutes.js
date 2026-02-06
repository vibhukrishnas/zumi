const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/create-payment-intent', verifyToken, paymentController.createPaymentIntent);
router.get('/status/:paymentIntentId', verifyToken, paymentController.getPaymentStatus);

module.exports = router;
