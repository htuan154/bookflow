// src/api/v1/routes/contract.route.js

const express = require('express');
const ContractController = require('../controllers/contract.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createContractSchema, updateStatusSchema } = require('../../../validators/contract.validator');

const router = express.Router();
const contractController = new ContractController();

// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// --- ADMIN-ONLY ROUTES ---
// Chỉ Admin mới có quyền tạo và thay đổi trạng thái hợp đồng

// POST /api/v1/contracts -> Admin tạo hợp đồng mới
router.post(
    '/',
    authorize(['admin']),
    validate(createContractSchema),
    contractController.createContract
);

// PATCH /api/v1/contracts/:id/status -> Admin cập nhật trạng thái hợp đồng
router.patch(
    '/:id/status',
    authorize(['admin']),
    validate(updateStatusSchema),
    contractController.updateContractStatus
);


// --- ADMIN & HOTEL OWNER ROUTES ---
// Cả Admin và Chủ khách sạn liên quan đều có thể xem hợp đồng

// GET /api/v1/contracts/:id -> Lấy chi tiết một hợp đồng
router.get(
    '/:id',
    authorize(['admin', 'hotel_owner']),
    contractController.getContractById
);

// GET /api/v1/hotels/:hotelId/contracts -> Lấy tất cả hợp đồng của một khách sạn
// (Logic kiểm tra ownership chi tiết sẽ nằm trong service)
router.get(
    '/hotel/:hotelId', // Thay đổi để tránh xung đột với /:id
    authorize(['admin', 'hotel_owner']),
    contractController.getContractsByHotel
);


module.exports = router;
