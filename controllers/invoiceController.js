/**
 * Invoice Controller
 * CRUD operations for invoices
 */

const pool = require('../config/db');

/**
 * Auto-generate invoice number (INV-001, INV-002, etc.)
 */
const generateInvoiceNumber = async () => {
  try {
    const [invoices] = await pool.execute(
      'SELECT invoice_no FROM invoices ORDER BY id DESC LIMIT 1'
    );

    if (invoices.length === 0) {
      return 'INV-001';
    }

    const latestInvoiceNo = invoices[0].invoice_no;
    const match = latestInvoiceNo.match(/INV-(\d+)/);
    
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `INV-${String(nextNumber).padStart(3, '0')}`;
    }

    return 'INV-001';
  } catch (error) {
    console.error('Generate invoice number error:', error);
    return `INV-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Get all invoices
 * GET /api/invoices
 * Query params: status
 */
const getAllInvoices = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        i.id, i.invoice_no, i.job_card_id, i.quotation_id,
        i.labour_amount, i.parts_amount, i.vat_percentage, i.grand_total,
        i.status, i.created_at, i.updated_at,
        jc.job_no,
        c.name AS customer_name
      FROM invoices i
      LEFT JOIN job_cards jc ON i.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND i.status = ?';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';

    const [invoices] = await pool.execute(query, params);

    const formattedInvoices = invoices.map(i => ({
      id: i.id,
      invoiceNo: i.invoice_no,
      jobCard: i.job_no,
      customerName: i.customer_name,
      labourAmount: parseFloat(i.labour_amount) || 0,
      partsAmount: parseFloat(i.parts_amount) || 0,
      vatPercentage: parseFloat(i.vat_percentage) || 0,
      grandTotal: parseFloat(i.grand_total) || 0,
      status: i.status,
      createdAt: i.created_at ? i.created_at.toISOString().split('T')[0] : null,
      updatedAt: i.updated_at
    }));

    res.json({
      success: true,
      data: formattedInvoices,
      count: formattedInvoices.length
    });
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
};

/**
 * Get invoice by ID
 * GET /api/invoices/:id
 * Returns invoice with full job card details for printing
 */
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoices] = await pool.execute(
      `SELECT 
        i.id, i.invoice_no, i.job_card_id, i.quotation_id,
        i.labour_amount, i.parts_amount, i.vat_percentage, i.grand_total,
        i.status, i.created_at, i.updated_at,
        jc.id AS job_card_id, jc.job_no, jc.vehicle_type, jc.vehicle_number,
        jc.engine_model, jc.job_type, jc.job_sub_type, jc.brand,
        jc.pump_injector_serial, jc.status AS job_status,
        jc.received_date, jc.expected_delivery_date, jc.description,
        c.id AS customer_id, c.name AS customer_name, c.phone AS customer_phone,
        c.company AS company_name, c.address AS customer_address,
        u.name AS technician_name
      FROM invoices i
      LEFT JOIN job_cards jc ON i.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE i.id = ?`,
      [id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const i = invoices[0];
    
    // Calculate VAT amount and subtotal
    const subtotal = (parseFloat(i.labour_amount) || 0) + (parseFloat(i.parts_amount) || 0);
    const vatAmount = (subtotal * (parseFloat(i.vat_percentage) || 0)) / 100;
    
    const formattedInvoice = {
      id: i.id,
      invoiceNo: i.invoice_no,
      jobCardId: i.job_card_id,
      jobCard: i.job_no,
      quotationId: i.quotation_id,
      labourAmount: parseFloat(i.labour_amount) || 0,
      partsAmount: parseFloat(i.parts_amount) || 0,
      vatPercentage: parseFloat(i.vat_percentage) || 0,
      vatAmount: vatAmount,
      subtotal: subtotal,
      grandTotal: parseFloat(i.grand_total) || 0,
      status: i.status,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      // Full job card details for printing
      jobCardDetails: {
        id: i.job_card_id,
        jobNumber: i.job_no,
        customerName: i.customer_name,
        customerPhone: i.customer_phone,
        companyName: i.company_name,
        customerAddress: i.customer_address,
        vehicleType: i.vehicle_type,
        vehicleNumber: i.vehicle_number,
        engineModel: i.engine_model,
        jobType: i.job_type,
        jobSubType: i.job_sub_type,
        brand: i.brand,
        pumpInjectorSerial: i.pump_injector_serial,
        technician: i.technician_name,
        status: i.job_status,
        receivedDate: i.received_date ? i.received_date.toISOString().split('T')[0] : null,
        expectedDeliveryDate: i.expected_delivery_date ? i.expected_delivery_date.toISOString().split('T')[0] : null,
        description: i.description
      }
    };

    res.json({
      success: true,
      data: formattedInvoice
    });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
};

/**
 * Create new invoice
 * POST /api/invoices
 * Body: { quotation (optional), jobCard, customerName, labourAmount, partsAmount, vatPercentage, status }
 */
const createInvoice = async (req, res) => {
  try {
    const { quotation, jobCard, customerName, labourAmount, partsAmount, vatPercentage, status } = req.body;

    let jobCardId = null;
    let labour = 0;
    let parts = 0;
    let vat = 0;

    // If quotation is provided, get data from quotation
    if (quotation) {
      const [quotations] = await pool.execute(
        'SELECT job_card_id, labour_charges, parts_charges, vat_percentage FROM quotations WHERE quotation_no = ?',
        [quotation]
      );

      if (quotations.length > 0) {
        const q = quotations[0];
        jobCardId = q.job_card_id;
        labour = parseFloat(q.labour_charges) || 0;
        parts = parseFloat(q.parts_charges) || 0;
        vat = parseFloat(q.vat_percentage) || 0;
      }
    }

    // If job card is provided directly
    if (!jobCardId && jobCard) {
      const [jobCards] = await pool.execute(
        'SELECT id FROM job_cards WHERE job_no = ?',
        [jobCard]
      );

      if (jobCards.length > 0) {
        jobCardId = jobCards[0].id;
      }
    }

    if (!jobCardId) {
      return res.status(400).json({
        success: false,
        error: 'Job card is required'
      });
    }

    // Override with provided values if any
    if (labourAmount !== undefined) {
      labour = parseFloat(labourAmount) || 0;
    }
    if (partsAmount !== undefined) {
      parts = parseFloat(partsAmount) || 0;
    }
    if (vatPercentage !== undefined) {
      vat = parseFloat(vatPercentage) || 0;
    }

    // Calculate grand total
    const subtotal = labour + parts;
    const vatAmount = (subtotal * vat) / 100;
    const grandTotal = subtotal + vatAmount;

    // Generate invoice number
    const invoiceNo = await generateInvoiceNumber();

    // Get quotation ID if quotation was provided
    let quotationId = null;
    if (quotation) {
      const [quotations] = await pool.execute(
        'SELECT id FROM quotations WHERE quotation_no = ?',
        [quotation]
      );
      if (quotations.length > 0) {
        quotationId = quotations[0].id;
      }
    }

    // Insert invoice
    const [result] = await pool.execute(
      `INSERT INTO invoices (
        invoice_no, job_card_id, quotation_id,
        labour_amount, parts_amount, vat_percentage, grand_total,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        invoiceNo,
        jobCardId,
        quotationId,
        labour,
        parts,
        vat,
        grandTotal,
        status || 'Unpaid'
      ]
    );

    // Fetch created invoice
    const [invoices] = await pool.execute(
      `SELECT 
        i.id, i.invoice_no, i.job_card_id, i.quotation_id,
        i.labour_amount, i.parts_amount, i.vat_percentage, i.grand_total,
        i.status, i.created_at, i.updated_at,
        jc.job_no,
        c.name AS customer_name
      FROM invoices i
      LEFT JOIN job_cards jc ON i.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE i.id = ?`,
      [result.insertId]
    );

    const i = invoices[0];
    const formattedInvoice = {
      id: i.id,
      invoiceNo: i.invoice_no,
      jobCard: i.job_no,
      customerName: i.customer_name,
      labourAmount: parseFloat(i.labour_amount) || 0,
      partsAmount: parseFloat(i.parts_amount) || 0,
      vatPercentage: parseFloat(i.vat_percentage) || 0,
      grandTotal: parseFloat(i.grand_total) || 0,
      status: i.status
    };

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: formattedInvoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invoice'
    });
  }
};

