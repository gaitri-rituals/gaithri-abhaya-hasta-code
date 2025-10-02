const express = require('express');
const { pool } = require('../config/database.js');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/expenses
// @desc    Get all temple expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { temple_id, category, start_date, end_date } = req.query;
    
    let query = 'SELECT * FROM temple_expenses WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (temple_id) {
      query += ` AND temple_id = $${paramIndex}`;
      params.push(temple_id);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (start_date) {
      query += ` AND date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      query += ` AND date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    query += ' ORDER BY date DESC, created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', protect, [
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('date').isDate().withMessage('Valid date is required'),
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
    
    const { temple_id, category, description, amount, date } = req.body;
    const created_by = req.user?.userId || null;
    
    const result = await pool.query(`
      INSERT INTO temple_expenses (temple_id, category, description, amount, date, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `, [temple_id || null, category, description, amount, date, created_by]);
    
    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, amount, date } = req.body;
    
    const updateFields = [];
    const values = [];
    let paramCount = 1;
    
    if (category !== undefined) {
      updateFields.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (amount !== undefined) {
      updateFields.push(`amount = $${paramCount}`);
      values.push(amount);
      paramCount++;
    }
    if (date !== undefined) {
      updateFields.push(`date = $${paramCount}`);
      values.push(date);
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
      UPDATE temple_expenses 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM temple_expenses WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/expenses/stats
// @desc    Get expense statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { temple_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        category,
        SUM(amount) as total_amount,
        COUNT(*) as count
      FROM temple_expenses
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (temple_id) {
      query += ` AND temple_id = $${paramIndex}`;
      params.push(temple_id);
      paramIndex++;
    }
    
    if (start_date) {
      query += ` AND date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      query += ` AND date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    query += ' GROUP BY category ORDER BY total_amount DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
