const express = require('express');
const sequelize = require('../config/database.js');
const { QueryTypes } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/subscriptions
// @desc    Get available subscription plans
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { temple_id, active_only = true } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (active_only === 'true') {
      whereConditions.push('sp.is_active = true');
    }

    if (temple_id) {
      whereConditions.push(`sp.temple_id = $${paramIndex}`);
      queryParams.push(temple_id);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const plansQuery = `
      SELECT 
        sp.*,
        t.name as temple_name,
        t.city as temple_city,
        COUNT(us.id) as subscriber_count
      FROM subscription_plans sp
      JOIN temples t ON sp.temple_id = t.id
      LEFT JOIN user_subscriptions us ON sp.id = us.plan_id AND us.status = 'active'
      ${whereClause}
      GROUP BY sp.id, t.id
      ORDER BY sp.price ASC
    `;

    const plans = await sequelize.query(plansQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      message: 'Subscription plans retrieved successfully',
      data: plans
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/subscriptions/:id/subscribe
// @desc    Subscribe to a plan
// @access  Private
router.post('/:id/subscribe', protect, [
  body('payment_method').isIn(['razorpay', 'upi', 'auto_debit']).withMessage('Valid payment method required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const planId = req.params.id;
    const user_id = req.user.userId;
    const { payment_method } = req.body;

    // Check if plan exists
    const plan = await sequelize.query(
      `SELECT sp.*, t.name as temple_name
       FROM subscription_plans sp
       JOIN temples t ON sp.temple_id = t.id
       WHERE sp.id = $1 AND sp.is_active = true`,
      {
        bind: [planId],
        type: QueryTypes.SELECT
      }
    );

    if (plan.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    const planData = plan[0];

    // Check if user already has active subscription for this temple
    const existingSubscription = await sequelize.query(
      `SELECT us.* FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = $1 AND sp.temple_id = $2 AND us.status = 'active'`,
      {
        bind: [user_id, planData.temple_id],
        type: QueryTypes.SELECT
      }
    );

    if (existingSubscription.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription for this temple'
      });
    }

    // Calculate subscription period
    const startDate = new Date();
    const endDate = new Date();
    switch (planData.billing_cycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case 'lifetime':
        endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime = 100 years
        break;
    }

    // Create subscription
    const subscriptionQuery = `
      INSERT INTO user_subscriptions (
        user_id, plan_id, start_date, end_date, payment_method,
        payment_status, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, 'pending', 'pending', CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const subscriptions = await sequelize.query(subscriptionQuery, {
      bind: [user_id, planId, startDate, endDate, payment_method],
      type: QueryTypes.INSERT
    });

    const subscription = subscriptions[0][0];

    // Get complete subscription details
    const completeSubscription = await sequelize.query(
      `SELECT 
        us.*,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.price,
        sp.billing_cycle,
        sp.features,
        t.name as temple_name
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       JOIN temples t ON sp.temple_id = t.id
       WHERE us.id = $1`,
      {
        bind: [subscription.id],
        type: QueryTypes.SELECT
      }
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        ...completeSubscription[0],
        payment_required: planData.price > 0
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during subscription',
      error: error.message
    });
  }
});

// @route   GET /api/subscriptions/my-subscriptions
// @desc    Get user's subscriptions
// @access  Private
router.get('/my-subscriptions', protect, async (req, res) => {
  try {
    const user_id = req.user.userId;
    const { status } = req.query;

    let whereClause = 'WHERE us.user_id = $1';
    let queryParams = [user_id];

    if (status) {
      whereClause += ' AND us.status = $2';
      queryParams.push(status);
    }

    const subscriptionsQuery = `
      SELECT 
        us.*,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.price,
        sp.billing_cycle,
        sp.features,
        t.name as temple_name,
        t.city as temple_city,
        CASE 
          WHEN us.end_date < CURRENT_DATE THEN 'expired'
          WHEN us.end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
          ELSE 'active'
        END as subscription_status
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      JOIN temples t ON sp.temple_id = t.id
      ${whereClause}
      ORDER BY us.created_at DESC
    `;

    const subscriptions = await sequelize.query(subscriptionsQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      message: 'Subscriptions retrieved successfully',
      data: subscriptions
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
