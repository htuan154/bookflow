// src/api/v1/controllers/hotelImage.controller.js

const HotelImageService = require('../services/hotelImage.service');
const { successResponse } = require('../../../utils/response');

class HotelImageController {
    /**
     * Tải lên hình ảnh cho một khách sạn.
     * POST /api/v1/hotels/:hotelId/images
     */
    async uploadImages(req, res, next) {
        try {
            const { hotelId } = req.params;
            const imagesData = req.body.images;
            const userId = req.user.id;
            const newImages = await HotelImageService.addImagesToHotel(hotelId, imagesData, userId);
            successResponse(res, newImages, 'Images uploaded successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một hình ảnh của khách sạn.
     * DELETE /api/v1/hotel-images/:imageId
     */
    async deleteImage(req, res, next) {
        try {
            const { imageId } = req.params;
            const userId = req.user.id;
            await HotelImageService.deleteHotelImage(imageId, userId);
            successResponse(res, null, 'Image deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đặt một hình ảnh làm ảnh đại diện.
     * PATCH /api/v1/hotel-images/:imageId/set-thumbnail
     */
    async setThumbnail(req, res, next) {
        try {
            const { imageId } = req.params;
            const userId = req.user.id;
            await HotelImageService.setHotelThumbnail(imageId, userId);
            successResponse(res, null, 'Thumbnail set successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new HotelImageController();