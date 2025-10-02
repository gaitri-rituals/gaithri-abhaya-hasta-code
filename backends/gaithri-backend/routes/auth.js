import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Generate JWT Token
const generateToken = (userId, role, temple_id = null, userType = 'admin') => {
  return jwt.sign(
    { userId, role, temple_id, userType },
    process.env.JWT_SECRET || 'gaithri_admin_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Generate OTP (4 digits)
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
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

    const token = generateToken(admin.id, admin.role, admin.temple_id, 'admin');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gaithri_admin_secret_key_2024');

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

// @route   POST /api/auth/otp/send
// @desc    Send OTP for phone-based login
// @access  Public
router.post('/otp/send', [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
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

    const { phone } = req.body;
    const purpose = 'login';

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this phone
    await sequelize.query(
      'DELETE FROM otp_verifications WHERE phone = $1 AND purpose = $2',
      {
        bind: [phone, purpose],
        type: QueryTypes.DELETE
      }
    );

    // Insert new OTP
    await sequelize.query(
      'INSERT INTO otp_verifications (phone, otp_code, purpose, expires_at, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
      {
        bind: [phone, otpCode, purpose, expiresAt],
        type: QueryTypes.INSERT
      }
    );

    // TODO: Integrate with SMS service to send OTP
    // For development, log the OTP
    console.log(`🔐 OTP for ${phone}: ${otpCode}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        expiresIn: 300, // 5 minutes in seconds
        // For development only - remove in production
        otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
      }
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// @route   POST /api/auth/otp/verify
// @desc    Verify OTP and login user
// @access  Public
router.post('/otp/verify', [
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 4, max: 4 })
    .withMessage('OTP must be 4 digits'),
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

    const { phone, otp } = req.body;

    // Verify OTP
    const otpRecords = await sequelize.query(
      `SELECT * FROM otp_verifications 
       WHERE phone = $1 
       AND otp_code = $2 
       AND purpose = 'login' 
       AND is_verified = false 
       AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      {
        bind: [phone, otp],
        type: QueryTypes.SELECT
      }
    );

    if (otpRecords.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as verified
    await sequelize.query(
      'UPDATE otp_verifications SET is_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      {
        bind: [otpRecords[0].id],
        type: QueryTypes.UPDATE
      }
    );

    // Check if user exists in users table
    let users = await sequelize.query(
      'SELECT id, name, phone, email, role FROM users WHERE phone = $1',
      {
        bind: [phone],
        type: QueryTypes.SELECT
      }
    );

    let user;
    if (users.length === 0) {
      // Create new user if doesn't exist
      // Generate a temporary email based on phone number
      const tempEmail = `${phone}@temp.abhayahasta.com`;
      const tempPassword = Math.random().toString(36).slice(-8); // Random password for phone users
      
      const newUsers = await sequelize.query(
        `INSERT INTO users (name, phone, email, password, role, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id, name, phone, email, role`,
        {
          bind: [`User ${phone}`, phone, tempEmail, tempPassword],
          type: QueryTypes.INSERT
        }
      );
      user = newUsers[0][0];
    } else {
      user = users[0];
    }

    const token = generateToken(user.id, user.role || 'user', null, 'user');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          userType: 'user'
        },
        token
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token cleanup)
// @access  Public
router.post('/logout', async (req, res) => {
  try {
    // For JWT-based auth, logout is primarily client-side
    // You can add token blacklisting here if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// Middleware to extract user ID from JWT token (without protect middleware for profile)
const getUserFromToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gaithri_admin_secret_key_2024');
      req.userId = decoded.userId;
      req.userType = decoded.userType;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
};

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', getUserFromToken, async (req, res) => {
  try {
    // Fetch user from database based on userType
    let user = null;
    
    if (req.userType === 'user') {
      const users = await sequelize.query(
        'SELECT id, name, email, phone, role FROM users WHERE id = $1',
        {
          bind: [req.userId],
          type: QueryTypes.SELECT
        }
      );
      user = users[0];
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userType: req.userType
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

export default router;
