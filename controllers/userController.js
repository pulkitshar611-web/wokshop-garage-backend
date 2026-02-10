/**
 * User Controller
 * CRUD operations for users (admin only)
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');

/**
 * Get all users
 * GET /api/users
 * Query params: role (optional filter)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = `
      SELECT 
        id, name, email, phone, role, login_access, 
        last_login, created_at, updated_at
      FROM users
    `;
    const params = [];

    // Filter by role if provided
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.execute(query, params);

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      `SELECT 
        id, name, email, phone, role, login_access, 
        last_login, created_at, updated_at
      FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
};

/**
 * Create new user
 * POST /api/users
 * Body: { name, email, phone, role, login_access, password }
 */
const createUser = async (req, res) => {
  try {
    const { name, email, phone, role, login_access, password } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and role are required'
      });
    }

    // Validate role
    const validRoles = ['admin', 'technician', 'storekeeper'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Check if email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      // Default password if not provided
      hashedPassword = await bcrypt.hash('password123', 10);
    }

    // Insert user
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, phone, role, login_access, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        phone || null,
        role,
        login_access !== undefined ? login_access : 1,
        hashedPassword
      ]
    );

    // Fetch created user (without password)
    const [users] = await pool.execute(
      `SELECT 
        id, name, email, phone, role, login_access, 
        last_login, created_at, updated_at
      FROM users WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: users[0]
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
};

/**
 * Update user
 * PUT /api/users/:id
 * Body: { name, email, phone, role, login_access, password (optional) }
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, login_access, password } = req.body;

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'technician', 'storekeeper'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const [emailCheck] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
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
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (login_access !== undefined) {
      updates.push('login_access = ?');
      params.push(login_access ? 1 : 0);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
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
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Fetch updated user
    const [users] = await pool.execute(
      `SELECT 
        id, name, email, phone, role, login_access, 
        last_login, created_at, updated_at
      FROM users WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: users[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete user
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};

