import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const staffApiService = {
    // ==========================================================================
    // --- HOTEL-SPECIFIC STAFF OPERATIONS ---
    // ==========================================================================

    /**
     * Lấy danh sách nhân viên của khách sạn
     * @param {string} hotelId - ID khách sạn
     * @param {Object} params - Query parameters (page, limit, sort, etc.)
     * @returns {Promise} Response với danh sách staff
     */
    async getHotelStaff(hotelId, params = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.STAFF.GET_HOTEL_STAFF(hotelId), {
                params
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching hotel staff:', error);
            throw error;
        }
    },

    /**
     * Tìm kiếm nhân viên trong khách sạn
     * @param {string} hotelId - ID khách sạn
     * @param {Object} searchParams - Query parameters (q, position, status)
     * @returns {Promise} Response với kết quả tìm kiếm
     */
    async searchStaff(hotelId, searchParams = {}) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.STAFF.SEARCH_STAFF(hotelId), {
                params: searchParams
            });
            return response.data;
        } catch (error) {
            console.error('Error searching staff:', error);
            throw error;
        }
    },

    /**
     * Lấy thống kê nhân viên của khách sạn
     * @param {string} hotelId - ID khách sạn
     * @returns {Promise} Response với thống kê staff
     */
    async getStaffStatistics(hotelId) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.STAFF.GET_STAFF_STATISTICS(hotelId));
            return response.data;
        } catch (error) {
            console.error('Error fetching staff statistics:', error);
            throw error;
        }
    },

    // ==========================================================================
    // --- ADD STAFF OPERATIONS ---
    // ==========================================================================

    /**
     * ⭐ MAIN METHOD: Tạo nhân viên mới kèm tài khoản user (RECOMMENDED)
     * @param {string} hotelId - ID khách sạn
     * @param {Object} staffData - Thông tin nhân viên và user
     * @returns {Promise} Response với thông tin staff được tạo
     */
    async createStaff(hotelId, staffData) {
        try {
            // Sử dụng endpoint chuyên biệt để tạo nhân viên + tài khoản mới
            const response = await axiosClient.post(
                API_ENDPOINTS.STAFF.ADD_NEW_STAFF(hotelId),
                staffData
            );
            return response.data;
        } catch (error) {
            console.error('Error creating new staff with account:', error);
            throw error;
        }
    },

    /**
     * Thêm nhân viên (auto-detect method)
     * @param {string} hotelId - ID khách sạn
     * @param {Object} staffData - Thông tin nhân viên
     * @returns {Promise} Response với thông tin staff được tạo
     */
    async addStaff(hotelId, staffData) {
        try {
            const response = await axiosClient.post(
                API_ENDPOINTS.STAFF.ADD_STAFF(hotelId), 
                staffData
            );
            return response.data;
        } catch (error) {
            console.error('Error adding staff (auto-detect):', error);
            throw error;
        }
    },

    /**
     * Tạo nhân viên mới kèm tài khoản user (Alternative method)
     * @param {string} hotelId - ID khách sạn
     * @param {Object} staffData - Thông tin nhân viên và user
     * @returns {Promise} Response với thông tin staff được tạo
     */
    async addNewStaff(hotelId, staffData) {
        try {
            const response = await axiosClient.post(
                API_ENDPOINTS.STAFF.ADD_NEW_STAFF(hotelId),
                staffData
            );
            return response.data;
        } catch (error) {
            console.error('Error adding new staff:', error);
            throw error;
        }
    },

    /**
     * Thêm user đã tồn tại làm nhân viên
     * @param {string} hotelId - ID khách sạn
     * @param {Object} staffData - Thông tin nhân viên (bao gồm user_id)
     * @returns {Promise} Response với thông tin staff được tạo
     */
    async addExistingUserAsStaff(hotelId, staffData) {
        try {
            const response = await axiosClient.post(
                API_ENDPOINTS.STAFF.ADD_EXISTING_USER_AS_STAFF(hotelId),
                staffData
            );
            return response.data;
        } catch (error) {
            console.error('Error adding existing user as staff:', error);
            throw error;
        }
    },

    /**
     * Thêm nhiều nhân viên cùng lúc (bulk operation)
     * @param {string} hotelId - ID khách sạn
     * @param {Array} staffList - Danh sách thông tin nhân viên
     * @returns {Promise} Response với kết quả bulk operation
     */
    async bulkAddStaff(hotelId, staffList) {
        try {
            const response = await axiosClient.post(
                API_ENDPOINTS.STAFF.BULK_ADD_STAFF(hotelId),
                { staff_list: staffList }
            );
            return response.data;
        } catch (error) {
            console.error('Error bulk adding staff:', error);
            throw error;
        }
    },

    // ==========================================================================
    // --- INDIVIDUAL STAFF OPERATIONS ---
    // ==========================================================================

    /**
     * Lấy thông tin nhân viên theo ID
     * @param {string} staffId - ID nhân viên
     * @returns {Promise} Response với thông tin staff
     */
    async getStaffById(staffId) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.STAFF.GET_BY_ID(staffId));
            return response.data;
        } catch (error) {
            console.error('Error fetching staff by ID:', error);
            throw error;
        }
    },

    /**
     * Cập nhật thông tin nhân viên
     * @param {string} staffId - ID nhân viên
     * @param {Object} staffData - Dữ liệu cập nhật
     * @returns {Promise} Response với thông tin staff đã cập nhật
     */
    async updateStaff(staffId, staffData) {
        try {
            const response = await axiosClient.put(API_ENDPOINTS.STAFF.UPDATE(staffId), staffData);
            return response.data;
        } catch (error) {
            console.error('Error updating staff:', error);
            throw error;
        }
    },

    /**
     * Xóa nhân viên (soft delete - chỉ remove khỏi hotel)
     * @param {string} staffId - ID nhân viên
     * @returns {Promise} Response xác nhận xóa
     */
    async deleteStaff(staffId) {
        try {
            const response = await axiosClient.delete(API_ENDPOINTS.STAFF.DELETE(staffId));
            return response.data;
        } catch (error) {
            console.error('Error deleting staff:', error);
            throw error;
        }
    },

    /**
     * Xóa nhân viên và user account vĩnh viễn (admin only)
     * @param {string} staffId - ID nhân viên
     * @param {string} confirmationText - Text xác nhận "DELETE_USER_ACCOUNT"
     * @returns {Promise} Response xác nhận xóa vĩnh viễn
     */
    async deleteStaffPermanently(staffId, confirmationText = "DELETE_USER_ACCOUNT") {
        try {
            const response = await axiosClient.delete(
                API_ENDPOINTS.STAFF.DELETE_PERMANENT(staffId),
                {
                    data: { confirm: confirmationText }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error permanently deleting staff:', error);
            throw error;
        }
    },

    // ==========================================================================
    // --- UTILITY METHODS ---
    // ==========================================================================

    /**
     * Cập nhật trạng thái nhân viên
     * @param {string} staffId - ID nhân viên
     * @param {string} status - Trạng thái mới (active/inactive/suspended/terminated)
     * @returns {Promise} Response xác nhận cập nhật
     */
    async updateStaffStatus(staffId, status) {
        try {
            const response = await axiosClient.patch(API_ENDPOINTS.STAFF.UPDATE(staffId), { 
                status
            });
            return response.data;
        } catch (error) {
            console.error('Error updating staff status:', error);
            throw error;
        }
    },

    /**
     * Cập nhật vị trí/chức vụ nhân viên
     * @param {string} staffId - ID nhân viên
     * @param {string} position - Chức vụ mới
     * @returns {Promise} Response xác nhận cập nhật
     */
    async updateStaffPosition(staffId, position) {
        try {
            const response = await axiosClient.patch(API_ENDPOINTS.STAFF.UPDATE(staffId), { 
                position
            });
            return response.data;
        } catch (error) {
            console.error('Error updating staff position:', error);
            throw error;
        }
    },

    /**
     * Cập nhật lương nhân viên
     * @param {string} staffId - ID nhân viên
     * @param {number} salary - Lương mới
     * @returns {Promise} Response xác nhận cập nhật
     */
    async updateStaffSalary(staffId, salary) {
        try {
            const response = await axiosClient.patch(API_ENDPOINTS.STAFF.UPDATE(staffId), { 
                salary
            });
            return response.data;
        } catch (error) {
            console.error('Error updating staff salary:', error);
            throw error;
        }
    },

    /**
     * Lấy tất cả staff record của một user (ở tất cả khách sạn)
     * @param {string} userId - ID user
     * @returns {Promise} Response với danh sách staff
     */
    async getStaffByUserId(userId) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.STAFF.GET_BY_USER_ID(userId));
            return response.data;
        } catch (error) {
            console.error('Error fetching staff by userId:', error);
            throw error;
        }
    }
};
