const { pool } = require('../config/database.js');

/**
 * Execute a database query with error handling and transaction support
 * @param {string} query - SQL query string
 * @param {Object} options - Query options (bindings, client)
 * @returns {Promise} Query results
 */
const executeQuery = async (query, options = {}) => {
  const { bindings = [], client = null } = options;
  const queryClient = client || pool;

  try {
    const results = await queryClient.query(query, bindings);
    return results.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
};

/**
 * Start a new database transaction
 * @returns {Promise} Transaction client
 */
const startTransaction = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    return client;
  } catch (error) {
    client.release();
    console.error('Transaction start error:', error);
    throw new Error(`Failed to start transaction: ${error.message}`);
  }
};

/**
 * Commit a transaction
 * @param {Object} client - Transaction client
 */
const commitTransaction = async (client) => {
  try {
    await client.query('COMMIT');
  } finally {
    client.release();
  }
};

/**
 * Rollback a transaction
 * @param {Object} client - Transaction client
 */
const rollbackTransaction = async (client) => {
  try {
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
};

/**
 * Build a WHERE clause and bindings from filter parameters
 * @param {Object} filters - Filter parameters
 * @param {Array} allowedFields - Allowed filter fields
 * @returns {Object} WHERE clause and bindings
 */
const buildWhereClause = (filters, allowedFields) => {
  const whereClause = [];
  const bindings = [];
  let paramCount = 1;

  Object.entries(filters).forEach(([key, value]) => {
    if (value && allowedFields.includes(key)) {
      if (typeof value === 'string' && value.includes('%')) {
        // Handle LIKE queries
        whereClause.push(`${key} ILIKE $${paramCount}`);
      } else {
        whereClause.push(`${key} = $${paramCount}`);
      }
      bindings.push(value);
      paramCount++;
    }
  });

  return {
    whereClause: whereClause.length ? whereClause.join(' AND ') : '1=1',
    bindings
  };
};

/**
 * Build pagination parameters
 * @param {Object} options - Pagination options
 * @returns {Object} Pagination parameters
 */
const buildPagination = (options) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Validate and sanitize sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort direction
 * @param {Array} allowedFields - Allowed sort fields
 * @returns {Object} Validated sort parameters
 */
const validateSort = (sortBy, sortOrder, allowedFields) => {
  const validSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) 
    ? sortOrder.toUpperCase() 
    : 'DESC';

  const validSortBy = allowedFields.includes(sortBy) ? sortBy : 'created_at';

  return { sortBy: validSortBy, sortOrder: validSortOrder };
};

/**
 * Format pagination response
 * @param {Array} data - Query results
 * @param {Object} pagination - Pagination parameters
 * @param {number} total - Total number of records
 * @returns {Object} Formatted response
 */
const formatPaginatedResponse = (data, pagination, total) => {
  return {
    success: true,
    data: {
      records: data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    }
  };
};

/**
 * Handle database errors and return appropriate response
 * @param {Error} error - Error object
 * @param {string} operation - Operation description
 * @returns {Object} Error response
 */
const handleDatabaseError = (error, operation) => {
  console.error(`Database error during ${operation}:`, error);
  
  // Check for specific error codes
  switch (error.code) {
    case '23505': // unique_violation
      return {
        success: false,
        status: 409,
        message: 'Duplicate entry found',
        error: error.detail || 'Unique constraint violation'
      };
    
    case '23503': // foreign_key_violation
      return {
        success: false,
        status: 400,
        message: 'Invalid reference',
        error: 'Foreign key constraint violation'
      };
    
    case '23502': // not_null_violation
    case '23514': // check_violation
      return {
        success: false,
        status: 400,
        message: 'Validation error',
        error: error.detail || 'Invalid data provided'
      };
    
    default:
      return {
        success: false,
        status: 500,
        message: `Error during ${operation}`,
        error: error.message
      };
  }
};

module.exports = {
  executeQuery,
  startTransaction,
  commitTransaction,
  rollbackTransaction,
  buildWhereClause,
  buildPagination,
  validateSort,
  formatPaginatedResponse,
  handleDatabaseError
};