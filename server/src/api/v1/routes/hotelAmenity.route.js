// src/api/v1/routes/hotelAmenity.route.js

const express = require('express');
const hotelAmenityController = require('../controllers/hotelAmenity.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { addAmenitySchema } = require('../../../validators/hotelAmenity.validator');

// Sử dụng mergeParams để có thể truy cập :hotelId từ route cha
const router = express.Router({ mergeParams: true }); 


// GET /api/v1/hotels/:hotelId/amenities -> Lấy danh sách tiện nghi (Public)
router.get('/', hotelAmenityController.getAmenitiesForHotel);

// POST /api/v1/hotels/:hotelId/amenities -> Thêm tiện nghi vào khách sạn
router.post(
    '/',
    authenticate,
    authorize(['hotel_owner', 'admin']),
    validate(addAmenitySchema),
    hotelAmenityController.addAmenityToHotel
);

// DELETE /api/v1/hotels/:hotelId/amenities/:amenityId -> Xóa tiện nghi khỏi khách sạn
router.delete(
    '/:amenityId',
    authenticate,
    authorize(['hotel_owner', 'admin']),
    hotelAmenityController.removeAmenityFromHotel
);

module.exports = router;
