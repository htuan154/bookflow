// src/api/v1/routes/promotionUsage.route.js

const express = require('express');
const promotionUsageController = require('../controllers/promotionUsage.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();


// GET /api/v1/promotions/:promotionId/usage-history -> Lấy lịch sử sử dụng của một mã
// Yêu cầu: Đã đăng nhập VÀ là 'admin' hoặc 'hotel_owner'
router.get(
    '/:promotionId/usage-history',
    authenticate,
    authorize(['admin', 'hotel_owner']),
    promotionUsageController.getUsageHistory
);

module.exports = router;
