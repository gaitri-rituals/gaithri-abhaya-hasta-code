const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { executeQuery, startTransaction, commitTransaction, rollbackTransaction, handleDatabaseError } = require('../utils/dbHelpers.js');

// Generate JWT Tokens
const generateTokens = (userId, role = 'user', userType = 'user') => {
  const accessToken = jwt.sign(
    { userId, role, userType, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role, userType, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Admin/Temple Staff Email Login
const adminLogin = async (req, res) => {
  const client = await startTransaction();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await rollbackTransaction(client);
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check admin_users table
    const adminUsers = await executeQuery(
      'SELECT id, name, email, phone, password_hash, role, temple_id, is_active FROM admin_users WHERE email = $1',
      { bindings: [email], client }
    );

    if (!adminUsers.length) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = adminUsers[0];

    if (!user.is_active) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await executeQuery(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      { bindings: [user.id], client }
    );

    await commitTransaction(client);

    const tokens = generateTokens(user.id, user.role, 'admin');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          temple_id: user.temple_id,
          userType: 'admin'
        },
        tokens
      }
    });

  } catch (error) {
    await rollbackTransaction(client);
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Vendor Email Login
const vendorLogin = async (req, res) => {
  const client = await startTransaction();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await rollbackTransaction(client);
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check vendor_users table
    const vendorUsers = await executeQuery(
      'SELECT id, name, email, phone, password_hash, role, vendor_id, is_active FROM vendor_users WHERE email = $1',
      { bindings: [email], client }
    );

    if (!vendorUsers.length) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = vendorUsers[0];

    if (!user.is_active) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await executeQuery(
      'UPDATE vendor_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      { bindings: [user.id], client }
    );

    await commitTransaction(client);

    const tokens = generateTokens(user.id, user.role, 'vendor');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          vendor_id: user.vendor_id,
          userType: 'vendor'
        },
        tokens
      }
    });

  } catch (error) {
    await rollbackTransaction(client);
    console.error('Vendor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Temple Email Login
const templeLogin = async (req, res) => {
  const client = await startTransaction();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await rollbackTransaction(client);
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check temple_users table
    const templeUsers = await executeQuery(
      'SELECT id, name, email, phone, password_hash, role, temple_id, is_active FROM temple_users WHERE email = $1',
      { bindings: [email], client }
    );

    if (!templeUsers.length) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = templeUsers[0];

    if (!user.is_active) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await executeQuery(
      'UPDATE temple_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      { bindings: [user.id], client }
    );

    await commitTransaction(client);

    const tokens = generateTokens(user.id, user.role, 'temple');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          temple_id: user.temple_id,
          userType: 'temple'
        },
        tokens
      }
    });

  } catch (error) {
    await rollbackTransaction(client);
    console.error('Temple login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send OTP for regular users
const sendOTP = async (req, res) => {
  const client = await startTransaction();
  try {
    const { phone, purpose = 'login' } = req.body;

    if (!phone) {
      await rollbackTransaction(client);
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTP for this phone
    await executeQuery(
      'DELETE FROM otp_verifications WHERE phone = $1 AND purpose = $2',
      { bindings: [phone, purpose], client }
    );

    // Insert new OTP
    await executeQuery(
      'INSERT INTO otp_verifications (phone, otp_code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      { bindings: [phone, otpCode, purpose, expiresAt], client }
    );

    await commitTransaction(client);

    // TODO: Integrate with SMS service to send OTP
    console.log(`OTP for ${phone}: ${otpCode}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        expiresIn: 300 // 5 minutes in seconds
      }
    });

  } catch (error) {
    await rollbackTransaction(client);
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP and login for regular users
const verifyOTPLogin = async (req, res) => {
  const client = await startTransaction();
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      await rollbackTransaction(client);
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Verify OTP
    const otpRecords = await executeQuery(
      'SELECT * FROM otp_verifications WHERE phone = $1 AND otp_code = $2 AND purpose = $3 AND is_verified = false AND expires_at > CURRENT_TIMESTAMP',
      { bindings: [phone, otp, 'login'], client }
    );

    if (!otpRecords.length) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as verified
    await executeQuery(
      'UPDATE otp_verifications SET is_verified = true WHERE id = $1',
      { bindings: [otpRecords[0].id], client }
    );

    // Check if user exists
    let users = await executeQuery(
      'SELECT id, name, phone, email, role FROM users WHERE phone = $1',
      { bindings: [phone], client }
    );

    let user;
    if (!users.length) {
      // Create new user if doesn't exist
      const newUsers = await executeQuery(
        'INSERT INTO users (name, phone, role) VALUES ($1, $2, $3) RETURNING id, name, phone, email, role',
        { bindings: [`User ${phone}`, phone, 'user'], client }
      );
      user = newUsers[0];
    } else {
      user = users[0];
    }

    await commitTransaction(client);

    const tokens = generateTokens(user.id, user.role, 'user');

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
        tokens
      }
    });

  } catch (error) {
    await rollbackTransaction(client);
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    });
  }
};

// Legacy login method (for backward compatibility)
const login = async (req, res) => {
  const client = await startTransaction();
  try {
    const { phone, email, password } = req.body;

    // Determine login method - email for admin users, phone for regular users
    let users;
    if (email) {
      // Email-based login for admin users
      users = await executeQuery(
        'SELECT id, name, phone, email, password, role FROM users WHERE email = $1',
        { bindings: [email], client }
      );
    } else if (phone) {
      // Phone-based login for regular users
      users = await executeQuery(
        'SELECT id, name, phone, email, password, role FROM users WHERE phone = $1',
        { bindings: [phone], client }
      );
    } else {
      await rollbackTransaction(client);
      return res.status(400).json({
        success: false,
        message: 'Either email or phone number is required'
      });
    }

    if (!users.length) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    if (password && user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await rollbackTransaction(client);
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    await commitTransaction(client);

    const tokens = generateTokens(user.id, user.role, 'user');

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
        tokens
      }
    });

  } catch (error) {
    await rollbackTransaction(client);
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

const register = async (req, res) => {
  const client = await startTransaction();
  try {
    const { name, phone, email, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUsers = await executeQuery(
      'SELECT id FROM users WHERE phone = $1',
      { bindings: [phone], client }
    );

    if (existingUsers.length > 0) {
      await rollbackTransaction(client);
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate OTP for phone verification
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Insert user
    const users = await executeQuery(
      `INSERT INTO users (name, phone, email, password, verification_token, role, is_verified, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)
       RETURNING id, name, phone, email, role, is_verified, created_at`,
      { bindings: [name, phone, email || null, passwordHash, otp.toString(), role], client }
    );

    const user = users[0];

    // Create default user preferences
    await executeQuery(
      `INSERT INTO user_preferences (user_id, language, push_notifications, email_notifications, created_at)
       VALUES ($1, 'en', true, true, CURRENT_TIMESTAMP)`,
      { bindings: [user.id], client }
    );

    // TODO: Send OTP via SMS
    console.log(`Registration OTP for ${phone}: ${otp}`);

    const tokens = generateTokens(user.id, role);

    await commitTransaction(client);
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your phone number.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          is_verified: user.is_verified
        },
        ...tokens,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });
  } catch (error) {
    await rollbackTransaction(client);
    const errorResponse = handleDatabaseError(error, 'registration');
    res.status(errorResponse.status).json(errorResponse);
  }
};

const refreshToken = async (req, res) => {
  const client = await startTransaction();
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (error) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Check if it's a refresh token
    if (decoded.type !== 'refresh') {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Check if user exists and refresh token is valid
    const users = await executeQuery(
      'SELECT id, name, phone, email, role, refresh_token, refresh_token_expire FROM users WHERE id = $1 AND is_active = true',
      { bindings: [decoded.userId], client }
    );

    if (users.length === 0) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    const userData = users[0];

    // Check if refresh token matches and is not expired
    if (userData.refresh_token !== refreshToken || 
        (userData.refresh_token_expire && new Date() > new Date(userData.refresh_token_expire))) {
      await rollbackTransaction(client);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(userData.id, userData.role);

    // Update refresh token in database
    await executeQuery(
      'UPDATE users SET refresh_token = $1, refresh_token_expire = CURRENT_TIMESTAMP + INTERVAL \'7 days\' WHERE id = $2',
      { bindings: [tokens.refreshToken, userData.id], client }
    );

    await commitTransaction(client);
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    await rollbackTransaction(client);
    const errorResponse = handleDatabaseError(error, 'token refresh');
    res.status(errorResponse.status).json(errorResponse);
  }
};

const logout = async (req, res) => {
  const client = await startTransaction();
  try {
    const { userId } = req.user;

    // Clear refresh token in database
    await executeQuery(
      'UPDATE users SET refresh_token = NULL, refresh_token_expire = NULL WHERE id = $1',
      { bindings: [userId], client }
    );

    await commitTransaction(client);
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    await rollbackTransaction(client);
    const errorResponse = handleDatabaseError(error, 'logout');
    res.status(errorResponse.status).json(errorResponse);
  }
};

module.exports = {
  login,
  adminLogin,
  templeLogin,
  vendorLogin,
  sendOTP,
  verifyOTPLogin,
  register,
  refreshToken,
  logout
};