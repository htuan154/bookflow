
// src/api/v1/services/promotionDetail.service.js

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
}

module.exports = new PromotionDetailService();
