// src/api/v1/routes/hotel.route.js
const express = require('express');
const hotelController = require('../controllers/hotel.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validator.middleware'); // <-- Đảm bảo có import này
const { validateHotelData, validateHotelUpdate } = require('../../../validators/hotel.validator');

const router = express.Router();

// PUBLIC ROUTES
router.get('/', hotelController.getAllHotels);
router.get('/search', hotelController.searchHotels);
router.get('/popular', hotelController.getPopularHotels);
router.get('/:id', hotelController.getHotelById);

// AUTHENTICATED ROUTES
router.get('/my-hotels', authenticate, hotelController.getMyHotels);

// HOTEL OWNER ROUTES
router.post('/', authenticate, validate(validateHotelData), hotelController.createHotel); // <-- Đảm bảo dùng validate()
router.put('/:id', authenticate, validate(validateHotelUpdate), hotelController.updateHotel); // <-- Đảm bảo dùng validate()
router.delete('/:id', authenticate, hotelController.deleteHotel);

module.exports = router;