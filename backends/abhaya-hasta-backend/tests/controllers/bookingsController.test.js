import { jest } from '@jest/globals';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking
} from '../../controllers/bookingsController.js';
import * as dbHelpers from '../../utils/dbHelpers.js';

// Mock the database helpers
jest.mock('../../utils/dbHelpers.js');

describe('Bookings Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 1 }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    beforeEach(() => {
      req.body = {
        temple_id: 1,
        service_id: 1,
        booking_date: '2024-03-20',
        booking_time: '10:00:00',
        notes: 'Test booking'
      };
    });

    it('should create a new booking successfully', async () => {
      const mockTemple = [{ id: 1, name: 'Temple 1', status: 'active' }];
      const mockService = [{ id: 1, name: 'Service 1', price: 100, status: 'active' }];
      const mockBooking = [{ id: 1, ...req.body }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockTemple)
        .mockResolvedValueOnce(mockService)
        .mockResolvedValueOnce([]) // No conflicting bookings
        .mockResolvedValueOnce(mockBooking);

      await createBooking(req, res);

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Booking created successfully',
        data: expect.any(Object)
      }));
    });

    it('should handle non-existent temple', async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce([]);

      await createBooking(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Temple not found'
      }));
    });

    it('should handle non-existent service', async () => {
      const mockTemple = [{ id: 1, name: 'Temple 1', status: 'active' }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockTemple)
        .mockResolvedValueOnce([]);

      await createBooking(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Service not found'
      }));
    });

    it('should handle booking time conflicts', async () => {
      const mockTemple = [{ id: 1, name: 'Temple 1', status: 'active' }];
      const mockService = [{ id: 1, name: 'Service 1', price: 100, status: 'active' }];
      const mockConflict = [{ id: 2 }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockTemple)
        .mockResolvedValueOnce(mockService)
        .mockResolvedValueOnce(mockConflict);

      await createBooking(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Selected time slot is not available'
      }));
    });
  });

  describe('getUserBookings', () => {
    it('should return user bookings with pagination', async () => {
      const mockBookings = [
        { id: 1, temple_name: 'Temple 1', service_name: 'Service 1' }
      ];
      const mockCount = [{ total: '1' }];

      dbHelpers.buildPagination.mockReturnValue({ page: 1, limit: 10, offset: 0 });
      dbHelpers.buildWhereClause.mockReturnValue({ whereClause: 'user_id = $1', bindings: [1] });
      dbHelpers.validateSort.mockReturnValue({ sortBy: 'created_at', sortOrder: 'DESC' });
      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockBookings)
        .mockResolvedValueOnce(mockCount);
      dbHelpers.formatPaginatedResponse.mockReturnValue({
        success: true,
        data: {
          records: mockBookings,
          pagination: { page: 1, limit: 10, total: 1, pages: 1 }
        }
      });

      await getUserBookings(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });
  });

  describe('getBookingById', () => {
    beforeEach(() => {
      req.params.id = '1';
    });

    it('should return booking details', async () => {
      const mockBooking = [{
        id: 1,
        temple_name: 'Temple 1',
        service_name: 'Service 1',
        user_id: 1
      }];

      dbHelpers.executeQuery.mockResolvedValue(mockBooking);

      await getBookingById(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Object)
      }));
    });

    it('should handle non-existent booking', async () => {
      dbHelpers.executeQuery.mockResolvedValue([]);

      await getBookingById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Booking not found'
      }));
    });

    it('should handle unauthorized access', async () => {
      const mockBooking = [{
        id: 1,
        temple_name: 'Temple 1',
        service_name: 'Service 1',
        user_id: 2
      }];

      dbHelpers.executeQuery.mockResolvedValue(mockBooking);

      await getBookingById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Unauthorized access to booking'
      }));
    });
  });

  describe('cancelBooking', () => {
    beforeEach(() => {
      req.params.id = '1';
    });

    it('should cancel booking successfully', async () => {
      const mockBooking = [{
        id: 1,
        user_id: 1,
        booking_status: 'confirmed',
        booking_date: '2024-03-20',
        booking_time: '10:00:00'
      }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce([]);

      await cancelBooking(req, res);

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Booking cancelled successfully'
      }));
    });

    it('should handle non-existent booking', async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce([]);

      await cancelBooking(req, res);

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
        booking_status: 'confirmed',
        booking_date: '2024-03-20',
        booking_time: '10:00:00'
      }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce(mockBooking);

      await cancelBooking(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Unauthorized access to booking'
      }));
    });
  });

  describe('rescheduleBooking', () => {
    beforeEach(() => {
      req.params.id = '1';
      req.body = {
        booking_date: '2024-03-21',
        booking_time: '11:00:00'
      };
    });

    it('should reschedule booking successfully', async () => {
      const mockBooking = [{
        id: 1,
        user_id: 1,
        booking_status: 'confirmed',
        temple_id: 1,
        service_id: 1
      }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce([]) // No conflicting bookings
        .mockResolvedValueOnce([]);

      await rescheduleBooking(req, res);

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Booking rescheduled successfully'
      }));
    });

    it('should handle non-existent booking', async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce([]);

      await rescheduleBooking(req, res);

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
        booking_status: 'confirmed',
        temple_id: 1,
        service_id: 1
      }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery.mockResolvedValueOnce(mockBooking);

      await rescheduleBooking(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Unauthorized access to booking'
      }));
    });

    it('should handle booking time conflicts', async () => {
      const mockBooking = [{
        id: 1,
        user_id: 1,
        booking_status: 'confirmed',
        temple_id: 1,
        service_id: 1
      }];
      const mockConflict = [{ id: 2 }];
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

      dbHelpers.startTransaction.mockResolvedValue(mockTransaction);
      dbHelpers.executeQuery
        .mockResolvedValueOnce(mockBooking)
        .mockResolvedValueOnce(mockConflict);

      await rescheduleBooking(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Selected time slot is not available'
      }));
    });
  });
});