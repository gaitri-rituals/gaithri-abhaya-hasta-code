import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMetrics,
  getDonationsChart,
  getVisitorFlow,
  getNotifications,
  acceptNotification,
  rejectNotification,
  getAnalytics
} from '../controllers/dashboardController.js';

const router = express.Router();

// @route   GET /api/dashboard/metrics
// @desc    Get dashboard metrics (matches Dashboard.tsx metrics)
// @access  Private (Temple Admin/Staff)
router.get('/metrics', protect, getMetrics);

// @route   GET /api/dashboard/donations/chart
// @desc    Get donation chart data for the last 6 months
// @access  Private (Temple Admin/Staff)
router.get('/donations/chart', protect, getDonationsChart);

// @route   GET /api/dashboard/visitor-flow
// @desc    Get visitor flow data (hourly breakdown for today)
// @access  Private (Temple Admin/Staff)
router.get('/visitor-flow', protect, getVisitorFlow);

// @route   GET /api/dashboard/notifications
// @desc    Get pending event notifications for temple admin
// @access  Private (Temple Admin only)
router.get('/notifications', protect, getNotifications);

// @route   POST /api/dashboard/notifications/:id/accept
// @desc    Accept a booking notification
// @access  Private (Temple Admin only)
router.post('/notifications/:id/accept', protect, acceptNotification);

// @route   POST /api/dashboard/notifications/:id/reject
// @desc    Reject a booking notification
// @access  Private (Temple Admin only)
router.post('/notifications/:id/reject', protect, rejectNotification);

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data (combines metrics, donations, and visitor data)
// @access  Private (Temple Admin/Staff)
router.get('/analytics', protect, getAnalytics);

export default router;