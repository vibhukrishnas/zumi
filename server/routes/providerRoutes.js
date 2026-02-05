const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/bookings', verifyToken, providerController.getProviderBookings);
router.put('/bookings/:bookingId/status', verifyToken, providerController.updateBookingStatus);
router.get('/availability', verifyToken, providerController.getAvailability);
router.post('/availability', verifyToken, providerController.updateAvailability);

module.exports = router;
