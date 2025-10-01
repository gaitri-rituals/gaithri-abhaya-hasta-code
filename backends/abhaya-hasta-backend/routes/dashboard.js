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

    // Get total bookings
    const bookingsQuery = await executeQuery(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
      FROM bookings
      WHERE ${templeId ? 'temple_id = $1' : '1=1'}
      ${userRole !== 'admin' ? 'AND user_id = $2' : ''}
    `, {
      bindings: userRole === 'admin' 
        ? (templeId ? [templeId] : [])
        : (templeId ? [templeId, userId] : [userId])
    });

    // Get total revenue
    const revenueQuery = await executeQuery(`
      SELECT 
        COALESCE(SUM(payment_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN payment_amount ELSE 0 END), 0) as current_month_revenue
      FROM bookings 
      WHERE payment_status = 'completed'
      AND ${templeId ? 'temple_id = $1' : '1=1'}
      ${userRole !== 'admin' ? 'AND user_id = $2' : ''}
    `, {
      bindings: userRole === 'admin'
        ? (templeId ? [templeId] : [])
        : (templeId ? [templeId, userId] : [userId])
    });

    // Get active events
    const eventsQuery = await executeQuery(`
      SELECT COUNT(*) as active_events
      FROM events
      WHERE end_date >= CURRENT_DATE
      AND ${templeId ? 'temple_id = $1' : '1=1'}
    `, templeId ? { bindings: [templeId] } : {});

    // Get total users (admin only)
    let totalUsers = 0;
    if (userRole === 'admin') {
      const usersQuery = await executeQuery(`
        SELECT COUNT(*) as total_users
        FROM users
        WHERE is_active = true
      `);
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
// @desc    Get dashboard analytics data
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
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
    const bookingTrendsQuery = `
      SELECT 
        date_trunc('day', date) as booking_date,
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings
      FROM bookings
      WHERE date >= ${dateRange}
      AND ${templeId ? 'temple_id = $1' : '1=1'}
      ${userRole !== 'admin' ? 'AND user_id = $2' : ''}
      GROUP BY date_trunc('day', date)
      ORDER BY booking_date ASC
    `;

    const bookingTrends = await executeQuery(
      bookingTrendsQuery,
      {
        bindings: userRole === 'admin'
          ? (templeId ? [templeId] : [])
          : (templeId ? [templeId, userId] : [userId])
      }
    );

    // Get service popularity
    const servicePopularityQuery = `
      SELECT 
        service_name,
        COUNT(*) as booking_count,
        COALESCE(SUM(payment_amount), 0) as total_revenue
      FROM bookings
      WHERE date >= ${dateRange}
      AND ${templeId ? 'temple_id = $1' : '1=1'}
      ${userRole !== 'admin' ? 'AND user_id = $2' : ''}
      GROUP BY service_name
      ORDER BY booking_count DESC
      LIMIT 5
    `;

    const servicePopularity = await executeQuery(
      servicePopularityQuery,
      {
        bindings: userRole === 'admin'
          ? (templeId ? [templeId] : [])
          : (templeId ? [templeId, userId] : [userId])
      }
    );

    // Get user engagement (admin only)
    let userEngagement = null;
    if (userRole === 'admin') {
      const userEngagementQuery = `
        SELECT 
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT CASE WHEN booking_count > 1 THEN user_id END) as returning_users,
          ROUND(AVG(booking_count), 2) as average_bookings_per_user
        FROM (
          SELECT user_id, COUNT(*) as booking_count
          FROM bookings
          WHERE date >= ${dateRange}
          AND ${templeId ? 'temple_id = $1' : '1=1'}
          GROUP BY user_id
        ) user_stats
      `;

      userEngagement = await executeQuery(
        userEngagementQuery,
        templeId ? { bindings: [templeId] } : {}
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