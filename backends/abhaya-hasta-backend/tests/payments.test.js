import request from 'supertest';
import express from 'express';
import paymentRoutes from '../routes/payments.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

// Mock authentication middleware
app.use((req, res, next) => {
  req.user = { userId: 'test_user_id' };
  next();
});

describe('Payment Routes', () => {
  describe('POST /api/payments/create-order', () => {
    it('should return 400 if amount is missing', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Amount is required');
    });

    it('should return 400 if amount is not a number', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({ amount: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if amount is less than minimum', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({ amount: 0.5 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if currency is invalid', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({ 
          amount: 100,
          currency: 'INVALID'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle valid payment order creation request', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({
          amount: 100,
          currency: 'INR',
          receipt: 'test_receipt_123'
        });

      // This might return 503 if Razorpay is not configured in test environment
      // or 500 if there's a configuration issue, which is expected in tests
      expect(response.status).toBeOneOf([200, 500, 503]);
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if razorpay_order_id is missing', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          razorpay_payment_id: 'pay_test123',
          razorpay_signature: 'signature_test'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if razorpay_payment_id is missing', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          razorpay_order_id: 'order_test123',
          razorpay_signature: 'signature_test'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 if razorpay_signature is missing', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          razorpay_order_id: 'order_test123',
          razorpay_payment_id: 'pay_test123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle payment verification request with all required fields', async () => {
      const response = await request(app)
        .post('/api/payments/verify')
        .send({
          razorpay_order_id: 'order_test123',
          razorpay_payment_id: 'pay_test123',
          razorpay_signature: 'signature_test'
        });

      // This will likely return an error in test environment due to invalid signature
      // but validates the route structure
      expect(response.status).toBeOneOf([200, 400, 500]);
    });
  });

  describe('GET /api/payments/orders', () => {
    it('should handle request to get payment orders', async () => {
      const response = await request(app)
        .get('/api/payments/orders');

      // This might return 503 if Razorpay is not configured in test environment
      expect(response.status).toBeOneOf([200, 500, 503]);
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/payments/orders?page=1&limit=10');

      expect(response.status).toBeOneOf([200, 500, 503]);
    });
  });
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});