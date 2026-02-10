/**
 * Settings Routes
 * CRUD operations for workshop settings
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

// All routes require admin authentication
const auth = authenticate('admin');

// Get settings (Admin only)
router.get('/', auth, settingsController.getSettings);

// Update settings (Admin only)
router.put('/', auth, settingsController.updateSettings);

module.exports = router;

