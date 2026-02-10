/**
 * Payment Controller
 * CRUD operations for payments
 */

const pool = require('../config/db');

/**
 * Auto-generate payment number (PAY-001, PAY-002, etc.)
 */
const generatePaymentNumber = async () => {
  try {
    const [payments] = await pool.execute(
      'SELECT payment_no FROM payments ORDER BY id DESC LIMIT 1'
    );

    if (payments.length === 0) {
      return 'PAY-001';
    }

    const latestPaymentNo = payments[0].payment_no;
    const match = latestPaymentNo.match(/PAY-(\d+)/);
    
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `PAY-${String(nextNumber).padStart(3, '0')}`;
    }

    return 'PAY-001';
  } catch (error) {
    console.error('Generate payment number error:', error);
    return `PAY-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Get all payments
 * GET /api/payments
 * Query params: paymentMode
 */
const getAllPayments = async (req, res) => {
  try {
    const { paymentMode } = req.query;
    
    let query = `
      SELECT 
        p.id, p.payment_no, p.invoice_id, p.amount_paid,
        p.payment_mode, p.payment_date, p.created_at, p.updated_at,
        i.invoice_no, i.grand_total,
        c.name AS customer_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN job_cards jc ON i.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (paymentMode && paymentMode !== 'all') {
      query += ' AND p.payment_mode = ?';
      params.push(paymentMode);
    }

    query += ' ORDER BY p.created_at DESC';

    const [payments] = await pool.execute(query, params);

    // Calculate balance for each payment
    const formattedPayments = await Promise.all(payments.map(async (p) => {
      // Get total paid for this invoice
      const [totalPaidResult] = await pool.execute(
        'SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE invoice_id = ?',
        [p.invoice_id]
      );
      const totalPaid = parseFloat(totalPaidResult[0].total_paid) || 0;
      const invoiceAmount = parseFloat(p.grand_total) || 0;
      const balance = invoiceAmount - totalPaid;

      return {
        id: p.id,
        paymentNo: p.payment_no,
        invoiceNo: p.invoice_no,
        customerName: p.customer_name,
        invoiceAmount: invoiceAmount,
        amountPaid: parseFloat(p.amount_paid) || 0,
        balance: balance,
        paymentMode: p.payment_mode,
        paymentDate: p.payment_date ? p.payment_date.toISOString().split('T')[0] : null,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      };
    }));

    res.json({
      success: true,
      data: formattedPayments,
      count: formattedPayments.length
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
};

/**
 * Get payment by ID
 * GET /api/payments/:id
 */
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [payments] = await pool.execute(
      `SELECT 
        p.id, p.payment_no, p.invoice_id, p.amount_paid,
        p.payment_mode, p.payment_date, p.created_at, p.updated_at,
        i.invoice_no, i.grand_total,
        c.name AS customer_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN job_cards jc ON i.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE p.id = ?`,
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const p = payments[0];
    
    // Calculate balance
    const [totalPaidResult] = await pool.execute(
      'SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE invoice_id = ?',
      [p.invoice_id]
    );
    const totalPaid = parseFloat(totalPaidResult[0].total_paid) || 0;
    const invoiceAmount = parseFloat(p.grand_total) || 0;
    const balance = invoiceAmount - totalPaid;

    const formattedPayment = {
      id: p.id,
      paymentNo: p.payment_no,
      invoiceNo: p.invoice_no,
      customerName: p.customer_name,
      invoiceAmount: invoiceAmount,
      amountPaid: parseFloat(p.amount_paid) || 0,
      balance: balance,
      paymentMode: p.payment_mode,
      paymentDate: p.payment_date ? p.payment_date.toISOString().split('T')[0] : null
    };

    res.json({
      success: true,
      data: formattedPayment
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment'
    });
  }
};

/**
 * Create new payment
 * POST /api/payments
 * Body: { invoice, customerName, invoiceAmount, amountPaid, balanceAmount, paymentMode, paymentDate }
 */
const createPayment = async (req, res) => {
  try {
    const { invoice, customerName, invoiceAmount, amountPaid, balanceAmount, paymentMode, paymentDate } = req.body;

    // Validate required fields
    if (!invoice || !amountPaid || !paymentMode) {
      return res.status(400).json({
        success: false,
        error: 'Invoice, amount paid, and payment mode are required'
      });
    }

    // Find invoice by invoice number
    const [invoices] = await pool.execute(
      'SELECT id, grand_total FROM invoices WHERE invoice_no = ?',
      [invoice]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const invoiceRecord = invoices[0];
    const invoiceId = invoiceRecord.id;
    const invoiceTotal = parseFloat(invoiceRecord.grand_total) || 0;

    // Get total already paid
    const [totalPaidResult] = await pool.execute(
      'SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE invoice_id = ?',
      [invoiceId]
    );
    const totalPaid = parseFloat(totalPaidResult[0].total_paid) || 0;
    const newAmountPaid = parseFloat(amountPaid) || 0;
    const newTotalPaid = totalPaid + newAmountPaid;
    const balance = invoiceTotal - newTotalPaid;

    // Generate payment number
    const paymentNo = await generatePaymentNumber();

    // Insert payment
    const [result] = await pool.execute(
      `INSERT INTO payments (
        payment_no, invoice_id, amount_paid, payment_mode, payment_date, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        paymentNo,
        invoiceId,
        newAmountPaid,
        paymentMode,
        paymentDate || new Date().toISOString().split('T')[0]
      ]
    );

    // Update invoice status based on balance
    let invoiceStatus = 'Unpaid';
    if (balance <= 0) {
      invoiceStatus = 'Paid';
    } else if (newTotalPaid > 0) {
      invoiceStatus = 'Partially Paid';
    }

    await pool.execute(
      'UPDATE invoices SET status = ?, updated_at = NOW() WHERE id = ?',
      [invoiceStatus, invoiceId]
    );

    // Fetch created payment
    const [payments] = await pool.execute(
      `SELECT 
        p.id, p.payment_no, p.invoice_id, p.amount_paid,
        p.payment_mode, p.payment_date, p.created_at, p.updated_at,
        i.invoice_no, i.grand_total,
        c.name AS customer_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN job_cards jc ON i.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE p.id = ?`,
      [result.insertId]
    );

    const p = payments[0];
    const formattedPayment = {
      id: p.id,
      paymentNo: p.payment_no,
      invoiceNo: p.invoice_no,
      customerName: p.customer_name,
      invoiceAmount: parseFloat(p.grand_total) || 0,
      amountPaid: parseFloat(p.amount_paid) || 0,
      balance: balance,
      paymentMode: p.payment_mode,
      paymentDate: p.payment_date ? p.payment_date.toISOString().split('T')[0] : null
    };

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: formattedPayment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment'
    });
  }
};

/**
 * Update payment
 * PUT /api/payments/:id
 */
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMode, paymentDate } = req.body;

    // Check if payment exists
    const [existingPayments] = await pool.execute(
      'SELECT id, invoice_id, amount_paid FROM payments WHERE id = ?',
      [id]
    );

    if (existingPayments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const existing = existingPayments[0];

    // Build update query
    const updates = [];
    const params = [];

    if (amountPaid !== undefined) {
      updates.push('amount_paid = ?');
      params.push(parseFloat(amountPaid));
    }
    if (paymentMode) {
      updates.push('payment_mode = ?');
      params.push(paymentMode);
    }
    if (paymentDate) {
      updates.push('payment_date = ?');
      params.push(paymentDate);
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
      `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Update invoice status
    const [invoiceResult] = await pool.execute(
      'SELECT grand_total FROM invoices WHERE id = ?',
      [existing.invoice_id]
    );
    
    if (invoiceResult.length > 0) {
      const invoiceTotal = parseFloat(invoiceResult[0].grand_total) || 0;
      const [totalPaidResult] = await pool.execute(
        'SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE invoice_id = ?',
        [existing.invoice_id]
      );
      const totalPaid = parseFloat(totalPaidResult[0].total_paid) || 0;
      const balance = invoiceTotal - totalPaid;

      let invoiceStatus = 'Unpaid';
      if (balance <= 0) {
        invoiceStatus = 'Paid';
      } else if (totalPaid > 0) {
        invoiceStatus = 'Partially Paid';
      }

      await pool.execute(
        'UPDATE invoices SET status = ?, updated_at = NOW() WHERE id = ?',
        [invoiceStatus, existing.invoice_id]
      );
    }

    // Fetch updated payment
    const [payments] = await pool.execute(
      `SELECT 
        p.id, p.payment_no, p.invoice_id, p.amount_paid,
        p.payment_mode, p.payment_date, p.created_at, p.updated_at,
        i.invoice_no, i.grand_total,
        c.name AS customer_name
      FROM payments p
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN job_cards jc ON i.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE p.id = ?`,
      [id]
    );

    const p = payments[0];
    const [totalPaidResult] = await pool.execute(
      'SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE invoice_id = ?',
      [p.invoice_id]
    );
    const totalPaid = parseFloat(totalPaidResult[0].total_paid) || 0;
    const balance = parseFloat(p.grand_total) - totalPaid;

    const formattedPayment = {
      id: p.id,
      paymentNo: p.payment_no,
      invoiceNo: p.invoice_no,
      customerName: p.customer_name,
      invoiceAmount: parseFloat(p.grand_total) || 0,
      amountPaid: parseFloat(p.amount_paid) || 0,
      balance: balance,
      paymentMode: p.payment_mode,
      paymentDate: p.payment_date ? p.payment_date.toISOString().split('T')[0] : null
    };

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: formattedPayment
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment'
    });
  }
};

/**
 * Delete payment
 * DELETE /api/payments/:id
 */
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if payment exists and get invoice_id
    const [payments] = await pool.execute(
      'SELECT id, invoice_id FROM payments WHERE id = ?',
      [id]
    );

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const invoiceId = payments[0].invoice_id;

    // Delete payment
    await pool.execute('DELETE FROM payments WHERE id = ?', [id]);

    // Update invoice status
    const [invoiceResult] = await pool.execute(
      'SELECT grand_total FROM invoices WHERE id = ?',
      [invoiceId]
    );
    
    if (invoiceResult.length > 0) {
      const invoiceTotal = parseFloat(invoiceResult[0].grand_total) || 0;
      const [totalPaidResult] = await pool.execute(
        'SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payments WHERE invoice_id = ?',
        [invoiceId]
      );
      const totalPaid = parseFloat(totalPaidResult[0].total_paid) || 0;
      const balance = invoiceTotal - totalPaid;

      let invoiceStatus = 'Unpaid';
      if (balance <= 0) {
        invoiceStatus = 'Paid';
      } else if (totalPaid > 0) {
        invoiceStatus = 'Partially Paid';
      }

      await pool.execute(
        'UPDATE invoices SET status = ?, updated_at = NOW() WHERE id = ?',
        [invoiceStatus, invoiceId]
      );
    }

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment'
    });
  }
};

