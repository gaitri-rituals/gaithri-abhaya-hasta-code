const db = require('../config/database');

const bookingsController = {
  // Create a new booking
  createBooking: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        temple_id, 
        service_id, 
        booking_date, 
        booking_time, 
        special_requests,
        contact_phone 
      } = req.body;

      // Validate required fields
      if (!temple_id || !service_id || !booking_date || !booking_time) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID, service ID, booking date, and time are required'
        });
      }

      // Check if temple and service exist
      const serviceQuery = `
        SELECT ts.*, t.name as temple_name 
        FROM temple_services ts 
        JOIN temples t ON ts.temple_id = t.id 
        WHERE ts.id = $1 AND ts.temple_id = $2 AND ts.is_active = true
      `;
      const serviceResult = await db.query(serviceQuery, [service_id, temple_id]);

      if (serviceResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found or not available'
        });
      }

      const service = serviceResult.rows[0];

      // Check for existing booking at the same time
      const conflictQuery = `
        SELECT id FROM bookings 
        WHERE temple_id = $1 AND booking_date = $2 AND booking_time = $3 
        AND status IN ('confirmed', 'pending')
      `;
      const conflictResult = await db.query(conflictQuery, [temple_id, booking_date, booking_time]);

      if (conflictResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked'
        });
      }

      // Create booking
      const insertQuery = `
        INSERT INTO bookings (
          user_id, temple_id, service_id, booking_date, booking_time, 
          amount, special_requests, contact_phone, status, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'pending') 
        RETURNING *
      `;

      const result = await db.query(insertQuery, [
        userId, temple_id, service_id, booking_date, booking_time,
        service.price, special_requests, contact_phone
      ]);

      const booking = result.rows[0];

      // Get complete booking details
      const detailsQuery = `
        SELECT b.*, t.name as temple_name, ts.name as service_name, u.name as user_name
        FROM bookings b
        JOIN temples t ON b.temple_id = t.id
        JOIN temple_services ts ON b.service_id = ts.id
        JOIN users u ON b.user_id = u.id
        WHERE b.id = $1
      `;
      const detailsResult = await db.query(detailsQuery, [booking.id]);

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: detailsResult.rows[0]
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's bookings
  getUserBookings: async (req, res) => {
    try {
      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;

      let query = `
        SELECT b.*, t.name as temple_name, t.city, t.state,
               ts.name as service_name, ts.duration,
               (SELECT ti.image_url FROM temple_images ti WHERE ti.temple_id = t.id LIMIT 1) as temple_image
        FROM bookings b
        JOIN temples t ON b.temple_id = t.id
        JOIN temple_services ts ON b.service_id = ts.id
        WHERE b.user_id = $1
      `;

      const params = [userId];

      if (status) {
        query += ' AND b.status = $' + (params.length + 1);
        params.push(status);
      }

      query += ' ORDER BY b.booking_date DESC, b.booking_time DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
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
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get booking by ID
  getBookingById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const query = `
        SELECT b.*, t.name as temple_name, t.address, t.city, t.state, t.phone as temple_phone,
               ts.name as service_name, ts.description as service_description, ts.duration,
               u.name as user_name, u.email as user_email
        FROM bookings b
        JOIN temples t ON b.temple_id = t.id
        JOIN temple_services ts ON b.service_id = ts.id
        JOIN users u ON b.user_id = u.id
        WHERE b.id = $1 AND b.user_id = $2
      `;

      const result = await db.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching booking details:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update booking status
  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Check if booking exists and belongs to user
      const checkQuery = 'SELECT * FROM bookings WHERE id = $1 AND user_id = $2';
      const checkResult = await db.query(checkQuery, [id, userId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const booking = checkResult.rows[0];

      // Only allow cancellation by user
      if (status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel your bookings'
        });
      }

      // Don't allow cancellation of completed bookings
      if (booking.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel completed booking'
        });
      }

      const updateQuery = 'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
      const result = await db.query(updateQuery, [status, id]);

      res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get available time slots for a service
  getAvailableSlots: async (req, res) => {
    try {
      const { temple_id, service_id, date } = req.query;

      if (!temple_id || !service_id || !date) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID, service ID, and date are required'
        });
      }

      // Get temple timings for the day
      const dayOfWeek = new Date(date).getDay();
      const timingsQuery = `
        SELECT * FROM temple_timings 
        WHERE temple_id = $1 AND day_of_week = $2 AND is_active = true
      `;
      const timingsResult = await db.query(timingsQuery, [temple_id, dayOfWeek]);

      if (timingsResult.rows.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Temple is closed on this day'
        });
      }

      const timing = timingsResult.rows[0];

      // Get existing bookings for the date
      const bookingsQuery = `
        SELECT booking_time FROM bookings 
        WHERE temple_id = $1 AND booking_date = $2 
        AND status IN ('confirmed', 'pending')
      `;
      const bookingsResult = await db.query(bookingsQuery, [temple_id, date]);
      const bookedSlots = bookingsResult.rows.map(row => row.booking_time);

      // Generate available slots (every 30 minutes)
      const availableSlots = [];
      const startTime = new Date(`2000-01-01 ${timing.opening_time}`);
      const endTime = new Date(`2000-01-01 ${timing.closing_time}`);

      while (startTime < endTime) {
        const timeString = startTime.toTimeString().slice(0, 5);
        if (!bookedSlots.includes(timeString)) {
          availableSlots.push(timeString);
        }
        startTime.setMinutes(startTime.getMinutes() + 30);
      }

      res.json({
        success: true,
        data: availableSlots
      });
    } catch (error) {
      console.error('Error fetching available slots:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get booking statistics for user
  getBookingStats: async (req, res) => {
    try {
      const userId = req.user.id;

      const statsQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_spent
        FROM bookings 
        WHERE user_id = $1
      `;

      const result = await db.query(statsQuery, [userId]);

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = bookingsController;