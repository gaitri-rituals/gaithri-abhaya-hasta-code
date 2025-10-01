const express = require('express');
const sequelize = require('../config/database.js');
const { QueryTypes } = require('sequelize');
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
        t.street, t.city, t.state,
        t.phone as temple_phone,
        COALESCE(
          (SELECT url FROM temple_images WHERE temple_id = c.temple_id AND is_primary = true LIMIT 1),
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop'
        ) as temple_image,
        (c.max_students - c.current_students) as available_spots,
        CASE 
          WHEN c.current_students >= c.max_students THEN 'full'
          WHEN c.current_students >= (c.max_students * 0.8) THEN 'filling_fast'
          ELSE 'available'
        END as availability_status
      FROM classes c
      JOIN temples t ON c.temple_id = t.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const classes = await sequelize.query(classesQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      message: 'Classes retrieved successfully',
      data: classes,
      count: classes.length
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
        t.street, t.city, t.state,
        t.phone as temple_phone,
        t.email as temple_email,
        ARRAY(
          SELECT json_build_object(
            'url', url,
            'alt_text', alt_text,
            'is_primary', is_primary
          )
          FROM temple_images 
          WHERE temple_id = c.temple_id 
          ORDER BY is_primary DESC
        ) as temple_images,
        ARRAY(
          SELECT json_build_object(
            'day_of_week', day_of_week,
            'open_time', open_time,
            'close_time', close_time,
            'is_holiday', is_holiday
          )
          FROM temple_timings 
          WHERE temple_id = c.temple_id
        ) as temple_timings,
        (c.max_students - c.current_students) as available_spots,
        CASE 
          WHEN c.current_students >= c.max_students THEN 'full'
          WHEN c.current_students >= (c.max_students * 0.8) THEN 'filling_fast'
          ELSE 'available'
        END as availability_status
      FROM classes c
      JOIN temples t ON c.temple_id = t.id
      WHERE c.id = $1 AND c.is_active = true
    `;

    const classes = await sequelize.query(classQuery, {
      bind: [classId],
      type: QueryTypes.SELECT
    });

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classData = classes[0];

    // Get recent enrollments for social proof
    const recentEnrollments = await sequelize.query(
      `SELECT u.name, ce.created_at 
       FROM class_enrollments ce
       JOIN users u ON ce.user_id = u.id
       WHERE ce.class_id = $1 AND ce.status = 'active'
       ORDER BY ce.created_at DESC
       LIMIT 5`,
      {
        bind: [classId],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: 'Class details retrieved successfully',
      data: {
        ...classData,
        recent_enrollments: recentEnrollments
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
      FROM classes c
      JOIN temples t ON c.temple_id = t.id
      WHERE c.id = $1 AND c.is_active = true
    `;

    const classes = await sequelize.query(classQuery, {
      bind: [classId],
      type: QueryTypes.SELECT
    });

    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or not active'
      });
    }

    const classData = classes[0];

    // Check if class is full
    if (classData.current_students >= classData.max_students) {
      return res.status(400).json({
        success: false,
        message: 'Class is full. Please try another class or wait for the next session.'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await sequelize.query(
      'SELECT id FROM class_enrollments WHERE class_id = $1 AND user_id = $2 AND status = $3',
      {
        bind: [classId, user_id, 'active'],
        type: QueryTypes.SELECT
      }
    );

    if (existingEnrollment.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this class'
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Create enrollment
      const enrollmentQuery = `
        INSERT INTO class_enrollments (
          class_id, user_id, emergency_contact_name, emergency_contact_phone, 
          notes, status, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      const enrollments = await sequelize.query(enrollmentQuery, {
        bind: [classId, user_id, emergency_contact_name, emergency_contact_phone, notes, 'active'],
        type: QueryTypes.INSERT,
        transaction
      });

      // Update class current_students count
      await sequelize.query(
        'UPDATE classes SET current_students = current_students + 1 WHERE id = $1',
        {
          bind: [classId],
          type: QueryTypes.UPDATE,
          transaction
        }
      );

      await transaction.commit();

      const enrollment = enrollments[0][0];

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
      await transaction.rollback();
      throw error;
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
    const existingEnrollment = await sequelize.query(
      'SELECT id FROM class_enrollments WHERE class_id = $1 AND user_id = $2 AND status = $3',
      {
        bind: [classId, user_id, 'active'],
        type: QueryTypes.SELECT
      }
    );

    if (existingEnrollment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active enrollment not found'
      });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Update enrollment status
      await sequelize.query(
        `UPDATE class_enrollments 
         SET status = 'cancelled', 
             cancellation_reason = $1,
             cancelled_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        {
          bind: [reason, existingEnrollment[0].id],
          type: QueryTypes.UPDATE,
          transaction
        }
      );

      // Update class current_students count
      await sequelize.query(
        'UPDATE classes SET current_students = current_students - 1 WHERE id = $1',
        {
          bind: [classId],
          type: QueryTypes.UPDATE,
          transaction
        }
      );

      await transaction.commit();

      res.json({
        success: true,
        message: 'Class enrollment cancelled successfully'
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
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

module.exports = router;
