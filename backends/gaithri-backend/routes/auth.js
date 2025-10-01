import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Generate JWT Token
const generateToken = (userId, role, temple_id = null) => {
  return jwt.sign(
    { userId, role, temple_id },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @route   POST /api/auth/login
// @desc    Login temple admin/staff
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find admin user
    const adminQuery = `
      SELECT 
        au.*,
        t.name as temple_name,
        t.city as temple_city
      FROM admin_users au
      LEFT JOIN temples t ON au.temple_id = t.id
      WHERE au.email = $1 AND au.is_active = true
    `;

    const admins = await sequelize.query(adminQuery, {
      bind: [email],
      type: QueryTypes.SELECT
    });

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = admins[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await sequelize.query(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      {
        bind: [admin.id],
        type: QueryTypes.UPDATE
      }
    );

    const token = generateToken(admin.id, admin.role, admin.temple_id);

    // Remove password from response
    const { password_hash, reset_password_token, reset_password_expire, ...safeAdmin } = admin;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeAdmin,
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// @route   POST /api/auth/create-admin
// @desc    Create new temple admin (Super Admin only)
// @access  Private (Super Admin)
router.post('/create-admin', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').trim().isLength({ min: 6 }).withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['super_admin', 'temple_admin', 'staff', 'vendor']).withMessage('Valid role required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, phone, password, role, temple_id } = req.body;

    // Check if username already exists
    const existing = await sequelize.query(
      'SELECT id FROM admin_users WHERE email = $1',
      {
        bind: [email],
        type: QueryTypes.SELECT
      }
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create admin user
    const insertQuery = `
      INSERT INTO admin_users (
        name, email, phone, password_hash, role, temple_id, 
        is_active, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP
      ) RETURNING id, name, email, role, temple_id, is_active, created_at
    `;

    const newAdmins = await sequelize.query(insertQuery, {
      bind: [name, email, phone, passwordHash, role, temple_id],
      type: QueryTypes.INSERT
    });

    const newAdmin = newAdmins[0][0];

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: newAdmin
    });

  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin creation',
      error: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current admin user profile
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const adminQuery = `
      SELECT 
        au.id, au.name, au.email, au.role, au.temple_id,
        au.is_active, au.last_login, au.created_at,
        t.name as temple_name,
        t.city as temple_city
      FROM admin_users au
      LEFT JOIN temples t ON au.temple_id = t.id
      WHERE au.id = $1 AND au.is_active = true
    `;

    const admins = await sequelize.query(adminQuery, {
      bind: [decoded.userId],
      type: QueryTypes.SELECT
    });

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin profile retrieved successfully',
      data: admins[0]
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Error fetching admin profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
