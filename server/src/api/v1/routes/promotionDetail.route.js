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

module.exports = router;
