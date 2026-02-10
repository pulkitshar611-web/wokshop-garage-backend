/**
 * Settings Controller
 * CRUD operations for workshop settings
 */

const pool = require('../config/db');

/**
 * Get workshop settings
 * GET /api/settings
 */
const getSettings = async (req, res) => {
  try {
    // Check if settings exist
    const [settings] = await pool.execute(
      'SELECT * FROM settings WHERE id = 1'
    );

    if (settings.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        workshopName: 'ABC Workshop',
        workshopAddress: '123 Main Street, Mumbai',
        workshopPhone: '+91 98765 43210',
        workshopEmail: 'info@workshop.com',
        vatPercentage: 18,
        invoiceFormat: 'Standard',
        language: 'English',
        dataBackup: 'Enabled',
        jobStatusReceived: 'Received',
        jobStatusUnderRepair: 'Under Repair',
        jobStatusTesting: 'Testing',
        jobStatusCompleted: 'Completed',
        jobStatusDelivered: 'Delivered',
      };

      return res.json({
        success: true,
        data: defaultSettings
      });
    }

    const setting = settings[0];
    const formattedSettings = {
      workshopName: setting.workshop_name || 'ABC Workshop',
      workshopAddress: setting.workshop_address || '123 Main Street, Mumbai',
      workshopPhone: setting.workshop_phone || '+91 98765 43210',
      workshopEmail: setting.workshop_email || 'info@workshop.com',
      vatPercentage: setting.vat_percentage || 18,
      invoiceFormat: setting.invoice_format || 'Standard',
      language: setting.language || 'English',
      dataBackup: setting.data_backup || 'Enabled',
      jobStatusLabels: {
        received: setting.job_status_received || 'Received',
        underRepair: setting.job_status_under_repair || 'Under Repair',
        testing: setting.job_status_testing || 'Testing',
        completed: setting.job_status_completed || 'Completed',
        delivered: setting.job_status_delivered || 'Delivered',
      },
    };

    res.json({
      success: true,
      data: formattedSettings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
};

/**
 * Update workshop settings
 * PUT /api/settings
 */
const updateSettings = async (req, res) => {
  try {
    const {
      workshopName,
      workshopAddress,
      workshopPhone,
      workshopEmail,
      vatPercentage,
      invoiceFormat,
      language,
      dataBackup,
      jobStatusLabels
    } = req.body;

    // Check if settings exist
    const [existing] = await pool.execute(
      'SELECT id FROM settings WHERE id = 1'
    );

    if (existing.length === 0) {
      // Create new settings
      await pool.execute(
        `INSERT INTO settings (
          id, workshop_name, workshop_address, workshop_phone, workshop_email,
          vat_percentage, invoice_format, language, data_backup,
          job_status_received, job_status_under_repair, job_status_testing,
          job_status_completed, job_status_delivered, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          1,
          workshopName || 'ABC Workshop',
          workshopAddress || '',
          workshopPhone || '',
          workshopEmail || '',
          vatPercentage || 18,
          invoiceFormat || 'Standard',
          language || 'English',
          dataBackup || 'Enabled',
          jobStatusLabels?.received || 'Received',
          jobStatusLabels?.underRepair || 'Under Repair',
          jobStatusLabels?.testing || 'Testing',
          jobStatusLabels?.completed || 'Completed',
          jobStatusLabels?.delivered || 'Delivered',
        ]
      );
    } else {
      // Update existing settings
      await pool.execute(
        `UPDATE settings SET
          workshop_name = ?,
          workshop_address = ?,
          workshop_phone = ?,
          workshop_email = ?,
          vat_percentage = ?,
          invoice_format = ?,
          language = ?,
          data_backup = ?,
          job_status_received = ?,
          job_status_under_repair = ?,
          job_status_testing = ?,
          job_status_completed = ?,
          job_status_delivered = ?,
          updated_at = NOW()
        WHERE id = 1`,
        [
          workshopName || 'ABC Workshop',
          workshopAddress || '',
          workshopPhone || '',
          workshopEmail || '',
          vatPercentage || 18,
          invoiceFormat || 'Standard',
          language || 'English',
          dataBackup || 'Enabled',
          jobStatusLabels?.received || 'Received',
          jobStatusLabels?.underRepair || 'Under Repair',
          jobStatusLabels?.testing || 'Testing',
          jobStatusLabels?.completed || 'Completed',
          jobStatusLabels?.delivered || 'Delivered',
        ]
      );
    }

    // Fetch updated settings
    const [updated] = await pool.execute(
      'SELECT * FROM settings WHERE id = 1'
    );

    const setting = updated[0];
    const formattedSettings = {
      workshopName: setting.workshop_name,
      workshopAddress: setting.workshop_address,
      workshopPhone: setting.workshop_phone,
      workshopEmail: setting.workshop_email,
      vatPercentage: setting.vat_percentage,
      invoiceFormat: setting.invoice_format,
      language: setting.language,
      dataBackup: setting.data_backup,
      jobStatusLabels: {
        received: setting.job_status_received,
        underRepair: setting.job_status_under_repair,
        testing: setting.job_status_testing,
        completed: setting.job_status_completed,
        delivered: setting.job_status_delivered,
      },
    };

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: formattedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getOptions: async (req, res) => {
    try {
      const { category, field } = req.query;
      let query = 'SELECT DISTINCT option_value FROM dropdown_options WHERE 1=1';
      const params = [];

      if (category) {
        query += ' AND category_type = ?';
        params.push(category);
      }

      if (field) {
        query += ' AND field_key = ?';
        params.push(field);
      }

      query += ' ORDER BY option_value';

      const [rows] = await pool.execute(query, params);

      res.json({
        success: true,
        data: rows.map(r => r.option_value)
      });
    } catch (error) {
      console.error('Get options error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch options' });
    }
  },

  addOption: async (req, res) => {
    try {
      const { category, field, value } = req.body;

      if (!category || !field || !value) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      // Check if exists
      const [existing] = await pool.execute(
        'SELECT id FROM dropdown_options WHERE category_type = ? AND field_key = ? AND option_value = ?',
        [category, field, value]
      );

      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO dropdown_options (category_type, field_key, option_value) VALUES (?, ?, ?)',
          [category, field, value]
        );
      }

      res.json({ success: true, message: 'Option added successfully' });
    } catch (error) {
      console.error('Add option error:', error);
      res.status(500).json({ success: false, error: 'Failed to add option' });
    }
  }
};

