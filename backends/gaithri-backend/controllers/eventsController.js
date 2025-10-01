const db = require('../config/database');

const eventsController = {
  // Get all events with filtering
  getAllEvents: async (req, res) => {
    try {
      const { temple_id, category, upcoming, limit = 20, offset = 0 } = req.query;
      
      let query = `
        SELECT e.*, t.name as temple_name, t.city, t.state,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as temple_image,
               COUNT(er.id) as registered_count
        FROM events e
        JOIN temples t ON e.temple_id = t.id
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'confirmed'
        WHERE e.is_active = true AND t.is_active = true
      `;
      
      const params = [];
      
      if (temple_id) {
        query += ' AND e.temple_id = $' + (params.length + 1);
        params.push(temple_id);
      }
      
      if (category) {
        query += ' AND e.category = $' + (params.length + 1);
        params.push(category);
      }
      
      if (upcoming === 'true') {
        query += ' AND e.event_date >= CURRENT_DATE';
      }
      
      query += `
        GROUP BY e.id, t.id
        ORDER BY e.event_date ASC, e.start_time ASC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get event by ID
  getEventById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT e.*, t.name as temple_name, t.address, t.city, t.state, t.phone as temple_phone,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as temple_image,
               COUNT(er.id) as registered_count
        FROM events e
        JOIN temples t ON e.temple_id = t.id
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'confirmed'
        WHERE e.id = $1 AND e.is_active = true
        GROUP BY e.id, t.id
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching event details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Register for an event
  registerForEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { special_requirements } = req.body;

      // Check if event exists and is active
      const eventQuery = `
        SELECT e.*, COUNT(er.id) as registered_count
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'confirmed'
        WHERE e.id = $1 AND e.is_active = true AND e.event_date >= CURRENT_DATE
        GROUP BY e.id
      `;
      
      const eventResult = await db.query(eventQuery, [id]);

      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found or registration closed'
        });
      }

      const event = eventResult.rows[0];

      // Check if event is full
      if (event.max_participants && event.registered_count >= event.max_participants) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }

      // Check if user is already registered
      const existingQuery = `
        SELECT id FROM event_registrations 
        WHERE event_id = $1 AND user_id = $2 AND status != 'cancelled'
      `;
      const existingResult = await db.query(existingQuery, [id, userId]);

      if (existingResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this event'
        });
      }

      // Create registration
      const registrationQuery = `
        INSERT INTO event_registrations (event_id, user_id, registration_fee, special_requirements, status)
        VALUES ($1, $2, $3, $4, 'confirmed')
        RETURNING *
      `;

      const result = await db.query(registrationQuery, [
        id, userId, event.registration_fee, special_requirements
      ]);

      // Get complete registration details
      const detailsQuery = `
        SELECT er.*, e.title as event_title, e.event_date, e.start_time, e.end_time,
               t.name as temple_name, u.name as user_name
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        JOIN temples t ON e.temple_id = t.id
        JOIN users u ON er.user_id = u.id
        WHERE er.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [result.rows[0].id]);

      res.status(201).json({
        success: true,
        message: 'Successfully registered for event',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error registering for event:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's event registrations
  getUserRegistrations: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, upcoming, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT er.*, e.title, e.description, e.event_date, e.start_time, e.end_time, e.category,
               t.name as temple_name, t.city, t.state,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as temple_image
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        JOIN temples t ON e.temple_id = t.id
        WHERE er.user_id = $1
      `;

      const params = [userId];

      if (status) {
        query += ' AND er.status = $' + (params.length + 1);
        params.push(status);
      }

      if (upcoming === 'true') {
        query += ' AND e.event_date >= CURRENT_DATE';
      }

      query += ' ORDER BY e.event_date ASC, e.start_time ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Cancel event registration
  cancelRegistration: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if registration exists and belongs to user
      const checkQuery = `
        SELECT er.*, e.event_date, e.title
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE er.id = $1 AND er.user_id = $2
      `;
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      const registration = checkResult.rows[0];

      // Check if event has already passed
      if (new Date(registration.event_date) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel registration for past events'
        });
      }

      // Update registration status
      const updateQuery = `
        UPDATE event_registrations 
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 
        RETURNING *
      `;
      const result = await db.query(updateQuery, [id]);

      res.json({
        success: true,
        message: 'Registration cancelled successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error cancelling registration:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get event categories
  getEventCategories: async (req, res) => {
    try {
      const query = `
        SELECT category, COUNT(*) as event_count
        FROM events 
        WHERE is_active = true AND event_date >= CURRENT_DATE
        GROUP BY category 
        ORDER BY event_count DESC
      `;
      
      const result = await db.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching event categories:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get upcoming events for a temple
  getTempleEvents: async (req, res) => {
    try {
      const { temple_id } = req.params;
      const { limit = 10 } = req.query;

      const query = `
        SELECT e.*, COUNT(er.id) as registered_count
        FROM events e
        LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'confirmed'
        WHERE e.temple_id = $1 AND e.is_active = true AND e.event_date >= CURRENT_DATE
        GROUP BY e.id
        ORDER BY e.event_date ASC, e.start_time ASC
        LIMIT $2
      `;

      const result = await db.query(query, [temple_id, limit]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching temple events:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get event registration statistics
  getEventStats: async (req, res) => {
    try {
      const userId = req.user.id;

      const statsQuery = `
        SELECT 
          COUNT(*) as total_registrations,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_registrations,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_registrations,
          COUNT(CASE WHEN e.event_date >= CURRENT_DATE THEN 1 END) as upcoming_events,
          COALESCE(SUM(registration_fee), 0) as total_fees_paid
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE er.user_id = $1
      `;

      const result = await db.query(statsQuery, [userId]);

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching event stats:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = eventsController;