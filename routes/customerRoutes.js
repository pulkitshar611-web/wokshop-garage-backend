/**
 * Customer Routes
 * CRUD operations for customers (admin and storekeeper)
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication (admin or storekeeper)
const auth = authenticate(['admin', 'storekeeper']);

// Get all customers
router.get('/', auth, customerController.getAllCustomers);

// Get customer by ID
router.get('/:id', auth, customerController.getCustomerById);

// Create new customer
router.post('/', auth, customerController.createCustomer);

// Update customer
router.put('/:id', auth, customerController.updateCustomer);

// Delete customer
router.delete('/:id', auth, customerController.deleteCustomer);

module.exports = router;