/**
 * Get payment statistics
 * GET /api/payments/stats/summary
 */
const getPaymentStats = async (req, res) => {
  try {
    // Total payments
    const [totalResult] = await pool.execute(
      'SELECT COALESCE(SUM(amount_paid), 0) AS total_payments FROM payments'
    );
    const totalPayments = parseFloat(totalResult[0].total_payments) || 0;

    // Pending payments (invoices with balance > 0)
    const [pendingResult] = await pool.execute(
      `SELECT COALESCE(SUM(i.grand_total - COALESCE(SUM(p.amount_paid), 0)), 0) AS pending
       FROM invoices i
       LEFT JOIN payments p ON i.id = p.invoice_id
       WHERE i.status IN ('Unpaid', 'Partially Paid')
       GROUP BY i.id`
    );
    
    let pendingPayments = 0;
    if (pendingResult.length > 0) {
      pendingPayments = pendingResult.reduce((sum, row) => sum + (parseFloat(row.pending) || 0), 0);
    }

    // Credit customers count (customers with unpaid invoices)
    const [creditResult] = await pool.execute(
      `SELECT COUNT(DISTINCT jc.customer_id) AS credit_customers
       FROM invoices i
       LEFT JOIN job_cards jc ON i.job_card_id = jc.id
       WHERE i.status IN ('Unpaid', 'Partially Paid')`
    );
    const creditCustomers = parseInt(creditResult[0].credit_customers) || 0;

    res.json({
      success: true,
      data: {
        totalPayments: totalPayments,
        pendingPayments: pendingPayments,
        creditCustomers: creditCustomers
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment statistics'
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats
};

