// src/api/v1/controllers/reviewImage.controller.js

const ReviewImageService = require('../services/reviewImage.service');
const { successResponse } = require('../../../utils/response');

class ReviewImageController {
    /**
     * Tải lên hình ảnh cho một đánh giá.
     * POST /api/v1/reviews/:reviewId/images
     */
    async uploadImages(req, res, next) {
        try {
            const { reviewId } = req.params;
            const { image_urls } = req.body; // Giả sử client gửi một mảng image_urls
            const userId = req.user.id; // Lấy từ middleware 'authenticate'

            const newImages = await ReviewImageService.addImagesToReview(reviewId, image_urls, userId);
            successResponse(res, newImages, 'Images added to review successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một hình ảnh của đánh giá.
     * DELETE /api/v1/review-images/:imageId
     */
    async deleteImage(req, res, next) {
        try {
            const { imageId } = req.params;
            const currentUser = req.user; // Lấy từ middleware 'authenticate'

            await ReviewImageService.deleteImage(imageId, currentUser);
            successResponse(res, null, 'Image deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReviewImageController();