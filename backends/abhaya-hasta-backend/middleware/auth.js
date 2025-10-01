const jwt = require('jsonwebtoken');
const { executeQuery } = require('../utils/dbHelpers.js');
const { QueryTypes } = require('sequelize');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = null;

      // Check user type from token and query appropriate table
      if (decoded.userType === 'admin') {
        const adminUsers = await executeQuery(
          'SELECT id, name, email, role, temple_id, is_active FROM admin_users WHERE id = $1 AND is_active = true',
          { bindings: [decoded.userId] }
        );
        if (adminUsers.length) {
          user = { ...adminUsers[0], user_type: 'admin' };
        }
      } else if (decoded.userType === 'temple') {
        const templeUsers = await executeQuery(
          'SELECT id, name, email, role, temple_id, is_active FROM temple_users WHERE id = $1 AND is_active = true',
          { bindings: [decoded.userId] }
        );
        if (templeUsers.length) {
          user = { ...templeUsers[0], user_type: 'temple' };
        }
      } else if (decoded.userType === 'vendor') {
        const vendorUsers = await executeQuery(
          'SELECT id, name, email, role, vendor_id, is_active FROM vendor_users WHERE id = $1 AND is_active = true',
          { bindings: [decoded.userId] }
        );
        if (vendorUsers.length) {
          user = { ...vendorUsers[0], user_type: 'vendor' };
        }
      } else {
        // Fallback to regular users table for frontend users
        const users = await executeQuery(
          'SELECT id, name, phone, email, role FROM users WHERE id = $1',
          { bindings: [decoded.userId] }
        );
        if (users.length) {
          user = { ...users[0], user_type: 'user' };
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in auth middleware'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user = null;

      // Check user type from token and query appropriate table
      if (decoded.userType === 'admin') {
        const adminUsers = await executeQuery(
          'SELECT id, name, email, role, temple_id, is_active FROM admin_users WHERE id = $1 AND is_active = true',
          { bindings: [decoded.userId] }
        );
        if (adminUsers.length) {
          user = { ...adminUsers[0], user_type: 'admin' };
        }
      } else if (decoded.userType === 'temple') {
        const templeUsers = await executeQuery(
          'SELECT id, name, email, role, temple_id, is_active FROM temple_users WHERE id = $1 AND is_active = true',
          { bindings: [decoded.userId] }
        );
        if (templeUsers.length) {
          user = { ...templeUsers[0], user_type: 'temple' };
        }
      } else if (decoded.userType === 'vendor') {
        const vendorUsers = await executeQuery(
          'SELECT id, name, email, role, vendor_id, is_active FROM vendor_users WHERE id = $1 AND is_active = true',
          { bindings: [decoded.userId] }
        );
        if (vendorUsers.length) {
          user = { ...vendorUsers[0], user_type: 'vendor' };
        }
      } else {
        // Fallback to regular users table for frontend users
        const users = await executeQuery(
          'SELECT id, name, phone, email, role FROM users WHERE id = $1',
          { bindings: [decoded.userId] }
        );
        if (users.length) {
          user = { ...users[0], user_type: 'user' };
        }
      }

      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Invalid token, but continue without user
      console.warn('Invalid token in optional auth:', error);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};
