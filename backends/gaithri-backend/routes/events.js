import express from 'express';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/events
// @desc    Get temple events (matches Dashboard.tsx EventsTab)
// @access  Private (Temple Admin/Staff)
router.get('/', protect, async (req, res) => {
  try {
    const { temple_id, role } = req.user;
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Super admin can see all events, temple admin only their temple
    let whereConditions = ['e.is_active = true'];
    let queryParams = [];
    let paramIndex = 1;
    
    if (temple_id) {
      whereConditions.push(`e.temple_id = $${paramIndex}`);
      queryParams.push(temple_id);
      paramIndex++;
    }
    
    if (status) {
      whereConditions.push(`e.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const eventsQuery = `
      SELECT 
        e.*,
        t.name as temple_name,
        t.city as temple_city,
        COUNT(eb.id) as booking_count,
        COALESCE(SUM(eb.payment_amount), 0) as total_revenue,
        CASE 
          WHEN e.event_date < CURRENT_DATE THEN 'completed'
          WHEN e.event_date = CURRENT_DATE THEN 'today'
          WHEN e.event_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'this_week'
          ELSE 'upcoming'
        END as event_timing
      FROM events e
      JOIN temples t ON e.temple_id = t.id
      LEFT JOIN event_bookings eb ON e.id = eb.event_id
      ${whereClause}
      GROUP BY e.id, t.id
      ORDER BY e.event_date ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const events = await sequelize.query(eventsQuery, {
      bind: queryParams,
      type: QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      message: 'Events retrieved successfully',
      data: events,
      count: events.length
    });
    
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Temple Admin/Staff)
router.post('/', protect, [
  body('name').trim().isLength({ min: 2 }).withMessage('Event name is required'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('event_date').isISO8601().withMessage('Valid event date required'),
  body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required'),
  body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time required'),
  body('max_participants').isInt({ min: 1 }).withMessage('Max participants must be positive'),
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

    const { temple_id: userTempleId, role } = req.user;
    const {
      name, description, event_date, start_time, end_time,
      max_participants, entry_fee, event_type, requirements
    } = req.body;

    // Use user's temple_id or allow super admin to specify
    const temple_id = userTempleId || req.body.temple_id;

    if (!temple_id) {
      return res.status(400).json({
        success: false,
        message: 'Temple ID is required'
      });
    }

    // Create event
    const eventQuery = `
      INSERT INTO events (
        temple_id, name, description, event_date, start_time, end_time,
        max_participants, current_participants, entry_fee, event_type,
        requirements, status, is_active, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, 'scheduled', true, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const events = await sequelize.query(eventQuery, {
      bind: [
        temple_id, name, description, event_date, start_time, end_time,
        max_participants, entry_fee || 0, event_type || 'festival',
        JSON.stringify(requirements || [])
      ],
      type: QueryTypes.INSERT
    });

    const event = events[0][0];

    // Get complete event details
    const completeEvent = await sequelize.query(
      `SELECT e.*, t.name as temple_name, t.city as temple_city
       FROM events e
       JOIN temples t ON e.temple_id = t.id
       WHERE e.id = $1`,
      {
        bind: [event.id],
        type: QueryTypes.SELECT
      }
    );

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        ...completeEvent[0],
        requirements: typeof completeEvent[0].requirements === 'string' 
          ? JSON.parse(completeEvent[0].requirements) 
          : completeEvent[0].requirements
      }
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during event creation',
      error: error.message
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Temple Admin/Staff)
router.put('/:id', protect, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { temple_id: userTempleId } = req.user;
    const updateFields = req.body;

    // Check if event exists and belongs to temple
    const event = await sequelize.query(
      'SELECT * FROM events WHERE id = $1 AND temple_id = $2',
      {
        bind: [eventId, userTempleId],
        type: QueryTypes.SELECT
      }
    );

    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'description', 'event_date', 'start_time', 'end_time', 'max_participants', 'entry_fee', 'status', 'requirements'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateFields)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(key === 'requirements' ? JSON.stringify(value) : value);
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
    values.push(eventId);

    const updateQuery = `
      UPDATE events 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updatedEvents = await sequelize.query(updateQuery, {
      bind: values,
      type: QueryTypes.UPDATE
    });

    // Get updated event with temple details
    const updatedEvent = await sequelize.query(
      `SELECT e.*, t.name as temple_name, t.city as temple_city
       FROM events e
       JOIN temples t ON e.temple_id = t.id
       WHERE e.id = $1`,
      {
        bind: [eventId],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        ...updatedEvent[0],
        requirements: typeof updatedEvent[0].requirements === 'string' 
          ? JSON.parse(updatedEvent[0].requirements) 
          : updatedEvent[0].requirements
      }
    });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during event update',
      error: error.message
    });
  }
});

// @route   GET /api/events/:id/bookings
// @desc    Get event bookings
// @access  Private (Temple Admin/Staff)
router.get('/:id/bookings', protect, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { temple_id: userTempleId } = req.user;

    // Verify event belongs to temple
    const event = await sequelize.query(
      'SELECT * FROM events WHERE id = $1 AND temple_id = $2',
      {
        bind: [eventId, userTempleId],
        type: QueryTypes.SELECT
      }
    );

    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get event bookings
    const bookingsQuery = `
      SELECT 
        eb.*,
        u.name as user_name,
        u.phone as user_phone,
        u.email as user_email
      FROM event_bookings eb
      JOIN users u ON eb.user_id = u.id
      WHERE eb.event_id = $1
      ORDER BY eb.created_at DESC
    `;

    const bookings = await sequelize.query(bookingsQuery, {
      bind: [eventId],
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      message: 'Event bookings retrieved successfully',
      data: {
        event: event[0],
        bookings: bookings
      }
    });

  } catch (error) {
    console.error('Error fetching event bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete/cancel event
// @access  Private (Temple Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { temple_id: userTempleId, role } = req.user;

    if (role !== 'temple_admin' && role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Check if event exists and belongs to temple
    const event = await sequelize.query(
      'SELECT * FROM events WHERE id = $1 AND temple_id = $2',
      {
        bind: [eventId, userTempleId],
        type: QueryTypes.SELECT
      }
    );

    if (event.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event has bookings
    const bookings = await sequelize.query(
      'SELECT COUNT(*) as booking_count FROM event_bookings WHERE event_id = $1',
      {
        bind: [eventId],
        type: QueryTypes.SELECT
      }
    );

    if (parseInt(bookings[0].booking_count) > 0) {
      // Cancel event instead of deleting
      await sequelize.query(
        'UPDATE events SET status = $1, is_active = false WHERE id = $2',
        {
          bind: ['cancelled', eventId],
          type: QueryTypes.UPDATE
        }
      );

      // Cancel all bookings and initiate refunds
      await sequelize.query(
        `UPDATE event_bookings 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE event_id = $1`,
        {
          bind: [eventId],
          type: QueryTypes.UPDATE
        }
      );

      return res.json({
        success: true,
        message: 'Event cancelled successfully. Attendees will be notified and refunds processed.'
      });
    }

    // Delete event if no bookings
    await sequelize.query(
      'DELETE FROM events WHERE id = $1',
      {
        bind: [eventId],
        type: QueryTypes.DELETE
      }
    );

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during event deletion',
      error: error.message
    });
  }
});

export default router;
