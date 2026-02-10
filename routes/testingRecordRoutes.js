/**
 * Testing Record Routes
 * CRUD operations for testing records
 */

const express = require('express');
const router = express.Router();
const testingRecordController = require('../controllers/testingRecordController');
const { authenticate } = require('../middleware/auth');
const { testingRecordUpload } = require('../middleware/upload');

// All routes require authentication
const auth = authenticate();

// Get all testing records
router.get('/', auth, testingRecordController.getAllTestingRecords);

// Get testing record by ID
router.get('/:id', auth, testingRecordController.getTestingRecordById);

// Create new testing record
router.post('/', auth, testingRecordUpload, testingRecordController.createTestingRecord);

// Update testing record
router.put('/:id', auth, testingRecordUpload, testingRecordController.updateTestingRecord);

// Delete testing record
router.delete('/:id', auth, testingRecordController.deleteTestingRecord);

module.exports = router;

