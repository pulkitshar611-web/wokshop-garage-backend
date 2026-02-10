/**
 * Quotation Controller
 * CRUD operations for quotations
 */

const pool = require('../config/db');

/**
 * Auto-generate quotation number (QT-001, QT-002, etc.)
 */
const generateQuotationNumber = async () => {
  try {
    const [quotations] = await pool.execute(
      'SELECT quotation_no FROM quotations ORDER BY id DESC LIMIT 1'
    );

    if (quotations.length === 0) {
      return 'QT-001';
    }

    const latestQuotationNo = quotations[0].quotation_no;
    const match = latestQuotationNo.match(/QT-(\d+)/);
    
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `QT-${String(nextNumber).padStart(3, '0')}`;
    }

    return 'QT-001';
  } catch (error) {
    console.error('Generate quotation number error:', error);
    return `QT-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Get all quotations
 * GET /api/quotations
 * Query params: status
 */
const getAllQuotations = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        q.id, q.quotation_no, q.job_card_id, q.labour_charges,
        q.parts_charges, q.vat_percentage, q.total_amount,
        q.valid_until, q.status, q.created_at, q.updated_at,
        jc.job_no,
        c.name AS customer_name
      FROM quotations q
      LEFT JOIN job_cards jc ON q.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND q.status = ?';
      params.push(status);
    }

    query += ' ORDER BY q.created_at DESC';

    const [quotations] = await pool.execute(query, params);

    const formattedQuotations = quotations.map(q => ({
      id: q.id,
      quotationNo: q.quotation_no,
      jobCard: q.job_no,
      customerName: q.customer_name,
      labourCharges: parseFloat(q.labour_charges) || 0,
      partsCharges: parseFloat(q.parts_charges) || 0,
      vatPercentage: parseFloat(q.vat_percentage) || 0,
      totalAmount: parseFloat(q.total_amount) || 0,
      validUntil: q.valid_until ? q.valid_until.toISOString().split('T')[0] : null,
      status: q.status,
      createdAt: q.created_at,
      updatedAt: q.updated_at
    }));

    res.json({
      success: true,
      data: formattedQuotations,
      count: formattedQuotations.length
    });
  } catch (error) {
    console.error('Get all quotations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quotations'
    });
  }
};

/**
 * Get quotation by ID
 * GET /api/quotations/:id
 */
const getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [quotations] = await pool.execute(
      `SELECT 
        q.id, q.quotation_no, q.job_card_id, q.labour_charges,
        q.parts_charges, q.vat_percentage, q.total_amount,
        q.valid_until, q.status, q.created_at, q.updated_at,
        jc.id AS job_card_id, jc.job_no, jc.vehicle_type, jc.vehicle_number,
        jc.engine_model, jc.job_type, jc.job_sub_type, jc.brand,
        jc.pump_injector_serial, jc.status AS job_status,
        jc.received_date, jc.expected_delivery_date, jc.description,
        c.id AS customer_id, c.name AS customer_name, c.phone AS customer_phone,
        c.company AS company_name, c.address AS customer_address,
        u.name AS technician_name
      FROM quotations q
      LEFT JOIN job_cards jc ON q.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE q.id = ?`,
      [id]
    );

    if (quotations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    const q = quotations[0];
    
    // Calculate VAT amount and subtotal
    const subtotal = (parseFloat(q.labour_charges) || 0) + (parseFloat(q.parts_charges) || 0);
    const vatAmount = (subtotal * (parseFloat(q.vat_percentage) || 0)) / 100;
    
    const formattedQuotation = {
      id: q.id,
      quotationNo: q.quotation_no,
      jobCardId: q.job_card_id,
      jobCard: q.job_no,
      labourCharges: parseFloat(q.labour_charges) || 0,
      partsCharges: parseFloat(q.parts_charges) || 0,
      vatPercentage: parseFloat(q.vat_percentage) || 0,
      vatAmount: vatAmount,
      subtotal: subtotal,
      totalAmount: parseFloat(q.total_amount) || 0,
      validUntil: q.valid_until ? q.valid_until.toISOString().split('T')[0] : null,
      status: q.status,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
      // Full job card details for printing
      jobCardDetails: {
        id: q.job_card_id,
        jobNumber: q.job_no,
        customerName: q.customer_name,
        customerPhone: q.customer_phone,
        companyName: q.company_name,
        customerAddress: q.customer_address,
        vehicleType: q.vehicle_type,
        vehicleNumber: q.vehicle_number,
        engineModel: q.engine_model,
        jobType: q.job_type,
        jobSubType: q.job_sub_type,
        brand: q.brand,
        pumpInjectorSerial: q.pump_injector_serial,
        technician: q.technician_name,
        status: q.job_status,
        receivedDate: q.received_date ? q.received_date.toISOString().split('T')[0] : null,
        expectedDeliveryDate: q.expected_delivery_date ? q.expected_delivery_date.toISOString().split('T')[0] : null,
        description: q.description
      }
    };

    res.json({
      success: true,
      data: formattedQuotation
    });
  } catch (error) {
    console.error('Get quotation by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quotation'
    });
  }
};

/**
 * Create new quotation
 * POST /api/quotations
 * Body: { jobCard, customerName, labourCharges, partsCharges, vatPercentage, validUntil, status }
 */
const createQuotation = async (req, res) => {
  try {
    const { jobCard, customerName, labourCharges, partsCharges, vatPercentage, validUntil, status } = req.body;

    // Validate required fields
    if (!jobCard) {
      return res.status(400).json({
        success: false,
        error: 'Job card is required'
      });
    }

    // Find job card by job number
    const [jobCards] = await pool.execute(
      'SELECT id FROM job_cards WHERE job_no = ?',
      [jobCard]
    );

    if (jobCards.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job card not found'
      });
    }

    const jobCardId = jobCards[0].id;

    // Calculate total amount
    const labour = parseFloat(labourCharges) || 0;
    const parts = parseFloat(partsCharges) || 0;
    const vat = parseFloat(vatPercentage) || 0;
    const subtotal = labour + parts;
    const vatAmount = (subtotal * vat) / 100;
    const total = subtotal + vatAmount;

    // Generate quotation number
    const quotationNo = await generateQuotationNumber();

    // Insert quotation
    const [result] = await pool.execute(
      `INSERT INTO quotations (
        quotation_no, job_card_id, labour_charges, parts_charges,
        vat_percentage, total_amount, valid_until, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        quotationNo,
        jobCardId,
        labour,
        parts,
        vat,
        total,
        validUntil || null,
        status || 'Draft'
      ]
    );

    // Fetch created quotation
    const [quotations] = await pool.execute(
      `SELECT 
        q.id, q.quotation_no, q.job_card_id, q.labour_charges,
        q.parts_charges, q.vat_percentage, q.total_amount,
        q.valid_until, q.status, q.created_at, q.updated_at,
        jc.job_no,
        c.name AS customer_name
      FROM quotations q
      LEFT JOIN job_cards jc ON q.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE q.id = ?`,
      [result.insertId]
    );

    const q = quotations[0];
    const formattedQuotation = {
      id: q.id,
      quotationNo: q.quotation_no,
      jobCard: q.job_no,
      customerName: q.customer_name,
      labourCharges: parseFloat(q.labour_charges) || 0,
      partsCharges: parseFloat(q.parts_charges) || 0,
      vatPercentage: parseFloat(q.vat_percentage) || 0,
      totalAmount: parseFloat(q.total_amount) || 0,
      validUntil: q.valid_until ? q.valid_until.toISOString().split('T')[0] : null,
      status: q.status
    };

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: formattedQuotation
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quotation'
    });
  }
};

