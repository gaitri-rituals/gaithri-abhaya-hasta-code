const { executeQuery } = require('../utils/dbHelpers.js');

// @desc    Get all events with filtering
// @route   GET /api/events
// @access  Private (Admin)
const getEvents = async (req, res) => {
  try {
    const { search, status, priority, category, startDate, endDate } = req.query;
    
    let whereConditions = [];
    let bindings = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(LOWER(e.title) LIKE LOWER($${paramIndex}) OR LOWER(e.customer_name) LIKE LOWER($${paramIndex}) OR LOWER(e.location) LIKE LOWER($${paramIndex}))`);
      bindings.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`e.status = $${paramIndex}`);
      bindings.push(status);
      paramIndex++;
    }

    if (priority) {
      whereConditions.push(`e.priority = $${paramIndex}`);
      bindings.push(priority);
      paramIndex++;
    }

    if (category) {
      whereConditions.push(`e.category_name = $${paramIndex}`);
      bindings.push(category);
      paramIndex++;
    }

    if (startDate) {
      whereConditions.push(`e.event_date >= $${paramIndex}`);
      bindings.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereConditions.push(`e.event_date <= $${paramIndex}`);
      bindings.push(endDate);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        e.*,
        t.name as temple_name
      FROM events e
      LEFT JOIN temples t ON e.temple_id = t.id
      ${whereClause}
      ORDER BY e.event_date DESC, e.created_at DESC
    `;

    const events = await executeQuery(query, { bindings });

    res.json({
      success: true,
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
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Private (Admin)
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        e.*,
        t.name as temple_name,
        t.email as temple_email,
        t.phone as temple_phone
      FROM events e
      LEFT JOIN temples t ON e.temple_id = t.id
      WHERE e.id = $1
    `;

    const events = await executeQuery(query, { bindings: [id] });

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get responses for this event
    const responsesQuery = `
      SELECT 
        er.*,
        t.name as temple_name
      FROM event_responses er
      LEFT JOIN temples t ON er.temple_id = t.id
      WHERE er.event_id = $1
      ORDER BY er.responded_at DESC
    `;

    const responses = await executeQuery(responsesQuery, { bindings: [id] });

    res.json({
      success: true,
      data: {
        ...events[0],
        responses
      }
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private (Admin)
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      categoryName,
      customerName,
      contactPerson,
      phone,
      email,
      location,
      estimatedBudget,
      requirements,
      priority
    } = req.body;

    const createdBy = req.user?.id;

    if (!title || !eventDate || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Title, event date, and customer name are required'
      });
    }

    const query = `
      INSERT INTO events (
        title, description, event_date, category_name, customer_name,
        contact_person, phone, email, location, estimated_budget,
        requirements, priority, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await executeQuery(query, {
      bindings: [
        title,
        description || null,
        eventDate,
        categoryName || null,
        customerName,
        contactPerson || null,
        phone || null,
        email || null,
        location || null,
        estimatedBudget || null,
        requirements || null,
        priority || 'normal',
        createdBy
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      eventDate,
      categoryName,
      customerName,
      contactPerson,
      phone,
      email,
      location,
      estimatedBudget,
      actualBudget,
      requirements,
      priority,
      status,
      templeId,
      acceptedBy,
      attendees,
      rating,
      review,
      feedback
    } = req.body;

    const query = `
      UPDATE events
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        event_date = COALESCE($3, event_date),
        category_name = COALESCE($4, category_name),
        customer_name = COALESCE($5, customer_name),
        contact_person = COALESCE($6, contact_person),
        phone = COALESCE($7, phone),
        email = COALESCE($8, email),
        location = COALESCE($9, location),
        estimated_budget = COALESCE($10, estimated_budget),
        actual_budget = COALESCE($11, actual_budget),
        requirements = COALESCE($12, requirements),
        priority = COALESCE($13, priority),
        status = COALESCE($14, status),
        temple_id = COALESCE($15, temple_id),
        accepted_by = COALESCE($16, accepted_by),
        attendees = COALESCE($17, attendees),
        rating = COALESCE($18, rating),
        review = COALESCE($19, review),
        feedback = COALESCE($20, feedback),
        accepted_date = CASE WHEN $14 IN ('confirmed', 'in_preparation') AND accepted_date IS NULL THEN CURRENT_TIMESTAMP ELSE accepted_date END,
        execution_date = CASE WHEN $14 = 'completed' AND execution_date IS NULL THEN event_date ELSE execution_date END
      WHERE id = $21
      RETURNING *
    `;

    const result = await executeQuery(query, {
      bindings: [
        title, description, eventDate, categoryName, customerName,
        contactPerson, phone, email, location, estimatedBudget,
        actualBudget, requirements, priority, status, templeId,
        acceptedBy, attendees, rating, review, feedback, id
      ]
    });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM events WHERE id = $1 RETURNING id`;
    const result = await executeQuery(query, { bindings: [id] });

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private (Admin)
const getEventStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN status = 'needs_confirmation' THEN 1 END) as needs_confirmation,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'in_preparation' THEN 1 END) as in_preparation,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        AVG(CASE WHEN rating IS NOT NULL THEN rating END) as average_rating,
        SUM(CASE WHEN actual_budget IS NOT NULL THEN actual_budget ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'completed' AND actual_budget IS NOT NULL THEN actual_budget ELSE 0 END) as completed_revenue
      FROM events
    `;

    const stats = await executeQuery(statsQuery, { bindings: [] });

    res.json({
      success: true,
      data: {
        totalEvents: parseInt(stats[0].total_events),
        needsConfirmation: parseInt(stats[0].needs_confirmation),
        pending: parseInt(stats[0].pending),
        confirmed: parseInt(stats[0].confirmed),
        inPreparation: parseInt(stats[0].in_preparation),
        completed: parseInt(stats[0].completed),
        cancelled: parseInt(stats[0].cancelled),
        highPriority: parseInt(stats[0].high_priority),
        averageRating: parseFloat(stats[0].average_rating) || 0,
        totalRevenue: parseFloat(stats[0].total_revenue) || 0,
        completedRevenue: parseFloat(stats[0].completed_revenue) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats
};
