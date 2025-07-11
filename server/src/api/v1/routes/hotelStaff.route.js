// src/api/v1/routes/hotelStaff.route.js

const express = require('express');
const hotelStaffController = require('../controllers/hotelStaff.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { addStaffSchema, updateStaffSchema } = require('../../../validators/hotelStaff.validator');

const router = express.Router();


// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// --- Routes cho một khách sạn cụ thể ---
// GET /api/v1/hotels/:hotelId/staff -> Lấy danh sách nhân viên của một khách sạn
router.get('/hotels/:hotelId/staff', hotelStaffController.getStaff);

// POST /api/v1/hotels/:hotelId/staff -> Thêm nhân viên mới vào khách sạn
router.post(
    '/hotels/:hotelId/staff',
    authorize(['hotel_owner', 'admin']),
    validate(addStaffSchema),
    hotelStaffController.addStaff
);

// --- Routes cho một nhân viên cụ thể ---
// PUT /api/v1/staff/:staffId -> Cập nhật thông tin nhân viên
router.put(
    '/staff/:staffId',
    authorize(['hotel_owner', 'admin']),
    validate(updateStaffSchema),
    hotelStaffController.updateStaff
);

// DELETE /api/v1/staff/:staffId -> Xóa (sa thải) nhân viên
router.delete(
    '/staff/:staffId',
    authorize(['hotel_owner', 'admin']),
    hotelStaffController.removeStaff
);

module.exports = router;