/**
 * Update invoice
 * PUT /api/invoices/:id
 */
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { labourAmount, partsAmount, vatPercentage, status } = req.body;

    // Check if invoice exists
    const [existingInvoices] = await pool.execute(
      'SELECT id, labour_amount, parts_amount, vat_percentage FROM invoices WHERE id = ?',
      [id]
    );

    if (existingInvoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const existing = existingInvoices[0];

    // Build update query
    const updates = [];
    const params = [];

    let labour = parseFloat(labourAmount) !== undefined ? parseFloat(labourAmount) : parseFloat(existing.labour_amount);
    let parts = parseFloat(partsAmount) !== undefined ? parseFloat(partsAmount) : parseFloat(existing.parts_amount);
    let vat = parseFloat(vatPercentage) !== undefined ? parseFloat(vatPercentage) : parseFloat(existing.vat_percentage);

    if (labourAmount !== undefined) {
      updates.push('labour_amount = ?');
      params.push(labour);
    }
    if (partsAmount !== undefined) {
      updates.push('parts_amount = ?');
      params.push(parts);
    }
    if (vatPercentage !== undefined) {
      updates.push('vat_percentage = ?');
      params.push(vat);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    // Recalculate grand total
    const subtotal = labour + parts;
    const vatAmount = (subtotal * vat) / 100;
    const grandTotal = subtotal + vatAmount;

    updates.push('grand_total = ?');
    params.push(grandTotal);
    updates.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated invoice
    const [invoices] = await pool.execute(
      `SELECT 
        i.id, i.invoice_no, i.job_card_id, i.quotation_id,
        i.labour_amount, i.parts_amount, i.vat_percentage, i.grand_total,
        i.status, i.created_at, i.updated_at,
        jc.job_no,
        c.name AS customer_name
      FROM invoices i
      LEFT JOIN job_cards jc ON i.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE i.id = ?`,
      [id]
    );

    const i = invoices[0];
    const formattedInvoice = {
      id: i.id,
      invoiceNo: i.invoice_no,
      jobCard: i.job_no,
      customerName: i.customer_name,
      labourAmount: parseFloat(i.labour_amount) || 0,
      partsAmount: parseFloat(i.parts_amount) || 0,
      vatPercentage: parseFloat(i.vat_percentage) || 0,
      grandTotal: parseFloat(i.grand_total) || 0,
      status: i.status
    };

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: formattedInvoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update invoice'
    });
  }
};

/**
 * Delete invoice
 * DELETE /api/invoices/:id
 */
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if invoice exists
    const [invoices] = await pool.execute(
      'SELECT id FROM invoices WHERE id = ?',
      [id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Check if invoice has payments
    const [payments] = await pool.execute(
      'SELECT id FROM payments WHERE invoice_id = ? LIMIT 1',
      [id]
    );

    if (payments.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete invoice with existing payments'
      });
    }

    // Delete invoice
    await pool.execute('DELETE FROM invoices WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete invoice'
    });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice
};

