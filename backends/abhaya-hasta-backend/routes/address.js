const express = require('express');
const sequelize = require('../config/database.js');
const { QueryTypes } = require('sequelize');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/address
// @desc    Get user's saved addresses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const addressQuery = `
      SELECT * FROM user_addresses 
      WHERE user_id = $1 
      ORDER BY is_default DESC, created_at DESC
    `;

    const addresses = await sequelize.query(addressQuery, {
      bind: [user_id],
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      message: 'Addresses retrieved successfully',
      data: addresses
    });

  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/address
// @desc    Add a new address
// @access  Private
router.post('/', protect, [
  body('type').isIn(['home', 'work', 'temple', 'other']).withMessage('Valid address type required'),
  body('label').optional().isLength({ max: 100 }).withMessage('Label must not exceed 100 characters'),
  body('street').notEmpty().isLength({ max: 255 }).withMessage('Street address is required and must not exceed 255 characters'),
  body('city').notEmpty().isLength({ max: 100 }).withMessage('City is required'),
  body('state').notEmpty().isLength({ max: 100 }).withMessage('State is required'),
  body('zip_code').notEmpty().isLength({ max: 10 }).withMessage('Zip code is required'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
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

    const {
      type,
      label,
      street,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      is_default
    } = req.body;

    const user_id = req.user.userId;

    // If this is being set as default, update other addresses
    if (is_default) {
      await sequelize.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
        {
          bind: [user_id],
          type: QueryTypes.UPDATE
        }
      );
    }

    // Insert new address
    const insertQuery = `
      INSERT INTO user_addresses (
        user_id, type, label, street, city, state, zip_code, 
        latitude, longitude, is_default, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const addresses = await sequelize.query(insertQuery, {
      bind: [
        user_id, type, label, street, city, state, zip_code,
        latitude, longitude, is_default || false
      ],
      type: QueryTypes.INSERT
    });

    const newAddress = addresses[0][0];

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: newAddress
    });

  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during address creation',
      error: error.message
    });
  }
});

// @route   PUT /api/address/:id
// @desc    Update an address
// @access  Private
router.put('/:id', protect, [
  body('type').optional().isIn(['home', 'work', 'temple', 'other']).withMessage('Valid address type required'),
  body('label').optional().isLength({ max: 100 }).withMessage('Label must not exceed 100 characters'),
  body('street').optional().isLength({ max: 255 }).withMessage('Street address must not exceed 255 characters'),
  body('city').optional().isLength({ max: 100 }).withMessage('City must not exceed 100 characters'),
  body('state').optional().isLength({ max: 100 }).withMessage('State must not exceed 100 characters'),
  body('zip_code').optional().isLength({ max: 10 }).withMessage('Zip code must not exceed 10 characters'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
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

    const addressId = req.params.id;
    const user_id = req.user.userId;
    const updateFields = req.body;

    // Check if address belongs to user
    const existingAddress = await sequelize.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
      {
        bind: [addressId, user_id],
        type: QueryTypes.SELECT
      }
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If setting as default, update other addresses
    if (updateFields.is_default) {
      await sequelize.query(
        'UPDATE user_addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        {
          bind: [user_id, addressId],
          type: QueryTypes.UPDATE
        }
      );
    }

    // Build dynamic update query
    const allowedFields = ['type', 'label', 'street', 'city', 'state', 'zip_code', 'latitude', 'longitude', 'is_default'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateFields)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(addressId, user_id);

    const updateQuery = `
      UPDATE user_addresses 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    const updatedAddresses = await sequelize.query(updateQuery, {
      bind: values,
      type: QueryTypes.UPDATE
    });

    if (updatedAddresses[1] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Get updated address
    const address = await sequelize.query(
      'SELECT * FROM user_addresses WHERE id = $1',
      {
        bind: [addressId],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address[0]
    });

  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during address update',
      error: error.message
    });
  }
});

// @route   DELETE /api/address/:id
// @desc    Delete an address
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const addressId = req.params.id;
    const user_id = req.user.userId;

    // Check if address belongs to user
    const existingAddress = await sequelize.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
      {
        bind: [addressId, user_id],
        type: QueryTypes.SELECT
      }
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Delete address
    await sequelize.query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2',
      {
        bind: [addressId, user_id],
        type: QueryTypes.DELETE
      }
    );

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during address deletion',
      error: error.message
    });
  }
});

// @route   PUT /api/address/:id/set-default
// @desc    Set an address as default
// @access  Private
router.put('/:id/set-default', protect, async (req, res) => {
  try {
    const addressId = req.params.id;
    const user_id = req.user.userId;

    // Check if address belongs to user
    const existingAddress = await sequelize.query(
      'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2',
      {
        bind: [addressId, user_id],
        type: QueryTypes.SELECT
      }
    );

    if (existingAddress.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update all addresses to not default
    await sequelize.query(
      'UPDATE user_addresses SET is_default = false WHERE user_id = $1',
      {
        bind: [user_id],
        type: QueryTypes.UPDATE
      }
    );

    // Set selected address as default
    await sequelize.query(
      'UPDATE user_addresses SET is_default = true WHERE id = $1 AND user_id = $2',
      {
        bind: [addressId, user_id],
        type: QueryTypes.UPDATE
      }
    );

    // Get updated address
    const address = await sequelize.query(
      'SELECT * FROM user_addresses WHERE id = $1',
      {
        bind: [addressId],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: 'Address set as default successfully',
      data: address[0]
    });

  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during setting default address',
      error: error.message
    });
  }
});

module.exports = router;
