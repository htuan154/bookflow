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

    /**
     * Lấy review theo bookingId (public API).
     * GET /api/v1/reviews/booking/:bookingId
     */
    async getReviewByBookingId(req, res, next) {
        try {
            const { bookingId } = req.params;
            const review = await ReviewService.getReviewByBookingId(bookingId);
            if (!review) {
                return successResponse(res, null, 'No review found for this booking', 200);
            }
            successResponse(res, review, 'Review retrieved successfully');
        } catch (error) {
            next(error);
        }
    }


    /**
     * API cập nhật các trường rating phụ cho review (cleanliness_rating, comfort_rating, service_rating, location_rating, value_rating).
     * YÊU CẦU: Người dùng phải đăng nhập (authenticate) mới được sử dụng.
     * PATCH /api/v1/reviews/:reviewId/ratings
     */
    async updateSubRatings(req, res, next) {
        try {
            const { reviewId } = req.params;
            const ratings = req.body;
            const updated = await ReviewService.updateSubRatings(reviewId, ratings);
            if (!updated) {
                return successResponse(res, null, 'Review not found', 404);
            }
            successResponse(res, updated, 'Sub ratings updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReviewController();
