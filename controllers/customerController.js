/**
 * Customer Controller
 * CRUD operations for customers
 */

const pool = require('../config/db');

/**
 * Get all customers
 * GET /api/customers
 * Query params: search (optional)
 */

/**
 * Get all customers
 * GET /api/customers
 * Query params: search (optional)
 */
const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT 
        id, name, email, phone, company, address, created_at, updated_at
      FROM customers
      WHERE is_deleted = 0
    `;
    const params = [];

    // Search filter
    if (search) {
      query += ` AND (
        name LIKE ? OR 
        email LIKE ? OR 
        phone LIKE ? OR 
        company LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    const [customers] = await pool.execute(query, params);

    res.json({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
};

/**
 * Get customer by ID
 * GET /api/customers/:id
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const [customers] = await pool.execute(
      `SELECT 
        id, name, email, phone, company, address, created_at, updated_at
      FROM customers WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customers[0]
    });
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer'
    });
  }
};

/**
 * Create new customer
 * POST /api/customers
 * Body: { name, email, phone, company, address }
 */
const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Mobile number is required'
      });
    }

    // Check if phone already exists
    const [existingPhone] = await pool.execute(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    if (existingPhone.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A customer with this mobile number already exists'
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const [existingEmail] = await pool.execute(
        'SELECT id FROM customers WHERE email = ?',
        [email]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this email already exists'
        });
      }
    }

    // Insert customer
    const [result] = await pool.execute(
      `INSERT INTO customers (name, email, phone, company, address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        email || null,
        phone,
        company || null,
        address || null
      ]
    );

    // Fetch created customer
    const [customers] = await pool.execute(
      `SELECT 
        id, name, email, phone, company, address, created_at, updated_at
      FROM customers WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customers[0]
    });
  } catch (error) {
    console.error('Create customer error:', error);

    // Handle duplicate error from DB
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('phone') || error.message.includes('idx_unique_phone')) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this mobile number already exists'
        });
      }
      if (error.message.includes('email') || error.message.includes('idx_unique_email')) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this email already exists'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
};

/**
 * Update customer
 * PUT /api/customers/:id
 * Body: { name, email, phone, company, address }
 */
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, address } = req.body;

    // Check if customer exists
    const [existingCustomers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ?',
      [id]
    );

    if (existingCustomers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Check if phone is being changed and if it already exists
    if (phone) {
      const [phoneCheck] = await pool.execute(
        'SELECT id FROM customers WHERE phone = ? AND id != ?',
        [phone, id]
      );

      if (phoneCheck.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this mobile number already exists'
        });
      }
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM customers WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this email already exists'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (company !== undefined) {
      updates.push('company = ?');
      params.push(company);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
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
      `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated customer
    const [customers] = await pool.execute(
      `SELECT 
        id, name, email, phone, company, address, created_at, updated_at
      FROM customers WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customers[0]
    });
  } catch (error) {
    console.error('Update customer error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('phone') || error.message.includes('idx_unique_phone')) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this mobile number already exists'
        });
      }
      if (error.message.includes('email') || error.message.includes('idx_unique_email')) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this email already exists'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    });
  }
};

/**
 * Delete customer
 * DELETE /api/customers/:id
 */
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const [customers] = await pool.execute(
      'SELECT id FROM customers WHERE id = ?',
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Soft delete customer
    await pool.execute('UPDATE customers SET is_deleted = 1 WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};

