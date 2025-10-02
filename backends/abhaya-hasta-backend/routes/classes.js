const express = require('express');
const { pool } = require('../config/database.js');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// @route   GET /api/classes
// @desc    Get available temple classes
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { temple_id, search, city, limit = 20, offset = 0 } = req.query;

    let whereConditions = ['c.is_active = true'];
    let queryParams = [];
    let paramIndex = 1;

    // Filter by temple
    if (temple_id) {
      whereConditions.push(`c.temple_id = $${paramIndex}`);
      queryParams.push(temple_id);
      paramIndex++;
    }

    // Search functionality
    if (search) {
      whereConditions.push(`(
        LOWER(c.name) LIKE LOWER($${paramIndex}) OR 
        LOWER(c.description) LIKE LOWER($${paramIndex}) OR 
        LOWER(c.instructor) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filter by city
    if (city) {
      whereConditions.push(`LOWER(t.city) = LOWER($${paramIndex})`);
      queryParams.push(city);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const classesQuery = `
      SELECT 
        c.*,
        t.name as temple_name,
        t.city, t.state,
        t.phone as temple_phone,
        (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'active') as enrolled_count,
        (c.capacity - (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'active')) as available_spots
      FROM temple_classes c
      JOIN temples t ON c.temple_id = t.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(classesQuery, queryParams);

    res.json({
      success: true,
      message: 'Classes retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/classes/stats
// @desc    Get class statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_classes,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_classes,
        COUNT(DISTINCT CASE WHEN is_active = true THEN instructor END) as total_instructors,
        COALESCE((SELECT COUNT(*) FROM class_enrollments ce 
                  JOIN temple_classes tc ON ce.class_id = tc.id 
                  WHERE ce.status = 'active' AND tc.is_active = true), 0) as total_enrollments,
        COALESCE(AVG(CASE WHEN is_active = true THEN capacity END), 0) as average_capacity
      FROM temple_classes
      WHERE is_active = true
    `;

    const result = await pool.query(statsQuery);
    
    res.json({
      success: true,
      message: 'Class statistics retrieved successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching class stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/classes/:id
// @desc    Get single class details
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const classId = req.params.id;

    const classQuery = `
      SELECT 
        c.*,
        t.name as temple_name,
        t.description as temple_description,
        t.city, t.state,
        t.phone as temple_phone,
        t.email as temple_email,
        (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'active') as enrolled_count,
        (c.capacity - (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'active')) as available_spots
      FROM temple_classes c
      JOIN temples t ON c.temple_id = t.id
      WHERE c.id = $1 AND c.is_active = true
    `;

    const result = await pool.query(classQuery, [classId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classData = result.rows[0];

    // Get recent enrollments for social proof
    const recentEnrollmentsResult = await pool.query(
      `SELECT u.name, ce.created_at 
       FROM class_enrollments ce
       JOIN users u ON ce.user_id = u.id
       WHERE ce.class_id = $1 AND ce.status = 'active'
       ORDER BY ce.created_at DESC
       LIMIT 5`,
      [classId]
    );

    res.json({
      success: true,
      message: 'Class details retrieved successfully',
      data: {
        ...classData,
        recent_enrollments: recentEnrollmentsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/classes/:id/enroll
// @desc    Enroll in a temple class
// @access  Private
router.post('/:id/enroll', protect, [
  body('emergency_contact_name').optional().isLength({ max: 100 }).withMessage('Emergency contact name must not exceed 100 characters'),
  body('emergency_contact_phone').optional().isMobilePhone('en-IN').withMessage('Valid emergency contact phone required'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
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

    const classId = req.params.id;
    const user_id = req.user.userId;
    const { emergency_contact_name, emergency_contact_phone, notes } = req.body;

    // Check if class exists and has available spots
    const classQuery = `
      SELECT c.*, t.name as temple_name
      FROM temple_classes c
      JOIN temples t ON c.temple_id = t.id
      WHERE c.id = $1 AND c.is_active = true
    `;

    const classResult = await pool.query(classQuery, [classId]);

    if (classResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or not active'
      });
    }

    const classData = classResult.rows[0];

    // Check enrolled count
    const enrolledCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1 AND status = $2',
      [classId, 'active']
    );

    // Check if class is full
    if (parseInt(enrolledCountResult.rows[0].count) >= classData.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Class is full. Please try another class or wait for the next session.'
      });
    }

    // Check if user is already enrolled
    const existingEnrollmentResult = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = $1 AND user_id = $2 AND status = $3',
      [classId, user_id, 'active']
    );

    if (existingEnrollmentResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this class'
      });
    }

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      
      // Create enrollment
      const enrollmentQuery = `
        INSERT INTO class_enrollments (
          class_id, user_id, emergency_contact_name, emergency_contact_phone, 
          notes, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      const enrollmentResult = await client.query(enrollmentQuery, 
        [classId, user_id, emergency_contact_name, emergency_contact_phone, notes, 'active']
      );

      // No need to update count as we calculate it dynamically from enrollments

      await client.query('COMMIT');

      const enrollment = enrollmentResult.rows[0];

      res.status(201).json({
        success: true,
        message: 'Successfully enrolled in class',
        data: {
          enrollment,
          class: {
            id: classData.id,
            name: classData.name,
            temple_name: classData.temple_name,
            schedule: classData.schedule,
            start_date: classData.start_date,
            end_date: classData.end_date
          }
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error enrolling in class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during enrollment',
      error: error.message
    });
  }
});

// @route   PUT /api/classes/:id/cancel-enrollment
// @desc    Cancel class enrollment
// @access  Private
router.put('/:id/cancel-enrollment', protect, [
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters'),
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

    const classId = req.params.id;
    const user_id = req.user.userId;
    const { reason } = req.body;

    // Check if enrollment exists
    const existingEnrollmentResult = await pool.query(
      'SELECT id FROM class_enrollments WHERE class_id = $1 AND user_id = $2 AND status = $3',
      [classId, user_id, 'active']
    );

    if (existingEnrollmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active enrollment not found'
      });
    }

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      
      // Update enrollment status
      await client.query(
        `UPDATE class_enrollments 
         SET status = 'cancelled', 
             cancellation_reason = $1,
             cancelled_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [reason, existingEnrollmentResult.rows[0].id]
      );

      // No need to update count as we calculate it dynamically from enrollments

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Class enrollment cancelled successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error cancelling enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during enrollment cancellation',
      error: error.message
    });
  }
});

// @route   POST /api/classes
// @desc    Create a new class
// @access  Private (Admin only)
router.post('/', protect, [
  body('temple_id').isInt().withMessage('Valid temple ID is required'),
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name is required and must be less than 200 characters'),
  body('instructor').trim().isLength({ min: 1, max: 200 }).withMessage('Instructor name is required'),
  body('schedule').trim().isLength({ min: 1 }).withMessage('Schedule is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
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

    const { temple_id, name, description, instructor, schedule, price, capacity, is_active } = req.body;

    // Check if temple exists
    const templeCheck = await pool.query(
      'SELECT id FROM temples WHERE id = $1',
      [temple_id]
    );

    if (templeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Temple not found'
      });
    }

    // Insert the new class
    const insertQuery = `
      INSERT INTO temple_classes (
        temple_id, name, description, instructor, schedule, 
        price, capacity, is_active, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      temple_id,
      name,
      description || null,
      instructor,
      schedule,
      price || 0,
      capacity || 30,
      is_active !== false
    ]);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/classes/:id
// @desc    Update a class
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    const classId = req.params.id;
    const { name, description, instructor, schedule, price, capacity, is_active } = req.body;

    // Check if class exists
    const classCheck = await pool.query(
      'SELECT id FROM temple_classes WHERE id = $1',
      [classId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

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
    if (instructor !== undefined) {
      updateFields.push(`instructor = $${paramCount}`);
      values.push(instructor);
      paramCount++;
    }
    if (schedule !== undefined) {
      updateFields.push(`schedule = $${paramCount}`);
      values.push(schedule);
      paramCount++;
    }
    if (price !== undefined) {
      updateFields.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }
    if (capacity !== undefined) {
      updateFields.push(`capacity = $${paramCount}`);
      values.push(capacity);
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
    values.push(classId);

    const updateQuery = `
      UPDATE temple_classes 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete a class
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const classId = req.params.id;

    // Check if class exists
    const classCheck = await pool.query(
      'SELECT id FROM temple_classes WHERE id = $1',
      [classId]
    );

    if (classCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if there are active enrollments
    const enrollmentCheck = await pool.query(
      'SELECT COUNT(*) as count FROM class_enrollments WHERE class_id = $1 AND status = $2',
      [classId, 'active']
    );

    if (parseInt(enrollmentCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with active enrollments. Please cancel all enrollments first.'
      });
    }

    // Delete the class
    await pool.query('DELETE FROM temple_classes WHERE id = $1', [classId]);

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
