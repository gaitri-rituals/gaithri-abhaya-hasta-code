const express = require('express');
const { protect } = require('../middleware/auth.js');
const { createBooking, getUserBookings, getBookingById, cancelBooking, rescheduleBooking } = require('../controllers/bookingsController.js');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, createBooking);

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', protect, getUserBookings);

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', protect, getBookingById);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', protect, cancelBooking);

// @route   PUT /api/bookings/:id/reschedule
// @desc    Reschedule a booking
// @access  Private
router.put('/:id/reschedule', protect, rescheduleBooking);

module.exports = router;
