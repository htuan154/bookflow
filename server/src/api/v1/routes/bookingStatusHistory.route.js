// src/api/v1/routes/bookingStatusHistory.route.js

const express = require('express');
const bookingStatusHistoryController = require('../controllers/bookingStatusHistory.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();


// GET /api/v1/bookings/:bookingId/history -> Lấy lịch sử của một đơn đặt phòng
// Route này được đặt trong một file riêng để rõ ràng, nhưng sẽ được gắn vào booking.route.js
router.get(
    '/:bookingId/history',
    authenticate,
    bookingStatusHistoryController.getBookingHistory
);

// POST /api/v1/bookings/:bookingId/history -> Tạo mới bản ghi lịch sử trạng thái
router.post(
    '/:bookingId/history',
    authenticate,
    bookingStatusHistoryController.createBookingStatusHistory
);

module.exports = router;
