// src/api/v1/services/hotelAmenity.service.js

const hotelAmenityRepository = require('../repositories/hotelAmenity.repository');
const hotelRepository = require('../repositories/hotel.repository'); // Giả định đã có
const amenityRepository = require('../repositories/amenity.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class HotelAmenityService {
    /**
     * Thêm một tiện nghi vào khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @param {string} amenityId - ID của tiện nghi.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<void>}
     */
    async addAmenityToHotel(hotelId, amenityId, userId) {
        // --- Kiểm tra nghiệp vụ ---
        const hotel = await hotelRepository.findById(hotelId);
        if (!hotel) throw new AppError('Hotel not found', 404);
        if (hotel.ownerId !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to manage amenities for this hotel', 403);
        }

        const amenity = await amenityRepository.findById(amenityId);
        if (!amenity) throw new AppError('Amenity not found', 404);

        await hotelAmenityRepository.addAmenityToHotel(hotelId, amenityId);
    }

    /**
     * Xóa một tiện nghi khỏi khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @param {string} amenityId - ID của tiện nghi.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<void>}
     */
    async removeAmenityFromHotel(hotelId, amenityId, userId) {
        // Kiểm tra quyền sở hữu tương tự như hàm add
        const hotel = await hotelRepository.findById(hotelId);
        if (!hotel) throw new AppError('Hotel not found', 404);
        if (hotel.ownerId !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to manage amenities for this hotel', 403);
        }

        const isRemoved = await hotelAmenityRepository.removeAmenityFromHotel(hotelId, amenityId);
        if (!isRemoved) {
            throw new AppError('Amenity was not associated with this hotel or could not be removed', 404);
        }
    }

    /**
     * Lấy danh sách tiện nghi của một khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @returns {Promise<Amenity[]>}
     */
    async getAmenitiesForHotel(hotelId) {
        return await hotelAmenityRepository.findAmenitiesByHotelId(hotelId);
    }
}

module.exports = new HotelAmenityService();