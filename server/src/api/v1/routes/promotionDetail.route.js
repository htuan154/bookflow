// src/api/v1/routes/promotionDetail.route.js

const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createPromotionDetailsSchema } = require('../../../validators/promotionDetail.validator');
const promotionDetailController = require('../controllers/promotionDetail.controller');

// Sử dụng mergeParams để có thể truy cập :promotionId từ route cha
const router = express.Router({ mergeParams: true });

// GET /api/v1/promotions/:promotionId/details -> Lấy danh sách chi tiết (Public)
router.get('/', promotionDetailController.getDetailsForPromotion);

// POST /api/v1/promotions/:promotionId/details -> Thêm chi tiết
router.post(
    '/',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    validate(createPromotionDetailsSchema),
    promotionDetailController.addDetailsToPromotion
);

// POST /api/v1/promotions/:promotionId/details/bulk -> Tạo nhiều chi tiết khuyến mãi
router.post(
    '/bulk',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    promotionDetailController.createPromotionDetailsBulk
);

// PUT /api/v1/promotions/:promotionId/details/bulk-update -> Cập nhật nhiều chi tiết khuyến mãi
router.put(
    '/bulk-update',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    promotionDetailController.updatePromotionDetailsBulk
);

// PUT /api/v1/promotions/:promotionId/details/:detailId -> Cập nhật chi tiết
router.put(
    '/:detailId',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    promotionDetailController.updatePromotionDetail
);

// DELETE /api/v1/promotions/:promotionId/details/:detailId -> Xóa chi tiết
router.delete(
    '/:detailId',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    promotionDetailController.deletePromotionDetail
);

module.exports = router;
