// src/api/v1/controllers/touristLocation.controller.js

const TouristLocationService = require('../services/touristLocation.service');
const { successResponse } = require('../../../utils/response');

class TouristLocationController {
    /**
     * Lấy tất cả các địa điểm du lịch.
     * GET /api/v1/tourist-locations
     */
    async getAllLocations(req, res, next) {
        try {
            const locations = await TouristLocationService.getAllLocations();
            successResponse(res, locations, 'Lấy danh sách địa điểm du lịch thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy các địa điểm du lịch theo thành phố.
     * GET /api/v1/tourist-locations/city/:city
     */
    async getLocationsByCity(req, res, next) {
        try {
            const { city } = req.params;
            const locations = await TouristLocationService.getLocationsByCity(city);
            successResponse(res, locations);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tạo một địa điểm du lịch mới (chỉ Admin).
     * POST /api/v1/tourist-locations
     */
    async createLocation(req, res, next) {
        try {
            const adminId = req.user.userId; // Lấy từ middleware 'authenticate'
            // Đảm bảo req.body có latitude, longitude
            // (Đã validate ở validator, chỉ cần truyền qua service)
            const newLocation = await TouristLocationService.createLocation(req.body, adminId);
            successResponse(res, newLocation, 'Tạo địa điểm du lịch mới thành công', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật một địa điểm du lịch (chỉ Admin).
     * PUT /api/v1/tourist-locations/:id
     */
    async updateLocation(req, res, next) {
        try {
            const { id } = req.params;
            // req.body có thể có latitude, longitude (validator đã kiểm tra)
            const updatedLocation = await TouristLocationService.updateLocation(id, req.body);
            successResponse(res, updatedLocation, 'Cập nhật địa điểm du lịch thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một địa điểm du lịch (chỉ Admin).
     * DELETE /api/v1/tourist-locations/:id
     */
    async deleteLocation(req, res, next) {
        try {
            const { id } = req.params;
            await TouristLocationService.deleteLocation(id);
            successResponse(res, null, 'Xóa địa điểm du lịch thành công');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy các địa điểm du lịch theo đúng tên thành phố (phân biệt hoa thường, hỗ trợ tiếng Việt).
     * GET /api/v1/tourist-locations/city-vn/:city
     */
    async getLocationsByCityVn(req, res, next) {
        try {
            const { city } = req.params;
            const locations = await TouristLocationService.getLocationsByCityVn(city);
            successResponse(res, locations);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy 10 địa điểm du lịch gần nhất theo vị trí (lat, lng).
     * GET /api/v1/tourist-locations/nearest?lat=...&lng=...
     */
    async getNearestLocations(req, res, next) {
        try {
            const lat = parseFloat(req.query.lat);
            const lng = parseFloat(req.query.lng);
            const locations = await TouristLocationService.getNearestLocations(lat, lng);
            successResponse(res, locations);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TouristLocationController();
