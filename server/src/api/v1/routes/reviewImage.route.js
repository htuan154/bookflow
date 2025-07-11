// src/api/v1/routes/reviewImage.route.js

const express = require('express');
const reviewImageController = require('../controllers/reviewImage.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { uploadReviewImagesSchema } = require('../../../validators/reviewImage.validator');

const router = express.Router();


// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// POST /api/v1/reviews/:reviewId/images -> Thêm một hoặc nhiều ảnh vào một đánh giá
router.post(
    '/reviews/:reviewId/images',
    validate(uploadReviewImagesSchema),
    reviewImageController.uploadImages
);

// DELETE /api/v1/review-images/:imageId -> Xóa một ảnh cụ thể
router.delete(
    '/review-images/:imageId',
    reviewImageController.deleteImage
);

module.exports = router;
