const express = require('express');
const { pool } = require('../config/database.js');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/pujas
// @desc    Get all temple services (pujas/sevas)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { temple_id, category, service_type } = req.query;
    
    let query = `
      SELECT ts.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', spo.id,
                   'option_name', spo.label,
                   'price', spo.amount,
                   'is_default', spo.is_default
                 ) ORDER BY spo.amount
               ) FILTER (WHERE spo.id IS NOT NULL), 
               '[]'::json
             ) as pricing_options
      FROM temple_services ts
      LEFT JOIN service_pricing_options spo ON ts.id = spo.service_id
      WHERE ts.is_available = true
    `;
    const params = [];
    let paramIndex = 1;
    
    if (temple_id) {
      query += ` AND ts.temple_id = $${paramIndex}`;
      params.push(temple_id);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND ts.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (service_type) {
      query += ` AND ts.service_type = $${paramIndex}`;
      params.push(service_type);
      paramIndex++;
    }
    
    query += ' GROUP BY ts.id ORDER BY ts.category, ts.name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching temple services:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/pujas
// @desc    Create a new temple service
// @access  Private (Admin)
router.post('/', protect, [
  body('temple_id').optional().isInt(),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('service_type').optional().isIn(['Regular', 'Dakshina', 'Archana', 'Abhisheka']).withMessage('Invalid service type'),
  body('pricing_type').optional().isIn(['fixed', 'flexible', 'package']).withMessage('Invalid pricing type'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('min_price').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
  body('max_price').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
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
      temple_id, name, description, price, duration, category, is_available,
      service_type, pricing_type, min_price, max_price, suggested_prices,
      requires_nakshatra, requires_gothra, pricing_options
    } = req.body;
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(`
        INSERT INTO temple_services (
          temple_id, name, description, price, duration, category, is_available,
          service_type, pricing_type, min_price, max_price, suggested_prices,
          requires_nakshatra, requires_gothra, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        temple_id || null, name, description, price, duration, category, is_available !== false,
        service_type || 'Regular', pricing_type || 'fixed', min_price, max_price,
        suggested_prices ? JSON.stringify(suggested_prices) : null,
        requires_nakshatra || false, requires_gothra || false
      ]);
      
      const serviceId = result.rows[0].id;
      
      // Insert pricing options if provided
      if (pricing_options && Array.isArray(pricing_options)) {
        for (const option of pricing_options) {
          await client.query(`
            INSERT INTO service_pricing_options (service_id, option_name, price, description)
            VALUES ($1, $2, $3, $4)
          `, [serviceId, option.option_name, option.price, option.description]);
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating temple service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/pujas/:id
// @desc    Update a temple service
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, description, price, duration, category, is_available,
      service_type, pricing_type, min_price, max_price, suggested_prices,
      requires_nakshatra, requires_gothra, pricing_options
    } = req.body;
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      if (name !== undefined) {
        updateFields.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }
      if (price !== undefined) {
        updateFields.push(`price = $${paramCount}`);
        values.push(price);
        paramCount++;
      }
      if (duration !== undefined) {
        updateFields.push(`duration = $${paramCount}`);
        values.push(duration);
        paramCount++;
      }
      if (category !== undefined) {
        updateFields.push(`category = $${paramCount}`);
        values.push(category);
        paramCount++;
      }
      if (is_available !== undefined) {
        updateFields.push(`is_available = $${paramCount}`);
        values.push(is_available);
        paramCount++;
      }
      if (service_type !== undefined) {
        updateFields.push(`service_type = $${paramCount}`);
        values.push(service_type);
        paramCount++;
      }
      if (pricing_type !== undefined) {
        updateFields.push(`pricing_type = $${paramCount}`);
        values.push(pricing_type);
        paramCount++;
      }
      if (min_price !== undefined) {
        updateFields.push(`min_price = $${paramCount}`);
        values.push(min_price);
        paramCount++;
      }
      if (max_price !== undefined) {
        updateFields.push(`max_price = $${paramCount}`);
        values.push(max_price);
        paramCount++;
      }
      if (suggested_prices !== undefined) {
        updateFields.push(`suggested_prices = $${paramCount}`);
        values.push(suggested_prices ? JSON.stringify(suggested_prices) : null);
        paramCount++;
      }
      if (requires_nakshatra !== undefined) {
        updateFields.push(`requires_nakshatra = $${paramCount}`);
        values.push(requires_nakshatra);
        paramCount++;
      }
      if (requires_gothra !== undefined) {
        updateFields.push(`requires_gothra = $${paramCount}`);
        values.push(requires_gothra);
        paramCount++;
      }
      
      if (updateFields.length === 0 && !pricing_options) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }
      
      let result;
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        
        result = await client.query(`
          UPDATE temple_services 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `, values);
        
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Service not found'
          });
        }
      } else {
        // Just fetch the service if only updating pricing options
        result = await client.query('SELECT * FROM temple_services WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({
            success: false,
            message: 'Service not found'
          });
        }
      }
      
      // Update pricing options if provided
      if (pricing_options && Array.isArray(pricing_options)) {
        // Delete existing pricing options
        await client.query('DELETE FROM service_pricing_options WHERE service_id = $1', [id]);
        
        // Insert new pricing options
        for (const option of pricing_options) {
          await client.query(`
            INSERT INTO service_pricing_options (service_id, option_name, price, description)
            VALUES ($1, $2, $3, $4)
          `, [id, option.option_name, option.price, option.description]);
        }
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Service updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating temple service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/pujas/:id
// @desc    Delete a temple service
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM temple_services WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting temple service:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/pujas/nakshatras
// @desc    Get all nakshatras
// @access  Public
router.get('/nakshatras', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM nakshatras ORDER BY name');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching nakshatras:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/pujas/gothras
// @desc    Get all gothras
// @access  Public
router.get('/gothras', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gothras ORDER BY name');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching gothras:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
