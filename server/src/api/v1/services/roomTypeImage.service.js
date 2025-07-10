// src/api/v1/services/roomTypeImage.service.js

const roomTypeImageRepository = require('../repositories/roomTypeImage.repository');
const roomTypeRepository = require('../repositories/roomType.repository'); // Giả định đã có
const hotelRepository = require('../repositories/hotel.repository');       // Giả định đã có
const { AppError } = require('../../../utils/errors');

class RoomTypeImageService {
    /**
     * Thêm hình ảnh mới cho một loại phòng.
     * @param {string} roomTypeId - ID của loại phòng.
     * @param {Array<object>} imagesData - Dữ liệu hình ảnh.
     * @param {string} userId - ID của người dùng thực hiện (chủ khách sạn).
     * @returns {Promise<RoomTypeImage[]>}
     */
    async addImagesToRoomType(roomTypeId, imagesData, userId) {
        // Bước 1: Kiểm tra xem loại phòng có tồn tại không
        const roomType = await roomTypeRepository.findById(roomTypeId);
        if (!roomType) {
            throw new AppError('Room type not found', 404);
        }

        // Bước 2: Kiểm tra quyền sở hữu
        const hotel = await hotelRepository.findById(roomType.hotelId);
        if (hotel.ownerId !== userId) {
            throw new AppError('Forbidden: You do not own this hotel', 403);
        }

        // Bước 3: Gọi repository để thêm ảnh
        const newImages = await roomTypeImageRepository.addImages(roomTypeId, imagesData);
        return newImages;
    }

    /**
     * Lấy tất cả hình ảnh của một loại phòng.
     * @param {string} roomTypeId - ID của loại phòng.
     * @returns {Promise<RoomTypeImage[]>}
     */
    async getImagesForRoomType(roomTypeId) {
        return await roomTypeImageRepository.findByRoomTypeId(roomTypeId);
    }

    /**
     * Xóa một hình ảnh.
     * @param {string} imageId - ID của hình ảnh.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<void>}
     */
    async deleteImage(imageId, userId) {
        // Để kiểm tra quyền, cần tìm ra khách sạn mà ảnh này thuộc về
        // Giả sử repository có hàm findById
        const image = await roomTypeImageRepository.findById(imageId); 
        if (!image) {
            throw new AppError('Image not found', 404);
        }

        const roomType = await roomTypeRepository.findById(image.roomTypeId);
        const hotel = await hotelRepository.findById(roomType.hotelId);

        if (hotel.ownerId !== userId) {
            throw new AppError('Forbidden: You do not have permission to delete this image', 403);
        }

        const isDeleted = await roomTypeImageRepository.deleteById(imageId);
        if (!isDeleted) {
            throw new AppError('Failed to delete image', 500);
        }
    }

    /**
     * Đặt một hình ảnh làm ảnh đại diện.
     * @param {string} imageId - ID của hình ảnh.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<void>}
     */
    async setThumbnail(imageId, userId) {
        const image = await roomTypeImageRepository.findById(imageId);
        if (!image) {
            throw new AppError('Image not found', 404);
        }

        const roomType = await roomTypeRepository.findById(image.roomTypeId);
        const hotel = await hotelRepository.findById(roomType.hotelId);

        if (hotel.ownerId !== userId) {
            throw new AppError('Forbidden: You do not have permission to set thumbnail', 403);
        }

        await roomTypeImageRepository.setAsThumbnail(image.roomTypeId, imageId);
    }
}

module.exports = new RoomTypeImageService();
