/**
 * Testing Record Controller
 * CRUD operations for testing records with individual item support
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
    jobCardItemId: tr.job_card_item_id,
    jobCardNumber: tr.job_no,
    customerName: tr.customer_name,
    jobType: tr.item_job_type,
    brand: tr.item_brand,
    serialNumber: tr.item_serial_number,
    categoryType: tr.category_type || null,
    schemaVersion: tr.schema_version || 1,
    beforeData: beforeData || null,
    afterData: afterData || null,
    beforeRepair,
    afterRepair,
    params: injectorParams,
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
 */
const getAllTestingRecords = async (req, res) => {
  try {
    const { technician, jobCardId, jobCardItemId } = req.query;

    let query = `
      SELECT 
        tr.*,
        jc.job_no,
        c.name AS customer_name,
        jci.job_type AS item_job_type,
        jci.brand AS item_brand,
        jci.serial_number AS item_serial_number
      FROM testing_records tr
      LEFT JOIN job_cards jc ON tr.job_card_id = jc.id
      LEFT JOIN job_card_items jci ON tr.job_card_item_id = jci.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      LEFT JOIN users u ON jc.technician_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (technician) {
      query += ` AND (u.name = ? OR tr.tested_by = ?)`;
      params.push(technician, technician);
    }

    if (jobCardId) {
      query += ` AND tr.job_card_id = ?`;
      params.push(jobCardId);
    }

    if (jobCardItemId) {
      query += ` AND tr.job_card_item_id = ?`;
      params.push(jobCardItemId);
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
 */
const getTestingRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        tr.*,
        jc.job_no,
        c.name AS customer_name,
        jci.job_type AS item_job_type,
        jci.brand AS item_brand,
        jci.serial_number AS item_serial_number
      FROM testing_records tr
      LEFT JOIN job_cards jc ON tr.job_card_id = jc.id
      LEFT JOIN job_card_items jci ON tr.job_card_item_id = jci.id
      LEFT JOIN customers c ON jc.customer_id = c.id
      WHERE tr.id = ?
    `;

    const [records] = await pool.execute(query, [id]);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Testing record not found'
      });
    }

    res.json({
      success: true,
      data: formatTestingRecord(records[0])
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
 */
const createTestingRecord = async (req, res) => {
  try {
    const {
      jobCardId,
      jobCardItemId,
      testDate,
      categoryType,
      schemaVersion,
      beforeData,
      afterData,
      testedBy,
      approvedBy,
      approvalDate
    } = req.body;

    if (!jobCardId || !jobCardItemId) {
      return res.status(400).json({
        success: false,
        error: 'Job card ID and Item ID are required'
      });
    }

    const attachments = buildAttachmentsFromFiles(req);
    const parsedBeforeData = typeof beforeData === 'string' ? JSON.parse(beforeData) : beforeData;
    const parsedAfterData = typeof afterData === 'string' ? JSON.parse(afterData) : afterData;

    // Extract some legacy fields for backward compatibility if possible
    const beforePassFail = derivePassFail(parsedBeforeData, 'Fail');
    const afterPassFail = derivePassFail(parsedAfterData, 'Fail');

    const [result] = await pool.execute(
      `INSERT INTO testing_records (
        job_card_id, job_card_item_id, test_date, category_type, schema_version,
        before_data, after_data, attachments, tested_by, approved_by, approval_date,
        before_pass_fail, after_pass_fail, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        jobCardId,
        jobCardItemId,
        testDate || new Date().toISOString().split('T')[0],
        categoryType,
        schemaVersion || 1,
        JSON.stringify(parsedBeforeData || {}),
        JSON.stringify(parsedAfterData || {}),
        attachments ? JSON.stringify(attachments) : null,
        testedBy || null,
        approvedBy || null,
        approvalDate || null,
        beforePassFail,
        afterPassFail
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Testing record created successfully',
      data: { id: result.insertId }
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
 */
const updateTestingRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      testDate,
      categoryType,
      beforeData,
      afterData,
      testedBy,
      approvedBy,
      approvalDate
    } = req.body;

    const [existing] = await pool.execute('SELECT id FROM testing_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Testing record not found' });
    }

    const updates = [];
    const params = [];

    if (testDate) { updates.push('test_date = ?'); params.push(testDate); }
    if (categoryType) { updates.push('category_type = ?'); params.push(categoryType); }

    if (beforeData) {
      const parsed = typeof beforeData === 'string' ? JSON.parse(beforeData) : beforeData;
      updates.push('before_data = ?');
      params.push(JSON.stringify(parsed));
      updates.push('before_pass_fail = ?');
      params.push(derivePassFail(parsed, 'Fail'));
    }

    if (afterData) {
      const parsed = typeof afterData === 'string' ? JSON.parse(afterData) : afterData;
      updates.push('after_data = ?');
      params.push(JSON.stringify(parsed));
      updates.push('after_pass_fail = ?');
      params.push(derivePassFail(parsed, 'Fail'));
    }

    const newAttachments = buildAttachmentsFromFiles(req);
    if (newAttachments) {
      updates.push('attachments = ?');
      params.push(JSON.stringify(newAttachments));
    }

    if (testedBy !== undefined) { updates.push('tested_by = ?'); params.push(testedBy); }
    if (approvedBy !== undefined) { updates.push('approved_by = ?'); params.push(approvedBy); }
    if (approvalDate !== undefined) { updates.push('approval_date = ?'); params.push(approvalDate); }

    updates.push('updated_at = NOW()');

    if (updates.length > 0) {
      await pool.execute(
        `UPDATE testing_records SET ${updates.join(', ')} WHERE id = ?`,
        [...params, id]
      );
    }

    res.json({ success: true, message: 'Testing record updated successfully' });
  } catch (error) {
    console.error('Update testing record error:', error);
    res.status(500).json({ success: false, error: 'Failed to update testing record' });
  }
};

/**
 * Delete testing record
 */
const deleteTestingRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM testing_records WHERE id = ?', [id]);
    res.json({ success: true, message: 'Testing record deleted successfully' });
  } catch (error) {
    console.error('Delete testing record error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete testing record' });
  }
};

module.exports = {
  getAllTestingRecords,
  getTestingRecordById,
  createTestingRecord,
  updateTestingRecord,
  deleteTestingRecord
};
