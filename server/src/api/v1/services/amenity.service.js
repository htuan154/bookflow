// src/api/v1/services/amenity.service.js

const amenityRepository = require('../repositories/amenity.repository');
const { AppError } = require('../../../utils/errors');

class AmenityService {
    /**
     * Tạo một tiện nghi mới.
     * @param {object} amenityData - Dữ liệu của tiện nghi.
     * @returns {Promise<Amenity>}
     */
    async createAmenity(amenityData) {
        const { name } = amenityData;

        // Logic nghiệp vụ: Kiểm tra xem tên tiện nghi đã tồn tại chưa
        const existingAmenity = await amenityRepository.findByName(name);
        if (existingAmenity) {
            throw new AppError('Amenity with this name already exists', 409); // 409 Conflict
        }

        return await amenityRepository.create(amenityData);
    }

    /**
     * Lấy tất cả các tiện nghi.
     * @returns {Promise<Amenity[]>}
     */
    async getAllAmenities() {
        return await amenityRepository.findAll();
    }

    /**
     * Cập nhật một tiện nghi.
     * @param {string} amenityId - ID của tiện nghi.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @returns {Promise<Amenity>}
     */
    async updateAmenity(amenityId, updateData) {
        const amenity = await amenityRepository.findById(amenityId);
        if (!amenity) {
            throw new AppError('Amenity not found', 404);
        }

        const updatedAmenity = await amenityRepository.update(amenityId, updateData);
        return updatedAmenity;
    }

    /**
     * Xóa một tiện nghi.
     * @param {string} amenityId - ID của tiện nghi.
     * @returns {Promise<void>}
     */
    async deleteAmenity(amenityId) {
        const amenity = await amenityRepository.findById(amenityId);
        if (!amenity) {
            throw new AppError('Amenity not found', 404);
        }

        // Logic nghiệp vụ quan trọng: Trước khi xóa, cần kiểm tra xem tiện nghi này
        // có đang được sử dụng bởi bất kỳ khách sạn nào không.
        // (Logic này có thể được thêm vào sau)
        // const isInUse = await hotelAmenityRepository.isAmenityInUse(amenityId);
        // if (isInUse) {
        //     throw new AppError('Cannot delete amenity that is currently in use', 400);
        // }

        const isDeleted = await amenityRepository.deleteById(amenityId);
        if (!isDeleted) {
            throw new AppError('Failed to delete amenity', 500);
        }
    }
}

module.exports = new AmenityService();
