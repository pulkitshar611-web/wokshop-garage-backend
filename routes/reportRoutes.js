/**
 * Report Routes
 * Generate various reports
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// All routes require admin authentication
const adminAuth = authenticate(['admin']);

// Get report by type
router.get('/:reportType', adminAuth, reportController.generateReport);

module.exports = router;

