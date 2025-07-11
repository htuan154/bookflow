// src/api/v1/controllers/seasonalPricing.controller.js

const SeasonalPricingService = require('../services/seasonalPricing.service');
const { successResponse } = require('../../../utils/response');

class SeasonalPricingController {
    /**
     * Tạo một quy tắc giá mới.
     * POST /api/v1/seasonal-pricings
     */
    async createSeasonalPricing(req, res, next) {
        try {
            const userId = req.user.userId; // Lấy từ middleware 'authenticate'
            const newPricingRule = await SeasonalPricingService.createSeasonalPricing(req.body, userId);
            successResponse(res, newPricingRule, 'Seasonal pricing rule created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả các quy tắc giá của một loại phòng.
     * GET /api/v1/room-types/:roomTypeId/seasonal-pricings
     */
    async getPricingsForRoomType(req, res, next) {
        try {
            const { roomTypeId } = req.params;
            const pricingRules = await SeasonalPricingService.getPricingsForRoomType(roomTypeId);
            successResponse(res, pricingRules);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật một quy tắc giá.
     * PUT /api/v1/seasonal-pricings/:pricingId
     */
    async updateSeasonalPricing(req, res, next) {
        try {
            const { pricingId } = req.params;
            const userId = req.user.userId;
            const updatedPricingRule = await SeasonalPricingService.updateSeasonalPricing(pricingId, req.body, userId);
            successResponse(res, updatedPricingRule, 'Seasonal pricing rule updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một quy tắc giá.
     * DELETE /api/v1/seasonal-pricings/:pricingId
     */
    async deleteSeasonalPricing(req, res, next) {
        try {
            const { pricingId } = req.params;
            const userId = req.user.userId;
            await SeasonalPricingService.deleteSeasonalPricing(pricingId, userId);
            successResponse(res, null, 'Seasonal pricing rule deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SeasonalPricingController();
