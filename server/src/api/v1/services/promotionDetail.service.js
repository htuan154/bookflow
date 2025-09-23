
// src/api/v1/services/promotionDetail.service.js
const pool = require('../../../config/db');
const promotionDetailRepository = require('../repositories/promotionDetail.repository');
const promotionRepository = require('../repositories/promotion.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class PromotionDetailService {
    /**
     * Thêm chi tiết cho một chương trình khuyến mãi.
     * @param {string} promotionId - ID của khuyến mãi.
     * @param {Array<object>} detailsData - Dữ liệu chi tiết.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<PromotionDetail[]>}
     */
    async addDetailsToPromotion(promotionId, detailsData, userId) {
        // --- Kiểm tra nghiệp vụ ---
        const promotion = await promotionRepository.findById(promotionId);
        if (!promotion) {
            throw new AppError('Promotion not found', 404);
        }
        // console.log('[DEBUG] promotion:', promotion);
        // console.log('[DEBUG] userId:', userId);
        // console.log('[DEBUG] promotion.createdBy:', promotion.createdBy);
        // Chỉ người tạo khuyến mãi hoặc admin mới có quyền thêm chi tiết
        if (promotion.createdBy !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to manage details for this promotion', 403);
        }

        // TODO: Thêm logic xóa các chi tiết cũ trước khi thêm mới nếu cần
        
        return await promotionDetailRepository.createMany(promotionId, detailsData, pool); // Dùng pool vì đây là hành động độc lập
    }

    /**
     * Lấy danh sách chi tiết của một chương trình khuyến mãi.
     * @param {string} promotionId - ID của khuyến mãi.
     * @returns {Promise<PromotionDetail[]>}
     */
    async getDetailsForPromotion(promotionId) {
        return await promotionDetailRepository.findByPromotionId(promotionId);
    }

    /**
     * Tạo nhiều chi tiết khuyến mãi (bulk create)
     * @param {Array<object>} detailsData - Dữ liệu chi tiết.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<PromotionDetail[]>}
     */
    async createDetailsBulk(detailsData, userId) {
        if (!detailsData || !Array.isArray(detailsData) || detailsData.length === 0) {
            throw new AppError('Details data is required and must be a non-empty array', 400);
        }

        // Validate that all details have the same promotion_id
        const promotionId = detailsData[0].promotion_id;
        if (!promotionId) {
            throw new AppError('Promotion ID is required for all details', 400);
        }

        const allSamePromotionId = detailsData.every(detail => detail.promotion_id === promotionId);
        if (!allSamePromotionId) {
            throw new AppError('All details must belong to the same promotion', 400);
        }

        // Check if promotion exists and user has permission
        const promotion = await promotionRepository.findById(promotionId);
        if (!promotion) {
            throw new AppError('Promotion not found', 404);
        }

        // Check permissions (only creator or admin can add details)
        if (promotion.createdBy !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to manage details for this promotion', 403);
        }

        return await promotionDetailRepository.createMany(promotionId, detailsData, pool);
    }

    /**
     * Cập nhật chi tiết khuyến mãi
     * @param {string} detailId - ID của chi tiết.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<PromotionDetail>}
     */
    async updateDetail(detailId, updateData, userId) {
        // Check if detail exists
        const detail = await promotionDetailRepository.findById(detailId);
        if (!detail) {
            throw new AppError('Promotion detail not found', 404);
        }

        // Check if promotion exists and user has permission
        const promotion = await promotionRepository.findById(detail.promotionId);
        if (!promotion) {
            throw new AppError('Promotion not found', 404);
        }

        if (promotion.createdBy !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to manage details for this promotion', 403);
        }

        return await promotionDetailRepository.update(detailId, updateData);
    }

    /**
     * Cập nhật nhiều chi tiết khuyến mãi (bulk update)
     * @param {string} promotionId - ID của khuyến mãi.
     * @param {Array<object>} detailsData - Dữ liệu cập nhật.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<PromotionDetail[]>}
     */
    async updateDetailsBulk(promotionId, detailsData, userId) {
        if (!detailsData || !Array.isArray(detailsData) || detailsData.length === 0) {
            throw new AppError('Details data is required and must be a non-empty array', 400);
        }

        // Check if promotion exists and user has permission
        const promotion = await promotionRepository.findById(promotionId);
        if (!promotion) {
            throw new AppError('Promotion not found', 404);
        }

        if (promotion.createdBy !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to manage details for this promotion', 403);
        }

        // Validate that all details exist and belong to this promotion
        for (const detailData of detailsData) {
            const detail = await promotionDetailRepository.findById(detailData.detailId);
            if (!detail) {
                throw new AppError(`Promotion detail with ID ${detailData.detailId} not found`, 404);
            }
            if (detail.promotionId !== promotionId) {
                throw new AppError(`Detail ${detailData.detailId} does not belong to promotion ${promotionId}`, 400);
            }
        }

        return await promotionDetailRepository.updateMany(detailsData);
    }

    /**
     * Xóa chi tiết khuyến mãi
     * @param {string} detailId - ID của chi tiết.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<void>}
     */
    async deleteDetail(detailId, userId) {
        // Check if detail exists
        const detail = await promotionDetailRepository.findById(detailId);
        if (!detail) {
            throw new AppError('Promotion detail not found', 404);
        }

        // Check if promotion exists and user has permission
        const promotion = await promotionRepository.findById(detail.promotionId);
        if (!promotion) {
            throw new AppError('Promotion not found', 404);
        }

        if (promotion.createdBy !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to manage details for this promotion', 403);
        }

        return await promotionDetailRepository.delete(detailId);
    }
}

module.exports = new PromotionDetailService();
