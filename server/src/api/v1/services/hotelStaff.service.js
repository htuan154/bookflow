// src/api/v1/services/hotelStaff.service.js

const hotelStaffRepository = require('../repositories/hotelStaff.repository');
const hotelRepository = require('../repositories/hotel.repository');
const userRepository = require('../repositories/user.repository');
const { AppError } = require('../../../utils/errors');

class HotelStaffService {
    /**
     * Thêm một nhân viên mới vào khách sạn (tự động tạo user).
     * @param {string} hotelId - ID của khách sạn.
     * @param {object} staffData - Dữ liệu của nhân viên và user.
     * @param {string} ownerId - ID của người thực hiện (chủ khách sạn).
     * @returns {Promise<{user: User, staff: HotelStaff}>}
     */
    async addNewStaffToHotel(hotelId, staffData, ownerId) {
        // 1. Kiểm tra khách sạn có tồn tại và thuộc sở hữu của người dùng không
        const hotel = await hotelRepository.findById(hotelId);
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to manage staff for this hotel', 403);
        }

        // 2. Validate dữ liệu đầu vào
        const requiredFields = ['username', 'email', 'password', 'full_name', 'job_position', 'start_date'];
        for (const field of requiredFields) {
            if (!staffData[field]) {
                throw new AppError(`Field ${field} is required`, 400);
            }
        }

        // 3. Kiểm tra email và username đã tồn tại chưa
        const existingUser = await userRepository.findByEmailOrUsername(staffData.email, staffData.username);
        if (existingUser) {
            throw new AppError('Email or username already exists', 409);
        }

        const fullStaffData = {
            ...staffData,
            hotel_id: hotelId,
            hired_by: ownerId,
        };

