/**
 * Sales Return Controller
 * Handle sales returns and refunds
 */

const pool = require('../config/db');

/**
 * Auto-generate return number (SR-001, SR-002, etc.)
 */
const generateReturnNumber = async () => {
  try {
    const [returns] = await pool.execute(
      'SELECT return_no FROM sales_returns ORDER BY id DESC LIMIT 1'
    );

    if (returns.length === 0) {
      return 'SR-001';
    }

    const latestReturnNo = returns[0].return_no;
    const match = latestReturnNo.match(/SR-(\d+)/);

    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `SR-${String(nextNumber).padStart(3, '0')}`;
    }

    return 'SR-001';
  } catch (error) {
    console.error('Generate return number error:', error);
    return `SR-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Get all sales returns
 * GET /api/sales-returns
 */
const getAllSalesReturns = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        sr.id, sr.return_no, sr.invoice_id, sr.job_card_id,
        sr.return_date, sr.return_amount, sr.reason, sr.status,
        sr.created_at, sr.updated_at,
        i.invoice_no,
        jc.job_no,
        c.name AS customer_name,
        u.name AS created_by_name
      FROM sales_returns sr
      LEFT JOIN invoices i ON sr.invoice_id = i.id
      LEFT JOIN job_cards jc ON COALESCE(sr.job_card_id, i.job_card_id) = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND sr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [returns] = await pool.execute(query, params);

    const formattedReturns = returns.map(r => ({
      id: r.id,
      returnNo: r.return_no,
      invoiceNo: r.invoice_no,
      jobNo: r.job_no,
      customerName: r.customer_name,
      returnDate: r.return_date ? r.return_date.toISOString().split('T')[0] : null,
      returnAmount: parseFloat(r.return_amount) || 0,
      reason: r.reason,
      status: r.status,
      createdBy: r.created_by_name,
      createdAt: r.created_at
    }));

    res.json({
      success: true,
      data: formattedReturns,
      count: formattedReturns.length
    });
  } catch (error) {
    console.error('Get all sales returns error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales returns'
    });
  }
};

/**
 * Get sales return by ID
 * GET /api/sales-returns/:id
 */
const getSalesReturnById = async (req, res) => {
  try {
    const { id } = req.params;

    const [returns] = await pool.execute(
      `SELECT
        sr.id, sr.return_no, sr.invoice_id, sr.job_card_id,
        sr.return_date, sr.return_amount, sr.reason, sr.status,
        sr.created_at, sr.updated_at,
        i.invoice_no, i.grand_total AS invoice_amount,
        jc.job_no,
        c.name AS customer_name, c.phone AS customer_phone,
        u.name AS created_by_name
      FROM sales_returns sr
      LEFT JOIN invoices i ON sr.invoice_id = i.id
      LEFT JOIN job_cards jc ON COALESCE(sr.job_card_id, i.job_card_id) = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON sr.created_by = u.id
      WHERE sr.id = ?`,
      [id]
    );

    if (returns.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sales return not found'
      });
    }

    const r = returns[0];
    const formattedReturn = {
      id: r.id,
      returnNo: r.return_no,
      invoiceId: r.invoice_id,
      invoiceNo: r.invoice_no,
      invoiceAmount: parseFloat(r.invoice_amount) || 0,
      jobCardId: r.job_card_id,
      jobNo: r.job_no,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      returnDate: r.return_date ? r.return_date.toISOString().split('T')[0] : null,
      returnAmount: parseFloat(r.return_amount) || 0,
      reason: r.reason,
      status: r.status,
      createdBy: r.created_by_name,
      createdAt: r.created_at
    };

    res.json({
      success: true,
      data: formattedReturn
    });
  } catch (error) {
    console.error('Get sales return by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales return'
    });
  }
};

/**
 * Create new sales return
 * POST /api/sales-returns
 */
const createSalesReturn = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log('📥 Received request body:', req.body);
    const { invoiceId, jobCardId, returnDate, returnAmount, reason, userId, items } = req.body;

    if (!invoiceId || !returnDate || returnAmount === undefined || returnAmount === null) {
      return res.status(400).json({
        success: false,
        error: 'Invoice, return date, and return amount are required'
      });
    }

    // Generate return number
    const returnNo = await generateReturnNumber();

    // 1. Insert sales return record
    const [result] = await connection.execute(
      `INSERT INTO sales_returns (
        return_no, invoice_id, job_card_id, return_date,
        return_amount, reason, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())`,
      [returnNo, invoiceId, jobCardId || null, returnDate, returnAmount, reason || null, userId || null]
    );

    const salesReturnId = result.insertId;

    // 2. Insert return items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await connection.execute(
          `INSERT INTO sales_return_items (
            sales_return_id, inventory_item_id, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?)`,
          [salesReturnId, item.inventoryItemId, item.quantity, item.unitPrice, item.totalPrice]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Sales return created successfully',
      data: { id: salesReturnId, returnNo }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create sales return error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sales return'
    });
  } finally {
    connection.release();
  }
};

/**
 * Update sales return status
 * PUT /api/sales-returns/:id
 */
const updateSalesReturn = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, reason } = req.body;

    // Check if return exists and its current status
    const [existing] = await connection.execute(
      'SELECT status, stock_updated FROM sales_returns WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sales return not found'
      });
    }

    const currentStatus = existing[0].status;
    const isStockUpdated = existing[0].stock_updated;

    // Build update query
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (reason !== undefined) {
      updates.push('reason = ?');
      params.push(reason);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await connection.execute(
      `UPDATE sales_returns SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // TRIGGER: If status changes to 'Approved' and stock hasn't been updated yet
    if (status === 'Approved' && currentStatus !== 'Approved' && !isStockUpdated) {
      // 1. Get items to return
      const [items] = await connection.execute(
        'SELECT inventory_item_id, quantity, unit_price FROM sales_return_items WHERE sales_return_id = ?',
        [id]
      );

      // Get return details for logging
      const [returnDetails] = await connection.execute(
        `SELECT sr.return_no, i.invoice_no FROM sales_returns sr 
         JOIN invoices i ON sr.invoice_id = i.id WHERE sr.id = ?`,
        [id]
      );
      const returnNo = returnDetails[0].return_no;
      const invoiceNo = returnDetails[0].invoice_no;

      for (const item of items) {
        if (item.inventory_item_id) {
          // 2. Increase stock
          await connection.execute(
            'UPDATE inventory_items SET available_stock = available_stock + ? WHERE id = ?',
            [item.quantity, item.inventory_item_id]
          );

          // 3. Record in stock_transactions
          await connection.execute(
            `INSERT INTO stock_transactions (
              inventory_item_id, transaction_type, quantity, reference_no, notes
            ) VALUES (?, 'Stock In', ?, ?, ?)`,
            [item.inventory_item_id, item.quantity, returnNo, `Sales Return from Invoice ${invoiceNo}`]
          );

          // 4. Record in item_activity
          await connection.execute(
            `INSERT INTO item_activity (
              inventory_item_id, activity_type, activity_date, quantity, 
              unit_price, total_price, reference_type, reference_id, reference_no, notes
            ) VALUES (?, 'Return', CURDATE(), ?, ?, ?, 'Sales Return', ?, ?, ?)`,
            [
              item.inventory_item_id,
              item.quantity,
              item.unit_price,
              item.quantity * item.unit_price,
              id,
              returnNo,
              `Returned items from Invoice ${invoiceNo}`
            ]
          );
        }
      }

      // Mark stock as updated
      await connection.execute(
        'UPDATE sales_returns SET stock_updated = 1 WHERE id = ?',
        [id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Sales return updated successfully and stock adjusted'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update sales return error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sales return'
    });
  } finally {
    connection.release();
  }
};

/**
 * Delete sales return
 * DELETE /api/sales-returns/:id
 */
const deleteSalesReturn = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if return exists
    const [returns] = await pool.execute(
      'SELECT id, status FROM sales_returns WHERE id = ?',
      [id]
    );

    if (returns.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sales return not found'
      });
    }

    // Only allow deletion of Pending returns
    if (returns[0].status !== 'Pending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete approved or rejected returns'
      });
    }

    await pool.execute('DELETE FROM sales_returns WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Sales return deleted successfully'
    });
  } catch (error) {
    console.error('Delete sales return error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete sales return'
    });
  }
};

module.exports = {
  getAllSalesReturns,
  getSalesReturnById,
  createSalesReturn,
  updateSalesReturn,
  deleteSalesReturn
};
