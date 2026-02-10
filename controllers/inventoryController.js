/**
 * Inventory Controller
 * CRUD operations for inventory items
 */

const pool = require('../config/db');

/**
 * Get all inventory items
 * GET /api/inventory
 * Query params: category, status, search
 */
const getAllInventoryItems = async (req, res) => {
  try {
    const { category, status, search } = req.query;

    let query = `
      SELECT 
        id, part_name, part_code, barcode, category, supplier,
        available_stock, min_stock_level, unit_price, 
        wholesale_price, sales_price, purchase_price,
        created_at, updated_at
      FROM inventory_items
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (status && status !== 'all') {
      if (status === 'Low') {
        query += ' AND available_stock <= min_stock_level';
      } else if (status === 'OK') {
        query += ' AND available_stock > min_stock_level';
      }
    }

    if (search) {
      query += ` AND (
        part_name LIKE ? OR 
        part_code LIKE ? OR 
        barcode LIKE ? OR
        supplier LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    const [items] = await pool.execute(query, params);

    // Add status field based on stock level and hide sensitive prices for non-admins
    const formattedItems = items.map(item => {
      const formatted = {
        id: item.id,
        partName: item.part_name,
        partCode: item.part_code,
        barcode: item.barcode,
        category: item.category,
        supplier: item.supplier,
        availableStock: item.available_stock,
        minStockLevel: item.min_stock_level,
        unitPrice: item.unit_price,
        salesPrice: item.sales_price,
        status: item.available_stock <= item.min_stock_level ? 'Low' : 'OK',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };

      // Only show purchase and wholesale price to admins
      if (req.user && req.user.role === 'admin') {
        formatted.purchasePrice = item.purchase_price;
        formatted.wholesalePrice = item.wholesale_price;
      }

      return formatted;
    });

    res.json({
      success: true,
      data: formattedItems,
      count: formattedItems.length
    });
  } catch (error) {
    console.error('Get all inventory items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory items'
    });
  }
};

/**
 * Get inventory item by ID
 * GET /api/inventory/:id
 */
const getInventoryItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const [items] = await pool.execute(
      `SELECT 
        id, part_name, part_code, barcode, category, supplier,
        available_stock, min_stock_level, unit_price,
        wholesale_price, sales_price, purchase_price,
        created_at, updated_at
      FROM inventory_items WHERE id = ?`,
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    const item = items[0];
    const formattedItem = {
      id: item.id,
      partName: item.part_name,
      partCode: item.part_code,
      barcode: item.barcode,
      category: item.category,
      supplier: item.supplier,
      availableStock: item.available_stock,
      minStockLevel: item.min_stock_level,
      unitPrice: item.unit_price,
      salesPrice: item.sales_price,
      status: item.available_stock <= item.min_stock_level ? 'Low' : 'OK',
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };

    // Only show purchase and wholesale price to admins
    if (req.user && req.user.role === 'admin') {
      formattedItem.purchasePrice = item.purchase_price;
      formattedItem.wholesalePrice = item.wholesale_price;
    }

    res.json({
      success: true,
      data: formattedItem
    });
  } catch (error) {
    console.error('Get inventory item by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory item'
    });
  }
};

/**
 * Create new inventory item
 * POST /api/inventory
 * Body: { partName, partCode, category, supplier, availableStock, minStockLevel }
 */
