/**
 * Voucher Controller
 * Handle Payment and Receipt Vouchers
 */

const pool = require('../config/db');

/**
 * Auto-generate payment voucher number (PV-001, PV-002, etc.)
 */
const generatePaymentVoucherNumber = async () => {
  try {
    const [vouchers] = await pool.execute(
      'SELECT voucher_no FROM payment_vouchers ORDER BY id DESC LIMIT 1'
    );

    if (vouchers.length === 0) {
      return 'PV-001';
    }

    const latestVoucherNo = vouchers[0].voucher_no;
    const match = latestVoucherNo.match(/PV-(\d+)/);

    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `PV-${String(nextNumber).padStart(3, '0')}`;
    }

    return 'PV-001';
  } catch (error) {
    console.error('Generate payment voucher number error:', error);
    return `PV-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Auto-generate receipt voucher number (RV-001, RV-002, etc.)
 */
const generateReceiptVoucherNumber = async () => {
  try {
    const [vouchers] = await pool.execute(
      'SELECT voucher_no FROM receipt_vouchers ORDER BY id DESC LIMIT 1'
    );

    if (vouchers.length === 0) {
      return 'RV-001';
    }

    const latestVoucherNo = vouchers[0].voucher_no;
    const match = latestVoucherNo.match(/RV-(\d+)/);

    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `RV-${String(nextNumber).padStart(3, '0')}`;
    }

    return 'RV-001';
  } catch (error) {
    console.error('Generate receipt voucher number error:', error);
    return `RV-${Date.now().toString().slice(-6)}`;
  }
};

// =============== PAYMENT VOUCHERS ===============

/**
 * Get all payment vouchers
 * GET /api/payment-vouchers
 */
const getAllPaymentVouchers = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        pv.id, pv.voucher_no, pv.voucher_date, pv.paid_to, pv.paid_to_type,
        pv.amount, pv.payment_mode, pv.reference_no,
        pv.description, pv.created_at,
        u.name AS created_by_name
      FROM payment_vouchers pv
      LEFT JOIN users u ON pv.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND pv.voucher_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND pv.voucher_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY pv.voucher_date DESC, pv.created_at DESC';

    const [vouchers] = await pool.execute(query, params);

    const formattedVouchers = vouchers.map(v => ({
      id: v.id,
      voucherNo: v.voucher_no,
      voucherDate: v.voucher_date ? v.voucher_date.toISOString().split('T')[0] : null,
      paidTo: v.paid_to,
      amount: parseFloat(v.amount) || 0,
      paymentMode: v.payment_mode,
      referenceNo: v.reference_no,
      description: v.description,
      paidToType: v.paid_to_type,
      createdBy: v.created_by_name,
      createdAt: v.created_at
    }));

    res.json({
      success: true,
      data: formattedVouchers,
      count: formattedVouchers.length
    });
  } catch (error) {
    console.error('Get all payment vouchers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment vouchers'
    });
  }
};

/**
 * Get payment voucher by ID
 * GET /api/payment-vouchers/:id
 */
const getPaymentVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const [vouchers] = await pool.execute(
      `SELECT
        pv.id, pv.voucher_no, pv.voucher_date, pv.paid_to,
        pv.amount, pv.payment_mode, pv.reference_no,
        pv.description, pv.created_at,
        u.name AS created_by_name
      FROM payment_vouchers pv
      LEFT JOIN users u ON pv.created_by = u.id
      WHERE pv.id = ?`,
      [id]
    );

    if (vouchers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment voucher not found'
      });
    }

    const v = vouchers[0];
    const formattedVoucher = {
      id: v.id,
      voucherNo: v.voucher_no,
      voucherDate: v.voucher_date ? v.voucher_date.toISOString().split('T')[0] : null,
      paidTo: v.paid_to,
      amount: parseFloat(v.amount) || 0,
      paymentMode: v.payment_mode,
      referenceNo: v.reference_no,
      description: v.description,
      createdBy: v.created_by_name,
      createdAt: v.created_at
    };

    res.json({
      success: true,
      data: formattedVoucher
    });
  } catch (error) {
    console.error('Get payment voucher by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment voucher'
    });
  }
};

/**
 * Create new payment voucher
 * POST /api/payment-vouchers
 */
const createPaymentVoucher = async (req, res) => {
  try {
    const { voucherDate, paidTo, amount, paymentMode, referenceNo, description, userId } = req.body;

    if (!voucherDate || !paidTo || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Voucher date, paid to, and amount are required'
      });
    }

    // Generate voucher number
    const voucherNo = await generatePaymentVoucherNumber();

    // Insert payment voucher
    const [result] = await pool.execute(
      `INSERT INTO payment_vouchers (
        voucher_no, voucher_date, paid_to, paid_to_type, amount,
        payment_mode, reference_no, description,
        created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [voucherNo, voucherDate, paidTo, req.body.paidToType || 'Other', amount, paymentMode || 'Cash', referenceNo, description, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Payment voucher created successfully',
      data: {
        id: result.insertId,
        voucherNo: voucherNo
      }
    });
  } catch (error) {
    console.error('Create payment voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment voucher'
    });
  }
};

