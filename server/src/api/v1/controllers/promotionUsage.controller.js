// src/api/v1/controllers/promotionUsage.controller.js

const PromotionUsageService = require('../services/promotionUsage.service');
const { successResponse } = require('../../../utils/response');

class PromotionUsageController {
    /**
     * Lấy lịch sử sử dụng của một mã khuyến mãi.
     * GET /api/v1/promotions/:promotionId/usage-history
     */
    async getUsageHistory(req, res, next) {
        try {
            const { promotionId } = req.params;
            const history = await PromotionUsageService.getUsageHistory(promotionId);
            successResponse(res, history, 'Promotion usage history retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PromotionUsageController();