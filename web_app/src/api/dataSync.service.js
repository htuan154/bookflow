// src/api/dataSync.service.js
import axiosClient from '../config/axiosClient';

// Endpoints khớp với server/src/api/v1/routes/data.routes.js
const DATA_SYNC_ENDPOINTS = {
  ADD_PLACE: '/data/place',      // POST /api/v1/data/place
  ADD_DISH: '/data/dish',        // POST /api/v1/data/dish
};

// Autocomplete endpoint từ chatbot
const AUTOCOMPLETE_ENDPOINT = (q) => 
  `http://localhost:8080/provinces/autocomplete?q=${encodeURIComponent(q)}`;

/**
 * Thêm địa điểm du lịch
 * @param {Object} data - { name, province, description }
 */
export const addPlace = async (data) => {
  try {
    const response = await axiosClient.post(DATA_SYNC_ENDPOINTS.ADD_PLACE, data);
    return response.data;
  } catch (error) {
    console.error('[DataSync] addPlace error:', error);
    throw error;
  }
};

/**
 * Thêm món ăn đặc sản
 * @param {Object} data - { name, province, description }
 */
export const addDish = async (data) => {
  try {
    const response = await axiosClient.post(DATA_SYNC_ENDPOINTS.ADD_DISH, data);
    return response.data;
  } catch (error) {
    console.error('[DataSync] addDish error:', error);
    throw error;
  }
};

/**
 * Autocomplete tỉnh/thành phố
 * @param {string} query - Từ khóa tìm kiếm
 */
export const autocompleteProvince = async (query) => {
  try {
    const response = await fetch(AUTOCOMPLETE_ENDPOINT(query));
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[DataSync] autocompleteProvince error:', error);
    throw error;
  }
};
