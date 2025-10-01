const { executeQuery, startTransaction, handleDatabaseError } = require('../utils/dbHelpers.js');
const { QueryTypes } = require('sequelize');

/**
 * Create a new booking
 * @route POST /api/v1/bookings
 */
const createBooking = async (req, res) => {
  const transaction = await startTransaction();

  try {
    const { templeId, serviceId, date, time, notes } = req.body;
    const userId = req.user.id;

    // Check if temple exists and is active
    const temples = await executeQuery(
      'SELECT id FROM temples WHERE id = $1 AND status = \'active\'',
      { bindings: [templeId], transaction }
    );

    if (!temples.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Temple not found or inactive'
      });
    }

    // Check if service exists and is active
    const services = await executeQuery(
      'SELECT id, duration FROM temple_services WHERE id = $1 AND temple_id = $2 AND is_active = true',
      { bindings: [serviceId, templeId], transaction }
    );

    if (!services.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Check for time conflicts
    const bookingTime = new Date(`${date}T${time}`);
    const endTime = new Date(bookingTime.getTime() + services[0].duration * 60000);

    const conflicts = await executeQuery(
      `SELECT id FROM bookings 
       WHERE temple_id = $1 
       AND date = $2 
       AND (
         (time <= $3 AND time + (duration * interval '1 minute') > $3) OR
         (time < $4 AND time + (duration * interval '1 minute') >= $4)
       )
       AND status != 'cancelled'`,
      {
        bindings: [templeId, date, time, endTime.toTimeString().split(' ')[0]],
        transaction
      }
    );

    if (conflicts.length) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Create booking
    const [booking] = await executeQuery(
      `INSERT INTO bookings (user_id, temple_id, service_id, date, time, notes, status, duration)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING id, date, time, status`,
      {
        bindings: [userId, templeId, serviceId, date, time, notes, services[0].duration],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    await transaction.rollback();
    const errorResponse = handleDatabaseError(error, 'booking creation');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Get user's bookings
 * @route GET /api/v1/bookings
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT b.id, b.date, b.time, b.status, b.notes,
             t.name as temple_name, t.address,
             s.name as service_name, s.price
      FROM bookings b
      JOIN temples t ON b.temple_id = t.id
      JOIN temple_services s ON b.service_id = s.id
      WHERE b.user_id = $1
    `;
    const bindings = [userId];

    if (status) {
      query += ' AND b.status = $2';
      bindings.push(status);
    }

    query += ' ORDER BY b.date DESC, b.time DESC';

    const bookings = await executeQuery(query, { bindings });

    return res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'fetching user bookings');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Get booking by ID
 * @route GET /api/v1/bookings/:id
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bookings = await executeQuery(
      `SELECT b.id, b.date, b.time, b.status, b.notes,
              t.name as temple_name, t.address,
              s.name as service_name, s.price,
              u.name as user_name, u.phone
       FROM bookings b
       JOIN temples t ON b.temple_id = t.id
       JOIN temple_services s ON b.service_id = s.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id = $1 AND (b.user_id = $2 OR $3 = 'admin')`,
      { bindings: [id, userId, req.user.role] }
    );

    if (!bookings.length) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    return res.json({
      success: true,
      data: bookings[0]
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error, 'fetching booking details');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Cancel booking
 * @route PUT /api/v1/bookings/:id/cancel
 */
const cancelBooking = async (req, res) => {
  const transaction = await startTransaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if booking exists and belongs to user
    const bookings = await executeQuery(
      'SELECT status FROM bookings WHERE id = $1 AND user_id = $2',
      { bindings: [id, userId], transaction }
    );

    if (!bookings.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (bookings[0].status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Update booking status
    await executeQuery(
      'UPDATE bookings SET status = \'cancelled\', updated_at = NOW() WHERE id = $1',
      { bindings: [id], type: QueryTypes.UPDATE, transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    await transaction.rollback();
    const errorResponse = handleDatabaseError(error, 'cancelling booking');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Reschedule booking
 * @route PUT /api/v1/bookings/:id/reschedule
 */
const rescheduleBooking = async (req, res) => {
  const transaction = await startTransaction();

  try {
    const { id } = req.params;
    const { date, time } = req.body;
    const userId = req.user.id;

    // Check if booking exists and belongs to user
    const bookings = await executeQuery(
      `SELECT b.status, b.temple_id, b.service_id, s.duration
       FROM bookings b
       JOIN temple_services s ON b.service_id = s.id
       WHERE b.id = $1 AND b.user_id = $2`,
      { bindings: [id, userId], transaction }
    );

    if (!bookings.length) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (bookings[0].status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a cancelled booking'
      });
    }

    // Check for time conflicts
    const bookingTime = new Date(`${date}T${time}`);
    const endTime = new Date(bookingTime.getTime() + bookings[0].duration * 60000);

    const conflicts = await executeQuery(
      `SELECT id FROM bookings 
       WHERE temple_id = $1 
       AND date = $2 
       AND id != $3
       AND (
         (time <= $4 AND time + (duration * interval '1 minute') > $4) OR
         (time < $5 AND time + (duration * interval '1 minute') >= $5)
       )
       AND status != 'cancelled'`,
      {
        bindings: [bookings[0].temple_id, date, id, time, endTime.toTimeString().split(' ')[0]],
        transaction
      }
    );

    if (conflicts.length) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Update booking
    await executeQuery(
      'UPDATE bookings SET date = $1, time = $2, updated_at = NOW() WHERE id = $3',
      { bindings: [date, time, id], type: QueryTypes.UPDATE, transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Booking rescheduled successfully'
    });
  } catch (error) {
    await transaction.rollback();
    const errorResponse = handleDatabaseError(error, 'rescheduling booking');
    return res.status(errorResponse.status).json(errorResponse);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking
};