const createInventoryItem = async (req, res) => {
  try {
    const { partName, partCode, barcode, category, supplier, availableStock, minStockLevel, unitPrice, wholesalePrice, salesPrice, purchasePrice } = req.body;

    // Barcode handle: If not provided, generate a 12-digit numeric barcode
    let finalBarcode = barcode;
    if (!finalBarcode) {
      finalBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    }

    // Validate required fields
    if (!partName || !category) {
      return res.status(400).json({
        success: false,
        error: 'Part name and category are required'
      });
    }

    // Check if part code or barcode already exists
    if (partCode || finalBarcode) {
      const [existingItems] = await pool.execute(
        'SELECT id FROM inventory_items WHERE part_code = ? OR barcode = ?',
        [partCode || null, finalBarcode]
      );

      if (existingItems.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Part code already exists'
        });
      }
    }

    // Insert inventory item
    const [result] = await pool.execute(
      `INSERT INTO inventory_items (
        part_name, part_code, barcode, category, supplier,
        available_stock, min_stock_level, unit_price,
        wholesale_price, sales_price, purchase_price,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        partName,
        partCode || null,
        finalBarcode,
        category,
        supplier || null,
        availableStock || 0,
        minStockLevel || 0,
        unitPrice || 0,
        wholesalePrice || 0,
        salesPrice || 0,
        purchasePrice || 0
      ]
    );

    // Fetch created item
    const [items] = await pool.execute(
      `SELECT 
        id, part_name, part_code, barcode, category, supplier,
        available_stock, min_stock_level, unit_price,
        wholesale_price, sales_price, purchase_price,
        created_at, updated_at
      FROM inventory_items WHERE id = ?`,
      [result.insertId]
    );

    const item = items[0];
    const formattedItem = {
      id: item.id,
      partName: item.part_name,
      partCode: item.part_code,
      barcode: item.barcode,
      category: item.category,
      supplier: item.supplier,
      availableStock: item.available_stock,
      minStockLevel: item.min_stock_level,
      unitPrice: item.unit_price,
      wholesalePrice: item.wholesale_price,
      salesPrice: item.sales_price,
      purchasePrice: item.purchase_price,
      status: item.available_stock <= item.min_stock_level ? 'Low' : 'OK'
    };

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: formattedItem
    });
  } catch (error) {
    console.error('Create inventory item error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Part code already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item'
    });
  }
};

/**
 * Update inventory item
 * PUT /api/inventory/:id
 */
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { partName, partCode, barcode, category, supplier, availableStock, minStockLevel, unitPrice, wholesalePrice, salesPrice, purchasePrice } = req.body;

    // Check if item exists
    const [existingItems] = await pool.execute(
      'SELECT id FROM inventory_items WHERE id = ?',
      [id]
    );

    if (existingItems.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Check if part code is being changed and if it already exists
    if (partCode) {
      const [codeCheck] = await pool.execute(
        'SELECT id FROM inventory_items WHERE (part_code = ? OR barcode = ?) AND id != ?',
        [partCode || null, barcode || null, id]
      );

      if (codeCheck.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Part code or Barcode already exists'
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (partName) {
      updates.push('part_name = ?');
      params.push(partName);
    }
    if (partCode !== undefined) {
      updates.push('part_code = ?');
      params.push(partCode);
    }
    if (barcode !== undefined) {
      updates.push('barcode = ?');
      params.push(barcode);
    }
    if (category) {
      updates.push('category = ?');
      params.push(category);
    }
    if (supplier !== undefined) {
      updates.push('supplier = ?');
      params.push(supplier);
    }
    if (availableStock !== undefined) {
      updates.push('available_stock = ?');
      params.push(availableStock);
    }
    if (minStockLevel !== undefined) {
      updates.push('min_stock_level = ?');
      params.push(minStockLevel);
    }
    if (unitPrice !== undefined) {
      updates.push('unit_price = ?');
      params.push(unitPrice);
    }
    if (wholesalePrice !== undefined) {
      updates.push('wholesale_price = ?');
      params.push(wholesalePrice);
    }
    if (salesPrice !== undefined) {
      updates.push('sales_price = ?');
      params.push(salesPrice);
    }
    if (purchasePrice !== undefined) {
      updates.push('purchase_price = ?');
      params.push(purchasePrice);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated item
    const [items] = await pool.execute(
      `SELECT 
        id, part_name, part_code, barcode, category, supplier,
        available_stock, min_stock_level, unit_price,
        wholesale_price, sales_price, purchase_price,
        created_at, updated_at
      FROM inventory_items WHERE id = ?`,
      [id]
    );

    const item = items[0];
    const formattedItem = {
      id: item.id,
      partName: item.part_name,
      partCode: item.part_code,
      barcode: item.barcode,
      category: item.category,
      supplier: item.supplier,
      availableStock: item.available_stock,
      minStockLevel: item.min_stock_level,
      unitPrice: item.unit_price,
      wholesalePrice: item.wholesale_price,
      salesPrice: item.sales_price,
      purchasePrice: item.purchase_price,
      status: item.available_stock <= item.min_stock_level ? 'Low' : 'OK'
    };

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: formattedItem
    });
  } catch (error) {
    console.error('Update inventory item error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Part code already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update inventory item'
    });
  }
};

/**
 * Delete inventory item
 * DELETE /api/inventory/:id
 */
const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const [items] = await pool.execute(
      'SELECT id FROM inventory_items WHERE id = ?',
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Delete item
    await pool.execute('DELETE FROM inventory_items WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete inventory item'
    });
  }
};

/**
 * Stock In - Add stock to inventory item
 * POST /api/inventory/:id/stock-in
 * Body: { quantity, notes, billNo, supplierName, purchaseDate, unitPrice }
 */
const stockIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes, billNo, supplierName, purchaseDate, unitPrice } = req.body;

    // Validate input
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    // Check if item exists
    const [items] = await pool.execute(
      'SELECT id, part_name, part_code, available_stock, min_stock_level FROM inventory_items WHERE id = ?',
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    const item = items[0];
    const newStock = item.available_stock + parseInt(quantity);
    const newStatus = newStock <= item.min_stock_level ? 'Low' : 'OK';

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update inventory stock
      await connection.execute(
        'UPDATE inventory_items SET available_stock = ?, updated_at = NOW() WHERE id = ?',
        [newStock, id]
      );

      // Record stock transaction
      await connection.execute(
        `INSERT INTO stock_transactions (
          inventory_item_id, transaction_type, quantity, 
          previous_stock, new_stock, notes, created_by, created_at,
          bill_no, supplier_name, purchase_date, unit_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
        [
          id,
          'Stock In',
          parseInt(quantity),
          item.available_stock,
          newStock,
          notes || null,
          req.user.id,
          billNo || null,
          supplierName || item.supplier || null,
          purchaseDate || new Date().toISOString().split('T')[0],
          unitPrice || item.purchase_price || 0
        ]
      );

      // Record in item_activity
      await connection.execute(
        `INSERT INTO item_activity (
          inventory_item_id, activity_type, activity_date, quantity,
          unit_price, total_price, reference_type, reference_no, 
          supplier_name, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id,
          'Purchase',
          purchaseDate || new Date().toISOString().split('T')[0],
          parseInt(quantity),
          unitPrice || item.purchase_price || 0,
          parseInt(quantity) * (unitPrice || item.purchase_price || 0),
          'Purchase Bill',
          billNo || null,
          supplierName || item.supplier || null,
          notes || null,
          req.user.id
        ]
      );

      // Also update purchase_price if provided
      if (unitPrice) {
        await connection.execute(
          'UPDATE inventory_items SET purchase_price = ? WHERE id = ?',
          [unitPrice, id]
        );
      }

      await connection.commit();

      // Fetch updated item
      const [updatedItems] = await pool.execute(
        `SELECT 
          id, part_name, part_code, category, supplier,
          available_stock, min_stock_level, created_at, updated_at
        FROM inventory_items WHERE id = ?`,
        [id]
      );

      const updatedItem = updatedItems[0];
      const formattedItem = {
        id: updatedItem.id,
        partName: updatedItem.part_name,
        partCode: updatedItem.part_code,
        category: updatedItem.category,
        supplier: updatedItem.supplier,
        availableStock: updatedItem.available_stock,
        minStockLevel: updatedItem.min_stock_level,
        status: updatedItem.available_stock <= updatedItem.min_stock_level ? 'Low' : 'OK'
      };

      res.json({
        success: true,
        message: `Stock added successfully. New stock: ${newStock}`,
        data: formattedItem
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Stock in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add stock'
    });
  }
};

/**
 * Stock Out - Deduct stock from inventory item
 * POST /api/inventory/:id/stock-out
 * Body: { quantity, notes }
 */
const stockOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes } = req.body;

    // Validate input
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    // Check if item exists
    const [items] = await pool.execute(
      'SELECT id, part_name, part_code, available_stock, min_stock_level FROM inventory_items WHERE id = ?',
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    const item = items[0];
    const deductQuantity = parseInt(quantity);

    // Check if sufficient stock available
    if (item.available_stock < deductQuantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Available: ${item.available_stock}, Requested: ${deductQuantity}`
      });
    }

    const newStock = Math.max(0, item.available_stock - deductQuantity);
    const newStatus = newStock <= item.min_stock_level ? 'Low' : 'OK';

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update inventory stock
      await connection.execute(
        'UPDATE inventory_items SET available_stock = ?, updated_at = NOW() WHERE id = ?',
        [newStock, id]
      );

      // Record stock transaction
      await connection.execute(
        `INSERT INTO stock_transactions (
          inventory_item_id, transaction_type, quantity, 
          previous_stock, new_stock, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id,
          'Stock Out',
          deductQuantity,
          item.available_stock,
          newStock,
          notes || null,
          req.user.id
        ]
      );

      // Record in item_activity
      await connection.execute(
        `INSERT INTO item_activity (
          inventory_item_id, activity_type, activity_date, quantity,
          notes, created_by, created_at
        ) VALUES (?, ?, CURDATE(), ?, ?, ?, NOW())`,
        [
          id,
          'Stock Out',
          deductQuantity,
          notes || null,
          req.user.id
        ]
      );

      await connection.commit();

      // Fetch updated item
      const [updatedItems] = await pool.execute(
        `SELECT 
          id, part_name, part_code, category, supplier,
          available_stock, min_stock_level, created_at, updated_at
        FROM inventory_items WHERE id = ?`,
        [id]
      );

      const updatedItem = updatedItems[0];
      const formattedItem = {
        id: updatedItem.id,
        partName: updatedItem.part_name,
        partCode: updatedItem.part_code,
        category: updatedItem.category,
        supplier: updatedItem.supplier,
        availableStock: updatedItem.available_stock,
        minStockLevel: updatedItem.min_stock_level,
        status: updatedItem.available_stock <= updatedItem.min_stock_level ? 'Low' : 'OK'
      };

      res.json({
        success: true,
        message: `Stock deducted successfully. Remaining stock: ${newStock}`,
        data: formattedItem
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Stock out error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deduct stock'
    });
  }
};

/**
 * Get stock transactions for an inventory item
 * GET /api/inventory/:id/transactions
 */
const getStockTransactions = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const [items] = await pool.execute(
      'SELECT id FROM inventory_items WHERE id = ?',
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Get transactions
    const [transactions] = await pool.execute(
      `SELECT 
        st.id, st.transaction_type, st.quantity,
        st.previous_stock, st.new_stock, st.notes,
        st.created_at,
        u.name AS created_by_name
      FROM stock_transactions st
      LEFT JOIN users u ON st.created_by = u.id
      WHERE st.inventory_item_id = ?
      ORDER BY st.created_at DESC`,
      [id]
    );

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      transactionType: t.transaction_type,
      quantity: t.quantity,
      previousStock: t.previous_stock,
      newStock: t.new_stock,
      notes: t.notes,
      createdBy: t.created_by_name,
      createdAt: t.created_at
    }));

    res.json({
      success: true,
      data: formattedTransactions,
      count: formattedTransactions.length
    });
  } catch (error) {
    console.error('Get stock transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock transactions'
    });
  }
};

/**
 * Get all inventory categories
 * GET /api/inventory/categories
 */
const getInventoryCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT id, name FROM inventory_categories ORDER BY name ASC'
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get inventory categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

/**
 * Create new inventory category
 * POST /api/inventory/categories
 */
const createInventoryCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO inventory_categories (name) VALUES (?)',
      [name]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name
      }
    });
  } catch (error) {
    console.error('Create inventory category error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Category already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

/**
 * Get Item Activity
 * GET /api/inventory/:id/activity
 */
const getItemActivity = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item exists
    const [items] = await pool.execute(
      'SELECT id, part_name, part_code, available_stock, purchase_price, sales_price FROM inventory_items WHERE id = ?',
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    const item = items[0];

    // Fetch activities
    const [activities] = await pool.execute(
      `SELECT * FROM item_activity WHERE inventory_item_id = ? ORDER BY activity_date DESC, created_at DESC`,
      [id]
    );

    // Calculate Summary
    const summary = {
      totalPurchased: 0,
      totalSold: 0,
      totalReturned: 0,
      availableStock: item.available_stock,
      lastPurchase: null
    };

    const formattedActivities = activities.map(a => {
      if (a.activity_type === 'Purchase' || a.activity_type === 'Stock In') {
        summary.totalPurchased += a.quantity;
        if (!summary.lastPurchase) {
          summary.lastPurchase = {
            date: a.activity_date,
            billNo: a.reference_no,
            supplierName: a.supplier_name,
            quantity: a.quantity,
            unitPrice: a.unit_price
          };
        }
      } else if (a.activity_type === 'Sale' || a.activity_type === 'Job Usage' || a.activity_type === 'Stock Out') {
        summary.totalSold += a.quantity;
      } else if (a.activity_type === 'Return') {
        summary.totalReturned += a.quantity;
      }

      return {
        id: a.id,
        type: a.activity_type,
        date: a.activity_date ? a.activity_date.toISOString().split('T')[0] : null,
        quantity: a.quantity,
        unitPrice: parseFloat(a.unit_price) || 0,
        totalPrice: parseFloat(a.total_price) || 0,
        referenceType: a.reference_type,
        referenceNo: a.reference_no,
        supplierName: a.supplier_name,
        customerName: a.customer_name,
        notes: a.notes,
        createdAt: a.created_at
      };
    });

    res.json({
      success: true,
      data: {
        itemInfo: {
          partName: item.part_name,
          partCode: item.part_code,
          purchasePrice: item.purchase_price,
          salesPrice: item.sales_price
        },
        summary,
        activities: formattedActivities
      }
    });
  } catch (error) {
    console.error('Get item activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item activity'
    });
  }
};

module.exports = {
  getAllInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  stockIn,
  stockOut,
  getStockTransactions,
  getInventoryCategories,
  createInventoryCategory,
  getItemActivity
};
