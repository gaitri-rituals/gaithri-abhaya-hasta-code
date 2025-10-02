const express = require('express');
const { 
  login, 
  adminLogin, 
  templeLogin, 
  vendorLogin, 
  sendOTP, 
  verifyOTPLogin, 
  register, 
  refreshToken, 
  logout,
  getProfile
} = require('../controllers/authController.js');
const { 
  validateLogin, 
  validateEmailLogin, 
  validateOTPRequest, 
  validateOTPVerification, 
  validateRegister, 
  validateRefreshToken 
} = require('../middleware/authValidation.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// Legacy login (backward compatibility)
router.post('/login', validateLogin, login);

// Admin/Temple staff email-based login
router.post('/admin/login', validateEmailLogin, adminLogin);

// Temple email-based login
router.post('/temple/login', validateEmailLogin, templeLogin);

// Vendor email-based login
router.post('/vendor/login', validateEmailLogin, vendorLogin);

// Regular user OTP-based login
router.post('/otp/send', validateOTPRequest, sendOTP);
router.post('/otp/verify', validateOTPVerification, verifyOTPLogin);

// Other routes
router.post('/register', validateRegister, register);
router.post('/refresh-token', validateRefreshToken, refreshToken);
router.post('/logout', logout);

// Profile route (protected)
router.get('/me', protect, getProfile);

module.exports = router;
