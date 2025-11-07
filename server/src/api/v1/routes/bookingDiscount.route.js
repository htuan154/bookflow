const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookingDiscount.controller');

// GET /api/v1/booking-discounts/:bookingId
router.get('/:bookingId', controller.getByBookingId);

// POST /api/v1/booking-discounts
router.post('/', controller.create);

module.exports = router;
