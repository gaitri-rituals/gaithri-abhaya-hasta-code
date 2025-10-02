import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

// GET /api/dashboard/metrics
export const getMetrics = async (req, res) => {
  try {
    const temple_id = req.user.temple_id;

    const isTempleSuperAdmin = !temple_id;
    const templeFilter = isTempleSuperAdmin ? '' : 'AND temple_id = $1';
    const queryParams = isTempleSuperAdmin ? [] : [temple_id];

    const donationsQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_donations,
        COUNT(*) as donation_count,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as current_month,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                          AND created_at < DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as last_month
      FROM bookings 
      WHERE payment_status = 'completed' ${templeFilter}
    `;

    const donations = await sequelize.query(donationsQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });

    const eventsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_date >= CURRENT_DATE THEN 1 END) as active_events,
        COUNT(CASE WHEN event_date >= CURRENT_DATE AND event_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END) as this_week_events
      FROM events 
      WHERE is_active = true ${templeFilter}
    `;

    const events = await sequelize.query(eventsQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });

    const membersQuery = `
      SELECT 
        COUNT(DISTINCT user_id) as total_members,
        COUNT(DISTINCT CASE WHEN b.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN b.user_id END) as new_this_month
      FROM bookings b
      WHERE 1=1 ${templeFilter}
    `;

    const members = await sequelize.query(membersQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });

    const visitorsQuery = `
      SELECT 
        COUNT(*) as today_visitors,
        COUNT(CASE WHEN EXTRACT(HOUR FROM created_at) = EXTRACT(HOUR FROM CURRENT_TIMESTAMP) THEN 1 END) as current_hour
      FROM bookings 
      WHERE DATE(created_at) = CURRENT_DATE ${templeFilter}
    `;

    const visitors = await sequelize.query(visitorsQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });

    const donationData = donations[0];
    const donationChange = donationData.last_month > 0 ? 
      ((donationData.current_month - donationData.last_month) / donationData.last_month * 100).toFixed(1) : 0;

    const metrics = [
      {
        title: 'Total Donations',
        value: `₹${Number(donationData.total_donations).toLocaleString('en-IN')}`,
        change: `${donationChange > 0 ? '+' : ''}${donationChange}% from last month`,
        changeType: donationChange >= 0 ? 'positive' : 'negative',
        icon: 'IndianRupee',
        description: 'Including Seva contributions',
      },
      {
        title: 'Active Events',
        value: String(events[0].active_events),
        change: `${events[0].this_week_events} this week`,
        changeType: 'neutral',
        icon: 'Calendar',
        description: 'Festivals & daily rituals',
      },
      {
        title: 'Community Members',
        value: Number(members[0].total_members).toLocaleString('en-IN'),
        change: `+${members[0].new_this_month} new devotees`,
        changeType: 'positive',
        icon: 'Users',
        description: 'Registered families',
      },
      {
        title: "Today's Visitors",
        value: String(visitors[0].today_visitors),
        change: 'Peak at 6:30 PM',
        changeType: 'neutral',
        icon: 'Activity',
        description: 'Live tracking active',
      },
    ];

    return res.json({ success: true, message: 'Dashboard metrics retrieved successfully', data: metrics });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET /api/dashboard/donations/chart
