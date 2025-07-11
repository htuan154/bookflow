// src/api/v1/services/reviewImage.service.js

const reviewImageRepository = require('../repositories/reviewImage.repository');
const reviewRepository = require('../repositories/review.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class ReviewImageService {
    /**
     * Thêm hình ảnh mới cho một đánh giá.
     * @param {string} reviewId - ID của đánh giá.
     * @param {Array<string>} imageUrls - Mảng các URL hình ảnh.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<ReviewImage[]>}
     */
    async addImagesToReview(reviewId, imageUrls, userId) {
        // --- Kiểm tra nghiệp vụ ---
        // 1. Kiểm tra xem đánh giá có tồn tại không.
        const review = await reviewRepository.findById(reviewId);
        if (!review) {
            throw new AppError('Review not found', 404);
        }

        // 2. Kiểm tra quyền sở hữu: Chỉ người viết đánh giá mới được thêm ảnh.
        if (review.userId !== userId) {
            throw new AppError('Forbidden: You can only add images to your own review', 403);
        }

        // 3. Gọi repository để thêm ảnh
        const newImages = await reviewImageRepository.addImages(reviewId, imageUrls);
        return newImages;
    }

    /**
     * Xóa một hình ảnh của đánh giá.
     * @param {string} imageId - ID của hình ảnh.
     * @param {object} currentUser - Thông tin người dùng hiện tại từ token.
     * @returns {Promise<void>}
     */
    async deleteImage(imageId, currentUser) {
        const image = await reviewImageRepository.findById(imageId);
        if (!image) {
            throw new AppError('Image not found', 404);
        }

        const review = await reviewRepository.findById(image.reviewId);
        if (!review) {
            // Trường hợp hiếm gặp nhưng vẫn cần kiểm tra
            throw new AppError('Associated review not found', 404);
        }

        // Logic phân quyền: Chỉ người viết đánh giá hoặc admin mới được xóa.
        if (review.userId !== currentUser.userId && currentUser.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to delete this image', 403);
        }

        const isDeleted = await reviewImageRepository.deleteById(imageId);
        if (!isDeleted) {
            throw new AppError('Failed to delete image', 500);
        }
    }
}

module.exports = new ReviewImageService();