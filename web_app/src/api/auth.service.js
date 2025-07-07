// src/api/auth.service.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1/auth';

const register = (userData) => {
    return axios.post(`${API_URL}/register`, userData);
};

// Cập nhật để hỗ trợ đăng nhập bằng email hoặc username
const login = (identifier, password) => {
    return axios.post(`${API_URL}/login`, {
        identifier, // có thể là email hoặc username
        password,
    });
};

const getProfile = (token) => {
    return axios.get(`${API_URL}/profile`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

const logout = (token) => {
    return axios.post(`${API_URL}/logout`, {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export {
    register,
    login,
    getProfile,
    logout
};