import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const staffApiService = {
    /**
     * Lấy danh sách nhân viên của khách sạn
     * @param {string} hotelId - ID khách sạn
     * @returns {Promise} Response với danh sách staff
     */
    async getHotelStaff(hotelId) {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.STAFF.GET_HOTEL_STAFF(hotelId));
            return response.data;
        } catch (error) {
            console.error('Error fetching hotel staff:', error);
            throw error;
        }
    },

    /**
     * Thêm nhân viên mới
     * @param {Object} staffData - Thông tin nhân viên
     * @returns {Promise} Response với thông tin staff được tạo
     */
    async createStaff(staffData) {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.STAFF.CREATE, staffData);
            return response.data;
        } catch (error) {
            console.error('Error creating staff:', error);
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
     * Xóa nhân viên
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
     * Cập nhật trạng thái nhân viên
     * @param {string} staffId - ID nhân viên
     * @param {string} status - Trạng thái mới (active/inactive)
     * @returns {Promise} Response xác nhận cập nhật
     */
    async updateStaffStatus(staffId, status) {
        try {
            const response = await axiosClient.patch(API_ENDPOINTS.STAFF.UPDATE_STATUS(staffId), { status });
            return response.data;
        } catch (error) {
            console.error('Error updating staff status:', error);
            throw error;
        }
    }
};