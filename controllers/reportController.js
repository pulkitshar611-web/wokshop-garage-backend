/**
 * Report Controller
 * Generate various reports
 */

const pool = require('../config/db');

/**
 * Generate report by type
 * GET /api/reports/:reportType
 * Query params: startDate, endDate, customerId, serialNumber
 */
const generateReport = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, customerId, serialNumber } = req.query;

    let reportData = {};

    switch (reportType) {
      case 'daily-sales':
        reportData = await getDailySalesReport(startDate, endDate);
        break;
      case 'monthly-sales':
        reportData = await getMonthlySalesReport(startDate, endDate);
        break;
      case 'job-history-customer':
        reportData = await getJobHistoryByCustomer(customerId);
        break;
      case 'job-history-serial':
        reportData = await getJobHistoryBySerialNumber(serialNumber);
        break;
      case 'labour-profit':
        reportData = await getLabourProfitReport(startDate, endDate);
        break;
      case 'parts-profit':
        reportData = await getPartsProfitReport(startDate, endDate);
        break;
      case 'warranty-tracking':
        reportData = await getWarrantyTrackingReport();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type'
        });
    }

    res.json({
      success: true,
      reportType,
      data: reportData
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
};

/**
 * Daily Sales Report
 */
const getDailySalesReport = async (startDate, endDate) => {
  const dateFilter = buildDateFilter(startDate, endDate, 'i.created_at');
  
  const [results] = await pool.execute(
    `SELECT 
      DATE(i.created_at) AS sale_date,
      COUNT(i.id) AS total_invoices,
      SUM(i.grand_total) AS total_revenue,
      SUM(COALESCE(p.amount_paid, 0)) AS total_collected
    FROM invoices i
    LEFT JOIN payments p ON i.id = p.invoice_id
    ${dateFilter.where}
    GROUP BY DATE(i.created_at)
    ORDER BY sale_date DESC`,
    dateFilter.params
  );

  return {
    title: 'Daily Sales Report',
    period: { startDate, endDate },
    summary: {
      totalDays: results.length,
      totalInvoices: results.reduce((sum, r) => sum + (r.total_invoices || 0), 0),
      totalRevenue: results.reduce((sum, r) => sum + (parseFloat(r.total_revenue) || 0), 0),
      totalCollected: results.reduce((sum, r) => sum + (parseFloat(r.total_collected) || 0), 0)
    },
    data: results.map(r => ({
      date: r.sale_date ? r.sale_date.toISOString().split('T')[0] : null,
      totalInvoices: r.total_invoices,
      totalRevenue: parseFloat(r.total_revenue) || 0,
      totalCollected: parseFloat(r.total_collected) || 0
    }))
  };
};

/**
 * Monthly Sales Report
 */
const getMonthlySalesReport = async (startDate, endDate) => {
  const dateFilter = buildDateFilter(startDate, endDate, 'i.created_at');
  
  const [results] = await pool.execute(
    `SELECT 
      DATE_FORMAT(i.created_at, '%Y-%m') AS sale_month,
      COUNT(i.id) AS total_invoices,
      SUM(i.grand_total) AS total_revenue,
      SUM(COALESCE(p.amount_paid, 0)) AS total_collected
    FROM invoices i
    LEFT JOIN payments p ON i.id = p.invoice_id
    ${dateFilter.where}
    GROUP BY DATE_FORMAT(i.created_at, '%Y-%m')
    ORDER BY sale_month DESC`,
    dateFilter.params
  );

  return {
    title: 'Monthly Sales Report',
    period: { startDate, endDate },
    summary: {
      totalMonths: results.length,
      totalInvoices: results.reduce((sum, r) => sum + (r.total_invoices || 0), 0),
      totalRevenue: results.reduce((sum, r) => sum + (parseFloat(r.total_revenue) || 0), 0),
      totalCollected: results.reduce((sum, r) => sum + (parseFloat(r.total_collected) || 0), 0)
    },
    data: results.map(r => ({
      month: r.sale_month,
      totalInvoices: r.total_invoices,
      totalRevenue: parseFloat(r.total_revenue) || 0,
      totalCollected: parseFloat(r.total_collected) || 0
    }))
  };
};

/**
 * Job History by Customer
 */
const getJobHistoryByCustomer = async (customerId) => {
  if (!customerId) {
    return { error: 'Customer ID is required' };
  }

  const [results] = await pool.execute(
    `SELECT 
      jc.id, jc.job_no, jc.vehicle_type, jc.vehicle_number,
      jc.job_type, jc.brand, jc.status, jc.received_date,
      jc.expected_delivery_date, jc.created_at,
      c.name AS customer_name, c.phone AS customer_phone,
      u.name AS technician_name
    FROM job_cards jc
    LEFT JOIN customers c ON jc.customer_id = c.id
    LEFT JOIN users u ON jc.technician_id = u.id
    WHERE jc.customer_id = ?
    ORDER BY jc.created_at DESC`,
    [customerId]
  );

  return {
    title: 'Job History by Customer',
    customerId,
    data: results.map(r => ({
      jobNumber: r.job_no,
      vehicleType: r.vehicle_type,
      vehicleNumber: r.vehicle_number,
      jobType: r.job_type,
      brand: r.brand,
      status: r.status,
      receivedDate: r.received_date ? r.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: r.expected_delivery_date ? r.expected_delivery_date.toISOString().split('T')[0] : null,
      technician: r.technician_name
    }))
  };
};

/**
 * Job History by Serial Number
 */
const getJobHistoryBySerialNumber = async (serialNumber) => {
  if (!serialNumber) {
    return { error: 'Serial number is required' };
  }

  const [results] = await pool.execute(
    `SELECT 
      jc.id, jc.job_no, jc.vehicle_type, jc.vehicle_number,
      jc.job_type, jc.brand, jc.pump_injector_serial, jc.status,
      jc.received_date, jc.expected_delivery_date, jc.created_at,
      c.name AS customer_name,
      u.name AS technician_name
    FROM job_cards jc
    LEFT JOIN customers c ON jc.customer_id = c.id
    LEFT JOIN users u ON jc.technician_id = u.id
    WHERE jc.pump_injector_serial = ?
    ORDER BY jc.created_at DESC`,
    [serialNumber]
  );

  return {
    title: 'Job History by Serial Number',
    serialNumber,
    data: results.map(r => ({
      jobNumber: r.job_no,
      customerName: r.customer_name,
      vehicleType: r.vehicle_type,
      vehicleNumber: r.vehicle_number,
      jobType: r.job_type,
      brand: r.brand,
      status: r.status,
      receivedDate: r.received_date ? r.received_date.toISOString().split('T')[0] : null,
      expectedDeliveryDate: r.expected_delivery_date ? r.expected_delivery_date.toISOString().split('T')[0] : null,
      technician: r.technician_name
    }))
  };
};

/**
 * Labour Profit Report
 */
const getLabourProfitReport = async (startDate, endDate) => {
  const dateFilter = buildDateFilter(startDate, endDate, 'i.created_at');
  
  const [results] = await pool.execute(
    `SELECT 
      DATE(i.created_at) AS invoice_date,
      COUNT(i.id) AS total_invoices,
      SUM(i.labour_amount) AS total_labour,
      SUM(i.grand_total) AS total_revenue
    FROM invoices i
    ${dateFilter.where}
    GROUP BY DATE(i.created_at)
    ORDER BY invoice_date DESC`,
    dateFilter.params
  );

  return {
    title: 'Labour Profit Report',
    period: { startDate, endDate },
    summary: {
      totalInvoices: results.reduce((sum, r) => sum + (r.total_invoices || 0), 0),
      totalLabour: results.reduce((sum, r) => sum + (parseFloat(r.total_labour) || 0), 0),
      totalRevenue: results.reduce((sum, r) => sum + (parseFloat(r.total_revenue) || 0), 0)
    },
    data: results.map(r => ({
      date: r.invoice_date ? r.invoice_date.toISOString().split('T')[0] : null,
      totalInvoices: r.total_invoices,
      totalLabour: parseFloat(r.total_labour) || 0,
      totalRevenue: parseFloat(r.total_revenue) || 0
    }))
  };
};

/**
 * Parts Profit Report
 */
const getPartsProfitReport = async (startDate, endDate) => {
  const dateFilter = buildDateFilter(startDate, endDate, 'i.created_at');
  
  const [results] = await pool.execute(
    `SELECT 
      DATE(i.created_at) AS invoice_date,
      COUNT(i.id) AS total_invoices,
      SUM(i.parts_amount) AS total_parts,
      SUM(i.grand_total) AS total_revenue
    FROM invoices i
    ${dateFilter.where}
    GROUP BY DATE(i.created_at)
    ORDER BY invoice_date DESC`,
    dateFilter.params
  );

  return {
    title: 'Parts Profit Report',
    period: { startDate, endDate },
    summary: {
      totalInvoices: results.reduce((sum, r) => sum + (r.total_invoices || 0), 0),
      totalParts: results.reduce((sum, r) => sum + (parseFloat(r.total_parts) || 0), 0),
      totalRevenue: results.reduce((sum, r) => sum + (parseFloat(r.total_revenue) || 0), 0)
    },
    data: results.map(r => ({
      date: r.invoice_date ? r.invoice_date.toISOString().split('T')[0] : null,
      totalInvoices: r.total_invoices,
      totalParts: parseFloat(r.total_parts) || 0,
      totalRevenue: parseFloat(r.total_revenue) || 0
    }))
  };
};

/**
 * Warranty Tracking Report
 */
const getWarrantyTrackingReport = async () => {
  const [results] = await pool.execute(
    `SELECT 
      jc.id, jc.job_no, jc.received_date, jc.status,
      c.name AS customer_name, c.phone AS customer_phone,
      jc.vehicle_type, jc.brand, jc.pump_injector_serial
    FROM job_cards jc
    LEFT JOIN customers c ON jc.customer_id = c.id
    WHERE jc.status IN ('Completed', 'Delivered')
    ORDER BY jc.received_date DESC
    LIMIT 100`
  );

  return {
    title: 'Warranty Tracking Report',
    data: results.map(r => ({
      jobNumber: r.job_no,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      vehicleType: r.vehicle_type,
      brand: r.brand,
      serialNumber: r.pump_injector_serial,
      receivedDate: r.received_date ? r.received_date.toISOString().split('T')[0] : null,
      status: r.status
    }))
  };
};

/**
 * Helper function to build date filter
 */
const buildDateFilter = (startDate, endDate, dateColumn) => {
  let where = '';
  const params = [];

  if (startDate && endDate) {
    where = `WHERE ${dateColumn} BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (startDate) {
    where = `WHERE ${dateColumn} >= ?`;
    params.push(startDate);
  } else if (endDate) {
    where = `WHERE ${dateColumn} <= ?`;
    params.push(endDate);
  }

  return { where, params };
};

module.exports = {
  generateReport
};

