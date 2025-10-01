const { executeQuery, buildWhereClause, buildPagination, validateSort, formatPaginatedResponse, handleDatabaseError } = require('../utils/dbHelpers.js');
const { QueryTypes } = require('sequelize');

/**
 * Get dashboard statistics
 * @route GET /api/v1/admin/dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = startDate && endDate
      ? 'AND b.date BETWEEN $1 AND $2'
      : '';
    const bindings = startDate && endDate ? [startDate, endDate] : [];

    // Get total bookings and revenue
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount END), 0) as total_revenue
      FROM bookings b
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE 1=1 ${dateFilter}
    `, { bindings });

    // Get temple-wise bookings
    const templeStats = await executeQuery(`
      SELECT 
        t.name,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount END), 0) as revenue
      FROM temples t
      LEFT JOIN bookings b ON t.id = b.temple_id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE 1=1 ${dateFilter}
      GROUP BY t.id, t.name
      ORDER BY total_bookings DESC
      LIMIT 5
    `, { bindings });

    // Get service-wise bookings
    const serviceStats = await executeQuery(`
      SELECT 
        s.name,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount END), 0) as revenue
      FROM temple_services s
      LEFT JOIN bookings b ON s.id = b.service_id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE 1=1 ${dateFilter}
      GROUP BY s.id, s.name
      ORDER BY total_bookings DESC
      LIMIT 5
    `, { bindings });

    return res.json({
      success: true,
      data: {
        overview: stats[0],
        templeStats,
        serviceStats
      }
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'fetching dashboard stats');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Get temples list
 * @route GET /api/v1/admin/temples
 */
const getTemples = async (req, res) => {
  try {
    const { status, search, sortBy, sortOrder } = req.query;
    const allowedFields = ['name', 'city', 'status', 'created_at'];

    // Build filters
    const { whereClause, bindings } = buildWhereClause(
      { status, name: search ? `%${search}%` : null },
      ['status', 'name']
    );

    // Build pagination
    const pagination = buildPagination(req.query);

    // Validate sort parameters
    const sort = validateSort(sortBy, sortOrder, allowedFields);

    // Get temples with pagination
    const temples = await executeQuery(`
      SELECT 
        t.*,
        COUNT(DISTINCT b.id) as total_bookings,
        COUNT(DISTINCT s.id) as total_services
      FROM temples t
      LEFT JOIN bookings b ON t.id = b.temple_id
      LEFT JOIN temple_services s ON t.id = s.temple_id
      WHERE ${whereClause}
      GROUP BY t.id
      ORDER BY ${sort.sortBy} ${sort.sortOrder}
      LIMIT ${pagination.limit} OFFSET ${pagination.offset}
    `, { bindings });

    // Get total count
    const [{ total }] = await executeQuery(`
      SELECT COUNT(*) as total
      FROM temples
      WHERE ${whereClause}
    `, { bindings });

    return res.json(formatPaginatedResponse(temples, pagination, total));
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'fetching temples');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Update temple status
 * @route PUT /api/v1/admin/temples/:id/status
 */
const updateTempleStatus = async (req, res) => {
  const transaction = await startTransaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if temple exists
    const temples = await executeQuery(
      'SELECT id FROM temples WHERE id = $1',
      { bindings: [id], transaction }
    );

    if (!temples.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Temple not found'
      });
    }

    // Update status
    await executeQuery(
      'UPDATE temples SET status = $1, updated_at = NOW() WHERE id = $2',
      { bindings: [status, id], type: QueryTypes.UPDATE, transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Temple status updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    const errorResponse = handleDatabaseError(error, 'updating temple status');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Get users list
 * @route GET /api/v1/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { role, search, sortBy, sortOrder } = req.query;
    const allowedFields = ['name', 'email', 'phone', 'role', 'created_at'];

    // Build filters
    const { whereClause, bindings } = buildWhereClause(
      {
        role,
        name: search ? `%${search}%` : null,
        email: search ? `%${search}%` : null,
        phone: search ? `%${search}%` : null
      },
      ['role', 'name', 'email', 'phone']
    );

    // Build pagination
    const pagination = buildPagination(req.query);

    // Validate sort parameters
    const sort = validateSort(sortBy, sortOrder, allowedFields);

    // Get users with pagination
    const users = await executeQuery(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.role, u.is_active,
        u.created_at, u.updated_at,
        COUNT(DISTINCT b.id) as total_bookings,
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount END), 0) as total_spent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE ${whereClause}
      GROUP BY u.id
      ORDER BY ${sort.sortBy} ${sort.sortOrder}
      LIMIT ${pagination.limit} OFFSET ${pagination.offset}
    `, { bindings });

    // Get total count
    const [{ total }] = await executeQuery(`
      SELECT COUNT(*) as total
      FROM users
      WHERE ${whereClause}
    `, { bindings });

    return res.json(formatPaginatedResponse(users, pagination, total));
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'fetching users');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Get bookings list
 * @route GET /api/v1/admin/bookings
 */
const getBookings = async (req, res) => {
  try {
    const { status, templeId, startDate, endDate, search, sortBy, sortOrder } = req.query;
    const allowedFields = ['date', 'time', 'status', 'created_at'];

    // Build filters
    const filters = {
      'b.status': status,
      'b.temple_id': templeId,
      'u.name': search ? `%${search}%` : null,
      'u.phone': search ? `%${search}%` : null
    };

    if (startDate && endDate) {
      filters['b.date'] = { between: [startDate, endDate] };
    }

    const { whereClause, bindings } = buildWhereClause(filters, Object.keys(filters));

    // Build pagination
    const pagination = buildPagination(req.query);

    // Validate sort parameters
    const sort = validateSort(sortBy, sortOrder, allowedFields);

    // Get bookings with pagination
    const bookings = await executeQuery(`
      SELECT 
        b.*,
        u.name as user_name,
        u.phone as user_phone,
        t.name as temple_name,
        s.name as service_name,
        p.amount as payment_amount,
        p.status as payment_status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN temples t ON b.temple_id = t.id
      JOIN temple_services s ON b.service_id = s.id
      LEFT JOIN payments p ON b.id = p.booking_id
      WHERE ${whereClause}
      ORDER BY ${sort.sortBy} ${sort.sortOrder}
      LIMIT ${pagination.limit} OFFSET ${pagination.offset}
    `, { bindings });

    // Get total count
    const [{ total }] = await executeQuery(`
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE ${whereClause}
    `, { bindings });

    return res.json(formatPaginatedResponse(bookings, pagination, total));
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'fetching bookings');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

module.exports = {
  getDashboardStats,
  getTemples,
  updateTempleStatus,
  getUsers,
  getBookings
};