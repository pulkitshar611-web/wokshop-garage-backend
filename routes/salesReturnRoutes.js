/**
 * Sales Return Routes
 */

const express = require('express');
const router = express.Router();
const salesReturnController = require('../controllers/salesReturnController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication and admin role
router.get('/', authenticate(['admin']), salesReturnController.getAllSalesReturns);
router.get('/:id', authenticate(['admin']), salesReturnController.getSalesReturnById);
router.post('/', authenticate(['admin']), salesReturnController.createSalesReturn);
router.put('/:id', authenticate(['admin']), salesReturnController.updateSalesReturn);
router.delete('/:id', authenticate(['admin']), salesReturnController.deleteSalesReturn);

module.exports = router;
