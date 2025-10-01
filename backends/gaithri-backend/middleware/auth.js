import jwt from 'jsonwebtoken';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

// Protect routes - authentication required
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gaithri_admin_secret_key_2024');

      let user = null;

      // Check user type from token and query appropriate table
      if (decoded.userType === 'admin') {
        const adminQuery = `
          SELECT 
            au.id, au.name, au.email, au.role, au.temple_id,
            au.permissions, au.is_active, 'admin' as user_type
          FROM admin_users au
          WHERE au.id = $1 AND au.is_active = true
        `;
        const admins = await sequelize.query(adminQuery, {
          bind: [decoded.userId],
          type: QueryTypes.SELECT
        });
        user = admins[0];
      } else if (decoded.userType === 'temple') {
        const templeQuery = `
          SELECT 
            tu.id, tu.name, tu.email, tu.role, tu.temple_id,
            tu.permissions, tu.is_active, 'temple' as user_type
          FROM temple_users tu
          WHERE tu.id = $1 AND tu.is_active = true
        `;
        const templeUsers = await sequelize.query(templeQuery, {
          bind: [decoded.userId],
          type: QueryTypes.SELECT
        });
        user = templeUsers[0];
      } else if (decoded.userType === 'vendor') {
        const vendorQuery = `
          SELECT 
            vu.id, vu.name, vu.email, vu.role, vu.vendor_id,
            vu.permissions, vu.is_active, 'vendor' as user_type
          FROM vendor_users vu
          WHERE vu.id = $1 AND vu.is_active = true
        `;
        const vendorUsers = await sequelize.query(vendorQuery, {
          bind: [decoded.userId],
          type: QueryTypes.SELECT
        });
        user = vendorUsers[0];
      }

      if (!user) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Check if user has specific permission
export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${permission}` 
      });
    }

    next();
  };
};

// Check if user has specific role
export const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

// Check if user belongs to temple or is super admin
export const belongsToTemple = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Support multiple param/body shapes: /temples/:id, /temples/:templeId, and body.templeId
  const templeId =
    (req.params && (req.params.id || req.params.templeId)) ||
    (req.body && (req.body.templeId || req.body.temple_id));

  if (req.user.role === 'super_admin') {
    return next();
  }

  if (!req.user.temple_id || req.user.temple_id.toString() !== String(templeId)) {
    return res.status(403).json({
      message: 'Access denied. You do not belong to this temple'
    });
  }

  next();
};
