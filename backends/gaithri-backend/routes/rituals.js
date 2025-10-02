import express from 'express';
import { protect, hasPermission } from '../middleware/auth.js';
import ritualsController from '../controllers/ritualsController.js';

const router = express.Router();

// Public routes (browsing rituals)
router.get('/categories', ritualsController.getRitualCategories);
router.get('/packages-config', ritualsController.getPackageConfigurations);
router.get('/catering-config', ritualsController.getCateringConfigurations);
router.get('/addons-config', ritualsController.getAddOnServicesConfigurations);
router.get('/', ritualsController.getAllRituals);
router.get('/category/:category', ritualsController.getRitualsByCategory);
router.get('/:id', ritualsController.getRitualById);
router.get('/:ritual_id/packages', ritualsController.getRitualPackages);

// Protected booking routes (require authentication)
router.post('/bookings', protect, ritualsController.createRitualBooking);
router.get('/bookings/my-bookings', protect, ritualsController.getUserRitualBookings);

export default router;
