const db = require('../config/database');

const paymentsController = {
  // Create a payment order
  createPaymentOrder: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        amount, 
        currency = 'INR', 
        payment_type, 
        reference_id, 
        reference_type,
        description 
      } = req.body;

      if (!amount || !payment_type || !reference_id || !reference_type) {
        return res.status(400).json({
          success: false,
          message: 'Amount, payment type, reference ID, and reference type are required'
        });
      }

      // Validate payment type
      const validPaymentTypes = ['booking', 'donation', 'store_order', 'event_registration'];
      if (!validPaymentTypes.includes(payment_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment type'
        });
      }

      // Validate reference type
      const validReferenceTypes = ['booking', 'temple', 'store_order', 'event'];
      if (!validReferenceTypes.includes(reference_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference type'
        });
      }

      // Generate order ID
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const insertQuery = `
        INSERT INTO payment_transactions (
          user_id, order_id, amount, currency, payment_type, 
          reference_id, reference_type, description, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        userId, orderId, amount, currency, payment_type,
        reference_id, reference_type, description
      ]);

      res.status(201).json({
        success: true,
        message: 'Payment order created successfully',
        data: {
          ...result.rows[0],
          // In a real implementation, you would integrate with payment gateway here
          payment_url: `https://payment-gateway.example.com/pay/${orderId}`
        }
      });
    } catch (error) {
      console.error('Error creating payment order:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update payment status (webhook endpoint)
  updatePaymentStatus: async (req, res) => {
    try {
      const { order_id, status, transaction_id, gateway_response } = req.body;

      if (!order_id || !status) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and status are required'
        });
      }

      // Validate status
      const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment status'
        });
      }

      // Check if payment exists
      const checkQuery = 'SELECT * FROM payment_transactions WHERE order_id = $1';
      const checkResult = await db.query(checkQuery, [order_id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment order not found'
        });
      }

      const payment = checkResult.rows[0];

      // Update payment status
      const updateQuery = `
        UPDATE payment_transactions 
        SET status = $1, transaction_id = $2, gateway_response = $3, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $4
        RETURNING *
      `;

      const result = await db.query(updateQuery, [
        status, transaction_id, JSON.stringify(gateway_response), order_id
      ]);

      // Handle post-payment actions based on payment type and status
      if (status === 'completed') {
        await handleSuccessfulPayment(payment);
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get payment by order ID
  getPaymentByOrderId: async (req, res) => {
    try {
      const { order_id } = req.params;
      const userId = req.user.id;

      const query = `
        SELECT pt.*, u.name as user_name, u.email as user_email
        FROM payment_transactions pt
        JOIN users u ON pt.user_id = u.id
        WHERE pt.order_id = $1 AND pt.user_id = $2
      `;

      const result = await db.query(query, [order_id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's payment history
  getUserPayments: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        status, 
        payment_type, 
        start_date, 
        end_date, 
        limit = 20, 
        offset = 0 
      } = req.query;

      let query = `
        SELECT pt.*, 
               CASE 
                 WHEN pt.reference_type = 'temple' THEN t.name
                 WHEN pt.reference_type = 'booking' THEN CONCAT('Booking #', b.id)
                 WHEN pt.reference_type = 'event' THEN e.title
                 ELSE 'Store Order'
               END as reference_name
        FROM payment_transactions pt
        LEFT JOIN temples t ON pt.reference_type = 'temple' AND pt.reference_id::text = t.id::text
        LEFT JOIN bookings b ON pt.reference_type = 'booking' AND pt.reference_id::text = b.id::text
        LEFT JOIN events e ON pt.reference_type = 'event' AND pt.reference_id::text = e.id::text
        WHERE pt.user_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND pt.status = $${paramCount}`;
        params.push(status);
      }

      if (payment_type) {
        paramCount++;
        query += ` AND pt.payment_type = $${paramCount}`;
        params.push(payment_type);
      }

      if (start_date) {
        paramCount++;
        query += ` AND pt.created_at >= $${paramCount}`;
        params.push(start_date);
      }

      if (end_date) {
        paramCount++;
        query += ` AND pt.created_at <= $${paramCount}`;
        params.push(end_date);
      }

      query += ` ORDER BY pt.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await db.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM payment_transactions pt
        WHERE pt.user_id = $1
      `;
      const countParams = [userId];
      let countParamCount = 1;

      if (status) {
        countParamCount++;
        countQuery += ` AND pt.status = $${countParamCount}`;
        countParams.push(status);
      }

      if (payment_type) {
        countParamCount++;
        countQuery += ` AND pt.payment_type = $${countParamCount}`;
        countParams.push(payment_type);
      }

      if (start_date) {
        countParamCount++;
        countQuery += ` AND pt.created_at >= $${countParamCount}`;
        countParams.push(start_date);
      }

      if (end_date) {
        countParamCount++;
        countQuery += ` AND pt.created_at <= $${countParamCount}`;
        countParams.push(end_date);
      }

      const countResult = await db.query(countQuery, countParams);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(countResult.rows[0].total)
        }
      });
    } catch (error) {
      console.error('Error fetching user payments:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get payment statistics for user
  getUserPaymentStats: async (req, res) => {
    try {
      const userId = req.user.id;
      const { year = new Date().getFullYear() } = req.query;

      const query = `
        SELECT 
          payment_type,
          status,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as average_amount
        FROM payment_transactions
        WHERE user_id = $1 
          AND EXTRACT(YEAR FROM created_at) = $2
        GROUP BY payment_type, status
        ORDER BY payment_type, status
      `;

      const result = await db.query(query, [userId, year]);

      // Get monthly breakdown
      const monthlyQuery = `
        SELECT 
          EXTRACT(MONTH FROM created_at) as month,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM payment_transactions
        WHERE user_id = $1 
          AND EXTRACT(YEAR FROM created_at) = $2
          AND status = 'completed'
        GROUP BY EXTRACT(MONTH FROM created_at)
        ORDER BY month
      `;

      const monthlyResult = await db.query(monthlyQuery, [userId, year]);

      res.json({
        success: true,
        data: {
          by_type_and_status: result.rows,
          monthly_breakdown: monthlyResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Initiate refund
  initiateRefund: async (req, res) => {
    try {
      const { order_id } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      // Check if payment exists and belongs to user
      const checkQuery = `
        SELECT * FROM payment_transactions 
        WHERE order_id = $1 AND user_id = $2 AND status = 'completed'
      `;
      const checkResult = await db.query(checkQuery, [order_id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found or not eligible for refund'
        });
      }

      const payment = checkResult.rows[0];

      // Check if refund is allowed based on payment type and timing
      const isRefundAllowed = await checkRefundEligibility(payment);
      if (!isRefundAllowed.allowed) {
        return res.status(400).json({
          success: false,
          message: isRefundAllowed.reason
        });
      }

      // Update payment status to refund requested
      const updateQuery = `
        UPDATE payment_transactions 
        SET status = 'refund_requested', 
            gateway_response = jsonb_set(
              COALESCE(gateway_response, '{}'), 
              '{refund_reason}', 
              $1
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $2
        RETURNING *
      `;

      const result = await db.query(updateQuery, [JSON.stringify(reason), order_id]);

      res.json({
        success: true,
        message: 'Refund request initiated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error initiating refund:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get payment methods (for future implementation)
  getPaymentMethods: async (req, res) => {
    try {
      // This would typically fetch from a configuration or payment gateway
      const paymentMethods = [
        {
          id: 'card',
          name: 'Credit/Debit Card',
          description: 'Pay using your credit or debit card',
          enabled: true,
          fees: 2.5 // percentage
        },
        {
          id: 'upi',
          name: 'UPI',
          description: 'Pay using UPI apps like GPay, PhonePe, Paytm',
          enabled: true,
          fees: 0
        },
        {
          id: 'netbanking',
          name: 'Net Banking',
          description: 'Pay using your bank account',
          enabled: true,
          fees: 1.5
        },
        {
          id: 'wallet',
          name: 'Digital Wallet',
          description: 'Pay using digital wallets',
          enabled: true,
          fees: 1.0
        }
      ];

      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

// Helper function to handle successful payment actions
async function handleSuccessfulPayment(payment) {
  try {
    switch (payment.payment_type) {
      case 'booking':
        // Update booking status to confirmed
        await db.query(
          'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['confirmed', payment.reference_id]
        );
        break;
      
      case 'store_order':
        // Update store order status to paid
        await db.query(
          'UPDATE store_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['paid', payment.reference_id]
        );
        break;
      
      case 'event_registration':
        // Update event registration status to confirmed
        await db.query(
          'UPDATE event_registrations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['confirmed', payment.reference_id]
        );
        break;
      
      default:
        // For donations, no additional action needed
        break;
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Helper function to check refund eligibility
async function checkRefundEligibility(payment) {
  const now = new Date();
  const paymentDate = new Date(payment.created_at);
  const hoursSincePayment = (now - paymentDate) / (1000 * 60 * 60);

  switch (payment.payment_type) {
    case 'booking':
      // Check if booking is in the future
      const bookingQuery = 'SELECT booking_date FROM bookings WHERE id = $1';
      const bookingResult = await db.query(bookingQuery, [payment.reference_id]);
      
      if (bookingResult.rows.length > 0) {
        const bookingDate = new Date(bookingResult.rows[0].booking_date);
        if (bookingDate > now) {
          return { allowed: true };
        } else {
          return { allowed: false, reason: 'Cannot refund past bookings' };
        }
      }
      break;
    
    case 'event_registration':
      // Check if event is in the future
      const eventQuery = 'SELECT start_date FROM events WHERE id = $1';
      const eventResult = await db.query(eventQuery, [payment.reference_id]);
      
      if (eventResult.rows.length > 0) {
        const eventDate = new Date(eventResult.rows[0].start_date);
        if (eventDate > now) {
          return { allowed: true };
        } else {
          return { allowed: false, reason: 'Cannot refund past events' };
        }
      }
      break;
    
    case 'store_order':
      // Allow refund within 24 hours for store orders
      if (hoursSincePayment <= 24) {
        return { allowed: true };
      } else {
        return { allowed: false, reason: 'Refund window expired for store orders' };
      }
    
    case 'donation':
      // Donations are generally non-refundable
      return { allowed: false, reason: 'Donations are non-refundable' };
    
    default:
      return { allowed: false, reason: 'Refund not supported for this payment type' };
  }

  return { allowed: false, reason: 'Refund not allowed' };
}

module.exports = paymentsController;