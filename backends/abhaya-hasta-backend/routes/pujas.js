const express = require('express');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ message: 'Get pujas - To be implemented' });
});

module.exports = router;
