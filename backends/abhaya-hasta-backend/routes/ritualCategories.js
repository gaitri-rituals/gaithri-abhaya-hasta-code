const express = require('express');
const {
  getRitualCategories,
  getRitualCategoryById,
  createRitualCategory,
  updateRitualCategory,
  deleteRitualCategory,
  getRitualCategoryStats
} = require('../controllers/ritualCategoryController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats route must come before /:id route
router.get('/stats', getRitualCategoryStats);

// Main CRUD routes
router.route('/')
  .get(getRitualCategories)
  .post(createRitualCategory);

router.route('/:id')
  .get(getRitualCategoryById)
  .put(updateRitualCategory)
  .delete(deleteRitualCategory);

module.exports = router;
