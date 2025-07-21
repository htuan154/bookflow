// src/api/v1/controllers/roomTypeImage.controller.js

const RoomTypeImageService = require('../services/roomTypeImage.service');
const { successResponse } = require('../../../utils/response');

class RoomTypeImageController {
    /**
     * Tải lên hình ảnh cho một loại phòng.
     * POST /api/v1/room-types/:roomTypeId/images
     */
    async uploadImages(req, res, next) {
        try {
            const { roomTypeId } = req.params;
            const imagesData = req.body.images; // Giả sử client gửi một mảng images
            const userId = req.user.id; // Lấy từ middleware 'protect'

            const newImages = await RoomTypeImageService.addImagesToRoomType(roomTypeId, imagesData, userId);
            successResponse(res, newImages, 'Images uploaded successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả hình ảnh của một loại phòng.
     * GET /api/v1/room-types/:roomTypeId/images
     */
    async getImages(req, res, next) {
        try {
            const { roomTypeId } = req.params;
            const images = await RoomTypeImageService.getImagesForRoomType(roomTypeId);
            successResponse(res, images);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một hình ảnh.
     * DELETE /api/v1/room-type-images/:imageId
     */
    async deleteImage(req, res, next) {
        try {
            const { imageId } = req.params;
            const userId = req.user.id; // Lấy từ middleware 'protect'

            await RoomTypeImageService.deleteImage(imageId, userId);
            successResponse(res, null, 'Image deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đặt một hình ảnh làm ảnh đại diện.
     * PATCH /api/v1/room-type-images/:imageId/set-thumbnail
     */
    async setThumbnail(req, res, next) {
        try {
            const { imageId } = req.params;
            const userId = req.user.id; // Lấy từ middleware 'protect'

            await RoomTypeImageService.setThumbnail(imageId, userId);
            successResponse(res, null, 'Thumbnail set successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoomTypeImageController();
