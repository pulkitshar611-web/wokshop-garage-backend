/**
 * Job Card Controller
 * CRUD operations for job cards with auto-generated job numbers
 */

const pool = require('../config/db');

/**
 * Auto-generate job number (JC-001, JC-002, etc.)
 * Gets the latest job number and increments it
 */
const generateJobNumber = async () => {
  try {
    // Get the latest job number
    const [jobs] = await pool.execute(
      'SELECT job_no FROM job_cards ORDER BY id DESC LIMIT 1'
    );

    if (jobs.length === 0) {
      // First job card
      return 'JC-001';
    }

    // Extract number from latest job_no (e.g., "JC-001" -> 1)
    const latestJobNo = jobs[0].job_no;
    const match = latestJobNo.match(/JC-(\d+)/);
    
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `JC-${String(nextNumber).padStart(3, '0')}`;
    }

    // Fallback if format doesn't match
    return `JC-001`;
  } catch (error) {
    console.error('Generate job number error:', error);
    // Fallback to timestamp-based number
    return `JC-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Get all job cards
 * GET /api/job-cards
 * Query params: status, technician, vehicleType, search
 */
const getAllJobCards = async (req, res) => {
  try {
    const { status, technician, vehicleType, search } = req.query;
    
    let query = `
      SELECT 
        jc.id, jc.job_no, jc.customer_id, jc.technician_id,
        jc.vehicle_type, jc.vehicle_number, jc.engine_model,
        jc.job_type, jc.job_sub_type, jc.brand, jc.pump_injector_serial,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        c.name AS customer_name, c.email AS customer_email, 
        c.phone AS customer_phone, c.company AS company_name,
        u.name AS technician_name
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (status && status !== 'all') {
      query += ' AND jc.status = ?';
      params.push(status);
    }

    if (technician && technician !== 'all') {
      query += ' AND u.name = ?';
      params.push(technician);
    }

    if (vehicleType && vehicleType !== 'all') {
      query += ' AND jc.vehicle_type = ?';
      params.push(vehicleType);
    }

    if (search) {
      query += ` AND (
        jc.job_no LIKE ? OR 
        c.name LIKE ? OR 
        c.phone LIKE ? OR
        jc.vehicle_number LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY jc.created_at DESC';

    const [jobCards] = await pool.execute(query, params);

    // Format response to match frontend expectations
    const formattedJobCards = jobCards.map(jc => ({
      id: jc.id,
      jobNumber: jc.job_no,
      customerName: jc.customer_name,
      customerPhone: jc.customer_phone,
      companyName: jc.company_name,
      vehicleType: jc.vehicle_type,
      vehicleNumber: jc.vehicle_number,
      engineModel: jc.engine_model,
      jobType: jc.job_type,
      jobSubType: jc.job_sub_type,
      brand: jc.brand,
      pumpInjectorSerial: jc.pump_injector_serial,
      technicianId: jc.technician_id,
      technician: jc.technician_name,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description,
      createdAt: jc.created_at,
      updatedAt: jc.updated_at
    }));

    res.json({
      success: true,
      data: formattedJobCards,
      count: formattedJobCards.length
    });
  } catch (error) {
    console.error('Get all job cards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job cards'
    });
  }
};

/**
 * Get job card by ID
 * GET /api/job-cards/:id
 */
const getJobCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const [jobCards] = await pool.execute(
      `SELECT 
        jc.id, jc.job_no, jc.customer_id, jc.technician_id,
        jc.vehicle_type, jc.vehicle_number, jc.engine_model,
        jc.job_type, jc.job_sub_type, jc.brand, jc.pump_injector_serial,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        c.name AS customer_name, c.email AS customer_email, 
        c.phone AS customer_phone, c.company AS company_name, c.address AS customer_address,
        u.name AS technician_name, u.email AS technician_email
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE jc.id = ?`,
      [id]
    );

    if (jobCards.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job card not found'
      });
    }

    const jc = jobCards[0];
    const formattedJobCard = {
      id: jc.id,
      jobNumber: jc.job_no,
      customerId: jc.customer_id,
      customerName: jc.customer_name,
      customerEmail: jc.customer_email,
      customerPhone: jc.customer_phone,
      companyName: jc.company_name,
      customerAddress: jc.customer_address,
      technicianId: jc.technician_id,
      technician: jc.technician_name,
      technicianEmail: jc.technician_email,
      vehicleType: jc.vehicle_type,
      vehicleNumber: jc.vehicle_number,
      engineModel: jc.engine_model,
      jobType: jc.job_type,
      jobSubType: jc.job_sub_type,
      brand: jc.brand,
      pumpInjectorSerial: jc.pump_injector_serial,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description,
      createdAt: jc.created_at,
      updatedAt: jc.updated_at
    };

    res.json({
      success: true,
      data: formattedJobCard
    });
  } catch (error) {
    console.error('Get job card by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job card'
    });
  }
};

/**
 * Create new job card
 * POST /api/job-cards
 * Body: { customerName, customerPhone, companyName, vehicleType, vehicleNumber, 
 *         engineModel, jobType, jobSubType, brand, pumpInjectorSerial, 
 *         technician, status, receivedDate, expectedDeliveryDate, description }
 */
const createJobCard = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      companyName,
      vehicleType,
      vehicleNumber,
      engineModel,
      jobType,
      jobSubType,
      brand,
      pumpInjectorSerial,
      technician,
      status,
      receivedDate,
      expectedDeliveryDate,
      description
    } = req.body;

    // Validate required fields
    if (!customerName || !vehicleType || !jobType || !brand) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, vehicle type, job type, and brand are required'
      });
    }

    // Find or create customer
    let customerId;
    if (customerName) {
      // Try to find existing customer by name and phone
      let [customers] = await pool.execute(
        'SELECT id FROM customers WHERE name = ? AND phone = ?',
        [customerName, customerPhone || '']
      );

      if (customers.length === 0) {
        // Create new customer
        const [customerResult] = await pool.execute(
          'INSERT INTO customers (name, phone, company, created_at) VALUES (?, ?, ?, NOW())',
          [customerName, customerPhone || null, companyName || null]
        );
        customerId = customerResult.insertId;
      } else {
        customerId = customers[0].id;
      }
    }

    // Find technician by name
    let technicianId = null;
    if (technician) {
      const [technicians] = await pool.execute(
        'SELECT id FROM users WHERE name = ? AND role = ?',
        [technician, 'technician']
      );
      if (technicians.length > 0) {
        technicianId = technicians[0].id;
      }
    }

    // Auto-generate job number
    const jobNo = await generateJobNumber();

    // Insert job card
    const [result] = await pool.execute(
      `INSERT INTO job_cards (
        job_no, customer_id, technician_id, vehicle_type, vehicle_number,
        engine_model, job_type, job_sub_type, brand, pump_injector_serial,
        status, received_date, expected_delivery_date, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        jobNo,
        customerId,
        technicianId,
        vehicleType,
        vehicleNumber || null,
        engineModel || null,
        jobType,
        jobSubType || null,
        brand,
        pumpInjectorSerial || null,
        status || 'Received',
        receivedDate || new Date().toISOString().split('T')[0],
        expectedDeliveryDate || null,
        description || null
      ]
    );

    // Fetch created job card
    const [jobCards] = await pool.execute(
      `SELECT 
        jc.id, jc.job_no, jc.customer_id, jc.technician_id,
        jc.vehicle_type, jc.vehicle_number, jc.engine_model,
        jc.job_type, jc.job_sub_type, jc.brand, jc.pump_injector_serial,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        c.name AS customer_name, c.phone AS customer_phone, c.company AS company_name,
        u.name AS technician_name
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE jc.id = ?`,
      [result.insertId]
    );

    const jc = jobCards[0];
    const formattedJobCard = {
      id: jc.id,
      jobNumber: jc.job_no,
      customerName: jc.customer_name,
      customerPhone: jc.customer_phone,
      companyName: jc.company_name,
      vehicleType: jc.vehicle_type,
      vehicleNumber: jc.vehicle_number,
      engineModel: jc.engine_model,
      jobType: jc.job_type,
      jobSubType: jc.job_sub_type,
      brand: jc.brand,
      pumpInjectorSerial: jc.pump_injector_serial,
      technicianId: jc.technician_id,
      technician: jc.technician_name,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description
    };

    res.status(201).json({
      success: true,
      message: 'Job card created successfully',
      data: formattedJobCard
    });
  } catch (error) {
    console.error('Create job card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job card'
    });
  }
};

