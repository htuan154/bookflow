// src/api/v1/services/promotion.service.js

const promotionRepository = require('../repositories/promotion.repository');
const { AppError } = require('../../../utils/errors');

class PromotionService {
    /**
     * Tạo một chương trình khuyến mãi mới.
     * @param {object} promotionData - Dữ liệu khuyến mãi.
     * @param {string} userId - ID của người tạo.
     * @returns {Promise<Promotion>}
     */
    async createPromotion(promotionData, userId) {
        // Logic nghiệp vụ: Mã code phải là duy nhất
        const existingPromotion = await promotionRepository.findByCode(promotionData.code);
        if (existingPromotion) {
            throw new AppError('Promotion code already exists', 409);
        }

        promotionData.created_by = userId;
        return await promotionRepository.create(promotionData);
    }

    /**
     * Lấy tất cả các chương trình khuyến mãi.
     * @returns {Promise<Promotion[]>}
     */
    async getAllPromotions() {
        return await promotionRepository.findAll();
    }

    /**
     * Xác thực và áp dụng một mã khuyến mãi.
     * @param {string} code - Mã khuyến mãi.
     * @param {number} bookingTotal - Tổng giá trị đơn đặt phòng.
     * @returns {Promise<{isValid: boolean, discountValue: number, message: string}>}
     */
    async validateAndApplyPromotion(code, bookingTotal) {
        const promotion = await promotionRepository.findByCode(code);

        if (!promotion) {
            throw new AppError('Invalid promotion code', 404);
        }
        if (promotion.status !== 'active') {
            throw new AppError('This promotion is not active', 400);
        }
        if (new Date() < new Date(promotion.validFrom) || new Date() > new Date(promotion.validUntil)) {
            throw new AppError('This promotion is not valid at this time', 400);
        }
        if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
            throw new AppError('This promotion has reached its usage limit', 400);
        }
        if (promotion.minBookingPrice && bookingTotal < promotion.minBookingPrice) {
            throw new AppError(`Minimum booking total of ${promotion.minBookingPrice} is required`, 400);
        }

        // Nếu tất cả đều hợp lệ
        // TODO: Cần có logic để tăng used_count và ghi lại vào bảng promotion_usage
        return {
            isValid: true,
            discountValue: promotion.discountValue,
            promotionId: promotion.promotionId,
            message: 'Promotion applied successfully'
        };
    }
}

module.exports = new PromotionService();