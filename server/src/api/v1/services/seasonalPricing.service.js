// src/api/v1/services/seasonalPricing.service.js

const seasonalPricingRepository = require('../repositories/seasonalPricing.repository');
const roomTypeRepository = require('../repositories/roomType.repository'); // Giả định đã có
const hotelRepository = require('../repositories/hotel.repository'); // Giả định đã có
const seasonRepository = require('../repositories/season.repository');
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
     * Lấy các seasons chưa có seasonal pricing cho một room type trong một năm.
     * @param {string} roomTypeId - ID của loại phòng.
     * @param {number} year - Năm cần kiểm tra.
     * @returns {Promise<Season[]>} - Mảng các seasons chưa có pricing.
     */
    async getAvailableSeasonsForRoomType(roomTypeId, year) {
        // 1. Kiểm tra room type có tồn tại không
        const roomType = await roomTypeRepository.findById(roomTypeId);
        if (!roomType) {
            throw new AppError('Room type not found', 404);
        }

        // 2. Lấy tất cả seasons của năm đó
        const seasons = await seasonRepository.findByYear(year);
        if (!seasons || seasons.length === 0) {
            return [];
        }

        // 3. Lấy danh sách season_id đã tồn tại cho room_type này
        const seasonIds = seasons.map(s => s.seasonId);
        const existingSeasonIds = await seasonalPricingRepository.findExistingSeasonIds(roomTypeId, seasonIds);

        // 4. Lọc ra các seasons chưa có seasonal pricing
        const availableSeasons = seasons.filter(s => !existingSeasonIds.includes(s.seasonId));

        return availableSeasons;
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

    /**
     * Tạo bulk seasonal pricing cho một room type với tất cả seasons của một năm.
     * Chỉ tạo các seasonal pricing cho seasons chưa có.
     * @param {object} bulkData - { room_type_id, year, price_modifier }
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<{ created: SeasonalPricing[], skipped: number }>}
     */
    async   bulkCreateSeasonalPricing(bulkData, userId) {
        const { room_type_id, year, price_modifier } = bulkData;

        // 1. Kiểm tra room type có tồn tại không
        const roomType = await roomTypeRepository.findById(room_type_id);
        if (!roomType) {
            throw new AppError('Room type not found', 404);
        }

        // 2. Kiểm tra quyền sở hữu
        const hotel = await hotelRepository.findById(roomType.hotelId);
        if (hotel.ownerId !== userId) {
            throw new AppError('Forbidden: You do not have permission to manage pricing for this room type', 403);
        }

        // 3. Lấy tất cả seasons của năm đó
        const seasons = await seasonRepository.findByYear(year);
        if (!seasons || seasons.length === 0) {
            throw new AppError(`No seasons found for year ${year}`, 404);
        }

        // 4. Lấy danh sách season_id đã tồn tại cho room_type này
        const seasonIds = seasons.map(s => s.seasonId);
        const existingSeasonIds = await seasonalPricingRepository.findExistingSeasonIds(room_type_id, seasonIds);

        // 5. Lọc ra các seasons chưa có seasonal pricing
        const seasonsToCreate = seasons.filter(s => !existingSeasonIds.includes(s.seasonId));

        if (seasonsToCreate.length === 0) {
            return {
                created: [],
                skipped: seasons.length,
                message: 'All seasons already have pricing rules for this room type'
            };
        }

        // 6. Tạo dữ liệu bulk insert
        const pricingDataArray = seasonsToCreate.map(season => ({
            room_type_id,
            season_id: season.seasonId,
            name: season.name,
            start_date: season.startDate,
            end_date: season.endDate,
            price_modifier
        }));

        // 7. Bulk insert
        const createdPricing = await seasonalPricingRepository.bulkCreate(pricingDataArray);

        return {
            created: createdPricing,
            skipped: existingSeasonIds.length,
            message: `Created ${createdPricing.length} pricing rules, skipped ${existingSeasonIds.length} existing rules`
        };
    }
}

module.exports = new SeasonalPricingService();
