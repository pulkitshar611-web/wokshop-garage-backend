/**
 * Dropdown Options Controller
 * For managing dynamic options in Testing Records
 */

const pool = require('../config/db');

/**
 * Get dropdown options
 * GET /api/dropdown-options
 */
const getOptions = async (req, res) => {
    try {
        const { category, fieldType, jobType } = req.query;

        let query = 'SELECT id, category, field_type, job_type, option_value FROM dropdown_options WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }
        if (fieldType) {
            query += ' AND field_type = ?';
            params.push(fieldType);
        }
        if (jobType) {
            query += ' AND job_type = ?';
            params.push(jobType);
        }

        query += ' ORDER BY option_value ASC';

        const [options] = await pool.execute(query, params);

        res.json({
            success: true,
            data: options
        });
    } catch (error) {
        console.error('Get dropdown options error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dropdown options'
        });
    }
};

/**
 * Add new dropdown option
 * POST /api/dropdown-options
 */
const addOption = async (req, res) => {
    try {
        const { category, fieldType, jobType, optionValue } = req.body;

        if (!category || !fieldType || !jobType || !optionValue) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        // Use INSERT IGNORE to prevent duplicates (Unique key in DB handles this)
        await pool.execute(
            'INSERT IGNORE INTO dropdown_options (category, field_type, job_type, option_value) VALUES (?, ?, ?, ?)',
            [category, fieldType, jobType, optionValue]
        );

        // Fetch the update list for this specific context
        const [updatedOptions] = await pool.execute(
            'SELECT id, category, field_type, job_type, option_value FROM dropdown_options WHERE category = ? AND field_type = ? AND job_type = ? ORDER BY option_value ASC',
            [category, fieldType, jobType]
        );

        res.json({
            success: true,
            message: 'Option added successfully',
            data: updatedOptions
        });
    } catch (error) {
        console.error('Add dropdown option error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add dropdown option'
        });
    }
};

module.exports = {
    getOptions,
    addOption
};
