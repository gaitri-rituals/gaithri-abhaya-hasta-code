const express = require('express');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats
} = require('../controllers/eventsController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Stats route must come before /:id route
router.get('/stats', getEventStats);

// Main CRUD routes
router.route('/')
  .get(getEvents)
  .post(createEvent);

router.route('/:id')
  .get(getEventById)
  .put(updateEvent)
  .delete(deleteEvent);

module.exports = router;
