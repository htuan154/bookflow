// src/api/v1/routes/amenity.route.js

const express = require('express');
const AmenityController = require('../controllers/amenity.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createAmenitySchema, updateAmenitySchema } = require('../../../validators/amenity.validator');

const router = express.Router();
const amenityController = new AmenityController();

// --- PUBLIC ROUTE ---
// GET /api/v1/amenities -> Lấy tất cả các tiện nghi
router.get('/', amenityController.getAllAmenities);

// --- ADMIN-ONLY ROUTES ---
// Các route dưới đây yêu cầu phải đăng nhập với vai trò 'admin'

// POST /api/v1/amenities -> Tạo một tiện nghi mới
router.post(
    '/',
    authenticate,
    authorize(['admin']),
    validate(createAmenitySchema),
    amenityController.createAmenity
);

// PUT /api/v1/amenities/:id -> Cập nhật một tiện nghi
router.put(
    '/:id',
    authenticate,
    authorize(['admin']),
    validate(updateAmenitySchema),
    amenityController.updateAmenity
);

// DELETE /api/v1/amenities/:id -> Xóa một tiện nghi
router.delete(
    '/:id',
    authenticate,
    authorize(['admin']),
    amenityController.deleteAmenity
);

module.exports = router;
