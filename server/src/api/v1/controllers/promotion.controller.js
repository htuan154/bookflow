// src/api/v1/controllers/promotion.controller.js

const PromotionService = require('../services/promotion.service');
const { successResponse } = require('../../../utils/response');

class PromotionController {
    /**
     * Tạo một chương trình khuyến mãi mới.
     * POST /api/v1/promotions
     */
    async createPromotion(req, res, next) {
        try {
            const userId = req.user.id;
            const newPromotion = await PromotionService.createPromotion(req.body, userId);
            successResponse(res, newPromotion, 'Promotion created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả các chương trình khuyến mãi.
     * GET /api/v1/promotions
     */
    async getAllPromotions(req, res, next) {
        try {
            const promotions = await PromotionService.getAllPromotions();
            successResponse(res, promotions);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xác thực một mã khuyến mãi.
     * POST /api/v1/promotions/validate
     */
    async validatePromotion(req, res, next) {
        try {
            const { code, bookingTotal } = req.body;
            const result = await PromotionService.validateAndApplyPromotion(code, bookingTotal);
            successResponse(res, result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết một chương trình khuyến mãi.
     * GET /api/v1/promotions/:promotionId
     */
    async getPromotionById(req, res, next) {
        try {
            const { promotionId } = req.params;
            const promotion = await PromotionService.findById(promotionId);
            if (!promotion) {
                return res.status(404).json({ message: 'Promotion not found' });
            }
            successResponse(res, promotion);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy khuyến mãi theo mã code.
     * GET /api/v1/promotions/code/:code
     */
    async getPromotionByCode(req, res, next) {
        try {
            const { code } = req.params;
            const promotion = await PromotionService.findByCode(code);
            successResponse(res, promotion);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật chương trình khuyến mãi.
     * PUT /api/v1/promotions/:promotionId
     */
    async updatePromotion(req, res, next) {
        try {
            const { promotionId } = req.params;
            const updatedPromotion = await PromotionService.updatePromotion(promotionId, req.body);
            successResponse(res, updatedPromotion, 'Promotion updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa chương trình khuyến mãi.
     * DELETE /api/v1/promotions/:promotionId
     */
    async deletePromotion(req, res, next) {
        try {
            const { promotionId } = req.params;
            await PromotionService.deletePromotion(promotionId);
            successResponse(res, null, 'Promotion deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách khuyến mãi với bộ lọc động.
     * GET /api/v1/promotions/filter
     */
    async getAllAndFilterPromotions(req, res, next) {
        try {
            const filters = {
                status: req.query.status,
                code: req.query.code,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                hotelId: req.query.hotelId,
            };
            const promotions = await PromotionService.getAllAndFilterPromotions(filters);
            successResponse(res, promotions);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PromotionController();
