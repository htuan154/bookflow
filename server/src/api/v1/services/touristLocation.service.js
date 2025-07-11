// src/api/v1/services/touristLocation.service.js

const touristLocationRepository = require('../repositories/touristLocation.repository');
const { AppError } = require('../../../utils/errors');

class TouristLocationService {
    /**
     * Tạo một địa điểm du lịch mới (chỉ Admin).
     * @param {object} locationData - Dữ liệu của địa điểm.
     * @param {string} adminId - ID của Admin tạo địa điểm.
     * @returns {Promise<TouristLocation>}
     */
    async createLocation(locationData, adminId) {
        // TODO: Có thể thêm logic kiểm tra xem địa điểm đã tồn tại chưa
        return await touristLocationRepository.create(locationData, adminId);
    }

    /**
     * Lấy tất cả các địa điểm du lịch.
     * @returns {Promise<TouristLocation[]>}
     */
    async getAllLocations() {
        return await touristLocationRepository.findAll();
    }

    /**
     * Lấy các địa điểm du lịch theo thành phố.
     * @param {string} city - Tên thành phố.
     * @returns {Promise<TouristLocation[]>}
     */
    async getLocationsByCity(city) {
        if (!city) {
            throw new AppError('City parameter is required', 400);
        }
        return await touristLocationRepository.findByCity(city);
    }

    /**
     * Cập nhật một địa điểm du lịch (chỉ Admin).
     * @param {string} locationId - ID của địa điểm.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @returns {Promise<TouristLocation>}
     */
    async updateLocation(locationId, updateData) {
        const location = await touristLocationRepository.findById(locationId);
        if (!location) {
            throw new AppError('Tourist location not found', 404);
        }

        const updatedLocation = await touristLocationRepository.update(locationId, updateData);
        return updatedLocation;
    }

    /**
     * Xóa một địa điểm du lịch (chỉ Admin).
     * @param {string} locationId - ID của địa điểm.
     * @returns {Promise<void>}
     */
    async deleteLocation(locationId) {
        const location = await touristLocationRepository.findById(locationId);
        if (!location) {
            throw new AppError('Tourist location not found', 404);
        }

        // TODO: Logic nghiệp vụ: Trước khi xóa, có thể cần kiểm tra xem địa điểm này
        // có đang được liên kết với các bài blog hay gợi ý món ăn nào không.

        const isDeleted = await touristLocationRepository.deleteById(locationId);
        if (!isDeleted) {
            throw new AppError('Failed to delete tourist location', 500);
        }
    }
}

module.exports = new TouristLocationService();
