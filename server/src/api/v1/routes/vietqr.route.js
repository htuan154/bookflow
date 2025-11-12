'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/vietqr.controller');

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(` [VIETQR ROUTE] ${req.method} ${req.originalUrl}`);
  console.log(' [VIETQR ROUTE] Body:', req.body);
  next();
});

// (1 + 2) booking có sẵn
router.post('/bookings/:bookingId/payments/qr', ctrl.createQrForBooking);

// (3) khách walk-in tại quầy
router.post('/hotels/:hotelId/payments/qr', ctrl.createQrAtCounter);

// kiểm tra trạng thái thanh toán
router.get('/payments/:txRef/status', ctrl.checkPaymentStatus);

// webhook xác nhận
router.post('/webhooks/vietqr', ctrl.vietqrWebhook);

// Cập nhật status payment
router.patch('/payments/update-status', ctrl.updatePaymentStatus);
// PayOS (tạo link thanh toán + polling trạng thái)
router.post('/payos/create', ctrl.createPayOSPayment);
router.get('/payos/status/:orderCode', ctrl.checkPayOSStatus);

module.exports = router;
