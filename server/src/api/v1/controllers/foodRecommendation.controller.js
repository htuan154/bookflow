// src/api/v1/controllers/foodRecommendation.controller.js

const FoodRecommendationService = require('../services/foodRecommendation.service');
const { successResponse } = require('../../../utils/response');

class FoodRecommendationController {
    /**
     * Lấy tất cả các gợi ý món ăn theo thành phố.
     * GET /api/v1/food-recommendations/city/:city
     */
    async getRecommendationsByCity(req, res, next) {
        try {
            const { city } = req.params;
            const recommendations = await FoodRecommendationService.getRecommendationsByCity(city);
            successResponse(res, recommendations);
        } catch (error) {
            next(error);
        }
    }
    /**
     * Tạo một gợi ý món ăn mới.
     * POST /api/v1/food-recommendations
     */
    async createFoodRecommendation(req, res, next) {
        try {
            // req.body có thể có latitude, longitude (validator đã kiểm tra)
            const newFood = await FoodRecommendationService.createFoodRecommendation(req.body);
            successResponse(res, newFood, 'Food recommendation created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả các gợi ý món ăn của một địa điểm.
     * GET /api/v1/tourist-locations/:locationId/food-recommendations
     */
    async getRecommendationsByLocation(req, res, next) {
        try {
            const { locationId } = req.params;
            const recommendations = await FoodRecommendationService.getRecommendationsByLocation(locationId);
            successResponse(res, recommendations);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật một gợi ý món ăn.
     * PUT /api/v1/food-recommendations/:id
     */
    async updateFoodRecommendation(req, res, next) {
        try {
            const { id } = req.params;
            // req.body có thể có latitude, longitude (validator đã kiểm tra)
            const updatedFood = await FoodRecommendationService.updateFoodRecommendation(id, req.body);
            successResponse(res, updatedFood, 'Food recommendation updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một gợi ý món ăn.
     * DELETE /api/v1/food-recommendations/:id
     */
    async deleteFoodRecommendation(req, res, next) {
        try {
            const { id } = req.params;
            await FoodRecommendationService.deleteFoodRecommendation(id);
            successResponse(res, null, 'Food recommendation deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FoodRecommendationController();