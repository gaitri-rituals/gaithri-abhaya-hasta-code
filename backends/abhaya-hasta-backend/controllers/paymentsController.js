const Razorpay = require('razorpay');
const crypto = require('crypto');
const { executeQuery, startTransaction, commitTransaction, rollbackTransaction, handleDatabaseError } = require('../utils/dbHelpers.js');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (req, res) => {
  const client = await startTransaction();
  try {
    const { amount, currency = 'INR', receipt = undefined } = req.body;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt,
      payment_capture: 1
    });

    // Store order details in database
    await executeQuery(
      `INSERT INTO payment_orders (
        order_id, user_id, amount, currency, receipt, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      {
        bindings: [
          order.id,
          req.user.id,
          amount,
          currency,
          receipt,
          order.status
        ],
        client
      }
    );

    await commitTransaction(client);
    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        order_id: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (error) {
    await rollbackTransaction(client);
    const errorResponse = handleDatabaseError(error, 'create payment order');
    res.status(errorResponse.status).json(errorResponse);
  }
};

const verifyPayment = async (req, res) => {
  const client = await startTransaction();
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await rollbackTransaction(client);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update payment status in database
    await executeQuery(
      `UPDATE payment_orders 
       SET payment_id = $1, 
           status = 'paid', 
           updated_at = CURRENT_TIMESTAMP 
       WHERE order_id = $2`,
      {
        bindings: [razorpay_payment_id, razorpay_order_id],
        client
      }
    );

    await commitTransaction(client);
    res.json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    await rollbackTransaction(client);
    const errorResponse = handleDatabaseError(error, 'verify payment');
    res.status(errorResponse.status).json(errorResponse);
  }
};

const getPaymentHistory = async (req, res) => {
  const client = await startTransaction();
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get total count
    const [{ count }] = await executeQuery(
      'SELECT COUNT(*) FROM payment_orders WHERE user_id = $1',
      {
        bindings: [req.user.id],
        client
      }
    );

    // Get paginated results
    const payments = await executeQuery(
      `SELECT order_id, payment_id, amount, currency, receipt, status, created_at 
       FROM payment_orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      {
        bindings: [req.user.id, limit, offset],
        client
      }
    );

    await commitTransaction(client);
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(count),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    await rollbackTransaction(client);
    const errorResponse = handleDatabaseError(error, 'get payment history');
    res.status(errorResponse.status).json(errorResponse);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory
};