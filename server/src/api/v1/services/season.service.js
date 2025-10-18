// src/api/v1/services/season.service.js

const seasonRepository = require('../repositories/season.repository');
const { AppError } = require('../../../utils/errors');

class SeasonService {
    /**
     * Tạo một mùa mới.
     * @param {object} seasonData - Dữ liệu của mùa.
     * @returns {Promise<Season>}
     */
    async createSeason(seasonData) {
        const { start_date, end_date } = seasonData;

        // Logic nghiệp vụ: Kiểm tra xem khoảng thời gian của mùa mới có bị trùng với mùa nào đã có không.
        const isOverlapping = await seasonRepository.checkOverlap(start_date, end_date);
        if (isOverlapping) {
            throw new AppError('The provided date range overlaps with an existing season.', 409); // 409 Conflict
        }

        return await seasonRepository.create(seasonData);
    }

    /**
     * Lấy tất cả các mùa.
     * @returns {Promise<Season[]>}
     */
    async getAllSeasons() {
        return await seasonRepository.findAll();
    }

    /**
     * Lấy tất cả các mùa theo năm.
     * @param {number} year - Năm cần lấy các mùa.
     * @returns {Promise<Season[]>}
     */
    async getSeasonsByYear(year) {
        return await seasonRepository.findByYear(year);
    }

    /**
     * Cập nhật một mùa.
     * @param {number} seasonId - ID của mùa.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @returns {Promise<Season>}
     */
    async updateSeason(seasonId, updateData) {
        const { start_date, end_date } = updateData;

        // Kiểm tra xem mùa có tồn tại không
        const season = await seasonRepository.findById(seasonId);
        if (!season) {
            throw new AppError('Season not found', 404);
        }

        // Kiểm tra trùng lặp thời gian, loại trừ chính mùa đang được cập nhật
        if (start_date && end_date) {
            const isOverlapping = await seasonRepository.checkOverlap(start_date, end_date, seasonId);
            if (isOverlapping) {
                throw new AppError('The provided date range overlaps with another season.', 409);
            }
        }

        const updatedSeason = await seasonRepository.update(seasonId, updateData);
        return updatedSeason;
    }

    /**
     * Xóa một mùa.
     * @param {number} seasonId - ID của mùa.
     * @returns {Promise<void>}
     */
    async deleteSeason(seasonId) {
        const season = await seasonRepository.findById(seasonId);
        if (!season) {
            throw new AppError('Season not found', 404);
        }

        // TODO: Logic nghiệp vụ quan trọng: Trước khi xóa, cần kiểm tra xem mùa này
        // có đang được áp dụng cho bất kỳ bảng giá nào không (seasonal_pricing).
        // const isInUse = await seasonalPricingRepository.isSeasonInUse(seasonId);
        // if (isInUse) {
        //     throw new AppError('Cannot delete a season that is currently in use.', 400);
        // }

        const isDeleted = await seasonRepository.deleteById(seasonId);
        if (!isDeleted) {
            throw new AppError('Failed to delete season', 500);
        }
    }
}

module.exports = new SeasonService();
