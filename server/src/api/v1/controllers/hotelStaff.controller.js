// src/api/v1/controllers/hotelStaff.controller.js

const HotelStaffService = require('../services/hotelStaff.service');
const { successResponse } = require('../../../utils/response');
const { AppError } = require('../../../utils/errors');

class HotelStaffController {
    /**
     * Lấy tất cả staff record của một user (ở tất cả khách sạn)
     * GET /api/v1/staff/user/:userId
     */
    async getStaffByUserId(req, res, next) {
        try {
            const { userId } = req.params;
            const staffList = await HotelStaffService.getStaffByUserId(userId);
            successResponse(res, staffList, 'Staff records by user_id retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Thêm một nhân viên mới vào khách sạn (tự động tạo user).
     * POST /api/v1/hotels/:hotelId/staff/new
     */
    async addNewStaff(req, res, next) {
        try {
            const { hotelId } = req.params;
            const ownerId = req.user.id;
            
            // Validate request body
            const requiredFields = ['username', 'email', 'password', 'full_name', 'job_position', 'start_date'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return next(new AppError(`Field ${field} is required`, 400));
                }
            }

            const result = await HotelStaffService.addNewStaffToHotel(hotelId, req.body, ownerId);
            successResponse(res, result, 'New staff member added successfully with user account created', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thêm user đã tồn tại làm nhân viên khách sạn.
     * POST /api/v1/hotels/:hotelId/staff/existing
     */
    async addExistingUserAsStaff(req, res, next) {
        try {
            const { hotelId } = req.params;
            const ownerId = req.user.id;
            
            // Validate request body
            const requiredFields = ['user_id', 'job_position', 'start_date'];
            for (const field of requiredFields) {
                if (!req.body[field]) {
                    return next(new AppError(`Field ${field} is required`, 400));
                }
            }

            const newStaff = await HotelStaffService.addExistingUserToHotel(hotelId, req.body, ownerId);
            successResponse(res, newStaff, 'Existing user added as staff member successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Thêm nhân viên (method tổng hợp - backward compatibility).
     * POST /api/v1/hotels/:hotelId/staff
     */
    async addStaff(req, res, next) {
        try {
            const { hotelId } = req.params;
            const ownerId = req.user.id;
            
            // Nếu có user_id thì thêm user đã tồn tại, ngược lại tạo user mới
            if (req.body.user_id) {
                const newStaff = await HotelStaffService.addExistingUserToHotel(hotelId, req.body, ownerId);
                successResponse(res, newStaff, 'Existing user added as staff member successfully', 201);
            } else {
                // Validate cho tạo user mới
                const requiredFields = ['username', 'email', 'password', 'full_name', 'job_position', 'start_date'];
                for (const field of requiredFields) {
                    if (!req.body[field]) {
                        return next(new AppError(`Field ${field} is required`, 400));
                    }
                }
                
                const result = await HotelStaffService.addNewStaffToHotel(hotelId, req.body, ownerId);
                successResponse(res, result, 'New staff member added successfully with user account created', 201);
            }
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
            const ownerId = req.user?.id; // Optional để cho phép public access nếu cần
            
            const staffList = await HotelStaffService.getStaffForHotel(hotelId, ownerId);
            successResponse(res, staffList, 'Staff list retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy thông tin chi tiết một nhân viên.
     * GET /api/v1/staff/:staffId
     */
    async getStaffById(req, res, next) {
        try {
            const { staffId } = req.params;
            const ownerId = req.user.id;
            
            const staffInfo = await HotelStaffService.getStaffById(staffId, ownerId);
            successResponse(res, staffInfo, 'Staff information retrieved successfully');
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
            
            // Validate trạng thái nếu có
            if (req.body.status && !['active', 'inactive', 'suspended', 'terminated'].includes(req.body.status)) {
                return next(new AppError('Invalid status. Must be one of: active, inactive, suspended, terminated', 400));
            }
            
            const updatedStaff = await HotelStaffService.updateStaffInfo(staffId, req.body, ownerId);
            successResponse(res, updatedStaff, 'Staff information updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa (sa thải) một nhân viên (chỉ xóa khỏi hotel_staff).
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

    /**
     * Xóa nhân viên và user liên quan (sử dụng cẩn thận).
     * DELETE /api/v1/staff/:staffId/permanent
     */
    async removeStaffPermanently(req, res, next) {
        try {
            const { staffId } = req.params;
            const ownerId = req.user.id;
            
            // Thêm confirmation check
            if (!req.body.confirm || req.body.confirm !== 'DELETE_USER_ACCOUNT') {
                return next(new AppError('This action requires confirmation. Please set confirm: "DELETE_USER_ACCOUNT" in request body', 400));
            }
            
            await HotelStaffService.removeStaffAndUser(staffId, ownerId);
            successResponse(res, null, 'Staff member and user account removed permanently');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy thống kê nhân viên của khách sạn.
     * GET /api/v1/hotels/:hotelId/staff/statistics
     */
    async getStaffStatistics(req, res, next) {
        try {
            const { hotelId } = req.params;
            const ownerId = req.user.id;
            
            const stats = await HotelStaffService.getStaffStatistics(hotelId, ownerId);
            successResponse(res, stats, 'Staff statistics retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk operations - Thêm nhiều nhân viên cùng lúc.
     * POST /api/v1/hotels/:hotelId/staff/bulk
     */
    async bulkAddStaff(req, res, next) {
        try {
            const { hotelId } = req.params;
            const ownerId = req.user.id;
            const { staffList } = req.body;
            
            if (!Array.isArray(staffList) || staffList.length === 0) {
                return next(new AppError('staffList must be a non-empty array', 400));
            }

            const results = [];
            const errors = [];

            for (let i = 0; i < staffList.length; i++) {
                try {
                    const staffData = staffList[i];
                    
                    // Validate required fields
                    const requiredFields = ['username', 'email', 'password', 'full_name', 'job_position', 'start_date'];
                    for (const field of requiredFields) {
                        if (!staffData[field]) {
                            throw new Error(`Field ${field} is required`);
                        }
                    }
                    
                    const result = await HotelStaffService.addNewStaffToHotel(hotelId, staffData, ownerId);
                    results.push({ index: i, success: true, data: result });
                } catch (error) {
                    errors.push({ index: i, success: false, error: error.message, data: staffList[i] });
                }
            }

            const response = {
                totalProcessed: staffList.length,
                successful: results.length,
                failed: errors.length,
                results: results,
                errors: errors
            };

            successResponse(res, response, 'Bulk staff addition completed', 200);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tìm kiếm nhân viên.
     * GET /api/v1/hotels/:hotelId/staff/search
     */
    async searchStaff(req, res, next) {
        try {
            const { hotelId } = req.params;
            const ownerId = req.user.id;
            const { q, position, status } = req.query;
            
            let staffList = await HotelStaffService.getStaffForHotel(hotelId, ownerId);
            
            // Filter by search query
            if (q) {
                const searchTerm = q.toLowerCase();
                staffList = staffList.filter(item => 
                    item.user.full_name.toLowerCase().includes(searchTerm) ||
                    item.user.email.toLowerCase().includes(searchTerm) ||
                    item.user.username.toLowerCase().includes(searchTerm) ||
                    item.staff.jobPosition.toLowerCase().includes(searchTerm)
                );
            }
            
            // Filter by position
            if (position) {
                staffList = staffList.filter(item => 
                    item.staff.jobPosition.toLowerCase().includes(position.toLowerCase())
                );
            }
            
            // Filter by status
            if (status) {
                staffList = staffList.filter(item => item.staff.status === status);
            }
            
            successResponse(res, staffList, 'Staff search completed successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new HotelStaffController();