/**
 * Update payment voucher
 * PUT /api/payment-vouchers/:id
 */
const updatePaymentVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { voucherDate, paidTo, amount, paymentMode, referenceNo, description } = req.body;

    // Check if voucher exists
    const [existing] = await pool.execute(
      'SELECT id FROM payment_vouchers WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment voucher not found'
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (voucherDate) {
      updates.push('voucher_date = ?');
      params.push(voucherDate);
    }
    if (paidTo) {
      updates.push('paid_to = ?');
      params.push(paidTo);
    }
    if (amount) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (paymentMode) {
      updates.push('payment_mode = ?');
      params.push(paymentMode);
    }
    if (referenceNo !== undefined) {
      updates.push('reference_no = ?');
      params.push(referenceNo);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE payment_vouchers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Payment voucher updated successfully'
    });
  } catch (error) {
    console.error('Update payment voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment voucher'
    });
  }
};

/**
 * Delete payment voucher
 * DELETE /api/payment-vouchers/:id
 */
const deletePaymentVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const [vouchers] = await pool.execute(
      'SELECT id FROM payment_vouchers WHERE id = ?',
      [id]
    );

    if (vouchers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment voucher not found'
      });
    }

    await pool.execute('DELETE FROM payment_vouchers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Payment voucher deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment voucher'
    });
  }
};

// =============== RECEIPT VOUCHERS ===============

/**
 * Get all receipt vouchers
 * GET /api/receipt-vouchers
 */
const getAllReceiptVouchers = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        rv.id, rv.voucher_no, rv.voucher_date, rv.received_from, rv.received_from_type,
        rv.amount, rv.payment_mode, rv.reference_no,
        rv.description, rv.created_at,
        u.name AS created_by_name
      FROM receipt_vouchers rv
      LEFT JOIN users u ON rv.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND rv.voucher_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND rv.voucher_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY rv.voucher_date DESC, rv.created_at DESC';

    const [vouchers] = await pool.execute(query, params);

    const formattedVouchers = vouchers.map(v => ({
      id: v.id,
      voucherNo: v.voucher_no,
      voucherDate: v.voucher_date ? v.voucher_date.toISOString().split('T')[0] : null,
      receivedFrom: v.received_from,
      amount: parseFloat(v.amount) || 0,
      paymentMode: v.payment_mode,
      referenceNo: v.reference_no,
      description: v.description,
      receivedFromType: v.received_from_type,
      createdBy: v.created_by_name,
      createdAt: v.created_at
    }));

    res.json({
      success: true,
      data: formattedVouchers,
      count: formattedVouchers.length
    });
  } catch (error) {
    console.error('Get all receipt vouchers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt vouchers'
    });
  }
};

/**
 * Get receipt voucher by ID
 * GET /api/receipt-vouchers/:id
 */
const getReceiptVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const [vouchers] = await pool.execute(
      `SELECT
        rv.id, rv.voucher_no, rv.voucher_date, rv.received_from,
        rv.amount, rv.payment_mode, rv.reference_no,
        rv.description, rv.created_at,
        u.name AS created_by_name
      FROM receipt_vouchers rv
      LEFT JOIN users u ON rv.created_by = u.id
      WHERE rv.id = ?`,
      [id]
    );

    if (vouchers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt voucher not found'
      });
    }

    const v = vouchers[0];
    const formattedVoucher = {
      id: v.id,
      voucherNo: v.voucher_no,
      voucherDate: v.voucher_date ? v.voucher_date.toISOString().split('T')[0] : null,
      receivedFrom: v.received_from,
      amount: parseFloat(v.amount) || 0,
      paymentMode: v.payment_mode,
      referenceNo: v.reference_no,
      description: v.description,
      createdBy: v.created_by_name,
      createdAt: v.created_at
    };

    res.json({
      success: true,
      data: formattedVoucher
    });
  } catch (error) {
    console.error('Get receipt voucher by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt voucher'
    });
  }
};

/**
 * Create new receipt voucher
 * POST /api/receipt-vouchers
 */
const createReceiptVoucher = async (req, res) => {
  try {
    const { voucherDate, receivedFrom, amount, paymentMode, referenceNo, description, userId } = req.body;

    if (!voucherDate || !receivedFrom || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Voucher date, received from, and amount are required'
      });
    }

    // Generate voucher number
    const voucherNo = await generateReceiptVoucherNumber();

    // Insert receipt voucher
    const [result] = await pool.execute(
      `INSERT INTO receipt_vouchers (
        voucher_no, voucher_date, received_from, received_from_type, amount,
        payment_mode, reference_no, description,
        created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [voucherNo, voucherDate, receivedFrom, req.body.receivedFromType || 'Other', amount, paymentMode || 'Cash', referenceNo, description, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Receipt voucher created successfully',
      data: {
        id: result.insertId,
        voucherNo: voucherNo
      }
    });
  } catch (error) {
    console.error('Create receipt voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create receipt voucher'
    });
  }
};

/**
 * Update receipt voucher
 * PUT /api/receipt-vouchers/:id
 */
const updateReceiptVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { voucherDate, receivedFrom, amount, paymentMode, referenceNo, description } = req.body;

    // Check if voucher exists
    const [existing] = await pool.execute(
      'SELECT id FROM receipt_vouchers WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt voucher not found'
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (voucherDate) {
      updates.push('voucher_date = ?');
      params.push(voucherDate);
    }
    if (receivedFrom) {
      updates.push('received_from = ?');
      params.push(receivedFrom);
    }
    if (amount) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (paymentMode) {
      updates.push('payment_mode = ?');
      params.push(paymentMode);
    }
    if (referenceNo !== undefined) {
      updates.push('reference_no = ?');
      params.push(referenceNo);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE receipt_vouchers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Receipt voucher updated successfully'
    });
  } catch (error) {
    console.error('Update receipt voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update receipt voucher'
    });
  }
};

/**
 * Delete receipt voucher
 * DELETE /api/receipt-vouchers/:id
 */
const deleteReceiptVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const [vouchers] = await pool.execute(
      'SELECT id FROM receipt_vouchers WHERE id = ?',
      [id]
    );

    if (vouchers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receipt voucher not found'
      });
    }

    await pool.execute('DELETE FROM receipt_vouchers WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Receipt voucher deleted successfully'
    });
  } catch (error) {
    console.error('Delete receipt voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete receipt voucher'
    });
  }
};

module.exports = {
  // Payment Vouchers
  getAllPaymentVouchers,
  getPaymentVoucherById,
  createPaymentVoucher,
  updatePaymentVoucher,
  deletePaymentVoucher,

  // Receipt Vouchers
  getAllReceiptVouchers,
  getReceiptVoucherById,
  createReceiptVoucher,
  updateReceiptVoucher,
  deleteReceiptVoucher
};
