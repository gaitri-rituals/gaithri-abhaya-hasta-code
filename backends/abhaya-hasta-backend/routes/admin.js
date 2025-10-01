const express = require('express');
const { protect, authorize } = require('../middleware/auth.js');
const {
  validateDashboardQuery,
  validateTempleQuery,
  validateTempleStatusUpdate,
  validateUserQuery,
  validateBookingQuery
} = require('../middleware/adminValidation.js');
const {
  getDashboardStats,
  getTemples,
  updateTempleStatus,
  getUsers,
  getBookings
} = require('../controllers/adminController.js');
const { validationResult } = require('express-validator');

const router = express.Router();

// Middleware to check for validation errors
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Protect all routes in this router
router.use(protect);
router.use(authorize(['admin', 'super-admin']));

// Dashboard routes
router.get('/dashboard', validateDashboardQuery, checkValidation, getDashboardStats);

// Temple management routes
router.get('/temples', validateTempleQuery, checkValidation, getTemples);
router.put('/temples/:id/status', validateTempleStatusUpdate, checkValidation, updateTempleStatus);

// User management routes
router.get('/users', validateUserQuery, checkValidation, getUsers);

// Booking management routes
router.get('/bookings', validateBookingQuery, checkValidation, getBookings);

module.exports = router;