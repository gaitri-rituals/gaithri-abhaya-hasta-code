import express from 'express';
import { protect, hasPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, hasPermission('manage_staff'), async (req, res) => {
  res.json({ message: 'Get users - To be implemented' });
});

export default router;
