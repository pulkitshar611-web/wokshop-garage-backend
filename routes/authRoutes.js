/**
 * Authentication Routes
 * POST /api/auth/login - User login
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login route (public)
router.post('/login', authController.login);

module.exports = router;