        try {
            return await hotelStaffRepository.addStaff(fullStaffData);
        } catch (error) {
            if (error.message.includes('Email hoặc username đã tồn tại')) {
                throw new AppError('Email or username already exists', 409);
            }
            throw error;
        }
    }

    /**
     * Thêm một user đã tồn tại làm nhân viên khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @param {object} staffData - Dữ liệu của nhân viên (chứa user_id).
     * @param {string} ownerId - ID của người thực hiện.
     * @returns {Promise<HotelStaff>}
     */
    async addExistingUserToHotel(hotelId, staffData, ownerId) {
        // 1. Kiểm tra khách sạn có tồn tại và thuộc sở hữu của người dùng không
        const hotel = await hotelRepository.findById(hotelId);
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to manage staff for this hotel', 403);
        }

        // 2. Validate dữ liệu đầu vào
        const requiredFields = ['user_id', 'job_position', 'start_date'];
        for (const field of requiredFields) {
            if (!staffData[field]) {
                throw new AppError(`Field ${field} is required`, 400);
            }
        }

        // 3. Kiểm tra xem user được thêm làm nhân viên có tồn tại không
        const userToAdd = await userRepository.findById(staffData.user_id);
        if (!userToAdd) {
            throw new AppError('User to be added as staff not found', 404);
        }

        // 4. Kiểm tra xem user này đã là nhân viên của khách sạn chưa
        const existingStaff = await hotelStaffRepository.findByHotelId(hotelId);
        const isAlreadyStaff = existingStaff.some(item => item.staff.userId === staffData.user_id);
        if (isAlreadyStaff) {
            throw new AppError('This user is already a staff member of this hotel', 409);
        }

        const fullStaffData = {
            ...staffData,
            hotel_id: hotelId,
            hired_by: ownerId,
        };

        return await hotelStaffRepository.addExistingUserAsStaff(fullStaffData);
    }

    /**
     * Lấy danh sách nhân viên của một khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @param {string} [ownerId] - ID của người yêu cầu (để kiểm tra quyền nếu cần).
     * @returns {Promise<Array>}
     */
    async getStaffForHotel(hotelId, ownerId = null) {
        // // Nếu có ownerId thì kiểm tra quyền
        // if (ownerId) {
        //     const hotel = await hotelRepository.findById(hotelId);
        //     if (!hotel) {
        //         throw new AppError('Hotel not found', 404);
        //     }
        //     if (hotel.ownerId !== ownerId) {
        //         throw new AppError('Forbidden: You do not have permission to view staff for this hotel', 403);
        //     }
        // }

        return await hotelStaffRepository.findByHotelId(hotelId);
    }

    /**
     * Lấy thông tin chi tiết một nhân viên.
     * @param {string} staffId - ID của nhân viên.
     * @param {string} ownerId - ID của người yêu cầu.
     * @returns {Promise<object>}
     */
    async getStaffById(staffId, ownerId) {
        const staffInfo = await hotelStaffRepository.findById(staffId);
        if (!staffInfo) {
            throw new AppError('Staff member not found', 404);
        }

        // Kiểm tra quyền sở hữu
        const hotel = await hotelRepository.findById(staffInfo.staff.hotelId);
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to view this staff member', 403);
        }

        return staffInfo;
    }

    /**
     * Cập nhật thông tin nhân viên.
     * @param {string} staffId - ID của nhân viên.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @param {string} ownerId - ID của người thực hiện.
     * @returns {Promise<HotelStaff>}
     */
    async updateStaffInfo(staffId, updateData, ownerId) {
        const staffInfo = await hotelStaffRepository.findById(staffId);
        if (!staffInfo) {
            throw new AppError('Staff member not found', 404);
        }

        // Kiểm tra quyền sở hữu
        const hotel = await hotelRepository.findById(staffInfo.staff.hotelId);
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to update this staff member', 403);
        }

        // Validate trạng thái nếu có
        if (updateData.status && !['active', 'inactive', 'suspended', 'terminated'].includes(updateData.status)) {
            throw new AppError('Invalid status. Must be one of: active, inactive, suspended, terminated', 400);
        }

        return await hotelStaffRepository.updateStaff(staffId, updateData);
    }

    /**
     * Xóa (sa thải) một nhân viên (chỉ xóa khỏi hotel_staff).
     * @param {string} staffId - ID của nhân viên.
     * @param {string} ownerId - ID của người thực hiện.
     * @returns {Promise<void>}
     */
    async removeStaffFromHotel(staffId, ownerId) {
        const staffInfo = await hotelStaffRepository.findById(staffId);
        if (!staffInfo) {
            throw new AppError('Staff member not found', 404);
        }

        // Kiểm tra quyền sở hữu
        const hotel = await hotelRepository.findById(staffInfo.staff.hotelId);
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to remove this staff member', 403);
        }

        const isRemoved = await hotelStaffRepository.removeStaff(staffId);
        if (!isRemoved) {
            throw new AppError('Failed to remove staff member', 500);
        }
    }

    /**
     * Xóa nhân viên và user liên quan (sử dụng cẩn thận).
     * @param {string} staffId - ID của nhân viên.
     * @param {string} ownerId - ID của người thực hiện.
     * @returns {Promise<void>}
     */
    async removeStaffAndUser(staffId, ownerId) {
        const staffInfo = await hotelStaffRepository.findById(staffId);
        if (!staffInfo) {
            throw new AppError('Staff member not found', 404);
        }

        // Kiểm tra quyền sở hữu
        const hotel = await hotelRepository.findById(staffInfo.staff.hotelId);
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to remove this staff member', 403);
        }

        try {
            await hotelStaffRepository.removeStaffAndUser(staffId);
        } catch (error) {
            throw new AppError('Failed to remove staff member and user account', 500);
        }
    }

    /**
     * Thống kê nhân viên theo khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @param {string} ownerId - ID của người yêu cầu.
     * @returns {Promise<object>}
     */
    async getStaffStatistics(hotelId, ownerId) {
        // Kiểm tra quyền
        const hotel = await hotelRepository.findById(hotelId);
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to view statistics for this hotel', 403);
        }

        const staffList = await hotelStaffRepository.findByHotelId(hotelId);
        
        const stats = {
            total: staffList.length,
            active: staffList.filter(item => item.staff.status === 'active').length,
            inactive: staffList.filter(item => item.staff.status === 'inactive').length,
            suspended: staffList.filter(item => item.staff.status === 'suspended').length,
            byPosition: {}
        };

        // Thống kê theo vị trí
        staffList.forEach(item => {
            const position = item.staff.jobPosition;
            if (stats.byPosition[position]) {
                stats.byPosition[position]++;
            } else {
                stats.byPosition[position] = 1;
            }
        });

        return stats;
    }

    /**
     * Lấy tất cả staff record của một user (ở tất cả khách sạn)
     * @param {string} userId
     * @returns {Promise<HotelStaff[]>}
     */
    async getStaffByUserId(userId) {
        return await hotelStaffRepository.findByUserId(userId);
    }

}

module.exports = new HotelStaffService();