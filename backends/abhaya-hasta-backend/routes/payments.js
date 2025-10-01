const express = require('express');
const { protect } = require('../middleware/auth.js');
const paymentsController = require('../controllers/paymentsController.js');

const router = express.Router();

// @route   POST /api/payments/create-order
// @desc    Create a new payment order
// @access  Private
router.post('/create-order', protect, paymentsController.createOrder);

// @route   POST /api/payments/verify
// @desc    Verify payment after completion
// @access  Private
router.post('/verify', protect, paymentsController.verifyPayment);

// @route   GET /api/payments/history
// @desc    Get user's payment history
// @access  Private
router.get('/history', protect, paymentsController.getPaymentHistory);

module.exports = router;
