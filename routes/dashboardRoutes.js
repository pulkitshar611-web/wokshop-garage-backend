/**
 * Dashboard Routes
 * Dashboard statistics endpoints
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
const auth = authenticate();

// Get dashboard statistics
router.get('/stats', auth, dashboardController.getDashboardStats);

module.exports = router;

