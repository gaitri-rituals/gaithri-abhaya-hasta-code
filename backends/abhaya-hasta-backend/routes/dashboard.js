const express = require('express');
const { protect } = require('../middleware/auth.js');
const { executeQuery } = require('../utils/dbHelpers.js');

const router = express.Router();

// @route   GET /api/dashboard/metrics
// @desc    Get dashboard metrics
// @access  Private
router.get('/metrics', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get temple_id for admin user
    let templeId = null;
    if (userRole === 'admin') {
      const userQuery = await executeQuery(
        'SELECT temple_id FROM admin_temple_access WHERE user_id = $1',
        { bindings: [userId] }
      );
      templeId = userQuery[0]?.temple_id;
    }

    // Build query conditions and bindings
    let whereConditions = [];
    let bindings = [];
    let paramIndex = 1;

    // Add temple condition if applicable
    if (templeId) {
      whereConditions.push(`temple_id = $${paramIndex}`);
      bindings.push(templeId);
      paramIndex++;
    }

    // Add user condition for non-admin users
    if (userRole !== 'admin') {
      whereConditions.push(`user_id = $${paramIndex}`);
      bindings.push(userId);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total bookings
    const bookingsQuery = await executeQuery(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
      ${whereClause}
    `, { bindings });

    // Get total revenue
    let revenueWhereConditions = ['payment_status = \'completed\''];
    let revenueBindings = [];
    let revenueParamIndex = 1;

    if (templeId) {
      revenueWhereConditions.push(`temple_id = $${revenueParamIndex}`);
      revenueBindings.push(templeId);
      revenueParamIndex++;
    }

    if (userRole !== 'admin') {
      revenueWhereConditions.push(`user_id = $${revenueParamIndex}`);
      revenueBindings.push(userId);
      revenueParamIndex++;
    }

    const revenueQuery = await executeQuery(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as current_month_revenue
      FROM bookings 
      WHERE ${revenueWhereConditions.join(' AND ')}
    `, { bindings: revenueBindings });

    // Get active events
    const eventsQuery = await executeQuery(`
      SELECT COUNT(*) as active_events
      FROM events
      WHERE event_date >= CURRENT_DATE
      ${templeId ? 'AND temple_id = $1' : ''}
    `, templeId ? { bindings: [templeId] } : { bindings: [] });

    // Get total users (admin only)
    let totalUsers = 0;
    if (userRole === 'admin') {
      const usersQuery = await executeQuery(`
        SELECT COUNT(*) as total_users
        FROM users
        WHERE is_active = true
      `, { bindings: [] });
      totalUsers = usersQuery[0].total_users;
    }

    const metrics = {
      bookings: {
        total: parseInt(bookingsQuery[0].total_bookings),
        confirmed: parseInt(bookingsQuery[0].confirmed_bookings),
        pending: parseInt(bookingsQuery[0].pending_bookings),
        cancelled: parseInt(bookingsQuery[0].cancelled_bookings)
      },
      revenue: {
        total: parseFloat(revenueQuery[0].total_revenue),
        currentMonth: parseFloat(revenueQuery[0].current_month_revenue)
      },
      activeEvents: parseInt(eventsQuery[0].active_events),
      totalUsers: userRole === 'admin' ? parseInt(totalUsers) : null
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data for dashboard
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const { userId, userRole } = req.user;
    const templeId = userRole === 'admin' ? null : req.user.templeId;

    // Build date range based on period
    let dateRange;
    switch (period) {
      case 'weekly':
        dateRange = "date_trunc('week', CURRENT_DATE)";
        break;
      case 'monthly':
        dateRange = "date_trunc('month', CURRENT_DATE)";
        break;
      case 'yearly':
        dateRange = "date_trunc('year', CURRENT_DATE)";
        break;
      default:
        dateRange = "date_trunc('month', CURRENT_DATE)";
    }

    // Get booking trends
    let bookingTrendsQuery;
    let bookingTrendsBindings = [];
    
    if (userRole === 'admin') {
      if (templeId) {
        bookingTrendsQuery = `
          SELECT 
            date_trunc('day', booking_date) as booking_date,
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings
          FROM bookings
          WHERE booking_date >= ${dateRange}
          AND temple_id = $1
          GROUP BY date_trunc('day', booking_date)
          ORDER BY booking_date ASC
        `;
        bookingTrendsBindings = [templeId];
      } else {
        bookingTrendsQuery = `
          SELECT 
            date_trunc('day', booking_date) as booking_date,
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings
          FROM bookings
          WHERE booking_date >= ${dateRange}
          GROUP BY date_trunc('day', booking_date)
          ORDER BY booking_date ASC
        `;
        bookingTrendsBindings = [];
      }
    } else {
      if (templeId) {
        bookingTrendsQuery = `
          SELECT 
            date_trunc('day', booking_date) as booking_date,
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings
          FROM bookings
          WHERE booking_date >= ${dateRange}
          AND temple_id = $1
          AND user_id = $2
          GROUP BY date_trunc('day', booking_date)
          ORDER BY booking_date ASC
        `;
        bookingTrendsBindings = [templeId, userId];
      } else {
        bookingTrendsQuery = `
          SELECT 
            date_trunc('day', booking_date) as booking_date,
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings
          FROM bookings
          WHERE booking_date >= ${dateRange}
          AND user_id = $1
          GROUP BY date_trunc('day', booking_date)
          ORDER BY booking_date ASC
        `;
        bookingTrendsBindings = [userId];
      }
    }

    const bookingTrends = await executeQuery(
      bookingTrendsQuery,
      { bindings: bookingTrendsBindings }
    );

    // Get service popularity
    let servicePopularityQuery;
    let servicePopularityBindings = [];
    
    if (userRole === 'admin') {
      if (templeId) {
        servicePopularityQuery = `
          SELECT 
            ts.name as service_name,
            COUNT(*) as booking_count,
            COALESCE(SUM(b.amount), 0) as total_revenue
          FROM bookings b
          JOIN temple_services ts ON b.service_id = ts.id
          WHERE b.booking_date >= ${dateRange}
          AND b.temple_id = $1
          GROUP BY ts.name
          ORDER BY booking_count DESC
          LIMIT 5
        `;
        servicePopularityBindings = [templeId];
      } else {
        servicePopularityQuery = `
          SELECT 
            ts.name as service_name,
            COUNT(*) as booking_count,
            COALESCE(SUM(b.amount), 0) as total_revenue
          FROM bookings b
          JOIN temple_services ts ON b.service_id = ts.id
          WHERE b.booking_date >= ${dateRange}
          GROUP BY ts.name
          ORDER BY booking_count DESC
          LIMIT 5
        `;
        servicePopularityBindings = [];
      }
    } else {
      if (templeId) {
        servicePopularityQuery = `
          SELECT 
            ts.name as service_name,
            COUNT(*) as booking_count,
            COALESCE(SUM(b.amount), 0) as total_revenue
          FROM bookings b
          JOIN temple_services ts ON b.service_id = ts.id
          WHERE b.booking_date >= ${dateRange}
          AND b.temple_id = $1
          AND b.user_id = $2
          GROUP BY ts.name
          ORDER BY booking_count DESC
          LIMIT 5
        `;
        servicePopularityBindings = [templeId, userId];
      } else {
        servicePopularityQuery = `
          SELECT 
            ts.name as service_name,
            COUNT(*) as booking_count,
            COALESCE(SUM(b.amount), 0) as total_revenue
          FROM bookings b
          JOIN temple_services ts ON b.service_id = ts.id
          WHERE b.booking_date >= ${dateRange}
          AND b.user_id = $1
          GROUP BY ts.name
          ORDER BY booking_count DESC
          LIMIT 5
        `;
        servicePopularityBindings = [userId];
      }
    }

    const servicePopularity = await executeQuery(
      servicePopularityQuery,
      { bindings: servicePopularityBindings }
    );

    // Get user engagement (admin only)
    let userEngagement = null;
    if (userRole === 'admin') {
      let userEngagementQuery;
      let userEngagementBindings = [];
      
      if (templeId) {
        userEngagementQuery = `
          SELECT 
            COUNT(DISTINCT user_id) as total_users,
            COUNT(DISTINCT CASE WHEN booking_count > 1 THEN user_id END) as returning_users,
            ROUND(AVG(booking_count), 2) as average_bookings_per_user
          FROM (
            SELECT user_id, COUNT(*) as booking_count
            FROM bookings
            WHERE booking_date >= ${dateRange}
            AND temple_id = $1
            GROUP BY user_id
          ) user_stats
        `;
        userEngagementBindings = [templeId];
      } else {
        userEngagementQuery = `
          SELECT 
            COUNT(DISTINCT user_id) as total_users,
            COUNT(DISTINCT CASE WHEN booking_count > 1 THEN user_id END) as returning_users,
            ROUND(AVG(booking_count), 2) as average_bookings_per_user
          FROM (
            SELECT user_id, COUNT(*) as booking_count
            FROM bookings
            WHERE booking_date >= ${dateRange}
            GROUP BY user_id
          ) user_stats
        `;
        userEngagementBindings = [];
      }

      userEngagement = await executeQuery(
        userEngagementQuery,
        { bindings: userEngagementBindings }
      );
    }

    res.json({
      success: true,
      data: {
        bookingTrends: bookingTrends.map(trend => ({
          date: trend.booking_date,
          total: parseInt(trend.total_bookings),
          confirmed: parseInt(trend.confirmed_bookings)
        })),
        servicePopularity: servicePopularity.map(service => ({
          name: service.service_name,
          bookings: parseInt(service.booking_count),
          revenue: parseFloat(service.total_revenue)
        })),
        userEngagement: userRole === 'admin' ? {
          totalUsers: parseInt(userEngagement[0].total_users),
          returningUsers: parseInt(userEngagement[0].returning_users),
          averageBookingsPerUser: parseFloat(userEngagement[0].average_bookings_per_user)
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;