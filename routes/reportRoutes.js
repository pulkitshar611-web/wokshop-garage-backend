/**
 * Report Routes
 * Generate various reports
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
const auth = authenticate();

// Get report by type
router.get('/:reportType', auth, reportController.generateReport);

module.exports = router;

