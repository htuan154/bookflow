// src/api/v1/services/touristLocation.service.js

const touristLocationRepository = require('../repositories/touristLocation.repository');
const { AppError } = require('../../../utils/errors');

class TouristLocationService {
    /**
     * Lấy 10 địa điểm du lịch gần nhất theo vị trí (lat, lng).
     * @param {number} lat - Vĩ độ.
     * @param {number} lng - Kinh độ.
     * @returns {Promise<TouristLocationNearest[]>}
     */
    async getNearestLocations(lat, lng) {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            throw new AppError('lat and lng are required and must be numbers', 400);
        }
        return await touristLocationRepository.findNearest(lat, lng);
    }

    /**
     * Tạo một địa điểm du lịch mới (chỉ Admin).
     * @param {object} locationData - Dữ liệu của địa điểm.
     * @param {string} adminId - ID của Admin tạo địa điểm.
     * @returns {Promise<TouristLocation>}
     */
    async createLocation(locationData, adminId) {
        // Đảm bảo locationData có latitude, longitude
        if (typeof locationData.latitude !== 'number' || typeof locationData.longitude !== 'number') {
            throw new AppError('Latitude and longitude are required', 400);
        }
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
        // Nếu updateData có latitude/longitude thì phải là số hợp lệ
        if (updateData.latitude !== undefined && typeof updateData.latitude !== 'number') {
            throw new AppError('Latitude must be a number', 400);
        }
        if (updateData.longitude !== undefined && typeof updateData.longitude !== 'number') {
            throw new AppError('Longitude must be a number', 400);
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

     /**
     * Lấy các địa điểm du lịch theo đúng tên thành phố (phân biệt hoa thường, hỗ trợ tiếng Việt).
     * @param {string} city - Tên thành phố.
     * @returns {Promise<TouristLocation[]>}
     */
    async getLocationsByCityVn(city) {
        if (!city) {
            throw new AppError('City parameter is required', 400);
        }
        return await touristLocationRepository.findByCityVn(city);
    }
}

module.exports = new TouristLocationService();
