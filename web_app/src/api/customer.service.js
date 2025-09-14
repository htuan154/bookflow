// src/api/customer.service.js

import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const customerService = {
    /**
     * Lấy danh sách chủ khách sạn (hotel owners) với phân trang
     * @param {Object} params - Query parameters (page, limit, search, status)
     * @returns {Promise} Response data
     */
    getHotelOwners: async (params = {}) => {
        console.log('customerService.getHotelOwners called with:', params);
        try {
            // Đảm bảo có phân trang mặc định
            const queryParams = {
                page: params.page || 1,
                limit: params.limit || 10,
                ...params
            };
            
            console.log('Final queryParams for getHotelOwners:', queryParams);
            
            const response = await axiosClient.get('/users/hotel-owners', { 
                params: queryParams 
            });
            
            console.log('getHotelOwners response:', response.data);
            return response.data;
        } catch (error) {
            console.error('getHotelOwners error:', error);
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
        console.log('customerService.getCustomersByRole called with:', { role, params });
        try {
            const response = await axiosClient.get(`/users/role/${role}`, { params });
            console.log('getCustomersByRole response:', response.data);
            return response.data;
        } catch (error) {
            console.error('getCustomersByRole error:', error);
            throw error;
        }
    },

    /**
     * Lấy tất cả khách hàng
     * @param {Object} params - Query parameters khác
     * @returns {Promise} Response data
     */
    getCustomers: async (params = {}) => {
        console.log('customerService.getCustomers called with:', params);
        try {
            const response = await axiosClient.get('/users', { params });
            console.log('getCustomers response:', response.data);
            return response.data;
        } catch (error) {
            console.error('getCustomers error:', error);
            throw error;
        }
    },

    /**
     * Lấy thông tin chi tiết một khách hàng
     * @param {string} customerId - ID của khách hàng
     * @returns {Promise} Customer data
     */
    getCustomerById: async (customerId) => {
        console.log('customerService.getCustomerById called with:', customerId);
        try {
            const response = await axiosClient.get(`/users/${customerId}`);
            console.log('getCustomerById response:', response.data);
            return response.data;
        } catch (error) {
            console.error('getCustomerById error:', error);
            throw error;
        }
    },

    /**
     * Tạo khách hàng mới
     * @param {Object} customerData - Dữ liệu khách hàng mới
     * @returns {Promise} Created customer data
     */
    createCustomer: async (customerData) => {
        console.log('customerService.createCustomer called with:', customerData);
        try {
            const response = await axiosClient.post('/users', customerData);
            console.log('createCustomer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('createCustomer error:', error);
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
        console.log('customerService.updateCustomer called with:', { customerId, customerData });
        try {
            const response = await axiosClient.put(`/users/${customerId}`, customerData);
            console.log('updateCustomer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('updateCustomer error:', error);
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
        console.log('customerService.updateCustomerStatus called with:', { customerId, status });
        try {
            const response = await axiosClient.patch(`/users/${customerId}/status`, { status });
            console.log('updateCustomerStatus response:', response.data);
            return response.data;
        } catch (error) {
            console.error('updateCustomerStatus error:', error);
            throw error;
        }
    },

    /**
     * Xóa khách hàng
     * @param {string} customerId - ID của khách hàng
     * @returns {Promise} Response data
     */
    deleteCustomer: async (customerId) => {
        console.log('customerService.deleteCustomer called with:', customerId);
        try {
            const response = await axiosClient.delete(`/users/${customerId}`);
            console.log('deleteCustomer response:', response.data);
            return response.data;
        } catch (error) {
            console.error('deleteCustomer error:', error);
            throw error;
        }
    }
};

export default customerService;