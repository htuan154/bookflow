// src/api/v1/routes/touristLocation.route.js

const express = require('express');
const touristLocationController = require('../controllers/touristLocation.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createLocationSchema, updateLocationSchema } = require('../../../validators/touristLocation.validator');

const router = express.Router();


// --- PUBLIC ROUTES ---
// GET /api/v1/tourist-locations -> Lấy tất cả các địa điểm
router.get('/', touristLocationController.getAllLocations);

// GET /api/v1/tourist-locations/nearest?lat=...&lng=... -> Lấy 10 địa điểm gần nhất
router.get('/nearest', touristLocationController.getNearestLocations);

// GET /api/v1/tourist-locations/city/:city -> Lấy địa điểm theo thành phố
router.get('/city/:city', touristLocationController.getLocationsByCity);

// GET /api/v1/tourist-locations/city-vn/:city -> Lấy địa điểm theo đúng tên thành phố (phân biệt hoa thường, hỗ trợ tiếng Việt)
router.get('/city-vn/:city', touristLocationController.getLocationsByCityVn);

// --- ADMIN-ONLY ROUTES ---
// Các route dưới đây yêu cầu phải đăng nhập với vai trò 'admin'

// POST /api/v1/tourist-locations -> Tạo địa điểm mới
router.post(
    '/',
    authenticate,
    authorize(['admin']),
    validate(createLocationSchema),
    touristLocationController.createLocation
);

// PUT /api/v1/tourist-locations/:id -> Cập nhật địa điểm
router.put(
    '/:id',
    authenticate,
    authorize(['admin']),
    validate(updateLocationSchema),
    touristLocationController.updateLocation
);

// DELETE /api/v1/tourist-locations/:id -> Xóa địa điểm
router.delete(
    '/:id',
    authenticate,
    authorize(['admin']),
    touristLocationController.deleteLocation
);

module.exports = router;
