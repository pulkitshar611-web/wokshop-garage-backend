/**
 * Job Card Routes
 * CRUD operations for job cards
 */

const express = require('express');
const router = express.Router();
const jobCardController = require('../controllers/jobCardController');
const { authenticate } = require('../middleware/auth');

// Authentication with role restrictions
const adminStorekeeperAuth = authenticate(['admin', 'storekeeper']);
const allAuth = authenticate(); // All authenticated users can view
const technicianAuth = authenticate(['admin', 'technician', 'storekeeper']);

// Get all job cards (All authenticated users)
router.get('/', allAuth, jobCardController.getAllJobCards);

// Get job card by ID (All authenticated users)
router.get('/:id', allAuth, jobCardController.getJobCardById);

// Create new job card (Admin & Storekeeper only)
router.post('/', adminStorekeeperAuth, jobCardController.createJobCard);

// Update job card (Admin, Technician - for status updates)
router.put('/:id', technicianAuth, jobCardController.updateJobCard);

// Delete job card (Admin only)
router.delete('/:id', authenticate(['admin']), jobCardController.deleteJobCard);

// Job Card Materials routes
const jobCardMaterialsController = require('../controllers/jobCardMaterialsController');

// Get materials for a job card
router.get('/:id/materials', authenticate(), jobCardMaterialsController.getJobCardMaterials);

// Add material to job card
router.post('/:id/materials', authenticate(['admin', 'storekeeper']), jobCardMaterialsController.addJobCardMaterial);

// Remove material from job card
router.delete('/:id/materials/:materialId', authenticate(['admin', 'storekeeper']), jobCardMaterialsController.removeJobCardMaterial);

module.exports = router;

