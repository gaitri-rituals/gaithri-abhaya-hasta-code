const { body } = require('express-validator');
const { checkValidation } = require('./validationMiddleware.js');

const validateLogin = [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Invalid phone number format'),
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
  validateRefreshToken,
  validateRegister
};