/**
 * Update quotation
 * PUT /api/quotations/:id
 */
const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { labourCharges, partsCharges, vatPercentage, validUntil, status } = req.body;

    // Check if quotation exists
    const [existingQuotations] = await pool.execute(
      'SELECT id, labour_charges, parts_charges, vat_percentage FROM quotations WHERE id = ?',
      [id]
    );

    if (existingQuotations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    const existing = existingQuotations[0];

    // Build update query
    const updates = [];
    const params = [];

    let labour = parseFloat(labourCharges) !== undefined ? parseFloat(labourCharges) : parseFloat(existing.labour_charges);
    let parts = parseFloat(partsCharges) !== undefined ? parseFloat(partsCharges) : parseFloat(existing.parts_charges);
    let vat = parseFloat(vatPercentage) !== undefined ? parseFloat(vatPercentage) : parseFloat(existing.vat_percentage);

    if (labourCharges !== undefined) {
      updates.push('labour_charges = ?');
      params.push(labour);
    }
    if (partsCharges !== undefined) {
      updates.push('parts_charges = ?');
      params.push(parts);
    }
    if (vatPercentage !== undefined) {
      updates.push('vat_percentage = ?');
      params.push(vat);
    }
    if (validUntil !== undefined) {
      updates.push('valid_until = ?');
      params.push(validUntil);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    // Recalculate total amount
    const subtotal = labour + parts;
    const vatAmount = (subtotal * vat) / 100;
    const total = subtotal + vatAmount;

    updates.push('total_amount = ?');
    params.push(total);
    updates.push('updated_at = NOW()');
    params.push(id);

    await pool.execute(
      `UPDATE quotations SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated quotation
    const [quotations] = await pool.execute(
      `SELECT 
        q.id, q.quotation_no, q.job_card_id, q.labour_charges,
        q.parts_charges, q.vat_percentage, q.total_amount,
        q.valid_until, q.status, q.created_at, q.updated_at,
        jc.job_no,
        c.name AS customer_name
      FROM quotations q
      LEFT JOIN job_cards jc ON q.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE q.id = ?`,
      [id]
    );

    const q = quotations[0];
    const formattedQuotation = {
      id: q.id,
      quotationNo: q.quotation_no,
      jobCard: q.job_no,
      customerName: q.customer_name,
      labourCharges: parseFloat(q.labour_charges) || 0,
      partsCharges: parseFloat(q.parts_charges) || 0,
      vatPercentage: parseFloat(q.vat_percentage) || 0,
      totalAmount: parseFloat(q.total_amount) || 0,
      validUntil: q.valid_until ? q.valid_until.toISOString().split('T')[0] : null,
      status: q.status
    };

    res.json({
      success: true,
      message: 'Quotation updated successfully',
      data: formattedQuotation
    });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quotation'
    });
  }
};

/**
 * Delete quotation
 * DELETE /api/quotations/:id
 */
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if quotation exists
    const [quotations] = await pool.execute(
      'SELECT id FROM quotations WHERE id = ?',
      [id]
    );

    if (quotations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found'
      });
    }

    // Check if quotation has been converted to invoice
    const [invoices] = await pool.execute(
      'SELECT id FROM invoices WHERE quotation_id = ? LIMIT 1',
      [id]
    );

    if (invoices.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete quotation that has been converted to invoice'
      });
    }

    // Delete quotation
    await pool.execute('DELETE FROM quotations WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quotation'
    });
  }
};

module.exports = {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation
};