export const getDonationsChart = async (req, res) => {
  try {
    const { temple_id } = req.user;
    const isTempleSuperAdmin = !temple_id;
    const templeFilter = isTempleSuperAdmin ? '' : 'AND temple_id = $1';
    const queryParams = isTempleSuperAdmin ? [] : [temple_id];

    const chartQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month_year,
        DATE_TRUNC('month', created_at) as month_date,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(*) as donation_count
      FROM bookings 
      WHERE payment_status = 'completed' 
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      ${templeFilter}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date ASC
    `;

    const chartData = await sequelize.query(chartQuery, { bind: queryParams, type: QueryTypes.SELECT });

    return res.json({
      success: true,
      message: 'Donation chart data retrieved successfully',
      data: chartData.map(row => ({ month: row.month_year, amount: parseFloat(row.total_amount), count: parseInt(row.donation_count) }))
    });
  } catch (error) {
    console.error('Error fetching donation chart:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET /api/dashboard/visitor-flow
export const getVisitorFlow = async (req, res) => {
  try {
    // Handle case where req.user might be undefined (for testing)
    const temple_id = req.user ? req.user.temple_id : null;
    const isTempleSuperAdmin = !temple_id;
    const templeFilter = isTempleSuperAdmin ? '' : 'AND temple_id = $1';
    const queryParams = isTempleSuperAdmin ? [] : [temple_id];

    const flowQuery = `
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as visitor_count
      FROM bookings 
      WHERE DATE(created_at) = CURRENT_DATE ${templeFilter}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour ASC
    `;

    const flowData = await sequelize.query(flowQuery, { bind: queryParams, type: QueryTypes.SELECT });

    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const data = flowData.find(row => parseInt(row.hour) === hour);
      return { hour: `${hour.toString().padStart(2, '0')}:00`, visitors: data ? parseInt(data.visitor_count) : 0 };
    });

    return res.json({ success: true, message: 'Visitor flow data retrieved successfully', data: hourlyData });
  } catch (error) {
    console.error('Error fetching visitor flow:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET /api/dashboard/notifications
export const getNotifications = async (req, res) => {
  try {
    const temple_id = req.user.temple_id;
    const role = req.user.role;
    
    if (role !== 'temple_admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Temple admin role required.' });
    }

    const notificationsQuery = `
      SELECT 
        b.id,
        ts.name as service_name,
        CONCAT(b.booking_date, ' ', b.booking_time) as scheduled_datetime,
        b.amount,
        b.status as booking_status,
        b.created_at,
        u.name as user_name,
        u.phone as user_phone,
        t.name as temple_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN temples t ON b.temple_id = t.id
      LEFT JOIN temple_services ts ON b.service_id = ts.id
      WHERE b.temple_id = $1 
      AND b.status = 'pending'
      AND b.payment_status = 'completed'
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

    const notifications = await sequelize.query(notificationsQuery, { bind: [temple_id], type: QueryTypes.SELECT });

    return res.json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications.map(notification => ({
        id: notification.id,
        title: `New ${notification.service_name} Booking`,
        description: `${notification.user_name} has requested ${notification.service_name}`,
        datetime: notification.scheduled_datetime,
        amount: notification.amount,
        user: { name: notification.user_name, phone: notification.user_phone },
        temple: notification.temple_name,
        created_at: notification.created_at
      }))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// POST /api/dashboard/notifications/:id/accept
export const acceptNotification = async (req, res) => {
  try {
    const { temple_id, role } = req.user;
    const bookingId = req.params.id;
    if (role !== 'temple_admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Temple admin role required.' });
    }

    const updateQuery = `
      UPDATE bookings 
      SET booking_status = 'confirmed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND temple_id = $2 AND booking_status = 'pending'
      RETURNING *
    `;

    const result = await sequelize.query(updateQuery, { bind: [bookingId, temple_id], type: QueryTypes.UPDATE });
    if (result[1] === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or already processed' });
    }
    return res.json({ success: true, message: 'Booking accepted successfully' });
  } catch (error) {
    console.error('Error accepting notification:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// POST /api/dashboard/notifications/:id/reject
export const rejectNotification = async (req, res) => {
  try {
    const { temple_id, role } = req.user;
    const bookingId = req.params.id;
    const { reason } = req.body;
    if (role !== 'temple_admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Temple admin role required.' });
    }

    const updateQuery = `
      UPDATE bookings 
      SET booking_status = 'cancelled',
          notes = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND temple_id = $2 AND booking_status = 'pending'
      RETURNING *
    `;

    const result = await sequelize.query(updateQuery, { bind: [bookingId, temple_id, reason || 'Rejected by temple admin'], type: QueryTypes.UPDATE });
    if (result[1] === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or already processed' });
    }
    return res.json({ success: true, message: 'Booking rejected successfully' });
  } catch (error) {
    console.error('Error rejecting notification:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET /api/dashboard/analytics
export const getAnalytics = async (req, res) => {
  try {
    const temple_id = req.user.temple_id;
    const { period = 'monthly' } = req.query;

    // Map period parameter to valid PostgreSQL DATE_TRUNC values
    const periodMap = {
      'daily': 'day',
      'weekly': 'week', 
      'monthly': 'month',
      'yearly': 'year'
    };
    const dateTruncPeriod = periodMap[period] || 'month';

    const isTempleSuperAdmin = !temple_id;
    const templeFilter = isTempleSuperAdmin ? '' : 'AND temple_id = $1';
    const queryParams = isTempleSuperAdmin ? [] : [temple_id];

    const bookingTrendsQuery = `
      SELECT 
        DATE_TRUNC('${dateTruncPeriod}', created_at) as date,
        COUNT(*) as bookings,
        COALESCE(SUM(amount), 0) as revenue
      FROM bookings 
      WHERE payment_status = 'completed'
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
      ${templeFilter}
      GROUP BY DATE_TRUNC('${dateTruncPeriod}', created_at)
      ORDER BY date ASC
    `;
    const bookingTrends = await sequelize.query(bookingTrendsQuery, { bind: queryParams, type: QueryTypes.SELECT });

    const servicePopularityQuery = `
      SELECT 
        ts.name as serviceName,
        COUNT(*) as bookings,
        COALESCE(SUM(b.amount), 0) as revenue
      FROM bookings b
      JOIN temple_services ts ON b.service_id = ts.id
      WHERE b.payment_status = 'completed'
      ${templeFilter.replace('temple_id', 'b.temple_id')}
      GROUP BY ts.name
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `;
    const servicePopularity = await sequelize.query(servicePopularityQuery, { bind: queryParams, type: QueryTypes.SELECT });

    const userEngagementQuery = `
      WITH UserStats AS (
        SELECT 
          user_id,
          MIN(created_at) as first_booking,
          COUNT(*) as total_bookings
        FROM bookings
        WHERE payment_status = 'completed'
        ${templeFilter}
        GROUP BY user_id
      )
      SELECT 
        COUNT(CASE WHEN first_booking >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_users,
        COUNT(CASE WHEN first_booking < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as returning_users,
        ROUND(AVG(total_bookings), 2) as average_bookings_per_user
      FROM UserStats
    `;
    const userEngagement = await sequelize.query(userEngagementQuery, { bind: queryParams, type: QueryTypes.SELECT });

    const revenueBreakdownQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN ts.category = 'puja' THEN b.amount ELSE 0 END), 0) as pujas,
        COALESCE(SUM(CASE WHEN ts.category = 'donation' THEN b.amount ELSE 0 END), 0) as donations,
        COALESCE(SUM(CASE WHEN ts.category = 'class' THEN b.amount ELSE 0 END), 0) as classes,
        COALESCE(SUM(CASE WHEN ts.category = 'event' THEN b.amount ELSE 0 END), 0) as events
      FROM bookings b
      LEFT JOIN temple_services ts ON b.service_id = ts.id
      WHERE b.payment_status = 'completed'
      AND b.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      ${templeFilter.replace('temple_id', 'b.temple_id')}
    `;
    const revenueBreakdown = await sequelize.query(revenueBreakdownQuery, { bind: queryParams, type: QueryTypes.SELECT });

    const analytics = {
      bookingTrends: bookingTrends.map(trend => ({ date: trend.date, bookings: parseInt(trend.bookings), revenue: parseFloat(trend.revenue) })),
      servicePopularity: servicePopularity.map(service => ({ serviceName: service.servicename, bookings: parseInt(service.bookings), revenue: parseFloat(service.revenue) })),
      userEngagement: {
        newUsers: parseInt(userEngagement[0]?.new_users || 0),
        returningUsers: parseInt(userEngagement[0]?.returning_users || 0),
        averageBookingsPerUser: parseFloat(userEngagement[0]?.average_bookings_per_user || 0)
      },
      revenueBreakdown: {
        pujas: parseFloat(revenueBreakdown[0]?.pujas || 0),
        donations: parseFloat(revenueBreakdown[0]?.donations || 0),
        classes: parseFloat(revenueBreakdown[0]?.classes || 0),
        events: parseFloat(revenueBreakdown[0]?.events || 0)
      }
    };

    return res.json({ success: true, message: 'Analytics data retrieved successfully', analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};