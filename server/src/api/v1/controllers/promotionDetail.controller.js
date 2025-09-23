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

    /**
     * Tạo nhiều chi tiết khuyến mãi (standalone)
     * POST /api/v1/promotion-details
     */
    async createPromotionDetailsBulk(req, res, next) {
        try {
            const { details } = req.body;
            const userId = req.user.id;
            const newDetails = await PromotionDetailService.createDetailsBulk(details, userId);
            successResponse(res, newDetails, 'Promotion details created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy chi tiết theo promotion ID (standalone)
     * GET /api/v1/promotion-details/promotion/:promotionId
     */
    async getDetailsByPromotionId(req, res, next) {
        try {
            const { promotionId } = req.params;
            const details = await PromotionDetailService.getDetailsForPromotion(promotionId);
            successResponse(res, details);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật chi tiết khuyến mãi
     * PUT /api/v1/promotion-details/:detailId
     */
    async updatePromotionDetail(req, res, next) {
        try {
            const { detailId } = req.params;
            const updateData = req.body;
            const userId = req.user.id;
            const updatedDetail = await PromotionDetailService.updateDetail(detailId, updateData, userId);
            successResponse(res, updatedDetail, 'Promotion detail updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật nhiều chi tiết khuyến mãi (bulk update)
     * PUT /api/v1/promotions/:promotionId/details/bulk-update
     */
    async updatePromotionDetailsBulk(req, res, next) {
        try {
            const { promotionId } = req.params;
            const { details } = req.body;
            const userId = req.user.id;
            const updatedDetails = await PromotionDetailService.updateDetailsBulk(promotionId, details, userId);
            successResponse(res, updatedDetails, 'Promotion details updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa chi tiết khuyến mãi
     * DELETE /api/v1/promotion-details/:detailId
     */
    async deletePromotionDetail(req, res, next) {
        try {
            const { detailId } = req.params;
            const userId = req.user.id;
            await PromotionDetailService.deleteDetail(detailId, userId);
            successResponse(res, null, 'Promotion detail deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PromotionDetailController();