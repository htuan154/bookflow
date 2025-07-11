// src/api/v1/services/promotionUsage.service.js

const promotionUsageRepository = require('../repositories/promotionUsage.repository');
const promotionRepository = require('../repositories/promotion.repository'); // Cần repository này để cập nhật số lượt dùng

class PromotionUsageService {
    /**
     * Ghi lại việc sử dụng khuyến mãi và cập nhật số lượt đã dùng.
     * Hàm này phải được gọi bên trong một transaction của service cha (ví dụ: BookingService).
     * @param {object} usageData - Dữ liệu sử dụng.
     * @param {object} client - Đối tượng client của pg từ transaction.
     * @returns {Promise<PromotionUsage>}
     */
    async logPromotionUsage(usageData, client) {
        // Bước 1: Ghi lại lịch sử sử dụng
        const newUsage = await promotionUsageRepository.create(usageData, client);

        // Bước 2: Cập nhật (tăng) số lượt đã dùng của mã khuyến mãi
        await promotionRepository.incrementUsageCount(usageData.promotion_id, client);

        return newUsage;
    }

    /**
     * Lấy lịch sử sử dụng của một mã khuyến mãi (dành cho Admin/Chủ KS).
     * @param {string} promotionId - ID của khuyến mãi.
     * @returns {Promise<PromotionUsage[]>}
     */
    async getUsageHistory(promotionId) {
        return await promotionUsageRepository.findByPromotionId(promotionId);
    }
}

module.exports = new PromotionUsageService();