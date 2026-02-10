/**
 * Quotation Routes
 * CRUD operations for quotations
 */

const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const { authenticate } = require('../middleware/auth');

// All routes require admin authentication
const adminAuth = authenticate(['admin']);

// Get all quotations
router.get('/', adminAuth, quotationController.getAllQuotations);

// Get quotation by ID
router.get('/:id', adminAuth, quotationController.getQuotationById);

// Create new quotation
router.post('/', adminAuth, quotationController.createQuotation);

// Update quotation
router.put('/:id', adminAuth, quotationController.updateQuotation);

// Delete quotation
router.delete('/:id', adminAuth, quotationController.deleteQuotation);

module.exports = router;

