const { query } = require('express-validator');

const validateAnalyticsQuery = [
  query('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Period must be one of: weekly, monthly, yearly'),
  query('temple_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Temple ID must be a positive integer')
];

module.exports = { validateAnalyticsQuery };