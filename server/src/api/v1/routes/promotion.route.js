// src/api/v1/routes/promotion.route.js

const express = require('express');
const promotionController = require('../controllers/promotion.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { 
    createPromotionSchema, 
    validateCodeSchema, 
    updatePromotionSchema // nên có schema validate update
} = require('../../../validators/promotion.validator');
const usageHistoryRoutes = require('./promotionUsage.route');
const promotionDetailRoutes = require('./promotionDetail.route');
const router = express.Router();

// GET /api/v1/promotions -> Lấy danh sách các khuyến mãi công khai
router.get('/', promotionController.getAllPromotions);

// GET /api/v1/promotions/code/:code -> Lấy khuyến mãi theo code
router.get('/code/:code', promotionController.getPromotionByCode);

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

// PUT /api/v1/promotions/:promotionId -> Cập nhật khuyến mãi
router.put(
    '/:promotionId',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    validate(updatePromotionSchema),
    promotionController.updatePromotion
);

// DELETE /api/v1/promotions/:promotionId -> Xóa khuyến mãi
router.delete(
    '/:promotionId',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    promotionController.deletePromotion
);

// GET /api/v1/promotions/filter -> Lọc khuyến mãi theo trạng thái, code, ngày bắt đầu/kết thúc, hotelId
router.get(
    '/filter',
    authenticate, // Nếu muốn public thì có thể bỏ dòng này
    authorize(['admin', 'hotel_owner']), // Nếu muốn public thì có thể bỏ dòng này
    promotionController.getAllAndFilterPromotions
);

// GET /api/v1/promotions/:promotionId -> Lấy thông tin chi tiết 1 khuyến mãi
router.get('/:promotionId', promotionController.getPromotionById);

// Gắn các route quản lý chi tiết khuyến mãi vào đường dẫn /:promotionId/details
router.use('/:promotionId/details', promotionDetailRoutes);

// Gắn các route quản lý lịch sử sử dụng
router.use('/', usageHistoryRoutes);

module.exports = router;
