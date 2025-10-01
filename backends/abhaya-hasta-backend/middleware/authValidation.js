const { body } = require('express-validator');
const { checkValidation } = require('./validationMiddleware.js');

const validateLogin = [
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body()
    .custom((value, { req }) => {
      if (!req.body.phone && !req.body.email) {
        throw new Error('Either phone number or email is required');
      }
      return true;
    }),
  checkValidation
];

const validateEmailLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  checkValidation
];

const validateOTPRequest = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Invalid phone number format'),
  checkValidation
];

const validateOTPVerification = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Invalid phone number format'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  checkValidation
];

const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  checkValidation
];

const validateRegister = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Invalid phone number format'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'temple_admin'])
    .withMessage('Invalid role'),
  checkValidation
];

module.exports = {
  validateLogin,
  validateEmailLogin,
  validateOTPRequest,
  validateOTPVerification,
  validateRefreshToken,
  validateRegister
};