// src/api/user.service.js

import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const userService = {
    /**
     * Lấy danh sách tất cả người dùng (Admin only)
     * @param {Object} params - Query parameters (page, limit, search, role, status)
     * @returns {Promise} Response data
     */
    getAllUsers: async (params = {}) => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_ALL, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    /**
     * Lấy thông tin chi tiết một người dùng
     * @param {string} userId - ID của người dùng
     * @returns {Promise} User data
     */
    getUserById: async (userId) => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_BY_ID(userId));
            return response.data;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    },

    /**
     * Cập nhật thông tin người dùng
     * @param {string} userId - ID của người dùng
     * @param {Object} userData - Dữ liệu cập nhật
     * @returns {Promise} Updated user data
     */
    updateUser: async (userId, userData) => {
        try {
            const response = await axiosClient.patch(API_ENDPOINTS.USERS.UPDATE(userId), userData);
            return response.data;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    /**
     * Xóa người dùng
     * @param {string} userId - ID của người dùng
     * @returns {Promise} Response data
     */
    deleteUser: async (userId) => {
        try {
            const response = await axiosClient.delete(API_ENDPOINTS.USERS.DELETE(userId));
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    /**
     * Cập nhật trạng thái người dùng (active/inactive)
     * @param {string} userId - ID của người dùng
     * @param {string} status - Trạng thái mới (active/inactive)
     * @returns {Promise} Updated user data
     */
    updateUserStatus: async (userId, status) => {
        try {
            const response = await axiosClient.patch(API_ENDPOINTS.USERS.UPDATE(userId), { status });
            return response.data;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    },

    /**
     * Cập nhật vai trò người dùng
     * @param {string} userId - ID của người dùng
     * @param {string} role - Vai trò mới (admin, hotel_owner, customer)
     * @returns {Promise} Updated user data
     */
    updateUserRole: async (userId, role) => {
        try {
            const response = await axiosClient.patch(API_ENDPOINTS.USERS.UPDATE(userId), { role });
            return response.data;
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    }
};

export default userService;