const express = require('express');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database.js');
const { QueryTypes } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with all related data
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const profileQuery = `
      SELECT 
        u.*,
        up.language, up.push_notifications, up.email_notifications, up.sms_notifications, up.booking_reminders,
        udi.favorite_deities, udi.preferred_temple_ids, udi.frequent_pujas,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.booking_status = 'completed' THEN 1 END) as completed_bookings,
        COALESCE(SUM(CASE WHEN b.payment_status = 'completed' THEN b.payment_amount ELSE 0 END), 0) as total_spent,
        (SELECT COUNT(*) FROM user_addresses WHERE user_id = u.id) as address_count
      FROM users u
      LEFT JOIN user_preferences up ON u.id = up.user_id
      LEFT JOIN user_devotional_info udi ON u.id = udi.user_id
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE u.id = $1
      GROUP BY u.id, up.user_id, up.language, up.push_notifications, up.email_notifications, up.sms_notifications, up.booking_reminders, udi.user_id, udi.favorite_deities, udi.preferred_temple_ids, udi.frequent_pujas
    `;

    const profiles = await sequelize.query(profileQuery, {
      bind: [user_id],
      type: QueryTypes.SELECT
    });

    if (profiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    const profile = profiles[0];

    // Get user's special dates
    const specialDates = await sequelize.query(
      'SELECT * FROM user_special_dates WHERE user_id = $1 ORDER BY date ASC',
      {
        bind: [user_id],
        type: QueryTypes.SELECT
      }
    );

    // Get default address
    const defaultAddress = await sequelize.query(
      'SELECT * FROM user_addresses WHERE user_id = $1 AND is_default = true',
      {
        bind: [user_id],
        type: QueryTypes.SELECT
      }
    );

    // Get recent bookings
    const recentBookings = await sequelize.query(
      `SELECT b.*, t.name as temple_name, t.city 
       FROM bookings b
       JOIN temples t ON b.temple_id = t.id
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC 
       LIMIT 5`,
      {
        bind: [user_id],
        type: QueryTypes.SELECT
      }
    );

    // Clean up profile data
    const {
      password_hash,
      verification_token,
      reset_password_token,
      reset_password_expire,
      device_tokens,
      ...safeProfile
    } = profile;

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        ...safeProfile,
        special_dates: specialDates,
        default_address: defaultAddress[0] || null,
        recent_bookings: recentBookings,
        stats: {
          total_bookings: parseInt(profile.total_bookings) || 0,
          completed_bookings: parseInt(profile.completed_bookings) || 0,
          total_spent: parseFloat(profile.total_spent) || 0,
          address_count: parseInt(profile.address_count) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('profile_image').optional().isURL().withMessage('Profile image must be a valid URL'),
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

    const user_id = req.user.userId;
    const { name, email, profile_image } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (email) {
      // Check if email is already taken by another user
      const existingUser = await sequelize.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        {
          bind: [email, user_id],
          type: QueryTypes.SELECT
        }
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }

      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (profile_image !== undefined) {
      updates.push(`profile_image = $${paramIndex}`);
      values.push(profile_image);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(user_id);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, phone, profile_image, is_verified, created_at, updated_at
    `;

    const updatedUsers = await sequelize.query(updateQuery, {
      bind: values,
      type: QueryTypes.UPDATE
    });

    if (updatedUsers[1] === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get updated user profile
    const updatedUser = await sequelize.query(
      'SELECT id, name, email, phone, profile_image, is_verified, created_at, updated_at FROM users WHERE id = $1',
      {
        bind: [user_id],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser[0]
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message
    });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
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

    const { currentPassword, newPassword } = req.body;
    const user_id = req.user.userId;

    // Get current user's password hash
    const users = await sequelize.query(
      'SELECT password_hash FROM users WHERE id = $1',
      {
        bind: [user_id],
        type: QueryTypes.SELECT
      }
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await sequelize.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      {
        bind: [hashedPassword, user_id],
        type: QueryTypes.UPDATE
      }
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change',
      error: error.message
    });
  }
});

module.exports = router;
