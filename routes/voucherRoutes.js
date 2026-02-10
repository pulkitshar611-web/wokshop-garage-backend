/**
 * Voucher Routes (Payment & Receipt)
 */

const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticate } = require('../middleware/auth');

// Payment Vouchers - Admin only
router.get('/payment-vouchers', authenticate(['admin']), voucherController.getAllPaymentVouchers);
router.get('/payment-vouchers/:id', authenticate(['admin']), voucherController.getPaymentVoucherById);
router.post('/payment-vouchers', authenticate(['admin']), voucherController.createPaymentVoucher);
router.put('/payment-vouchers/:id', authenticate(['admin']), voucherController.updatePaymentVoucher);
router.delete('/payment-vouchers/:id', authenticate(['admin']), voucherController.deletePaymentVoucher);

// Receipt Vouchers - Admin only
router.get('/receipt-vouchers', authenticate(['admin']), voucherController.getAllReceiptVouchers);
router.get('/receipt-vouchers/:id', authenticate(['admin']), voucherController.getReceiptVoucherById);
router.post('/receipt-vouchers', authenticate(['admin']), voucherController.createReceiptVoucher);
router.put('/receipt-vouchers/:id', authenticate(['admin']), voucherController.updateReceiptVoucher);
router.delete('/receipt-vouchers/:id', authenticate(['admin']), voucherController.deleteReceiptVoucher);

module.exports = router;
