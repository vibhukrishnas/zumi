const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get user bookings
router.get('/user', verifyToken, bookingController.getUserBookings);

// Create a new booking
router.post('/initiate', verifyToken, bookingController.initiateBooking);

// Cancel a booking
router.delete('/:bookingId', verifyToken, bookingController.cancelBooking);

// Confirm a booking (after payment)
router.put('/:bookingId/confirm', verifyToken, bookingController.confirmBooking);

module.exports = router;
