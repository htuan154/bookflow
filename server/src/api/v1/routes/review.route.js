// src/api/v1/routes/review.route.js

const express = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createReviewSchema } = require('../../../validators/review.validator');

const router = express.Router();


// --- PUBLIC ROUTE ---
// GET /api/v1/reviews/:hotelId/reviews -> Lấy tất cả đánh giá của một khách sạn
// Route này được đặt ở đây để gom nhóm, nhưng có thể được cấu trúc lại trong hotel.route.js
router.get('/:hotelId', reviewController.getReviewsForHotel);


// --- PROTECTED ROUTES (Yêu cầu đăng nhập) ---

// POST /api/v1/reviews -> Người dùng tạo một đánh giá mới
router.post(
    '/',
    authenticate,
    validate(createReviewSchema),
    reviewController.createReview
);

// DELETE /api/v1/reviews/:reviewId -> Xóa một đánh giá
// Chỉ người viết đánh giá hoặc admin mới có thể xóa
router.delete(
    '/:reviewId',
    authenticate,
    reviewController.deleteReview
);

module.exports = router;
