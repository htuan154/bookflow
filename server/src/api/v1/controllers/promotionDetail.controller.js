// src/api/v1/controllers/promotionDetail.controller.js

const PromotionDetailService = require('../services/promotionDetail.service');
const { successResponse } = require('../../../utils/response');

class PromotionDetailController {
    /**
     * Thêm chi tiết cho một chương trình khuyến mãi.
     * POST /api/v1/promotions/:promotionId/details
     */
    async addDetailsToPromotion(req, res, next) {
        try {
            const { promotionId } = req.params;
            const detailsData = req.body.details;
            const userId = req.user.id;
            const newDetails = await PromotionDetailService.addDetailsToPromotion(promotionId, detailsData, userId);
            successResponse(res, newDetails, 'Promotion details added successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách chi tiết của một chương trình khuyến mãi.
     * GET /api/v1/promotions/:promotionId/details
     */
    async getDetailsForPromotion(req, res, next) {
        try {
            const { promotionId } = req.params;
            const details = await PromotionDetailService.getDetailsForPromotion(promotionId);
            successResponse(res, details);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PromotionDetailController();