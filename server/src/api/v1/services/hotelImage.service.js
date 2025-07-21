// src/api/v1/services/hotelImage.service.js

const hotelImageRepository = require('../repositories/hotelImage.repository');
const hotelRepository = require('../repositories/hotel.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class HotelImageService {
    /**
     * Thêm hình ảnh mới cho một khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @param {Array<object>} imagesData - Dữ liệu hình ảnh.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<HotelImage[]>}
     */
    async addImagesToHotel(hotelId, imagesData, userId) {
        // --- Kiểm tra nghiệp vụ ---
        const hotel = await hotelRepository.findById(hotelId);
        if (!hotel) {
            throw new AppError('Hotel not found', 404);
        }
        // Chỉ chủ khách sạn hoặc admin mới có quyền thêm ảnh
        if (hotel.ownerId !== userId) {
            console.log('No permission:', hotel.ownerId, '!==', userId);
            throw new AppError('Forbidden: You do not have permission to add images to this hotel', 403);
        }

        return await hotelImageRepository.addImages(hotelId, imagesData);
    }

    /**
     * Xóa một hình ảnh của khách sạn.
     * @param {string} imageId - ID của hình ảnh.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<void>}
     */
    async deleteHotelImage(imageId, userId) {
        const image = await hotelImageRepository.findById(imageId);
        if (!image) {
            throw new AppError('Image not found', 404);
        }
        const hotel = await hotelRepository.findById(image.hotelId);
        if (hotel.ownerId !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to delete this image', 403);
        }
        const isDeleted = await hotelImageRepository.deleteById(imageId);
        if (!isDeleted) {
            throw new AppError('Failed to delete image', 500);
        }
    }

    /**
     * Đặt ảnh đại diện cho khách sạn.
     * @param {string} imageId - ID của hình ảnh.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<void>}
     */
    async setHotelThumbnail(imageId, userId) {
        const image = await hotelImageRepository.findById(imageId);
        if (!image) {
            throw new AppError('Image not found', 404);
        }
        const hotel = await hotelRepository.findById(image.hotelId);
        if (hotel.ownerId !== userId && userId.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to set a thumbnail for this hotel', 403);
        }
        await hotelImageRepository.setAsThumbnail(image.hotelId, imageId);
    }
}

module.exports = new HotelImageService();