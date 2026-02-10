/**
 * Invoice Routes
 * CRUD operations for invoices
 */

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate } = require('../middleware/auth');

// All routes require admin authentication
const adminAuth = authenticate(['admin']);

// Get all invoices
router.get('/', adminAuth, invoiceController.getAllInvoices);

// Get invoice by ID
router.get('/:id', adminAuth, invoiceController.getInvoiceById);

// Create new invoice
router.post('/', adminAuth, invoiceController.createInvoice);

// Update invoice
router.put('/:id', adminAuth, invoiceController.updateInvoice);

// Delete invoice
router.delete('/:id', adminAuth, invoiceController.deleteInvoice);

module.exports = router;

