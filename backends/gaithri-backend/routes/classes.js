import express from 'express';
import { protect, hasPermission } from '../middleware/auth.js';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getClassStats,
  getClassEnrollments,
  enrollInClass
} from '../controllers/classesController.js';

const router = express.Router();

// IMPORTANT: Specific routes must come BEFORE parameterized routes
// Stats routes must be before /:id route

// TODO: For production, add protect middleware back to GET routes
// Public routes (temporarily without auth for development)
router.get('/stats', getClassStats);
router.get('/stats/:templeId', getClassStats);
router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.get('/:id/enrollments', getClassEnrollments);

// Protected enrollment route
router.post('/:id/enroll', protect, enrollInClass);

// Admin routes - temporarily without auth for development
// TODO: For production, add back: protect, hasPermission('manage_classes')
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

export default router;
