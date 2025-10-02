import express from 'express';
import jwt from 'jsonwebtoken';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Middleware to extract user ID from JWT token
const getUserId = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gaithri_admin_secret_key_2024');
      req.userId = decoded.userId;
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      res.status(401).json({ success: false, message: 'Invalid token', error: error.message });
    }
  } else {
    res.status(401).json({ success: false, message: 'No token provided' });
  }
};

// @route   GET /api/users/addresses
// @desc    Get all addresses for logged-in user
// @access  Private
router.get('/addresses', getUserId, async (req, res) => {
  try {
    const addresses = await sequelize.query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      {
        bind: [req.userId],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get addresses',
      error: error.message
    });
  }
});

// @route   POST /api/users/addresses
// @desc    Add new address
// @access  Private
router.post('/addresses', [
  getUserId,
  body('street').notEmpty().withMessage('Street is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('zip_code').notEmpty().withMessage('Zip code is required'),
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

    const { type, label, street, city, state, zip_code, country, is_default } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await sequelize.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        {
          bind: [req.userId],
          type: QueryTypes.UPDATE
        }
      );
    }

    const result = await sequelize.query(
      `INSERT INTO addresses (user_id, type, label, street, city, state, zip_code, country, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      {
        bind: [
          req.userId,
          type || 'home',
          label || 'Address',
          street,
          city,
          state,
          zip_code,
          country || 'India',
          is_default || false
        ],
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: result[0][0]
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: error.message
    });
  }
});

// @route   PUT /api/users/addresses/:id
// @desc    Update address
// @access  Private
router.put('/addresses/:id', getUserId, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, label, street, city, state, zip_code, country, is_default } = req.body;

    // Check if address belongs to user
    const existing = await sequelize.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      {
        bind: [id, req.userId],
        type: QueryTypes.SELECT
      }
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await sequelize.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        {
          bind: [req.userId, id],
          type: QueryTypes.UPDATE
        }
      );
    }

    await sequelize.query(
      `UPDATE addresses 
       SET type = $1, label = $2, street = $3, city = $4, state = $5, 
           zip_code = $6, country = $7, is_default = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10`,
      {
        bind: [
          type || existing[0].type,
          label || existing[0].label,
          street || existing[0].street,
          city || existing[0].city,
          state || existing[0].state,
          zip_code || existing[0].zip_code,
          country || existing[0].country,
          is_default !== undefined ? is_default : existing[0].is_default,
          id,
          req.userId
        ],
        type: QueryTypes.UPDATE
      }
    );

    const updated = await sequelize.query(
      'SELECT * FROM addresses WHERE id = $1',
      {
        bind: [id],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: updated[0]
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
});

// @route   DELETE /api/users/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/addresses/:id', getUserId, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if address belongs to user
    const existing = await sequelize.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      {
        bind: [id, req.userId],
        type: QueryTypes.SELECT
      }
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await sequelize.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
      {
        bind: [id, req.userId],
        type: QueryTypes.DELETE
      }
    );

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    });
  }
});

export default router;
