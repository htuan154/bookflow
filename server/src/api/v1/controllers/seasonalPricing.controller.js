// src/api/v1/controllers/seasonalPricing.controller.js

const SeasonalPricingService = require('../services/seasonalPricing.service');
const { successResponse } = require('../../../utils/response');
const { AppError } = require('../../../utils/errors');

class SeasonalPricingController {
    /**
     * Tạo một quy tắc giá mới.
     * POST /api/v1/seasonal-pricings
     */
    async createSeasonalPricing(req, res, next) {
        try {
            const userId = req.user.id; // Lấy từ middleware 'authenticate'
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
     * Lấy các seasons chưa có seasonal pricing cho một room type trong một năm.
     * GET /api/v1/seasonal-pricings/available/:roomTypeId?year=2025
     */
    async getAvailableSeasonsForRoomType(req, res, next) {
        try {
            const { roomTypeId } = req.params;
            const { year } = req.query;
            
            if (!year) {
                throw new AppError('Year parameter is required', 400);
            }

            const availableSeasons = await SeasonalPricingService.getAvailableSeasonsForRoomType(roomTypeId, parseInt(year));
            successResponse(res, availableSeasons);
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
            const userId = req.user.id;
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
            const userId = req.user.id;
            await SeasonalPricingService.deleteSeasonalPricing(pricingId, userId);
            successResponse(res, null, 'Seasonal pricing rule deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo bulk seasonal pricing cho một room type với tất cả seasons của một năm.
     * POST /api/v1/seasonal-pricings/bulk
     */
    async bulkCreateSeasonalPricing(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await SeasonalPricingService.bulkCreateSeasonalPricing(req.body, userId);
            successResponse(res, result, result.message, 201);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SeasonalPricingController();
