import express from 'express';
import { protect, hasPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  res.json({ message: 'Get vendors - To be implemented' });
});

router.post('/', protect, hasPermission('manage_vendors'), async (req, res) => {
  res.json({ message: 'Create vendor - To be implemented' });
});

export default router;
