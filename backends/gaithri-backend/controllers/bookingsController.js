import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

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
        WHERE ts.id = ? AND ts.temple_id = ? AND ts.is_available = true
      `;
      const serviceResult = await sequelize.query(serviceQuery, { 
        replacements: [service_id, temple_id],
        type: QueryTypes.SELECT 
      });

      if (serviceResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found or not available'
        });
      }

      const service = serviceResult[0];

      // Check for existing booking at the same time
      const conflictQuery = `
        SELECT id FROM bookings 
        WHERE temple_id = $1 AND booking_date = $2 AND booking_time = $3 
        AND status IN ('confirmed', 'pending')
      `;
      const conflictResult = await sequelize.query(conflictQuery, { replacements: [temple_id, booking_date, booking_time], type: QueryTypes.SELECT });

      if (conflictResult.length > 0) {
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

      const result = await sequelize.query(insertQuery, { 
        replacements: [
          userId, temple_id, service_id, booking_date, booking_time,
          service.price, special_requests, contact_phone
        ], 
        type: QueryTypes.SELECT 
      });

      const booking = result[0];

      // Get complete booking details
      const detailsQuery = `
        SELECT b.*, t.name as temple_name, ts.name as service_name, u.name as user_name
        FROM bookings b
        JOIN temples t ON b.temple_id = t.id
        JOIN temple_services ts ON b.service_id = ts.id
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
      `;
      const detailsResult = await sequelize.query(detailsQuery, { replacements: [booking.id], type: QueryTypes.SELECT });

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: detailsResult[0]
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
               ts.name as service_name
        FROM bookings b
        JOIN temples t ON b.temple_id = t.id
        JOIN temple_services ts ON b.service_id = ts.id
        WHERE b.user_id = :userId
      `;

      const replacements = { userId, limit: parseInt(limit), offset: parseInt(offset) };

      if (status) {
        query += ' AND b.status = :status';
        replacements.status = status;
      }

      query += ' ORDER BY b.booking_date DESC, b.booking_time DESC LIMIT :limit OFFSET :offset';

      const result = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: result,
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
        WHERE b.id = ? AND b.user_id = ?
      `;

      const result = await sequelize.query(query, { replacements: [id, userId], type: QueryTypes.SELECT });

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        data: result[0]
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
      const checkQuery = 'SELECT * FROM bookings WHERE id = ? AND user_id = ?';
      const checkResult = await sequelize.query(checkQuery, { replacements: [id, userId], type: QueryTypes.SELECT });

      if (checkResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const booking = checkResult[0];

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

      const updateQuery = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *';
      const result = await sequelize.query(updateQuery, { replacements: [status, id], type: QueryTypes.SELECT });

      res.json({
        success: true,
        message: 'Booking status updated successfully',
        data: result[0]
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
        WHERE temple_id = ? AND day_of_week = ? AND is_active = true
      `;
      const timingsResult = await sequelize.query(timingsQuery, { replacements: [temple_id, dayOfWeek], type: QueryTypes.SELECT });

      if (timingsResult.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Temple is closed on this day'
        });
      }

      const timing = timingsResult[0];

      // Get existing bookings for the date
      const bookingsQuery = `
        SELECT booking_time FROM bookings 
        WHERE temple_id = ? AND booking_date = ? 
        AND status IN ('confirmed', 'pending')
      `;
      const bookingsResult = await sequelize.query(bookingsQuery, { replacements: [temple_id, date], type: QueryTypes.SELECT });
      const bookedSlots = bookingsResult.map(row => row.booking_time);

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
        WHERE user_id = ?
      `;

      const result = await sequelize.query(statsQuery, { replacements: [userId], type: QueryTypes.SELECT });

      res.json({
        success: true,
        data: result[0]
      });
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Temple Basket functionality
  // Add service to basket
  addToBasket: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        temple_id, 
        service_id, 
        quantity = 1, 
        booking_date, 
        booking_time,
        special_requests,
        devotee_details = []
      } = req.body;

      if (!temple_id || !service_id) {
        return res.status(400).json({
          success: false,
          message: 'Temple ID and service ID are required'
        });
      }

      // Check if service exists and is available
      const serviceQuery = `
        SELECT ts.*, t.name as temple_name 
        FROM temple_services ts 
        JOIN temples t ON ts.temple_id = t.id 
        WHERE ts.id = $1 AND ts.temple_id = $2 AND ts.is_available = true
      `;
      const serviceResult = await sequelize.query(serviceQuery, { replacements: [service_id, temple_id], type: QueryTypes.SELECT });

      if (serviceResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found or not available'
        });
      }

      const service = serviceResult[0];

      // Check if item already in basket
      const existingQuery = 'SELECT * FROM temple_basket WHERE user_id = ? AND service_id = ?';
      const existingResult = await sequelize.query(existingQuery, { replacements: [userId, service_id], type: QueryTypes.SELECT });

      if (existingResult.length > 0) {
        // Update existing basket item
        const updateQuery = `
          UPDATE temple_basket 
          SET quantity = ?, 
              booking_date = ?, 
              booking_time = ?,
              special_requests = ?,
              devotee_details = ?,
              updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = ? AND service_id = ? 
          RETURNING *
        `;
        const result = await sequelize.query(updateQuery, { replacements: [
          quantity, booking_date, booking_time, special_requests, 
          JSON.stringify(devotee_details), userId, service_id
        ], type: QueryTypes.SELECT });
        
        res.json({
          success: true,
          message: 'Basket updated successfully',
          data: result[0]
        });
      } else {
        // Add new item to basket
        const insertQuery = `
          INSERT INTO temple_basket (
            user_id, temple_id, service_id, quantity, 
            booking_date, booking_time, special_requests, devotee_details
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
          RETURNING *
        `;
        const result = await sequelize.query(insertQuery, { replacements: [
          userId, temple_id, service_id, quantity, 
          booking_date, booking_time, special_requests, JSON.stringify(devotee_details)
        ], type: QueryTypes.SELECT });
        
        res.status(201).json({
          success: true,
          message: 'Item added to basket successfully',
          data: result[0]
        });
      }
    } catch (error) {
      console.error('Error adding to basket:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Get user's basket
  getBasket: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT tb.*, ts.name as service_name, ts.price, ts.category, ts.description,
               t.name as temple_name, t.address as temple_address,
               (tb.quantity * ts.price) as total_price
        FROM temple_basket tb
        JOIN temple_services ts ON tb.service_id = ts.id
        JOIN temples t ON tb.temple_id = t.id
        WHERE tb.user_id = ? AND ts.is_available = true
        ORDER BY tb.created_at DESC
      `;
      
      const result = await sequelize.query(query, { replacements: [userId], type: QueryTypes.SELECT });
      
      // Calculate basket totals
      const totalAmount = result.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
      const totalItems = result.reduce((sum, item) => sum + item.quantity, 0);
      
      res.json({
        success: true,
        data: {
          items: result,
          summary: {
            totalItems,
            totalAmount: totalAmount.toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching basket:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Update basket item
  updateBasketItem: async (req, res) => {
    try {
      const userId = req.user.id;
      const basketItemId = req.params.id;
      const { quantity, booking_date, booking_time, special_requests, devotee_details } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      const updateQuery = `
        UPDATE temple_basket 
        SET quantity = ?, 
            booking_date = ?, 
            booking_time = ?,
            special_requests = ?,
            devotee_details = ?,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ? 
        RETURNING *
      `;

      const result = await sequelize.query(updateQuery, { replacements: [
        quantity, booking_date, booking_time, special_requests, 
        JSON.stringify(devotee_details), basketItemId, userId
      ], type: QueryTypes.SELECT });

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Basket item not found'
        });
      }

      res.json({
        success: true,
        message: 'Basket item updated successfully',
        data: result[0]
      });
    } catch (error) {
      console.error('Error updating basket item:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Remove item from basket
  removeFromBasket: async (req, res) => {
    try {
      const userId = req.user.id;
      const basketItemId = req.params.id;

      const deleteQuery = 'DELETE FROM temple_basket WHERE id = ? AND user_id = ? RETURNING *';
      const result = await sequelize.query(deleteQuery, { replacements: [basketItemId, userId], type: QueryTypes.SELECT });

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Basket item not found'
        });
      }

      res.json({
        success: true,
        message: 'Item removed from basket successfully'
      });
    } catch (error) {
      console.error('Error removing from basket:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Clear basket
  clearBasket: async (req, res) => {
    try {
      const userId = req.user.id;

      const deleteQuery = 'DELETE FROM temple_basket WHERE user_id = ?';
      await sequelize.query(deleteQuery, { replacements: [userId], type: QueryTypes.SELECT });

      res.json({
        success: true,
        message: 'Basket cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing basket:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // Checkout basket - convert basket items to bookings
  checkoutBasket: async (req, res) => {
    try {
      const userId = req.user.id;
      const { payment_method = 'razorpay' } = req.body;

      // Get basket items
      const basketQuery = `
        SELECT tb.*, ts.name as service_name, ts.price, ts.category,
               t.name as temple_name,
               (tb.quantity * ts.price) as total_price
        FROM temple_basket tb
        JOIN temple_services ts ON tb.service_id = ts.id
        JOIN temples t ON tb.temple_id = t.id
        WHERE tb.user_id = ? AND ts.is_available = true
      `;
      
      const basketResult = await sequelize.query(basketQuery, { replacements: [userId], type: QueryTypes.SELECT });

      if (basketResult.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Basket is empty'
        });
      }

      const basketItems = basketResult;
      const totalAmount = basketItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);

      // Create bookings for each basket item
      const bookings = [];
      
      for (const item of basketItems) {
        // Create individual booking
        const bookingQuery = `
          INSERT INTO bookings (
            user_id, temple_id, service_id, booking_date, booking_time, 
            amount, status, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending') 
          RETURNING *
        `;

        const bookingResult = await sequelize.query(bookingQuery, { replacements: [
          userId, item.temple_id, item.service_id, 
          item.booking_date, item.booking_time,
          item.total_price
        ], type: QueryTypes.SELECT });

        bookings.push(bookingResult[0]);
      }

      // Clear basket after creating bookings
      await sequelize.query('DELETE FROM temple_basket WHERE user_id = ?', { replacements: [userId], type: QueryTypes.SELECT });

      res.status(201).json({
        success: true,
        message: 'Basket checkout successful',
        data: {
          bookings,
          totalAmount: totalAmount.toFixed(2),
          payment_method
        }
      });
    } catch (error) {
      console.error('Error during basket checkout:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

export default bookingsController;