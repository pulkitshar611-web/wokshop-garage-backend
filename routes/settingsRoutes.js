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

// Get custom options (Authenticated users)
router.get('/options', authenticate(), settingsController.getOptions);

// Add custom option (Authenticated users)
router.post('/options', authenticate(), settingsController.addOption);

module.exports = router;

