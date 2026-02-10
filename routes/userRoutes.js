/**
 * User Routes
 * CRUD operations for users (admin only)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// All routes require admin authentication
const adminAuth = authenticate(['admin']);

// Get all users
router.get('/', adminAuth, userController.getAllUsers);

// Get user by ID
router.get('/:id', adminAuth, userController.getUserById);

// Create new user
router.post('/', adminAuth, userController.createUser);

// Update user
router.put('/:id', adminAuth, userController.updateUser);

// Delete user
router.delete('/:id', adminAuth, userController.deleteUser);

module.exports = router;

