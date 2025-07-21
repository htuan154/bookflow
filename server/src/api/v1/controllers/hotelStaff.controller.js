// src/api/v1/controllers/hotelStaff.controller.js

const HotelStaffService = require('../services/hotelStaff.service');
const { successResponse } = require('../../../utils/response');

class HotelStaffController {
    /**
     * Thêm một nhân viên mới vào khách sạn.
     * POST /api/v1/hotels/:hotelId/staff
     */
    async addStaff(req, res, next) {
        try {
            const { hotelId } = req.params;
            const ownerId = req.user.id; // Lấy từ middleware 'authenticate'
            const newStaff = await HotelStaffService.addStaffToHotel(hotelId, req.body, ownerId);
            successResponse(res, newStaff, 'Staff member added successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách nhân viên của một khách sạn.
     * GET /api/v1/hotels/:hotelId/staff
     */
    async getStaff(req, res, next) {
        try {
            const { hotelId } = req.params;
            const staffList = await HotelStaffService.getStaffForHotel(hotelId);
            successResponse(res, staffList);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin một nhân viên.
     * PUT /api/v1/staff/:staffId
     */
    async updateStaff(req, res, next) {
        try {
            const { staffId } = req.params;
            const ownerId = req.user.id;
            const updatedStaff = await HotelStaffService.updateStaffInfo(staffId, req.body, ownerId);
            successResponse(res, updatedStaff, 'Staff information updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa (sa thải) một nhân viên.
     * DELETE /api/v1/staff/:staffId
     */
    async removeStaff(req, res, next) {
        try {
            const { staffId } = req.params;
            const ownerId = req.user.id;
            await HotelStaffService.removeStaffFromHotel(staffId, ownerId);
            successResponse(res, null, 'Staff member removed successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new HotelStaffController();