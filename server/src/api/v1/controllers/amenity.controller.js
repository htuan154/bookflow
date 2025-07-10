// src/api/v1/controllers/amenity.controller.js

const AmenityService = require('../services/amenity.service');
const { successResponse } = require('../../../utils/response');

class AmenityController {
    /**
     * Lấy tất cả các tiện nghi.
     * GET /api/v1/amenities
     */
    async getAllAmenities(req, res, next) {
        try {
            const amenities = await AmenityService.getAllAmenities();
            successResponse(res, amenities, 'Lấy danh sách tiện nghi thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo một tiện nghi mới.
     * POST /api/v1/amenities
     */
    async createAmenity(req, res, next) {
        try {
            const newAmenity = await AmenityService.createAmenity(req.body);
            successResponse(res, newAmenity, 'Tạo tiện nghi mới thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật một tiện nghi.
     * PUT /api/v1/amenities/:id
     */
    async updateAmenity(req, res, next) {
        try {
            const { id } = req.params;
            const updatedAmenity = await AmenityService.updateAmenity(id, req.body);
            successResponse(res, updatedAmenity, 'Cập nhật tiện nghi thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một tiện nghi.
     * DELETE /api/v1/amenities/:id
     */
    async deleteAmenity(req, res, next) {
        try {
            const { id } = req.params;
            await AmenityService.deleteAmenity(id);
            successResponse(res, null, 'Xóa tiện nghi thành công');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AmenityController();
