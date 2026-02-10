/**
 * Testing Record Controller
 * CRUD operations for testing records
 */

const pool = require('../config/db');

const parseJsonMaybe = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getRequestFiles = (req, fieldName) => {
  if (!req.files || !req.files[fieldName]) return [];
  return req.files[fieldName] || [];
};

const buildAttachmentsFromFiles = (req) => {
  const mapFile = (file) => ({
    originalName: file.originalname,
    fileName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    url: `/uploads/testing-records/${file.filename}`,
  });

  const photos = getRequestFiles(req, 'photos').map(mapFile);
  const pdfReports = getRequestFiles(req, 'pdfReports').map(mapFile);
  const calibrationSheets = getRequestFiles(req, 'calibrationSheets').map(mapFile);

  if (photos.length === 0 && pdfReports.length === 0 && calibrationSheets.length === 0) {
    return null;
  }

  return {
    photos,
    pdfReports,
    calibrationSheets,
  };
};

const derivePassFail = (data, fallback) => {
  if (!data) return fallback;
  return (
    data.passFail ||
    data.pass_fail ||
    data.finalResult?.passFail ||
    data.finalResult?.pass_fail ||
    data.result?.passFail ||
    data.result?.pass_fail ||
    fallback
  );
};

const formatTestingRecord = (tr) => {
  const beforeData = parseJsonMaybe(tr.before_data);
  const afterData = parseJsonMaybe(tr.after_data);
  const attachments = parseJsonMaybe(tr.attachments);

  const beforeRepair = beforeData?.beforeRepair || {
    pressure: tr.before_pressure,
    leak: tr.before_leak,
    calibration: tr.before_calibration,
    passFail: derivePassFail(beforeData, tr.before_pass_fail),
  };

  const afterRepair = afterData?.afterRepair || {
    pressure: tr.after_pressure,
    leak: tr.after_leak,
    calibration: tr.after_calibration,
    passFail: derivePassFail(afterData, tr.after_pass_fail),
  };

  const injectorParams = {
    pilotInjection: tr.pilot_injection,
    mainInjection: tr.main_injection,
    returnFlow: tr.return_flow,
    pressure: tr.injector_pressure,
    leakTest: tr.leak_test,
  };

  return {
    id: tr.id,
    jobCardId: tr.job_card_id,
    jobCardNumber: tr.job_no,
    customerName: tr.customer_name,
    jobType: tr.job_type,
    brand: tr.brand,
    categoryType: tr.category_type || null,
    schemaVersion: tr.schema_version || 1,
    beforeData: beforeData || null,
    afterData: afterData || null,
    beforeRepair,
    afterRepair,
    injectorParams,
    testDate: tr.test_date ? tr.test_date.toISOString().split('T')[0] : null,
    attachments: attachments || null,
    approvals: {
      testedBy: tr.tested_by || null,
      approvedBy: tr.approved_by || null,
      approvalDate: tr.approval_date ? tr.approval_date.toISOString().split('T')[0] : null,
    },
    createdAt: tr.created_at,
    updatedAt: tr.updated_at,
  };
};

/**
 * Get all testing records
 * GET /api/testing-records
 * Query params: technician (technician name or ID)
 */
