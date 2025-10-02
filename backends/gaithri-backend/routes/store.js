import express from 'express';
import { protect, hasPermission } from '../middleware/auth.js';
import storeController from '../controllers/storeController.js';

const router = express.Router();

// Public routes (can be accessed without auth for browsing)
router.get('/items', storeController.getStoreItems);
router.get('/items/:id', storeController.getStoreItemById);
router.get('/categories', storeController.getStoreCategories);

// Protected cart routes (require authentication)
router.get('/cart', protect, storeController.getCart);
router.post('/cart', protect, storeController.addToCart);
router.put('/cart/:id', protect, storeController.updateCartItem);
router.delete('/cart/:id', protect, storeController.removeFromCart);
router.delete('/cart', protect, storeController.clearCart);

// Protected order routes (require authentication)
router.post('/orders', protect, storeController.createOrder);
router.get('/orders', protect, storeController.getUserOrders);
router.get('/orders/:id', protect, storeController.getOrderById);

export default router;
