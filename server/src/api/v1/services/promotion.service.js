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
        // 1. Ràng buộc bắt buộc
        // if (!promotionData.hotel_id) {
        //     throw new AppError('hotel_id is required', 400);
        // }
        if (!promotionData.code || promotionData.code.trim() === '') {
            throw new AppError('Promotion code is required', 400);
        }
        if (!promotionData.name || promotionData.name.trim() === '') {
            throw new AppError('Promotion name is required', 400);
        }
        if (promotionData.discount_value == null || promotionData.discount_value <= 0) {
            throw new AppError('discount_value must be greater than 0', 400);
        }

        // 2. Ràng buộc số học
        if (promotionData.min_booking_price != null && promotionData.min_booking_price < 0) {
            throw new AppError('min_booking_price must be >= 0', 400);
        }
        if (promotionData.max_discount_amount != null && promotionData.max_discount_amount < 0) {
            throw new AppError('max_discount_amount must be >= 0', 400);
        }
        if (promotionData.usage_limit != null && promotionData.usage_limit <= 0) {
            throw new AppError('usage_limit must be greater than 0', 400);
        }

        // 3. Ngày giờ
        if (!promotionData.valid_from || !promotionData.valid_until) {
            throw new AppError('valid_from and valid_until are required', 400);
        }
        if (new Date(promotionData.valid_from) >= new Date(promotionData.valid_until)) {
            throw new AppError('valid_from must be before valid_until', 400);
        }

        // 4. Enum check
        const allowedTypes = ['general', 'room_specific'];
        if (promotionData.promotion_type && !allowedTypes.includes(promotionData.promotion_type)) {
            throw new AppError(`promotion_type must be one of: ${allowedTypes.join(', ')}`, 400);
        }
        const allowedStatus = ['pending', 'approved', 'rejected', 'active', 'inactive'];
        if (promotionData.status && !allowedStatus.includes(promotionData.status)) {
            throw new AppError(`status must be one of: ${allowedStatus.join(', ')}`, 400);
        }

        // 5. Check code unique
        const existingPromotion = await promotionRepository.findByCode(promotionData.code);
        if (existingPromotion) {
            throw new AppError('Promotion code already exists', 409);
        }

        // 6. Set người tạo
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

    /**
     * Lấy chi tiết một chương trình khuyến mãi theo ID.
     * @param {string} promotionId
     * @returns {Promise<Promotion|null>}
     */
    async findById(promotionId) {
        return await promotionRepository.findById(promotionId);
    }

    /**
     * Tìm chương trình khuyến mãi theo code.
     * @param {string} code
     * @returns {Promise<Promotion|null>}
     */
    async findByCode(code) {
        const promotion = await promotionRepository.findByCode(code);
        if (!promotion) {
            throw new AppError('Promotion not found', 404);
        }
        return promotion;
    }

    /**
     * Cập nhật thông tin chương trình khuyến mãi.
     * @param {string} promotionId
     * @param {object} updateData
     * @returns {Promise<Promotion>}
     */
    async updatePromotion(promotionId, updateData) {
        const existing = await promotionRepository.findById(promotionId);
        if (!existing) {
            throw new AppError('Promotion not found', 404);
        }

        const updated = await promotionRepository.update(promotionId, updateData);
        return updated;
    }

    /**
     * Xóa một chương trình khuyến mãi.
     * @param {string} promotionId
     * @returns {Promise<boolean>}
     */
    async deletePromotion(promotionId) {
        const existing = await promotionRepository.findById(promotionId);
        if (!existing) {
            throw new AppError('Promotion not found', 404);
        }
        return await promotionRepository.deleteById(promotionId);
    }

    /**
     * Lấy danh sách khuyến mãi với bộ lọc động.
     * @param {object} filters
     * @returns {Promise<Promotion[]>}
     */
    async getAllAndFilterPromotions(filters) {
        return await promotionRepository.findAllAndFilter(filters);
    }
}

module.exports = new PromotionService();