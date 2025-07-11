// src/api/v1/services/seasonalPricing.service.js

const seasonalPricingRepository = require('../repositories/seasonalPricing.repository');
const roomTypeRepository = require('../repositories/roomType.repository'); // Giả định đã có
const hotelRepository = require('../repositories/hotel.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class SeasonalPricingService {
    /**
     * Tạo một quy tắc giá mới cho một loại phòng.
     * @param {object} pricingData - Dữ liệu của quy tắc giá.
     * @param {string} userId - ID của người dùng (chủ khách sạn) thực hiện.
     * @returns {Promise<SeasonalPricing>}
     */
    async createSeasonalPricing(pricingData, userId) {
        const { room_type_id } = pricingData;

        // --- Kiểm tra nghiệp vụ ---
        // 1. Kiểm tra xem loại phòng có tồn tại không
        const roomType = await roomTypeRepository.findById(room_type_id);
        if (!roomType) {
            throw new AppError('Room type not found', 404);
        }

        // 2. Kiểm tra quyền sở hữu của người dùng đối với khách sạn chứa loại phòng này
        const hotel = await hotelRepository.findById(roomType.hotelId);
        if (hotel.ownerId !== userId) {
            throw new AppError('Forbidden: You do not have permission to manage pricing for this room type', 403);
        }

        // TODO: Thêm logic kiểm tra trùng lặp khoảng thời gian cho cùng một room_type_id

        return await seasonalPricingRepository.create(pricingData);
    }

    /**
     * Lấy tất cả các quy tắc giá của một loại phòng.
     * @param {string} roomTypeId - ID của loại phòng.
     * @returns {Promise<SeasonalPricing[]>}
     */
    async getPricingsForRoomType(roomTypeId) {
        return await seasonalPricingRepository.findByRoomTypeId(roomTypeId);
    }

    /**
     * Cập nhật một quy tắc giá.
     * @param {string} pricingId - ID của quy tắc giá.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<SeasonalPricing>}
     */
    async updateSeasonalPricing(pricingId, updateData, userId) {
        // Kiểm tra quy tắc giá có tồn tại không
        const pricingRule = await seasonalPricingRepository.findById(pricingId);
        if (!pricingRule) {
            throw new AppError('Pricing rule not found', 404);
        }

        // Kiểm tra quyền sở hữu
        const roomType = await roomTypeRepository.findById(pricingRule.roomTypeId);
        const hotel = await hotelRepository.findById(roomType.hotelId);
        if (hotel.ownerId !== userId) {
            throw new AppError('Forbidden: You do not have permission to update this pricing rule', 403);
        }

        return await seasonalPricingRepository.update(pricingId, updateData);
    }

    /**
     * Xóa một quy tắc giá.
     * @param {string} pricingId - ID của quy tắc giá.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<void>}
     */
    async deleteSeasonalPricing(pricingId, userId) {
        // Kiểm tra quyền sở hữu tương tự như hàm update
        const pricingRule = await seasonalPricingRepository.findById(pricingId);
        if (!pricingRule) {
            throw new AppError('Pricing rule not found', 404);
        }
        const roomType = await roomTypeRepository.findById(pricingRule.roomTypeId);
        const hotel = await hotelRepository.findById(roomType.hotelId);
        if (hotel.ownerId !== userId) {
            throw new AppError('Forbidden: You do not have permission to delete this pricing rule', 403);
        }

        const isDeleted = await seasonalPricingRepository.deleteById(pricingId);
        if (!isDeleted) {
            throw new AppError('Failed to delete pricing rule', 500);
        }
    }
}

module.exports = new SeasonalPricingService();
