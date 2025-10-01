import { jest } from '@jest/globals';
import { protect, authorize } from '../../middleware/auth.js';
import jwt from 'jsonwebtoken';
import * as dbHelpers from '../../utils/dbHelpers.js';

// Mock jwt and database helpers
jest.mock('jsonwebtoken');
jest.mock('../../utils/dbHelpers.js');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {}
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

  describe('protect', () => {
    it('should authenticate user with valid token in Authorization header', async () => {
      const mockUser = [{
        id: 1,
        email: 'test@example.com',
        role: 'user'
      }];
      const mockDecodedToken = { id: 1 };

      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockReturnValue(mockDecodedToken);
      dbHelpers.executeQuery.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
      expect(dbHelpers.executeQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('SELECT id, email, role FROM users WHERE id = $1'),
        values: [1]
      });
      expect(req.user).toEqual(mockUser[0]);
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate user with valid token in cookie', async () => {
      const mockUser = [{
        id: 1,
        email: 'test@example.com',
        role: 'user'
      }];
      const mockDecodedToken = { id: 1 };

      req.cookies.token = 'valid_token';
      jwt.verify.mockReturnValue(mockDecodedToken);
      dbHelpers.executeQuery.mockResolvedValue(mockUser);

      await protect(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
      expect(dbHelpers.executeQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('SELECT id, email, role FROM users WHERE id = $1'),
        values: [1]
      });
      expect(req.user).toEqual(mockUser[0]);
      expect(next).toHaveBeenCalled();
    });

    it('should return error if no token is provided', async () => {
      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return error for invalid token', async () => {
      req.headers.authorization = 'Bearer invalid_token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return error if user not found', async () => {
      const mockDecodedToken = { id: 1 };

      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockReturnValue(mockDecodedToken);
      dbHelpers.executeQuery.mockResolvedValue([]);

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User no longer exists'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      req.user = {
        id: 1,
        email: 'test@example.com',
        role: 'user'
      };
    });

    it('should authorize user with correct role', () => {
      const authorizeMiddleware = authorize('user', 'admin');
      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should not authorize user with incorrect role', () => {
      const authorizeMiddleware = authorize('admin');
      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle multiple allowed roles', () => {
      req.user.role = 'admin';
      const authorizeMiddleware = authorize('user', 'admin', 'superadmin');
      authorizeMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle case when user has no role', () => {
      delete req.user.role;
      const authorizeMiddleware = authorize('user');
      authorizeMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});