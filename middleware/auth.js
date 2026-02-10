/**
 * Authentication Middleware
 * Verifies JWT tokens and checks role-based permissions
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Ensure JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not configured in .env file');
}

/**
 * Verify JWT token from Authorization header
 * Attaches user info to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided. Authorization header required.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and have login access
    const [users] = await pool.execute(
      'SELECT id, name, email, phone, role, login_access FROM users WHERE id = ? AND login_access = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found or login access revoked' 
      });
    }

    // Attach user info to request
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication error' 
    });
  }
};

/**
 * Check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

/**
 * Combined middleware: verify token + check role
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
const authenticate = (allowedRoles = null) => {
  const middlewares = [verifyToken];
  
  if (allowedRoles) {
    middlewares.push(checkRole(allowedRoles));
  }
  
  return middlewares;
};

module.exports = {
  verifyToken,
  checkRole,
  authenticate
};

