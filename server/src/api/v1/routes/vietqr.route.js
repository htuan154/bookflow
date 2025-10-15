'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/vietqr.controller');

// (1 + 2) booking có sẵn
router.post('/bookings/:bookingId/payments/qr', ctrl.createQrForBooking);

// (3) khách walk-in tại quầy
router.post('/hotels/:hotelId/payments/qr', ctrl.createQrAtCounter);

// webhook xác nhận
router.post('/webhooks/vietqr', ctrl.vietqrWebhook);

module.exports = router;