/**
 * Update job card
 * PUT /api/job-cards/:id
 */
const updateJobCard = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      companyName,
      vehicleType,
      vehicleNumber,
      engineModel,
      jobType,
      jobSubType,
      brand,
      pumpInjectorSerial,
      technician,
      status,
      receivedDate,
      expectedDeliveryDate,
      description
    } = req.body;

    // Check if job card exists
    const [existingJobs] = await pool.execute(
      'SELECT id, customer_id FROM job_cards WHERE id = ?',
      [id]
    );

    if (existingJobs.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job card not found'
      });
    }

    const existingJob = existingJobs[0];

    // Update customer if customer info changed
    if (customerName && existingJob.customer_id) {
      await pool.execute(
        'UPDATE customers SET name = ?, phone = ?, company = ?, updated_at = NOW() WHERE id = ?',
        [customerName, customerPhone || null, companyName || null, existingJob.customer_id]
      );
    }

    // Find technician by name if provided
    let technicianId = null;
    if (technician) {
      const [technicians] = await pool.execute(
        'SELECT id FROM users WHERE name = ? AND role = ?',
        [technician, 'technician']
      );
      if (technicians.length > 0) {
        technicianId = technicians[0].id;
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (vehicleType) {
      updates.push('vehicle_type = ?');
      params.push(vehicleType);
    }
    if (vehicleNumber !== undefined) {
      updates.push('vehicle_number = ?');
      params.push(vehicleNumber);
    }
    if (engineModel !== undefined) {
      updates.push('engine_model = ?');
      params.push(engineModel);
    }
    if (jobType) {
      updates.push('job_type = ?');
      params.push(jobType);
    }
    if (jobSubType !== undefined) {
      updates.push('job_sub_type = ?');
      params.push(jobSubType);
    }
    if (brand) {
      updates.push('brand = ?');
      params.push(brand);
    }
    if (pumpInjectorSerial !== undefined) {
      updates.push('pump_injector_serial = ?');
      params.push(pumpInjectorSerial);
    }
    if (technicianId !== null) {
      updates.push('technician_id = ?');
      params.push(technicianId);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (receivedDate) {
      updates.push('received_date = ?');
      params.push(receivedDate);
    }
    if (expectedDeliveryDate !== undefined) {
      updates.push('expected_delivery_date = ?');
      params.push(expectedDeliveryDate);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id);

      await pool.execute(
        `UPDATE job_cards SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Fetch updated job card
    const [jobCards] = await pool.execute(
      `SELECT 
        jc.id, jc.job_no, jc.customer_id, jc.technician_id,
        jc.vehicle_type, jc.vehicle_number, jc.engine_model,
        jc.job_type, jc.job_sub_type, jc.brand, jc.pump_injector_serial,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        c.name AS customer_name, c.phone AS customer_phone, c.company AS company_name,
        u.name AS technician_name
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE jc.id = ?`,
      [id]
    );

    const jc = jobCards[0];
    const formattedJobCard = {
      id: jc.id,
      jobNumber: jc.job_no,
      customerName: jc.customer_name,
      customerPhone: jc.customer_phone,
      companyName: jc.company_name,
      vehicleType: jc.vehicle_type,
      vehicleNumber: jc.vehicle_number,
      engineModel: jc.engine_model,
      jobType: jc.job_type,
      jobSubType: jc.job_sub_type,
      brand: jc.brand,
      pumpInjectorSerial: jc.pump_injector_serial,
      technicianId: jc.technician_id,
      technician: jc.technician_name,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description
    };

    res.json({
      success: true,
      message: 'Job card updated successfully',
      data: formattedJobCard
    });
  } catch (error) {
    console.error('Update job card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job card'
    });
  }
};

/**
 * Delete job card
 * DELETE /api/job-cards/:id
 */
const deleteJobCard = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if job card exists
    const [jobCards] = await pool.execute(
      'SELECT id FROM job_cards WHERE id = ?',
      [id]
    );

    if (jobCards.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job card not found'
      });
    }

    // Check if job card has related records (testing records, quotations, invoices)
    const [testingRecords] = await pool.execute(
      'SELECT id FROM testing_records WHERE job_card_id = ? LIMIT 1',
      [id]
    );

    if (testingRecords.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete job card with existing testing records'
      });
    }

    // Delete job card
    await pool.execute('DELETE FROM job_cards WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Job card deleted successfully'
    });
  } catch (error) {
    console.error('Delete job card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job card'
    });
  }
};

module.exports = {
  getAllJobCards,
  getJobCardById,
  createJobCard,
  updateJobCard,
  deleteJobCard
};

