const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');
const { validateBookingInitiation, validateBookingConfirmation } = require('../middleware/validationMiddleware');

// Get user bookings
router.get('/user', verifyToken, bookingController.getUserBookings);

// Calculate price preview (no booking created)
router.post('/calculate', verifyToken, bookingController.calculatePrice);

// Create a new booking (with validation)
router.post('/initiate', verifyToken, validateBookingInitiation, bookingController.initiateBooking);

// Cancel a booking
router.delete('/:bookingId', verifyToken, bookingController.cancelBooking);

// Confirm a booking (after payment, with validation)
router.put('/:bookingId/confirm', verifyToken, validateBookingConfirmation, bookingController.confirmBooking);

module.exports = router;
