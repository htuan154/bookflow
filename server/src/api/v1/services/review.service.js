// src/api/v1/services/review.service.js

const reviewRepository = require('../repositories/review.repository');
const bookingRepository = require('../repositories/booking.repository');
const hotelRepository = require('../repositories/hotel.repository');
const { AppError } = require('../../../utils/errors');

/**
 * Hàm trợ giúp (private) để tính toán và cập nhật lại rating của khách sạn.
 * @param {string} hotelId - ID của khách sạn cần cập nhật.
 * @private
 */
async function _updateHotelRating(hotelId) {
    // Lấy tất cả các đánh giá của khách sạn (không phân trang)
    const allReviews = await reviewRepository.findByHotelId(hotelId, null, 0);
    const totalReviews = allReviews.length;

    let averageRating = 0;
    if (totalReviews > 0) {
        // Tính tổng điểm rating
        const totalRatingSum = allReviews.reduce((sum, review) => sum + review.rating, 0);
        // Tính điểm trung bình và làm tròn đến 2 chữ số thập phân
        averageRating = parseFloat((totalRatingSum / totalReviews).toFixed(2));
    }

    // Gọi repository để cập nhật lại thông tin trong bảng hotels
    //await hotelRepository.updateRatingStats(hotelId, averageRating, totalReviews);
}


class ReviewService {
    /**
     * Tạo một đánh giá mới.
     * @param {object} reviewData - Dữ liệu của đánh giá.
     * @param {string} userId - ID của người dùng viết đánh giá.
     * @returns {Promise<Review>}
     */
    async createReview(reviewData, userId) {
        const { booking_id } = reviewData;

        // --- Logic nghiệp vụ quan trọng ---
        // 1. Kiểm tra xem đơn đặt phòng có tồn tại không và có thuộc về người dùng này không.
        const booking = await bookingRepository.findById(booking_id);
        if (!booking || booking.userId !== userId) {
            throw new AppError('You can only review your own completed bookings.', 403);
        }

        // 2. Kiểm tra xem trạng thái đơn đặt phòng đã là 'completed' chưa.
        if (booking.bookingStatus !== 'completed') {
            throw new AppError('You can only review after the booking is completed.', 400);
        }

        // 3. Kiểm tra xem người dùng đã đánh giá cho đơn đặt phòng này chưa.
        const existingReview = await reviewRepository.findByBookingId(booking_id);
        if (existingReview) {
            throw new AppError('You have already reviewed this booking.', 409); // 409 Conflict
        }

        // Gán hotel_id từ booking để đảm bảo tính nhất quán
        reviewData.hotel_id = booking.hotelId;
        reviewData.user_id = userId;
        
        const newReview = await reviewRepository.create(reviewData);

        // Cập nhật lại rating của khách sạn sau khi tạo review mới
        await _updateHotelRating(booking.hotelId);

        return newReview;
    }

    /**
     * Lấy tất cả các đánh giá của một khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @param {object} paginationOptions - Tùy chọn phân trang { page, limit }.
     * @returns {Promise<Review[]>}
     */
    async getReviewsForHotel(hotelId, paginationOptions = {}) {
        const { page = 1, limit = 10 } = paginationOptions;
        const offset = (page - 1) * limit;
        return await reviewRepository.findByHotelId(hotelId, limit, offset);
    }

    /**
     * Xóa một đánh giá.
     * @param {string} reviewId - ID của đánh giá.
     * @param {object} currentUser - Thông tin người dùng hiện tại từ token.
     * @returns {Promise<void>}
     */
    async deleteReview(reviewId, currentUser) {
        const review = await reviewRepository.findById(reviewId);
        if (!review) {
            throw new AppError('Review not found', 404);
        }

        // Logic phân quyền: Chỉ người viết đánh giá hoặc admin mới được xóa.
        if (review.userId !== currentUser.id && currentUser.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to delete this review.', 403);
        }

        const isDeleted = await reviewRepository.deleteById(reviewId);
        if (!isDeleted) {
            throw new AppError('Failed to delete review', 500);
        }

        // Cập nhật lại rating của khách sạn sau khi xóa review
        await _updateHotelRating(review.hotelId);
    }
}

module.exports = new ReviewService();
