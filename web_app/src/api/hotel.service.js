import React, { useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';
import { BarChart2, Building, Users, LogOut, Menu, X, ChevronDown, Search, MoreHorizontal, CheckCircle, XCircle, Eye, Edit } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Tạo một instance axios để tự động thêm token
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const hotelApiService = {
    // Lấy tất cả khách sạn cho Admin, có thể lọc theo trạng thái
    async getHotelsForAdmin(filters = {}) {
        // Chuyển đổi filters thành query params
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') {
            params.append('status', filters.status);
        }
        if (filters.search) {
            params.append('q', filters.search); // Giả sử backend hỗ trợ tìm kiếm qua query 'q'
        }
        // Trong thực tế, bạn sẽ dùng API GET /api/v1/hotels/admin/all hoặc /pending
        // Ở đây ta giả lập bằng cách gọi chung một API
        return apiClient.get('/hotels/admin/all', { params });
    },

    // Cập nhật trạng thái khách sạn (approve/reject)
    async updateHotelStatus(hotelId, status) {
        return apiClient.patch(`/hotels/admin/${hotelId}/status`, { status });
    }
};