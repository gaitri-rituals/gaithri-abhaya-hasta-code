import express from 'express';
import { protect, hasPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, hasPermission('manage_classes'), async (req, res) => {
  res.json({ message: 'Get classes - To be implemented' });
});

router.post('/', protect, hasPermission('manage_classes'), async (req, res) => {
  res.json({ message: 'Create class - To be implemented' });
});

export default router;
