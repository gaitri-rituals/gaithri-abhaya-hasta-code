import jwt from 'jsonwebtoken';
import { protect, optionalAuth } from '../middleware/auth.js';

// Mock request and response objects
const mockRequest = (headers = {}) => ({
  headers,
  user: null
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
  });

  describe('protect middleware', () => {
    it('should return 401 if no token is provided', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.',
        errorCode: 'NO_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token format is invalid', async () => {
      const req = mockRequest({
        authorization: 'InvalidTokenFormat'
      });
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token format.',
        errorCode: 'INVALID_TOKEN_FORMAT'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      const req = mockRequest({
        authorization: 'Bearer invalid_token'
      });
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token.',
        errorCode: 'INVALID_TOKEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: '123', type: 'access' },
        'test_secret',
        { expiresIn: '-1h' }
      );

      const req = mockRequest({
        authorization: `Bearer ${expiredToken}`
      });
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Token has expired.',
        errorCode: 'TOKEN_EXPIRED'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for non-access token type', async () => {
      const refreshToken = jwt.sign(
        { userId: '123', type: 'refresh' },
        'test_secret',
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        authorization: `Bearer ${refreshToken}`
      });
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token type.',
        errorCode: 'INVALID_TOKEN_TYPE'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() for valid access token', async () => {
      const validToken = jwt.sign(
        { userId: '123', type: 'access' },
        'test_secret',
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        authorization: `Bearer ${validToken}`
      });
      const res = mockResponse();

      await protect(req, res, mockNext);

      expect(req.user).toEqual({ userId: '123', type: 'access' });
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should call next() when no token is provided', async () => {
      const req = mockRequest();
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() and set user for valid token', async () => {
      const validToken = jwt.sign(
        { userId: '123', type: 'access' },
        'test_secret',
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        authorization: `Bearer ${validToken}`
      });
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toEqual({ userId: '123', type: 'access' });
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() with null user for invalid token', async () => {
      const req = mockRequest({
        authorization: 'Bearer invalid_token'
      });
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeNull();
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});