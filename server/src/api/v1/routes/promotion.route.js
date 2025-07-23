// src/api/v1/routes/promotion.route.js

const express = require('express');
const promotionController = require('../controllers/promotion.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createPromotionSchema, validateCodeSchema } = require('../../../validators/promotion.validator');
const usageHistoryRoutes = require('./promotionUsage.route');
const promotionDetailRoutes = require('./promotionDetail.route'); 
const router = express.Router();



// GET /api/v1/promotions -> Lấy danh sách các khuyến mãi công khai
router.get('/', promotionController.getAllPromotions);

// POST /api/v1/promotions/validate -> Người dùng kiểm tra mã khuyến mãi
router.post(
    '/validate',
    authenticate,
    validate(validateCodeSchema),
    promotionController.validatePromotion
);

// POST /api/v1/promotions -> Tạo khuyến mãi mới
router.post(
    '/',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    validate(createPromotionSchema),
    promotionController.createPromotion
);



// Gắn các route quản lý chi tiết khuyến mãi vào đường dẫn /:promotionId/details
// Ví dụ: GET /api/v1/promotions/123-abc/details
router.use('/:promotionId/details', promotionDetailRoutes);

// Gắn các route quản lý lịch sử sử dụng
// Ví dụ: GET /api/v1/promotions/123-abc/usage-history
router.use('/', usageHistoryRoutes);

module.exports = router;
