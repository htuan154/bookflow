// src/api/v1/controllers/hotelAmenity.controller.js

const HotelAmenityService = require('../services/hotelAmenity.service');
const { successResponse } = require('../../../utils/response');

class HotelAmenityController {
    /**
     * Thêm một tiện nghi vào khách sạn.
     * POST /api/v1/hotels/:hotelId/amenities
     */
    async addAmenityToHotel(req, res, next) {
        try {
            const { hotelId } = req.params;
            const { amenity_id } = req.body;
            const userId = req.user.id;
            await HotelAmenityService.addAmenityToHotel(hotelId, amenity_id, userId);
            successResponse(res, null, 'Amenity added to hotel successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một tiện nghi khỏi khách sạn.
     * DELETE /api/v1/hotels/:hotelId/amenities/:amenityId
     */
    async removeAmenityFromHotel(req, res, next) {
        try {
            const { hotelId, amenityId } = req.params;
            const userId = req.user.id;
            await HotelAmenityService.removeAmenityFromHotel(hotelId, amenityId, userId);
            successResponse(res, null, 'Amenity removed from hotel successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách tiện nghi của một khách sạn.
     * GET /api/v1/hotels/:hotelId/amenities
     */
    async getAmenitiesForHotel(req, res, next) {
        try {
            const { hotelId } = req.params;
            const amenities = await HotelAmenityService.getAmenitiesForHotel(hotelId);
            successResponse(res, amenities);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new HotelAmenityController();