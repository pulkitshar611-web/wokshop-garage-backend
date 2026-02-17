/**
 * Job Card Controller
 * CRUD operations for job cards with multi-item support
 */

const pool = require('../config/db');

/**
 * Auto-generate job number (JC-001, JC-002, etc.)
 */
const generateJobNumber = async () => {
  try {
    const [jobs] = await pool.execute(
      'SELECT job_no FROM job_cards ORDER BY id DESC LIMIT 1'
    );

    if (jobs.length === 0) return 'JC-001';

    const latestJobNo = jobs[0].job_no;
    const match = latestJobNo.match(/JC-(\d+)/);

    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `JC-${String(nextNumber).padStart(3, '0')}`;
    }

    return `JC-001`;
  } catch (error) {
    console.error('Generate job number error:', error);
    return `JC-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Get all job cards
 */
const getAllJobCards = async (req, res) => {
  try {
    const { status, technician, vehicleType, search } = req.query;

    let query = `
      SELECT 
        jc.id, jc.job_no, jc.customer_id, jc.technician_id,
        jc.vehicle_type, jc.vehicle_number, jc.engine_model,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        jc.quotation_amount, jc.final_amount,
        c.name AS customer_name, c.email AS customer_email, 
        c.phone AS customer_phone, c.company AS company_name,
        u.name AS technician_name,
        (SELECT COALESCE(SUM(total_price), 0) FROM job_card_materials WHERE job_card_id = jc.id) AS materials_cost,
        (SELECT COALESCE(COUNT(*), 0) FROM job_card_materials WHERE job_card_id = jc.id) AS materials_count,
        (SELECT GROUP_CONCAT(CONCAT(job_type, ' (', COALESCE(serial_number, 'N/A'), ')') SEPARATOR ', ') FROM job_card_items WHERE job_card_id = jc.id) AS items_summary
      FROM job_cards jc
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE 1=1
    `;
    const params = [];

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

    const formattedJobCards = jobCards.map(jc => ({
      id: jc.id,
      jobNumber: jc.job_no,
      customerName: jc.customer_name,
      customerPhone: jc.customer_phone,
      companyName: jc.company_name,
      vehicleType: jc.vehicle_type,
      vehicleNumber: jc.vehicle_number,
      engineModel: jc.engine_model,
      itemsSummary: jc.items_summary,
      technicianId: jc.technician_id,
      technician: jc.technician_name,
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description,
      materialsCost: jc.materials_cost,
      materialsCount: jc.materials_count,
      quotationAmount: jc.quotation_amount,
      finalAmount: jc.final_amount,
      labourCost: jc.labour_cost,
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
 */
const getJobCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const [jobCards] = await pool.execute(
      `SELECT 
        jc.id, jc.job_no, jc.customer_id, jc.technician_id,
        jc.vehicle_type, jc.vehicle_number, jc.engine_model,
        jc.status, jc.received_date, jc.expected_delivery_date,
        jc.description, jc.created_at, jc.updated_at,
        jc.quotation_amount, jc.final_amount, jc.labour_cost,
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

    const [items] = await pool.execute(
      'SELECT * FROM job_card_items WHERE job_card_id = ?',
      [id]
    );

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
      items: items.map(item => ({
        id: item.id,
        jobType: item.job_type,
        jobSubType: item.job_sub_type,
        brand: item.brand,
        serialNumber: item.serial_number,
        description: item.description,
        status: item.status,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price) || 0,
        totalPrice: parseFloat(item.total_price) || 0
      })),
      status: jc.status,
      receivedDate: jc.received_date ? jc.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: jc.expected_delivery_date ? jc.expected_delivery_date.toISOString().split('T')[0] : null,
      description: jc.description,
      quotationAmount: parseFloat(jc.quotation_amount) || 0,
      finalAmount: parseFloat(jc.final_amount) || 0,
      labourCost: parseFloat(jc.labour_cost) || 0,
      materials: materials.map(m => ({
        id: m.id,
        materialName: m.material_name,
        quantity: m.quantity,
        unitPrice: m.unit_price,
        totalPrice: m.total_price,
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
 */
const createJobCard = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      customerName,
      customerPhone,
      companyName,
      vehicleType,
      vehicleNumber,
      engineModel,
      items,
      technician,
      status,
      receivedDate,
      expectedDeliveryDate,
      description,
      quotationAmount,
      finalAmount,
      labourCost
    } = req.body;

    if (!customerName || !vehicleType || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer name, vehicle type, and at least one job item are required'
      });
    }

    await connection.beginTransaction();

    let customerId;
    let [customers] = await connection.execute(
      'SELECT id FROM customers WHERE name = ? AND (phone = ? OR phone IS NULL)',
      [customerName, customerPhone || '']
    );

    if (customers.length === 0) {
      const [customerResult] = await connection.execute(
        'INSERT INTO customers (name, phone, company, created_at) VALUES (?, ?, ?, NOW())',
        [customerName, customerPhone || null, companyName || null]
      );
      customerId = customerResult.insertId;
    } else {
      customerId = customers[0].id;
    }

    let technicianId = null;
    if (technician) {
      const [technicians] = await connection.execute(
        'SELECT id FROM users WHERE name = ? AND role = ?',
        [technician, 'technician']
      );
      if (technicians.length > 0) {
        technicianId = technicians[0].id;
      }
    }

    const jobNo = await generateJobNumber();

    const [result] = await connection.execute(
      `INSERT INTO job_cards (
        job_no, customer_id, technician_id, vehicle_type, vehicle_number,
        engine_model, status, received_date, expected_delivery_date, description,
        quotation_amount, final_amount, labour_cost, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        jobNo,
        customerId,
        technicianId,
        vehicleType,
        vehicleNumber || null,
        engineModel || null,
        status || 'Received',
        receivedDate || new Date().toISOString().split('T')[0],
        expectedDeliveryDate || null,
        description || null,
        quotationAmount || 0,
        finalAmount || 0,
        labourCost || 0
      ]
    );

    const jobCardId = result.insertId;

    for (const item of items) {
      await connection.execute(
        `INSERT INTO job_card_items (
          job_card_id, job_type, job_sub_type, brand, serial_number, 
          description, status, quantity, unit_price, total_price, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          jobCardId,
          item.jobType,
          item.jobSubType || null,
          item.brand,
          item.serialNumber || null,
          item.description || null,
          item.status || 'Received',
          item.quantity || 1,
          item.unitPrice || 0,
          item.totalPrice || 0
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Job card created successfully',
      data: { id: jobCardId, jobNumber: jobNo }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Create job card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job card'
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Update job card
 */
const updateJobCard = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      customerName,
      customerPhone,
      companyName,
      vehicleType,
      vehicleNumber,
      engineModel,
      items,
      technician,
      status,
      receivedDate,
      expectedDeliveryDate,
      description,
      quotationAmount,
      finalAmount,
      labourCost
    } = req.body;

    const [existingJobs] = await connection.execute(
      'SELECT id, customer_id, status FROM job_cards WHERE id = ?',
      [id]
    );

    if (existingJobs.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: 'Job card not found'
      });
    }

    const existingJob = existingJobs[0];

    await connection.beginTransaction();

    if (customerName && existingJob.customer_id) {
      await connection.execute(
        'UPDATE customers SET name = ?, phone = ?, company = ?, updated_at = NOW() WHERE id = ?',
        [customerName, customerPhone || null, companyName || null, existingJob.customer_id]
      );
    }

    let technicianId = null;
    if (technician) {
      const [technicians] = await connection.execute(
        'SELECT id FROM users WHERE name = ? AND role = ?',
        [technician, 'technician']
      );
      if (technicians.length > 0) {
        technicianId = technicians[0].id;
      }
    }

    await connection.execute(
      `UPDATE job_cards SET 
        technician_id = ?, vehicle_type = ?, vehicle_number = ?, engine_model = ?,
        status = ?, received_date = ?, expected_delivery_date = ?, description = ?,
        quotation_amount = ?, final_amount = ?, labour_cost = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        technicianId,
        vehicleType,
        vehicleNumber || null,
        engineModel || null,
        status,
        receivedDate,
        expectedDeliveryDate || null,
        description || null,
        quotationAmount,
        finalAmount,
        labourCost,
        id
      ]
    );

    if (items && Array.isArray(items)) {
      const [currentItems] = await connection.execute(
        'SELECT id FROM job_card_items WHERE job_card_id = ?',
        [id]
      );
      const currentItemIds = currentItems.map(item => item.id);
      const newItemIds = items.filter(item => item.id).map(item => parseInt(item.id));

      const itemsToRemove = currentItemIds.filter(cid => !newItemIds.includes(cid));
      if (itemsToRemove.length > 0) {
        await connection.execute(
          `DELETE FROM job_card_items WHERE id IN (${itemsToRemove.join(',')})`
        );
      }

      for (const item of items) {
        if (item.id && currentItemIds.includes(parseInt(item.id))) {
          await connection.execute(
            `UPDATE job_card_items SET 
              job_type = ?, job_sub_type = ?, brand = ?, serial_number = ?, 
              description = ?, status = ?, quantity = ?, unit_price = ?, total_price = ?, updated_at = NOW()
            WHERE id = ?`,
            [
              item.jobType,
              item.jobSubType || null,
              item.brand,
              item.serialNumber || null,
              item.description || null,
              item.status || 'Received',
              item.quantity || 1,
              item.unitPrice || 0,
              item.totalPrice || 0,
              item.id
            ]
          );
        } else {
          await connection.execute(
            `INSERT INTO job_card_items (
              job_card_id, job_type, job_sub_type, brand, serial_number, 
              description, status, quantity, unit_price, total_price, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              id,
              item.jobType,
              item.jobSubType || null,
              item.brand,
              item.serialNumber || null,
              item.description || null,
              item.status || 'Received',
              item.quantity || 1,
              item.unitPrice || 0,
              item.totalPrice || 0
            ]
          );
        }
      }
    }

    if (status === 'Under Repair' && existingJob.status !== 'Under Repair') {
      const [undeductedMaterials] = await connection.execute(
        'SELECT id, inventory_item_id, quantity FROM job_card_materials WHERE job_card_id = ? AND stock_deducted = 0',
        [id]
      );

      for (const mat of undeductedMaterials) {
        if (mat.inventory_item_id) {
          const [invItems] = await connection.execute(
            'SELECT available_stock, part_name FROM inventory_items WHERE id = ? FOR UPDATE',
            [mat.inventory_item_id]
          );

          if (invItems.length > 0) {
            const item = invItems[0];
            if (item.available_stock < mat.quantity) {
              throw new Error(`Insufficient stock for ${item.part_name}. Available: ${item.available_stock}, needed: ${mat.quantity}`);
            }

            await connection.execute(
              'UPDATE inventory_items SET available_stock = available_stock - ? WHERE id = ?',
              [mat.quantity, mat.inventory_item_id]
            );

            await connection.execute(
              'UPDATE job_card_materials SET stock_deducted = 1 WHERE id = ?',
              [mat.id]
            );

            await connection.execute(
              `INSERT INTO stock_transactions (
                inventory_item_id, transaction_type, quantity, reference_no, notes, created_at
              ) VALUES (?, 'Stock Out', ?, ?, ?, NOW())`,
              [mat.inventory_item_id, mat.quantity, id, `Used in Job Card ID: ${id}`]
            );
          }
        }
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: 'Job card updated successfully'
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Update job card error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update job card'
    });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Delete job card
 */
const deleteJobCard = async (req, res) => {
  try {
    const { id } = req.params;

    const [jobCards] = await pool.execute('SELECT id FROM job_cards WHERE id = ?', [id]);
    if (jobCards.length === 0) {
      return res.status(404).json({ success: false, error: 'Job card not found' });
    }

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

    await pool.execute('DELETE FROM job_cards WHERE id = ?', [id]);

    res.json({ success: true, message: 'Job card deleted successfully' });
  } catch (error) {
    console.error('Delete job card error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete job card' });
  }
};

module.exports = {
  getAllJobCards,
  getJobCardById,
  createJobCard,
  updateJobCard,
  deleteJobCard
};
