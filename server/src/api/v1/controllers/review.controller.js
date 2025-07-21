// src/api/v1/controllers/review.controller.js

const ReviewService = require('../services/review.service');
const { successResponse } = require('../../../utils/response');

class ReviewController {
    /**
     * Tạo một đánh giá mới.
     * POST /api/v1/reviews
     */
    async createReview(req, res, next) {
        try {
            const userId = req.user.id; // Lấy từ middleware 'authenticate'
            const reviewData = req.body;

            const newReview = await ReviewService.createReview(reviewData, userId);
            successResponse(res, newReview, 'Review created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả các đánh giá của một khách sạn.
     * GET /api/v1/hotels/:hotelId/reviews
     */
    async getReviewsForHotel(req, res, next) {
        try {
            const { hotelId } = req.params;
            const { page, limit } = req.query;

            const reviews = await ReviewService.getReviewsForHotel(hotelId, { page, limit });
            successResponse(res, reviews, 'Reviews retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một đánh giá.
     * DELETE /api/v1/reviews/:reviewId
     */
    async deleteReview(req, res, next) {
        try {
            const { reviewId } = req.params;
            const currentUser = req.user; // Lấy từ middleware 'authenticate'

            await ReviewService.deleteReview(reviewId, currentUser);
            successResponse(res, null, 'Review deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReviewController();
