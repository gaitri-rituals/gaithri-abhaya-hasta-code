const express = require('express');
const {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorStats
} = require('../controllers/vendorsController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats route must come before /:id route
router.get('/stats', getVendorStats);

// Main CRUD routes
router.route('/')
  .get(getVendors)
  .post(createVendor);

router.route('/:id')
  .get(getVendorById)
  .put(updateVendor)
  .delete(deleteVendor);

module.exports = router;
