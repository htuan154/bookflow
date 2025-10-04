const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createBookingSchema, updateStatusSchema } = require('../../../validators/booking.validator');
const historyRoutes = require('./bookingStatusHistory.route');

const router = express.Router();

// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// POST /api/v1/bookings
router.post(
    '/',
    validate(createBookingSchema),
    bookingController.createBooking
);

// GET /api/v1/bookings/:bookingId
router.get(
    '/:bookingId',
    bookingController.getBookingDetails
);

// GET /api/v1/bookings/user/:userId
router.get(
    '/user/:userId',
    bookingController.getUserBookings
);

// GET /api/v1/bookings/hotel/:hotelId
router.get(
    '/hotel/:hotelId',
    authorize(['hotel_owner', 'admin']),
    bookingController.getBookingsByHotelId
);

// PATCH /api/v1/bookings/:bookingId/status
router.patch(
    '/:bookingId/status',
    authorize(['hotel_owner', 'admin']),
    validate(updateStatusSchema),
    bookingController.updateBookingStatus
);
// request đến /:bookingId/history
router.use('/', historyRoutes);


module.exports = router;
