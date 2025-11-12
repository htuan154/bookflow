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
        // Support different token key names because parts of the app sometimes
        // write the token under different keys (token, accessToken, access_token, authToken, jwt)
        const token =
            localStorage.getItem('token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('access_token') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('jwt') ||
            null;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Debug: Log request data
        // console.log('Axios Request:', {
        //     method: config.method,
        //     url: config.url,
        //     data: config.data,
        //     headers: config.headers
        // });
        
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