import { jest } from '@jest/globals';
import {
  createOrder,
  verifyPayment,
  getPaymentHistory
} from '../../controllers/paymentsController.js';
import * as dbHelpers from '../../utils/dbHelpers.js';
import Razorpay from 'razorpay';

// Mock the database helpers and Razorpay
jest.mock('../../utils/dbHelpers.js');
jest.mock('razorpay');

describe('Payments Controller', () => {
  let req;
  let res;
  let mockRazorpayInstance;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      user: { id: 1 }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Setup Razorpay mock
    mockRazorpayInstance = {
      orders: {
        create: jest.fn()
      },
      payments: {
        fetch: jest.fn()
      }
    };
    Razorpay.mockImplementation(() => mockRazorpayInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    beforeEach(() => {
      req.body = {
        booking_id: 1,
        amount: 1000,
        currency: 'INR'
      };
    });

    it('should create a Razorpay order successfully', async () => {
      const mockBooking = [{
        id: 1,
        user_id: 1,
        booking_status: 'pending',
        amount: 1000
      }];
      const mockOrder = {
        id: 'order_123',
        amount: 1000,
        currency: 'INR'
      };
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce(mockBooking);
      mockRazorpayInstance.orders.create.mockResolvedValue(mockOrder);

      await createOrder(req, res);

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          order_id: mockOrder.id
        })
      }));
    });

    it('should handle non-existent booking', async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce([]);

      await createOrder(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Booking not found'
      }));
    });

    it('should handle unauthorized access', async () => {
      const mockBooking = [{
        id: 1,
        user_id: 2,
        booking_status: 'pending',
        amount: 1000
      }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce(mockBooking);

      await createOrder(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Unauthorized access to booking'
      }));
    });

    it('should handle Razorpay errors', async () => {
      const mockBooking = [{
        id: 1,
        user_id: 1,
        booking_status: 'pending',
        amount: 1000
      }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      const razorpayError = new Error('Razorpay API error');

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce(mockBooking);
      mockRazorpayInstance.orders.create.mockRejectedValue(razorpayError);

      await createOrder(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error creating Razorpay order'
      }));
    });
  });

  describe('verifyPayment', () => {
    beforeEach(() => {
      req.body = {
        razorpay_order_id: 'order_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_signature'
      };
    });

    it('should verify payment successfully', async () => {
      const mockPayment = {
        id: 'pay_123',
        order_id: 'order_123',
        status: 'captured',
        amount: 1000
      };
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockPayment);
      dbHelpers.executeQuery
        .mockResolvedValueOnce([{ booking_id: 1 }]) // Get order details
        .mockResolvedValueOnce([]) // Update payment status
        .mockResolvedValueOnce([]); // Update booking status

      await verifyPayment(req, res);

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Payment verified successfully'
      }));
    });

    it('should handle invalid payment verification', async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      const razorpayError = new Error('Invalid signature');

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      mockRazorpayInstance.payments.fetch.mockRejectedValue(razorpayError);

      await verifyPayment(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Payment verification failed'
      }));
    });

    it('should handle non-existent order', async () => {
      const mockPayment = {
        id: 'pay_123',
        order_id: 'order_123',
        status: 'captured',
        amount: 1000
      };
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockPayment);
      dbHelpers.executeQuery.mockResolvedValueOnce([]); // No order found

      await verifyPayment(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Order not found'
      }));
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history with pagination', async () => {
      const mockPayments = [
        {
          id: 1,
          razorpay_order_id: 'order_123',
          razorpay_payment_id: 'pay_123',
          amount: 1000,
          status: 'success'
        }
      ];
      const mockCount = [{ total: '1' }];

      dbHelpers.buildPagination.mockReturnValue({ page: 1, limit: 10, offset: 0 });
      dbHelpers.buildWhereClause.mockReturnValue({ whereClause: 'user_id = $1', bindings: [1] });
      dbHelpers.validateSort.mockReturnValue({ sortBy: 'created_at', sortOrder: 'DESC' });
      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockPayments)
        .mockResolvedValueOnce(mockCount);
      dbHelpers.formatPaginatedResponse.mockReturnValue({
        success: true,
        data: {
          records: mockPayments,
          pagination: { page: 1, limit: 10, total: 1, pages: 1 }
        }
      });

      await getPaymentHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      dbHelpers.executeQuery.mockRejectedValue(error);
      dbHelpers.handleDatabaseError.mockReturnValue({
        status: 500,
        success: false,
        message: 'Error fetching payment history',
        error: error.message
      });

      await getPaymentHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: error.message
      }));
    });
  });
});