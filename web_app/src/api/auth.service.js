// src/api/auth.service.js

import axios from 'axios';

import { API_ENDPOINTS } from '../config/apiEndpoints';

// Hàm register
const register = (userData) => {

    return axios.post(API_ENDPOINTS.AUTH.REGISTER, userData);
};

// Hàm login
const login = (identifier, password) => {

    return axios.post(API_ENDPOINTS.AUTH.LOGIN, {
        identifier,
        password,
    });
};

// Hàm get profile
const getProfile = (token) => {

    return axios.get(API_ENDPOINTS.AUTH.PROFILE, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

// Hàm logout
const logout = (token) => {

    return axios.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};


export const authService = {
    register,
    login,
    getProfile,
    logout
};