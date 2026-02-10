/**
 * Inventory Routes
 * CRUD operations for inventory items
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication (admin or storekeeper)
const auth = authenticate(['admin', 'storekeeper']);

// Get all inventory items
router.get('/', auth, inventoryController.getAllInventoryItems);

// Get inventory item by ID
router.get('/:id', auth, inventoryController.getInventoryItemById);

// Create new inventory item
router.post('/', auth, inventoryController.createInventoryItem);

// Update inventory item
router.put('/:id', auth, inventoryController.updateInventoryItem);

// Delete inventory item
router.delete('/:id', auth, inventoryController.deleteInventoryItem);

// Stock In - Add stock
router.post('/:id/stock-in', auth, inventoryController.stockIn);

// Stock Out - Deduct stock
router.post('/:id/stock-out', auth, inventoryController.stockOut);

// Get stock transactions for an item
router.get('/:id/transactions', auth, inventoryController.getStockTransactions);

module.exports = router;