const getAllTestingRecords = async (req, res) => {
  try {
    const { technician } = req.query;

    let query = `
      SELECT 
        tr.id, tr.job_card_id, tr.test_date, tr.category_type, tr.schema_version,
        tr.before_pressure, tr.before_leak, tr.before_calibration, tr.before_pass_fail,
        tr.after_pressure, tr.after_leak, tr.after_calibration, tr.after_pass_fail,
        tr.pilot_injection, tr.main_injection, tr.return_flow, tr.injector_pressure, tr.leak_test,
        tr.before_data, tr.after_data, tr.attachments,
        tr.tested_by, tr.approved_by, tr.approval_date,
        tr.created_at, tr.updated_at,
        jc.job_no, jc.brand, jc.job_type, jc.technician_id,
        c.name AS customer_name,
        u.name AS technician_name
      FROM testing_records tr
      LEFT JOIN job_cards jc ON tr.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by technician if provided
    if (technician) {
      // Try to match by technician name first
      query += ` AND u.name = ?`;
      params.push(technician);
    }

    query += ` ORDER BY tr.created_at DESC`;

    const [records] = await pool.execute(query, params);

    const formattedRecords = records.map(formatTestingRecord);

    res.json({
      success: true,
      data: formattedRecords,
      count: formattedRecords.length
    });
  } catch (error) {
    console.error('Get all testing records error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch testing records'
    });
  }
};

/**
 * Get testing record by ID
 * GET /api/testing-records/:id
 */
const getTestingRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const [records] = await pool.execute(
      `SELECT 
        tr.id, tr.job_card_id, tr.test_date, tr.category_type, tr.schema_version,
        tr.before_pressure, tr.before_leak, tr.before_calibration, tr.before_pass_fail,
        tr.after_pressure, tr.after_leak, tr.after_calibration, tr.after_pass_fail,
        tr.pilot_injection, tr.main_injection, tr.return_flow, tr.injector_pressure, tr.leak_test,
        tr.before_data, tr.after_data, tr.attachments,
        tr.tested_by, tr.approved_by, tr.approval_date,
        tr.created_at, tr.updated_at,
        jc.job_no, jc.brand, jc.job_type,
        c.name AS customer_name
      FROM testing_records tr
      LEFT JOIN job_cards jc ON tr.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE tr.id = ?`,
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Testing record not found'
      });
    }

    const formattedRecord = formatTestingRecord(records[0]);

    res.json({
      success: true,
      data: formattedRecord
    });
  } catch (error) {
    console.error('Get testing record by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch testing record'
    });
  }
};

/**
 * Create new testing record
 * POST /api/testing-records
 * Body: { jobCardNumber, customerName, jobType, brand, beforeRepair, afterRepair, injectorParams, testDate }
 */
const createTestingRecord = async (req, res) => {
  try {
    let {
      jobCardNumber,
      customerName,
      jobType,
      brand,
      categoryType,
      beforeData,
      afterData,
      approvals,
      beforeRepair,
      afterRepair,
      injectorParams,
      testDate
    } = req.body;

    // Normalize v2 payload
    const parsedBeforeData = parseJsonMaybe(beforeData) || parseJsonMaybe(req.body.before_data) || null;
    const parsedAfterData = parseJsonMaybe(afterData) || parseJsonMaybe(req.body.after_data) || null;
    const parsedApprovals = parseJsonMaybe(approvals) || null;
    const parsedBeforeRepair = parseJsonMaybe(beforeRepair) || null;
    const parsedAfterRepair = parseJsonMaybe(afterRepair) || null;
    const parsedInjectorParams = parseJsonMaybe(injectorParams) || null;

    const beforeDataToStore = parsedBeforeData || (parsedBeforeRepair || parsedInjectorParams ? { beforeRepair: parsedBeforeRepair, injectorParams: parsedInjectorParams } : null);
    const afterDataToStore = parsedAfterData || (parsedAfterRepair || parsedInjectorParams ? { afterRepair: parsedAfterRepair, injectorParams: parsedInjectorParams } : null);

    const fileAttachments = buildAttachmentsFromFiles(req);

    // Backward compatible scalar values
    const beforeRepairCompat = parsedBeforeRepair || {};
    const afterRepairCompat = parsedAfterRepair || {};
    const injectorCompat = parsedInjectorParams || {};

    const beforePassFail = derivePassFail(beforeDataToStore, beforeRepairCompat.passFail || 'Fail');
    const afterPassFail = derivePassFail(afterDataToStore, afterRepairCompat.passFail || 'Fail');

    // Find job card by job number
    const [jobCards] = await pool.execute(
      `SELECT jc.id, jc.technician_id, u.name AS technician_name 
       FROM job_cards jc
       LEFT JOIN users u ON jc.technician_id = u.id
       WHERE jc.job_no = ?`,
      [jobCardNumber]
    );

    if (jobCards.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job card not found'
      });
    }

    const jobCard = jobCards[0];
    const jobCardId = jobCard.id;

    // If user is technician, verify they own this job card
    if (req.user && req.user.role === 'technician') {
      if (jobCard.technician_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You can only create testing records for your assigned job cards'
        });
      }
    }

    const categoryTypeFinal = categoryType || req.body.category_type || null;

    const approvalsFinal = parsedApprovals || {
      testedBy: req.body.tested_by || null,
      approvedBy: req.body.approved_by || null,
      approvalDate: req.body.approval_date || null,
    };

    // Insert testing record (supports v1 + v2 columns)
    const [result] = await pool.execute(
      `INSERT INTO testing_records (
        job_card_id, test_date,
        category_type, schema_version,
        before_pressure, before_leak, before_calibration, before_pass_fail,
        after_pressure, after_leak, after_calibration, after_pass_fail,
        pilot_injection, main_injection, return_flow, injector_pressure, leak_test,
        before_data, after_data, attachments,
        tested_by, approved_by, approval_date,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        jobCardId,
        testDate || new Date().toISOString().split('T')[0],
        categoryTypeFinal,
        beforeDataToStore || afterDataToStore || fileAttachments || approvalsFinal.testedBy || approvalsFinal.approvedBy || approvalsFinal.approvalDate ? 2 : 1,
        beforeRepairCompat.pressure || null,
        beforeRepairCompat.leak || null,
        beforeRepairCompat.calibration || null,
        beforePassFail || 'Fail',
        afterRepairCompat.pressure || null,
        afterRepairCompat.leak || null,
        afterRepairCompat.calibration || null,
        afterPassFail || 'Fail',
        injectorCompat.pilotInjection || null,
        injectorCompat.mainInjection || null,
        injectorCompat.returnFlow || null,
        injectorCompat.pressure || null,
        injectorCompat.leakTest || 'Fail',
        beforeDataToStore ? JSON.stringify(beforeDataToStore) : null,
        afterDataToStore ? JSON.stringify(afterDataToStore) : null,
        fileAttachments ? JSON.stringify(fileAttachments) : null,
        approvalsFinal.testedBy || null,
        approvalsFinal.approvedBy || null,
        approvalsFinal.approvalDate || null
      ]
    );

    // Fetch created record
    const [records] = await pool.execute(
      `SELECT 
        tr.id, tr.job_card_id, tr.test_date, tr.category_type, tr.schema_version,
        tr.before_pressure, tr.before_leak, tr.before_calibration, tr.before_pass_fail,
        tr.after_pressure, tr.after_leak, tr.after_calibration, tr.after_pass_fail,
        tr.pilot_injection, tr.main_injection, tr.return_flow, tr.injector_pressure, tr.leak_test,
        tr.before_data, tr.after_data, tr.attachments,
        tr.tested_by, tr.approved_by, tr.approval_date,
        jc.job_no, jc.brand, jc.job_type,
        c.name AS customer_name
      FROM testing_records tr
      LEFT JOIN job_cards jc ON tr.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE tr.id = ?`,
      [result.insertId]
    );

    const formattedRecord = formatTestingRecord(records[0]);

    res.status(201).json({
      success: true,
      message: 'Testing record created successfully',
      data: formattedRecord
    });
  } catch (error) {
    console.error('Create testing record error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create testing record'
    });
  }
};

