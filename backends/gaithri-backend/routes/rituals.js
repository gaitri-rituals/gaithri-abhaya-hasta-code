import express from 'express';
import { protect, hasPermission } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/rituals
// @desc    Get all rituals
// @access  Private
router.get('/', protect, async (req, res) => {
  res.json({ message: 'Get rituals - To be implemented' });
});

// @route   POST /api/rituals
// @desc    Create new ritual
// @access  Private
router.post('/', protect, hasPermission('manage_rituals'), async (req, res) => {
  res.json({ message: 'Create ritual - To be implemented' });
});

export default router;
