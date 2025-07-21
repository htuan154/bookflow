// src/api/v1/routes/bookingDetail.route.js

const express = require('express');
const bookingDetailController = require('../controllers/bookingDetail.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { addBookingDetailsSchema } = require('../../../validators/bookingDetail.validator');

const router = express.Router();

// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// GET /api/v1/booking-details/:detailId
router.get(
    '/:detailId',
    bookingDetailController.getBookingDetailById
);

// GET /api/v1/booking-details/booking/:bookingId
router.get(
    '/booking/:bookingId',
    bookingDetailController.getBookingDetailsByBookingId
);

// POST /api/v1/booking-details/booking/:bookingId
router.post(
    '/booking/:bookingId',
    validate(addBookingDetailsSchema),
    bookingDetailController.addBookingDetails
);

module.exports = router;