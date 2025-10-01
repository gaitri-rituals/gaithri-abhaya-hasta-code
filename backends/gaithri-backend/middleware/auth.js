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

      // Get admin user from the token
      const adminQuery = `
        SELECT 
          au.id, au.name, au.email, au.role, au.temple_id,
          au.permissions, au.is_active
        FROM admin_users au
        WHERE au.id = $1 AND au.is_active = true
      `;

      const admins = await sequelize.query(adminQuery, {
        bind: [decoded.userId],
        type: QueryTypes.SELECT
      });

      if (admins.length === 0) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      req.user = admins[0];
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
