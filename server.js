/**
 * Workshop Management System - Express Server
 * Main entry point for the backend API
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not configured in .env file');
  console.error('📝 Please create .env file with JWT_SECRET');
  console.error('💡 Run: node create-env.js');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const jobCardRoutes = require('./routes/jobCardRoutes');
const testingRecordRoutes = require('./routes/testingRecordRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dropdownOptionsRoutes = require('./routes/dropdownOptionsRoutes');
// NEW ROUTES - Sales Returns & Vouchers
const salesReturnRoutes = require('./routes/salesReturnRoutes');
const voucherRoutes = require('./routes/voucherRoutes');

// Initialize Express app
const app = express();
// Force port 8000 if 3000 is set (to avoid conflict with frontend)
const PORT = process.env.PORT === '3000' || !process.env.PORT ? 8000 : process.env.PORT;

// Middleware
// Middleware - CORS Fix
app.use(
  cors({
    origin: [
      "https://garagemanage.kiaantechnology.com",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Workshop Management API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/job-cards', jobCardRoutes);
app.use('/api/testing-records', testingRecordRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dropdown-options', dropdownOptionsRoutes);
// NEW ROUTE REGISTRATIONS - Sales Returns & Vouchers
app.use('/api/sales-returns', salesReturnRoutes);
app.use('/api/vouchers', voucherRoutes); // Handles /payment-vouchers and /receipt-vouchers

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

