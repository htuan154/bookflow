// src/config/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor request: tự động thêm token vào headers nếu có
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Xử lý lỗi request nếu có
        return Promise.reject(error);
    }
);

// Interceptor response: xử lý lỗi toàn cục nếu cần
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Bạn có thể xử lý lỗi token hết hạn ở đây nếu cần
        // Ví dụ: logout người dùng, chuyển hướng đến trang đăng nhập, v.v.
        return Promise.reject(error);
    }
);

export default axiosClient;
