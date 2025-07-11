// src/api/v1/services/foodRecommendation.service.js

const foodRecommendationRepository = require('../repositories/foodRecommendation.repository');
const touristLocationRepository = require('../repositories/touristLocation.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class FoodRecommendationService {
    /**
     * Tạo một gợi ý món ăn mới (chỉ Admin).
     * @param {object} foodData - Dữ liệu của gợi ý.
     * @returns {Promise<FoodRecommendation>}
     */
    async createFoodRecommendation(foodData) {
        // Nếu có location_id, kiểm tra xem địa điểm có tồn tại không
        if (foodData.location_id) {
            const location = await touristLocationRepository.findById(foodData.location_id);
            if (!location) {
                throw new AppError('Associated tourist location not found', 404);
            }
        }
        return await foodRecommendationRepository.create(foodData);
    }

    /**
     * Lấy tất cả các gợi ý món ăn của một địa điểm.
     * @param {string} locationId - ID của địa điểm.
     * @returns {Promise<FoodRecommendation[]>}
     */
    async getRecommendationsByLocation(locationId) {
        return await foodRecommendationRepository.findByLocationId(locationId);
    }

    /**
     * Cập nhật một gợi ý món ăn (chỉ Admin).
     * @param {string} foodId - ID của gợi ý.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @returns {Promise<FoodRecommendation>}
     */
    async updateFoodRecommendation(foodId, updateData) {
        const food = await foodRecommendationRepository.findById(foodId);
        if (!food) {
            throw new AppError('Food recommendation not found', 404);
        }
        return await foodRecommendationRepository.update(foodId, updateData);
    }

    /**
     * Xóa một gợi ý món ăn (chỉ Admin).
     * @param {string} foodId - ID của gợi ý.
     * @returns {Promise<void>}
     */
    async deleteFoodRecommendation(foodId) {
        const food = await foodRecommendationRepository.findById(foodId);
        if (!food) {
            throw new AppError('Food recommendation not found', 404);
        }
        const isDeleted = await foodRecommendationRepository.deleteById(foodId);
        if (!isDeleted) {
            throw new AppError('Failed to delete food recommendation', 500);
        }
    }
}

module.exports = new FoodRecommendationService();