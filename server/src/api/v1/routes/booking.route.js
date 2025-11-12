const express = require('express');
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createBookingSchema, updateStatusSchema } = require('../../../validators/booking.validator');
const historyRoutes = require('./bookingStatusHistory.route');

const router = express.Router();

router.use(authenticate);

router.get(
    '/user/:userId/no_show',
    bookingController.getUserNoShowBookings
);

router.post('/', validate(createBookingSchema), bookingController.createBooking);

router.get('/:bookingId', bookingController.getBookingDetails);

router.get('/user/:userId/completed', bookingController.getUserCompletedBookings);

router.get('/user/:userId', bookingController.getUserBookings);

router.get('/hotel/:hotelId', authorize(['hotel_owner', 'admin']), bookingController.getBookingsByHotelId);

router.patch('/:bookingId/status', authorize(['hotel_owner', 'admin']), validate(updateStatusSchema), bookingController.updateBookingStatus);

router.patch('/:bookingId', authorize(['hotel_owner', 'admin']), bookingController.updateBooking);

router.use('/', historyRoutes);

module.exports = router;
