import { jest } from '@jest/globals';
import {
  validateDashboardQuery,
  validateTempleQuery,
  validateTempleStatusUpdate,
  validateUserQuery,
  validateBookingQuery,
  checkValidation
} from '../../middleware/adminValidation.js';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('Admin Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkValidation', () => {
    it('should call next() when no validation errors', () => {
      validationResult.mockReturnValue({
        isEmpty: () => true
      });

      checkValidation(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should return validation errors when present', () => {
      const mockErrors = {
        array: () => [
          { param: 'status', msg: 'Invalid status' }
        ]
      };
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: mockErrors.array
      });

      checkValidation(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        errors: mockErrors.array()
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateDashboardQuery', () => {
    it('should validate start_date and end_date', async () => {
      req.query = {
        start_date: '2024-03-01',
        end_date: '2024-03-31'
      };

      // Run all validation middleware
      await Promise.all(validateDashboardQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });

    it('should validate optional parameters', async () => {
      req.query = {};

      // Run all validation middleware
      await Promise.all(validateDashboardQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });
  });

  describe('validateTempleQuery', () => {
    it('should validate search parameters', async () => {
      req.query = {
        search: 'temple',
        status: 'active',
        page: '1',
        limit: '10',
        sort_by: 'name',
        sort_order: 'asc'
      };

      // Run all validation middleware
      await Promise.all(validateTempleQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });

    it('should validate optional parameters', async () => {
      req.query = {};

      // Run all validation middleware
      await Promise.all(validateTempleQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });
  });

  describe('validateTempleStatusUpdate', () => {
    it('should validate temple status update', async () => {
      req.params = { id: '1' };
      req.body = { status: 'inactive' };

      // Run all validation middleware
      await Promise.all(validateTempleStatusUpdate.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });

    it('should validate temple ID', async () => {
      req.params = { id: 'invalid' };
      req.body = { status: 'inactive' };

      // Run all validation middleware
      await Promise.all(validateTempleStatusUpdate.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeFalsy();
    });

    it('should validate status value', async () => {
      req.params = { id: '1' };
      req.body = { status: 'invalid' };

      // Run all validation middleware
      await Promise.all(validateTempleStatusUpdate.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeFalsy();
    });
  });

  describe('validateUserQuery', () => {
    it('should validate search parameters', async () => {
      req.query = {
        search: 'user',
        role: 'user',
        page: '1',
        limit: '10',
        sort_by: 'name',
        sort_order: 'asc'
      };

      // Run all validation middleware
      await Promise.all(validateUserQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });

    it('should validate optional parameters', async () => {
      req.query = {};

      // Run all validation middleware
      await Promise.all(validateUserQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });

    it('should validate role values', async () => {
      req.query = { role: 'invalid' };

      // Run all validation middleware
      await Promise.all(validateUserQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeFalsy();
    });
  });

  describe('validateBookingQuery', () => {
    it('should validate search parameters', async () => {
      req.query = {
        search: 'booking',
        status: 'confirmed',
        start_date: '2024-03-01',
        end_date: '2024-03-31',
        page: '1',
        limit: '10',
        sort_by: 'created_at',
        sort_order: 'desc'
      };

      // Run all validation middleware
      await Promise.all(validateBookingQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });

    it('should validate optional parameters', async () => {
      req.query = {};

      // Run all validation middleware
      await Promise.all(validateBookingQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeTruthy();
    });

    it('should validate status values', async () => {
      req.query = { status: 'invalid' };

      // Run all validation middleware
      await Promise.all(validateBookingQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeFalsy();
    });

    it('should validate date range', async () => {
      req.query = {
        start_date: '2024-03-31',
        end_date: '2024-03-01'
      };

      // Run all validation middleware
      await Promise.all(validateBookingQuery.map(validation => validation.run(req)));

      expect(validationResult(req).isEmpty()).toBeFalsy();
    });
  });
});