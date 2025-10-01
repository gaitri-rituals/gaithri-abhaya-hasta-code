const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery, startTransaction, commitTransaction, rollbackTransaction, handleDatabaseError } = require('../utils/dbHelpers.js');

// Generate JWT Tokens
const generateTokens = (userId, role = 'user') => {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );

  return { accessToken, refreshToken };
};

const login = async (req, res) => {
  const client = await startTransaction();
  try {
    const { phone, password } = req.body;

    const users = await executeQuery(
      'SELECT id, name, phone, email, password_hash, role, is_verified, is_active FROM users WHERE phone = $1',
      { bindings: [phone], client }
    );

    if (!users.length) {
      await rollbackTransaction(client);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = users[0];

    if (!userData.is_active) {
      await rollbackTransaction(client);
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    if (password) {
      if (!userData.password_hash) {
        await rollbackTransaction(client);
        return res.status(400).json({
          success: false,
          message: 'Password not set for this account. Please use OTP login.'
        });
      }

      const isMatch = await bcrypt.compare(password, userData.password_hash);
      if (!isMatch) {
        await rollbackTransaction(client);
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }

      // Update last login
      await executeQuery(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        { bindings: [userData.id], client }
      );

      const tokens = generateTokens(userData.id, userData.role);

      await commitTransaction(client);
      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: userData.id,
            name: userData.name,
            phone: userData.phone,
            email: userData.email,
            role: userData.role,
            is_verified: userData.is_verified
          },
          ...tokens
        }
      });
    } else {
      // OTP-based login
      const otp = Math.floor(100000 + Math.random() * 900000);
      
      await executeQuery(
        'UPDATE users SET verification_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        { bindings: [otp.toString(), userData.id], client }
      );

      // TODO: Send OTP via SMS
      console.log(`Login OTP for ${phone}: ${otp}`);

      await commitTransaction(client);
      return res.json({
        success: true,
        message: 'OTP sent to your phone number',
        data: {
          requires_otp: true,
          otp: process.env.NODE_ENV === 'development' ? otp : undefined
        }
      });
    }
  } catch (error) {
    await rollbackTransaction(client);
    const errorResponse = handleDatabaseError(error, 'login');
    res.status(errorResponse.status).json(errorResponse);
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
      `INSERT INTO users (name, phone, email, password_hash, verification_token, role, is_verified, created_at)
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
  register,
  refreshToken,
  logout
};