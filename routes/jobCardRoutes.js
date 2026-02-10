/**
 * Job Card Routes
 * CRUD operations for job cards
 */

const express = require('express');
const router = express.Router();
const jobCardController = require('../controllers/jobCardController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
const auth = authenticate();

// Get all job cards
router.get('/', auth, jobCardController.getAllJobCards);

// Get job card by ID
router.get('/:id', auth, jobCardController.getJobCardById);

// Create new job card
router.post('/', auth, jobCardController.createJobCard);

// Update job card
router.put('/:id', auth, jobCardController.updateJobCard);

// Delete job card
router.delete('/:id', auth, jobCardController.deleteJobCard);

module.exports = router;

