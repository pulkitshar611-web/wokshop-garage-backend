/**
 * Payment Routes
 * CRUD operations for payments
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// All routes require admin authentication
const adminAuth = authenticate(['admin']);

// Get all payments
router.get('/', adminAuth, paymentController.getAllPayments);

// Get payment by ID
router.get('/:id', adminAuth, paymentController.getPaymentById);

// Create new payment
router.post('/', adminAuth, paymentController.createPayment);

// Update payment
router.put('/:id', adminAuth, paymentController.updatePayment);

// Delete payment
router.delete('/:id', adminAuth, paymentController.deletePayment);

// Get payment statistics
router.get('/stats/summary', adminAuth, paymentController.getPaymentStats);

module.exports = router;

