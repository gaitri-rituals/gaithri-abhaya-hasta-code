const express = require('express');
const { pool } = require('../config/database.js');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/staff
// @desc    Get all temple staff
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { temple_id, role, search } = req.query;
    
    let query = 'SELECT * FROM temple_staff WHERE is_active = true';
    const params = [];
    let paramIndex = 1;
    
    if (temple_id) {
      query += ` AND temple_id = $${paramIndex}`;
      params.push(temple_id);
      paramIndex++;
    }
    
    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(email) LIKE LOWER($${paramIndex}) OR LOWER(phone) LIKE LOWER($${paramIndex}))`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/staff/:id
// @desc    Get single staff member
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM temple_staff WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/staff
// @desc    Create new staff member
// @access  Private (Admin)
router.post('/', protect, [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('role').trim().isLength({ min: 1 }).withMessage('Role is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
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
    
    const { temple_id, name, role, phone, email } = req.body;
    
    const result = await pool.query(`
      INSERT INTO temple_staff (temple_id, name, role, phone, email, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP)
      RETURNING *
    `, [temple_id || null, name, role, phone, email]);
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/staff/:id
// @desc    Update staff member
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, phone, email, is_active } = req.body;
    
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (role !== undefined) {
      updateFields.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await pool.query(`
      UPDATE temple_staff 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/staff/:id
// @desc    Delete/Deactivate staff member
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - set is_active to false
    const result = await pool.query(
      'UPDATE temple_staff SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Staff member deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
