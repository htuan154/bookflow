// src/api/v1/services/hotelStaff.service.js

const hotelStaffRepository = require('../repositories/hotelStaff.repository');
const hotelRepository = require('../repositories/hotel.repository'); // Giả định đã có
const userRepository = require('../repositories/user.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class HotelStaffService {
    /**
     * Thêm một nhân viên mới vào khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @param {object} staffData - Dữ liệu của nhân viên.
     * @param {string} ownerId - ID của người thực hiện (chủ khách sạn).
     * @returns {Promise<HotelStaff>}
     */
    async addStaffToHotel(hotelId, staffData, ownerId) {
        // --- Kiểm tra nghiệp vụ ---
        // 1. Kiểm tra khách sạn có tồn tại và thuộc sở hữu của người dùng không.
        const hotel = await hotelRepository.findById(hotelId);
        if (!hotel || hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to manage staff for this hotel', 403);
        }

        // 2. Kiểm tra xem user được thêm làm nhân viên có tồn tại không.
        const userToAdd = await userRepository.findById(staffData.user_id);
        if (!userToAdd) {
            throw new AppError('User to be added as staff not found', 404);
        }

        // TODO: Kiểm tra xem user này đã là nhân viên của khách sạn chưa.

        const fullStaffData = {
            ...staffData,
            hotel_id: hotelId,
            hired_by: ownerId,
        };

        return await hotelStaffRepository.addStaff(fullStaffData);
    }

    /**
     * Lấy danh sách nhân viên của một khách sạn.
     * @param {string} hotelId - ID của khách sạn.
     * @returns {Promise<HotelStaff[]>}
     */
    async getStaffForHotel(hotelId) {
        return await hotelStaffRepository.findByHotelId(hotelId);
    }

    /**
     * Cập nhật thông tin nhân viên.
     * @param {string} staffId - ID của nhân viên.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @param {string} ownerId - ID của người thực hiện.
     * @returns {Promise<HotelStaff>}
     */
    async updateStaffInfo(staffId, updateData, ownerId) {
        const staffMember = await hotelStaffRepository.findById(staffId);
        if (!staffMember) {
            throw new AppError('Staff member not found', 404);
        }

        // Kiểm tra quyền sở hữu
        const hotel = await hotelRepository.findById(staffMember.hotelId);
        if (hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to update this staff member', 403);
        }

        return await hotelStaffRepository.updateStaff(staffId, updateData);
    }

    /**
     * Xóa (sa thải) một nhân viên.
     * @param {string} staffId - ID của nhân viên.
     * @param {string} ownerId - ID của người thực hiện.
     * @returns {Promise<void>}
     */
    async removeStaffFromHotel(staffId, ownerId) {
        // Kiểm tra quyền sở hữu tương tự như hàm update
        const staffMember = await hotelStaffRepository.findById(staffId);
        if (!staffMember) {
            throw new AppError('Staff member not found', 404);
        }
        const hotel = await hotelRepository.findById(staffMember.hotelId);
        if (hotel.ownerId !== ownerId) {
            throw new AppError('Forbidden: You do not have permission to remove this staff member', 403);
        }

        const isRemoved = await hotelStaffRepository.removeStaff(staffId);
        if (!isRemoved) {
            throw new AppError('Failed to remove staff member', 500);
        }
    }
}

module.exports = new HotelStaffService();