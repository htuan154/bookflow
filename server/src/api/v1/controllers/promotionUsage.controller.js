// src/api/v1/controllers/promotionUsage.controller.js

const PromotionUsageService = require('../services/promotionUsage.service');
const { successResponse } = require('../../../utils/response');

class PromotionUsageController {
    /**
     * Ghi nhận sử dụng khuyến mãi
     * POST /api/v1/promotions/:promotionId/use
     */
    async usePromotion(req, res, next) {
        const pool = require('../../../config/db');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { promotionId } = req.params;
            // Chỉ nhận promotion_id, user_id, booking_id
            const usageData = {
                promotion_id: promotionId,
                user_id: req.body.user_id,
                booking_id: req.body.booking_id,
            };
            const newUsage = await PromotionUsageService.logPromotionUsage(usageData, client);
            
            await client.query('COMMIT');
            successResponse(res, newUsage, 'Promotion usage recorded');
        } catch (error) {
            await client.query('ROLLBACK');
            next(error);
        } finally {
            client.release();
        }
    }
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