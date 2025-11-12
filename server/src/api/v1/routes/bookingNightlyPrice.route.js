// server/src/api/v1/routes/bookingNightlyPrice.route.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookingNightlyPrice.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// GET /api/v1/booking-nightly-prices/:bookingId
router.get('/:bookingId', authenticate, controller.getByBookingId);

// POST /api/v1/booking-nightly-prices
router.post('/', authenticate, controller.create);

module.exports = router;
