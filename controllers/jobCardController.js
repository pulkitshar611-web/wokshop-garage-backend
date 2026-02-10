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
        jc.quantity,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        jc.quotation_amount, jc.final_amount,
        c.name AS customer_name, c.email AS customer_email, 
        c.phone AS customer_phone, c.company AS company_name,
        u.name AS technician_name,
        (SELECT COALESCE(SUM(total_price), 0) FROM job_card_materials WHERE job_card_id = jc.id) AS materials_cost,
        (SELECT COALESCE(COUNT(*), 0) FROM job_card_materials WHERE job_card_id = jc.id) AS materials_count
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
      quantity: jc.quantity,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description,
      materialsCost: jc.materials_cost,
      materialsCount: jc.materials_count,
      quotationAmount: jc.quotation_amount,
      finalAmount: jc.final_amount,
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
        jc.quantity,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        jc.quotation_amount, jc.final_amount,
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

    // Also fetch materials
    const [materials] = await pool.execute(
      `SELECT 
        jcm.id, jcm.material_name, jcm.quantity, jcm.unit_price, jcm.total_price, jcm.inventory_item_id,
        ii.part_code
      FROM job_card_materials jcm
      LEFT JOIN inventory_items ii ON jcm.inventory_item_id = ii.id
      WHERE jcm.job_card_id = ?`,
      [id]
    );

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
      quantity: jc.quantity,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description,
      quotationAmount: parseFloat(jc.quotation_amount) || 0,
      finalAmount: parseFloat(jc.final_amount) || 0,
      labourCost: parseFloat(jc.labour_cost) || 0,
      materialsAmount: parseFloat(jc.materials_amount) || 0,
      materialsCost: parseFloat(jc.materials_cost) || 0,
      materials: materials.map(m => ({
        id: m.id,
        materialName: m.material_name,
        quantity: m.quantity,
        unitPrice: m.unit_price,
        totalPrice: m.total_price,
        totalCost: m.total_cost,
        partCode: m.part_code
      })),
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
      quantity,
      technician,
      status,
      receivedDate,
      expectedDeliveryDate,
      description,
      quotationAmount,
      finalAmount,
      labourCost
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
        quantity, status, received_date, expected_delivery_date, description,
        quotation_amount, final_amount, labour_cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
        quantity || 1,
        status || 'Received',
        receivedDate || new Date().toISOString().split('T')[0],
        expectedDeliveryDate || null,
        description || null,
        quotationAmount || 0,
        finalAmount || 0,
        labourCost || 0
      ]
    );

    // Fetch created job card
    const [jobCards] = await pool.execute(
      `SELECT 
        jc.id, jc.job_no, jc.customer_id, jc.technician_id,
        jc.vehicle_type, jc.vehicle_number, jc.engine_model,
        jc.job_type, jc.job_sub_type, jc.brand, jc.pump_injector_serial,
        jc.quantity,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.quotation_amount, jc.final_amount, jc.labour_cost, jc.created_at, jc.updated_at,
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
      quantity: jc.quantity,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description,
      quotationAmount: parseFloat(jc.quotation_amount) || 0,
      finalAmount: parseFloat(jc.final_amount) || 0,
      labourCost: parseFloat(jc.labour_cost) || 0
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
      description,
      quantity,
      quotationAmount,
      finalAmount,
      labourCost
    } = req.body;

    // Check if job card exists
    const [existingJobs] = await pool.execute(
      'SELECT id, customer_id, status FROM job_cards WHERE id = ?',
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

    // Build update query dynamically
    let updateQuery = 'UPDATE job_cards SET';
    const updateFields = ['updated_at = NOW()'];
    const params = [];

    if (technicianId !== null) {
      updateFields.push('technician_id = ?');
      params.push(technicianId);
    }
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (vehicleType) {
      updateFields.push('vehicle_type = ?');
      params.push(vehicleType);
    }
    if (vehicleNumber !== undefined) {
      updateFields.push('vehicle_number = ?');
      params.push(vehicleNumber);
    }
    if (engineModel !== undefined) {
      updateFields.push('engine_model = ?');
      params.push(engineModel);
    }
    if (jobType) {
      updateFields.push('job_type = ?');
      params.push(jobType);
    }
    if (jobSubType !== undefined) {
      updateFields.push('job_sub_type = ?');
      params.push(jobSubType);
    }
    if (brand) {
      updateFields.push('brand = ?');
      params.push(brand);
    }
    if (pumpInjectorSerial !== undefined) {
      updateFields.push('pump_injector_serial = ?');
      params.push(pumpInjectorSerial);
    }
    if (receivedDate) {
      updateFields.push('received_date = ?');
      params.push(receivedDate);
    }
    if (expectedDeliveryDate !== undefined) {
      updateFields.push('expected_delivery_date = ?');
      params.push(expectedDeliveryDate);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (quantity !== undefined) {
      updateFields.push('quantity = ?');
      params.push(quantity);
    }
    if (quotationAmount !== undefined) {
      updateFields.push('quotation_amount = ?');
      params.push(quotationAmount);
    }
    if (finalAmount !== undefined) {
      updateFields.push('final_amount = ?');
      params.push(finalAmount);
    }
    if (labourCost !== undefined) {
      updateFields.push('labour_cost = ?');
      params.push(labourCost);
    }
    
    // Build the final update query
    updateQuery = `${updateQuery} ${updateFields.join(', ')}`;
    params.push(id);

    // Start transaction for status-based inventory deduction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.execute(
        `${updateQuery} WHERE id = ?`,
        params
      );

      // Inventory Deduction Logic: If moving to 'Under Repair'
      if (status === 'Under Repair' && existingJob.status !== 'Under Repair') {
        // Get all materials that are NOT yet deducted
        const [undeductedMaterials] = await connection.execute(
          'SELECT id, inventory_item_id, quantity FROM job_card_materials WHERE job_card_id = ? AND stock_deducted = 0',
          [id]
        );

        for (const mat of undeductedMaterials) {
          if (mat.inventory_item_id) {
            // Check stock
            const [invItems] = await connection.execute(
              'SELECT available_stock, part_name FROM inventory_items WHERE id = ? FOR UPDATE',
              [mat.inventory_item_id]
            );

            if (invItems.length > 0) {
              const item = invItems[0];
              if (item.available_stock < mat.quantity) {
                throw new Error(`Insufficient stock for ${item.part_name}. Available: ${item.available_stock}, needed: ${mat.quantity}`);
              }

              // Deduct stock
              await connection.execute(
                'UPDATE inventory_items SET available_stock = available_stock - ? WHERE id = ?',
                [mat.quantity, mat.inventory_item_id]
              );

              // Mark material as deducted
              await connection.execute(
                'UPDATE job_card_materials SET stock_deducted = 1 WHERE id = ?',
                [mat.id]
              );

              // Get some details for logging
              const [details] = await connection.execute(
                `SELECT jc.job_no, c.name FROM job_cards jc 
                 JOIN customers c ON jc.customer_id = c.id 
                 WHERE jc.id = ?`,
                [id]
              );
              const jobNo = details[0]?.job_no || 'N/A';
              const customerName = details[0]?.name || 'N/A';

              // Get material prices for activity log
              const [matPrices] = await connection.execute(
                'SELECT unit_price, unit_cost FROM job_card_materials WHERE id = ?',
                [mat.id]
              );
              const unitPrice = matPrices[0]?.unit_price || 0;

              // Record in stock_transactions
              await connection.execute(
                `INSERT INTO stock_transactions (
                  inventory_item_id, transaction_type, quantity, reference_no, notes, created_at
                ) VALUES (?, 'Stock Out', ?, ?, ?, NOW())`,
                [mat.inventory_item_id, mat.quantity, jobNo, `Used in Job Card ${jobNo}`]
              );

              // Record in item_activity
              await connection.execute(
                `INSERT INTO item_activity (
                  inventory_item_id, activity_type, activity_date, quantity, 
                  unit_price, total_price, reference_type, reference_no, customer_name, notes, created_at
                ) VALUES (?, 'Job Usage', CURDATE(), ?, ?, ?, 'Job Card', ?, ?, ?, NOW())`,
                [
                  mat.inventory_item_id,
                  mat.quantity,
                  unitPrice,
                  mat.quantity * unitPrice,
                  'Job Card',
                  jobNo,
                  customerName,
                  `Used in Job Card ${jobNo}`
                ]
              );
            }
          }
        }
      }

      await connection.commit();
    } catch (txnError) {
      await connection.rollback();
      throw txnError;
    } finally {
      connection.release();
    }

    // Fetch updated job card
    const [jobCards] = await pool.execute(
      `SELECT 
        jc.id, jc.job_no, jc.customer_id, jc.technician_id,
        jc.vehicle_type, jc.vehicle_number, jc.engine_model,
        jc.job_type, jc.job_sub_type, jc.brand, jc.pump_injector_serial,
        jc.quantity,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        jc.quotation_amount, jc.final_amount,
        c.name AS customer_name, c.phone AS customer_phone, c.company AS company_name,
        u.name AS technician_name,
        (SELECT COALESCE(SUM(total_price), 0) FROM job_card_materials WHERE job_card_id = jc.id) AS materials_cost,
        (SELECT COALESCE(COUNT(*), 0) FROM job_card_materials WHERE job_card_id = jc.id) AS materials_count
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
      quantity: jc.quantity,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description,
      materialsCost: jc.materials_cost,
      materialsCount: jc.materials_count,
      quotationAmount: jc.quotation_amount,
      finalAmount: jc.final_amount
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

