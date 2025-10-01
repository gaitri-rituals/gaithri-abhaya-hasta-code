const express = require('express');
const { login, register, refreshToken, logout } = require('../controllers/authController.js');
const { validateLogin, validateRegister, validateRefreshToken } = require('../middleware/authValidation.js');

const router = express.Router();

router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);
router.post('/refresh-token', validateRefreshToken, refreshToken);
router.post('/logout', logout);

module.exports = router;
