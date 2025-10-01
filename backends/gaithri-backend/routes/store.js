import express from 'express';
import { protect, hasPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, hasPermission('manage_store'), async (req, res) => {
  res.json({ message: 'Get store products - To be implemented' });
});

router.post('/', protect, hasPermission('manage_store'), async (req, res) => {
  res.json({ message: 'Create store product - To be implemented' });
});

export default router;
