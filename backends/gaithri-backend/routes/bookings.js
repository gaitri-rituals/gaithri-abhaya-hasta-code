import express from 'express';
import { protect } from '../middleware/auth.js';
import bookingsController from '../controllers/bookingsController.js';

const router = express.Router();

// Temple booking routes
router.post('/', protect, bookingsController.createBooking);
router.get('/my-bookings', protect, bookingsController.getUserBookings);
router.get('/available-slots/:templeId/:date', bookingsController.getAvailableSlots);
router.get('/stats', protect, bookingsController.getBookingStats);

// Temple basket routes (for managing multiple services before booking)
router.post('/basket/add', protect, bookingsController.addToBasket);
router.get('/basket', protect, bookingsController.getBasket);
router.put('/basket/:id', protect, bookingsController.updateBasketItem);
router.delete('/basket/:id', protect, bookingsController.removeFromBasket);
router.delete('/basket', protect, bookingsController.clearBasket);
router.post('/basket/checkout', protect, bookingsController.checkoutBasket);

// These routes with parameters should come last to avoid conflicts
router.get('/:id', protect, bookingsController.getBookingById);
router.put('/:id/status', protect, bookingsController.updateBookingStatus);

export default router;