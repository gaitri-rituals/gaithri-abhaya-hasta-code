const { body, query, param } = require('express-validator');

const validateDashboardQuery = [
  query('start_date').optional().isDate().withMessage('Start date must be a valid date'),
  query('end_date').optional().isDate().withMessage('End date must be a valid date')
];

const validateTempleQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status value'),
  query('search').optional().isString().trim().escape(),
  query('sort_by').optional().isIn(['created_at', 'name', 'city', 'status']).withMessage('Invalid sort field'),
  query('sort_order').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC')
];

const validateTempleStatusUpdate = [
  param('id').isInt({ min: 1 }).withMessage('Temple ID must be a positive integer'),
  body('status').isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status value')
];

const validateUserQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'admin', 'super-admin']).withMessage('Invalid role value'),
  query('search').optional().isString().trim().escape(),
  query('sort_by').optional().isIn(['created_at', 'name', 'email', 'role']).withMessage('Invalid sort field'),
  query('sort_order').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC')
];

const validateBookingQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status value'),
  query('temple_id').optional().isInt({ min: 1 }).withMessage('Temple ID must be a positive integer'),
  query('user_id').optional().isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  query('date_from').optional().isDate().withMessage('From date must be a valid date'),
  query('date_to').optional().isDate().withMessage('To date must be a valid date'),
  query('sort_by').optional().isIn(['created_at', 'scheduled_datetime', 'booking_status']).withMessage('Invalid sort field'),
  query('sort_order').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC')
];

module.exports = {
  validateDashboardQuery,
  validateTempleQuery,
  validateTempleStatusUpdate,
  validateUserQuery,
  validateBookingQuery
};