/**
 * Update testing record
 * PUT /api/testing-records/:id
 */
const updateTestingRecord = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      categoryType,
      beforeData,
      afterData,
      approvals,
      beforeRepair,
      afterRepair,
      injectorParams,
      testDate
    } = req.body;

    const parsedBeforeData = parseJsonMaybe(beforeData) || parseJsonMaybe(req.body.before_data) || null;
    const parsedAfterData = parseJsonMaybe(afterData) || parseJsonMaybe(req.body.after_data) || null;
    const parsedApprovals = parseJsonMaybe(approvals) || null;
    const parsedBeforeRepair = parseJsonMaybe(beforeRepair) || null;
    const parsedAfterRepair = parseJsonMaybe(afterRepair) || null;
    const parsedInjectorParams = parseJsonMaybe(injectorParams) || null;

    const beforeDataToStore = parsedBeforeData || (parsedBeforeRepair || parsedInjectorParams ? { beforeRepair: parsedBeforeRepair, injectorParams: parsedInjectorParams } : null);
    const afterDataToStore = parsedAfterData || (parsedAfterRepair || parsedInjectorParams ? { afterRepair: parsedAfterRepair, injectorParams: parsedInjectorParams } : null);

    const fileAttachments = buildAttachmentsFromFiles(req);

    // Check if record exists and get job card info
    const [existingRecords] = await pool.execute(
      `SELECT tr.id, tr.job_card_id, jc.technician_id 
       FROM testing_records tr
       LEFT JOIN job_cards jc ON tr.job_card_id = jc.id
       WHERE tr.id = ?`,
      [id]
    );

    if (existingRecords.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Testing record not found'
      });
    }

    // If user is technician, verify they own this testing record's job card
    if (req.user && req.user.role === 'technician') {
      if (existingRecords[0].technician_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You can only update testing records for your assigned job cards'
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (categoryType !== undefined || req.body.category_type !== undefined) {
      updates.push('category_type = ?');
      params.push(categoryType || req.body.category_type || null);
    }

    // If v2 data present, bump schema version
    if (beforeDataToStore || afterDataToStore || fileAttachments || parsedApprovals) {
      updates.push('schema_version = ?');
      params.push(2);
    }

    if (beforeDataToStore) {
      updates.push('before_data = ?');
      params.push(JSON.stringify(beforeDataToStore));

      const pf = derivePassFail(beforeDataToStore, 'Fail');
      updates.push('before_pass_fail = ?');
      params.push(pf);
    }

    if (afterDataToStore) {
      updates.push('after_data = ?');
      params.push(JSON.stringify(afterDataToStore));

      const pf = derivePassFail(afterDataToStore, 'Fail');
      updates.push('after_pass_fail = ?');
      params.push(pf);
    }

    if (parsedApprovals) {
      if (parsedApprovals.testedBy !== undefined) {
        updates.push('tested_by = ?');
        params.push(parsedApprovals.testedBy);
      }
      if (parsedApprovals.approvedBy !== undefined) {
        updates.push('approved_by = ?');
        params.push(parsedApprovals.approvedBy);
      }
      if (parsedApprovals.approvalDate !== undefined) {
        updates.push('approval_date = ?');
        params.push(parsedApprovals.approvalDate);
      }
    }

    if (parsedBeforeRepair) {
      if (parsedBeforeRepair.pressure !== undefined) {
        updates.push('before_pressure = ?');
        params.push(parsedBeforeRepair.pressure);
      }
      if (parsedBeforeRepair.leak !== undefined) {
        updates.push('before_leak = ?');
        params.push(parsedBeforeRepair.leak);
      }
      if (parsedBeforeRepair.calibration !== undefined) {
        updates.push('before_calibration = ?');
        params.push(parsedBeforeRepair.calibration);
      }
      const pf = parsedBeforeRepair.passFail;
      if (pf !== undefined) {
        updates.push('before_pass_fail = ?');
        params.push(pf);
      }
    }

    if (parsedAfterRepair) {
      if (parsedAfterRepair.pressure !== undefined) {
        updates.push('after_pressure = ?');
        params.push(parsedAfterRepair.pressure);
      }
      if (parsedAfterRepair.leak !== undefined) {
        updates.push('after_leak = ?');
        params.push(parsedAfterRepair.leak);
      }
      if (parsedAfterRepair.calibration !== undefined) {
        updates.push('after_calibration = ?');
        params.push(parsedAfterRepair.calibration);
      }
      const pf = parsedAfterRepair.passFail;
      if (pf !== undefined) {
        updates.push('after_pass_fail = ?');
        params.push(pf);
      }
    }

    if (parsedInjectorParams) {
      if (parsedInjectorParams.pilotInjection !== undefined) {
        updates.push('pilot_injection = ?');
        params.push(parsedInjectorParams.pilotInjection);
      }
      if (parsedInjectorParams.mainInjection !== undefined) {
        updates.push('main_injection = ?');
        params.push(parsedInjectorParams.mainInjection);
      }
      if (parsedInjectorParams.returnFlow !== undefined) {
        updates.push('return_flow = ?');
        params.push(parsedInjectorParams.returnFlow);
      }
      if (parsedInjectorParams.pressure !== undefined) {
        updates.push('injector_pressure = ?');
        params.push(parsedInjectorParams.pressure);
      }
      if (parsedInjectorParams.leakTest !== undefined) {
        updates.push('leak_test = ?');
        params.push(parsedInjectorParams.leakTest);
      }
    }

    // Attachments: merge if new files exist
    if (fileAttachments) {
      const [existing] = await pool.execute('SELECT attachments FROM testing_records WHERE id = ?', [id]);
      const current = parseJsonMaybe(existing?.[0]?.attachments) || {
        photos: [],
        pdfReports: [],
        calibrationSheets: [],
      };

      const merged = {
        photos: [...(current.photos || []), ...(fileAttachments.photos || [])],
        pdfReports: [...(current.pdfReports || []), ...(fileAttachments.pdfReports || [])],
        calibrationSheets: [...(current.calibrationSheets || []), ...(fileAttachments.calibrationSheets || [])],
      };

      updates.push('attachments = ?');
      params.push(JSON.stringify(merged));
    } else if (req.body.attachments !== undefined) {
      const parsedAttachments = parseJsonMaybe(req.body.attachments);
      if (parsedAttachments) {
        updates.push('attachments = ?');
        params.push(JSON.stringify(parsedAttachments));
      }
    }

    if (testDate) {
      updates.push('test_date = ?');
      params.push(testDate);
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
      `UPDATE testing_records SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated record
    const [records] = await pool.execute(
      `SELECT 
        tr.id, tr.job_card_id, tr.test_date, tr.category_type, tr.schema_version,
        tr.before_pressure, tr.before_leak, tr.before_calibration, tr.before_pass_fail,
        tr.after_pressure, tr.after_leak, tr.after_calibration, tr.after_pass_fail,
        tr.pilot_injection, tr.main_injection, tr.return_flow, tr.injector_pressure, tr.leak_test,
        tr.before_data, tr.after_data, tr.attachments,
        tr.tested_by, tr.approved_by, tr.approval_date,
        jc.job_no, jc.brand, jc.job_type,
        c.name AS customer_name
      FROM testing_records tr
      LEFT JOIN job_cards jc ON tr.job_card_id = jc.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE tr.id = ?`,
      [id]
    );

    const formattedRecord = formatTestingRecord(records[0]);

    res.json({
      success: true,
      message: 'Testing record updated successfully',
      data: formattedRecord
    });
  } catch (error) {
    console.error('Update testing record error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update testing record'
    });
  }
};

/**
 * Delete testing record
 * DELETE /api/testing-records/:id
 */
const deleteTestingRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if record exists and get job card info
    const [records] = await pool.execute(
      `SELECT tr.id, tr.job_card_id, jc.technician_id 
       FROM testing_records tr
       LEFT JOIN job_cards jc ON tr.job_card_id = jc.id
       WHERE tr.id = ?`,
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Testing record not found'
      });
    }

    // If user is technician, verify they own this testing record's job card
    if (req.user && req.user.role === 'technician') {
      if (records[0].technician_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete testing records for your assigned job cards'
        });
      }
    }

    // Delete record
    await pool.execute('DELETE FROM testing_records WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Testing record deleted successfully'
    });
  } catch (error) {
    console.error('Delete testing record error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete testing record'
    });
  }
};

module.exports = {
  getAllTestingRecords,
  getTestingRecordById,
  createTestingRecord,
  updateTestingRecord,
  deleteTestingRecord
};

