// src/api/customer.service.js

import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const customerService = {
    /**
     * Lấy danh sách chủ khách sạn (hotel owners)
     * @param {Object} params - Query parameters (page, limit, search, status)
     * @returns {Promise} Response data
     */
    getHotelOwners: async (params = {}) => {
        try {
            // ✅ FIXED: Sử dụng endpoint đúng cho hotel owners
            const queryParams = {
                ...params,
                roleId: 2, // Thêm roleId để filter
                role: 'hotel_owner'
            };
            
            const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_HOTEL_OWNERS, { 
                params: queryParams 
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching hotel owners:', error);
            throw error;
        }
    },

    /**
     * Lấy danh sách khách hàng theo role
     * @param {string} role - Role của khách hàng (hotel_owner, customer, etc.)
     * @param {Object} params - Query parameters khác
     * @returns {Promise} Response data
     */
    getCustomersByRole: async (role, params = {}) => {
        try {
            const queryParams = {
                ...params,
                role: role,
                roleId: role === 'hotel_owner' ? 2 : params.roleId
            };
            
            const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_ALL, { 
                params: queryParams 
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching customers by role ${role}:`, error);
            throw error;
        }
    },

    /**
     * Lấy thông tin chi tiết một khách hàng
     * @param {string} customerId - ID của khách hàng
     * @returns {Promise} Customer data
     */
    getCustomerById: async (customerId) => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_BY_ID(customerId));
            return response.data;
        } catch (error) {
            console.error('Error fetching customer:', error);
            throw error;
        }
    },

    /**
     * Tạo khách hàng mới
     * @param {Object} customerData - Dữ liệu khách hàng mới
     * @returns {Promise} Created customer data
     */
    createCustomer: async (customerData) => {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.USERS.CREATE, customerData);
            return response.data;
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    },

    /**
     * ✅ FIXED: Tạo hotel owner mới - sử dụng đúng endpoint
     * @param {Object} hotelOwnerData - Dữ liệu hotel owner mới
     * @returns {Promise} Created hotel owner data
     */
    createHotelOwner: async (hotelOwnerData) => {
        try {
            console.log('createHotelOwner received data:', hotelOwnerData);
            
            // Chuẩn bị dữ liệu theo format backend mong đợi
            const requestData = {
                username: hotelOwnerData.username,
                email: hotelOwnerData.email,
                password: hotelOwnerData.password,
                fullName: hotelOwnerData.fullName,
                roleId: 2, // Hotel owner role
                phoneNumber: hotelOwnerData.phoneNumber,
                address: hotelOwnerData.address
            };
            
            console.log('Sending to API:', requestData);
            
            const response = await axiosClient.post(API_ENDPOINTS.USERS.CREATE, requestData);
            console.log('API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error creating hotel owner:', error);
            throw error;
        }
    },

    /**
     * Cập nhật thông tin khách hàng
     * @param {string} customerId - ID của khách hàng
     * @param {Object} customerData - Dữ liệu cập nhật
     * @returns {Promise} Updated customer data
     */
    updateCustomer: async (customerId, customerData) => {
        try {
            const response = await axiosClient.patch(
                API_ENDPOINTS.USERS.UPDATE(customerId), 
                customerData
            );
            return response.data;
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    },

    /**
     * Xóa khách hàng
     * @param {string} customerId - ID của khách hàng
     * @returns {Promise} Response data
     */
    deleteCustomer: async (customerId) => {
        try {
            const response = await axiosClient.delete(API_ENDPOINTS.USERS.DELETE(customerId));
            return response.data;
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    },

    /**
     * Cập nhật trạng thái khách hàng (active/inactive)
     * @param {string} customerId - ID của khách hàng
     * @param {string} status - Trạng thái mới (active/inactive)
     * @returns {Promise} Updated customer data
     */
    updateCustomerStatus: async (customerId, status) => {
        try {
            const response = await axiosClient.patch(
                API_ENDPOINTS.USERS.UPDATE(customerId), 
                { status }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating customer status:', error);
            throw error;
        }
    },

    /**
     * Cập nhật trạng thái khách hàng bằng API chuyên dụng (active/inactive)
     * @param {string} userId - ID của khách hàng
     * @param {string} status - Trạng thái mới (active/inactive)
     * @returns {Promise} Updated customer data
     */
    updateCustomerStatusV2: async (userId, status) => {
        try {
            const response = await axiosClient.patch(API_ENDPOINTS.USERS.UPDATE_STATUS(userId), { status });
            return response.data;
        } catch (error) {
            console.error('Error updating customer status:', error);
            throw error;
        }
    },

    /**
     * Cập nhật vai trò khách hàng
     * @param {string} customerId - ID của khách hàng
     * @param {string} role - Vai trò mới (admin, hotel_owner, customer)
     * @returns {Promise} Updated customer data
     */
    updateCustomerRole: async (customerId, role) => {
        try {
            const response = await axiosClient.patch(
                API_ENDPOINTS.USERS.UPDATE(customerId), 
                { role }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating customer role:', error);
            throw error;
        }
    },

    /**
     * ✅ FIXED: Lấy danh sách khách hàng có khách sạn
     * @param {Object} params - Query parameters
     * @returns {Promise} Response data with hotel information
     */
    getCustomersWithHotels: async (params = {}) => {
        try {
            // ✅ FIXED: Sử dụng endpoint đúng
            const response = await axiosClient.get(
                API_ENDPOINTS.USERS.GET_HOTEL_OWNERS, 
                { params }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching customers with hotels:', error);
            throw error;
        }
    },

    /**
     * ✅ FIXED: Suspend/Block một hotel owner
     * @param {string} ownerId - ID của hotel owner
     * @returns {Promise} Response data
     */
    suspendHotelOwner: async (ownerId) => {
        try {
            // ✅ FIXED: Sử dụng updateCustomer thay vì endpoint không tồn tại
            const response = await axiosClient.patch(
                API_ENDPOINTS.USERS.UPDATE(ownerId),
                { status: 'inactive' }
            );
            return response.data;
        } catch (error) {
            console.error('Error suspending hotel owner:', error);
            throw error;
        }
    },

    /**
     * ✅ FIXED: Activate một hotel owner
     * @param {string} ownerId - ID của hotel owner
     * @returns {Promise} Response data
     */
    activateHotelOwner: async (ownerId) => {
        try {
            // ✅ FIXED: Sử dụng updateCustomer thay vì endpoint không tồn tại
            const response = await axiosClient.patch(
                API_ENDPOINTS.USERS.UPDATE(ownerId),
                { status: 'active' }
            );
            return response.data;
        } catch (error) {
            console.error('Error activating hotel owner:', error);
            throw error;
        }
    },

    /**
     * Tìm kiếm khách hàng
     * @param {string} searchTerm - Từ khóa tìm kiếm
     * @param {Object} filters - Bộ lọc thêm
     * @returns {Promise} Search results
     */
    searchCustomers: async (searchTerm, filters = {}) => {
        try {
            const params = {
                search: searchTerm,
                role: 'hotel_owner',
                roleId: 2,
                ...filters
            };
            
            const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_ALL, { params });
            return response.data;
        } catch (error) {
            console.error('Error searching customers:', error);
            throw error;
        }
    },

    /**
     * Lấy thống kê khách hàng
     * @returns {Promise} Statistics data
     */
    getCustomerStatistics: async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_DASHBOARD_STATS);
            return response.data;
        } catch (error) {
            console.error('Error fetching customer statistics:', error);
            throw error;
        }
    },

    /**
     * Export danh sách khách hàng
     * @param {Object} filters - Bộ lọc export
     * @returns {Promise} Export data
     */
    exportCustomers: async (filters = {}) => {
        try {
            const params = {
                ...filters,
                role: 'hotel_owner',
                roleId: 2,
                export: true
            };
            
            const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_ALL, { 
                params,
                responseType: 'blob' // For file download
            });
            return response.data;
        } catch (error) {
            console.error('Error exporting customers:', error);
            throw error;
        }
    }
};

export default customerService;