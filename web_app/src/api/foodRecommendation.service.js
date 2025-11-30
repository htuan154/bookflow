// src/api/foodRecommendation.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const foodRecommendationService = {
  // Lấy gợi ý món ăn của một địa điểm
  getByLocation: async (locationId) => {
    const res = await axiosClient.get(API_ENDPOINTS.FOOD_RECOMMENDATIONS.GET_BY_LOCATION(locationId));
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Lấy gợi ý món ăn theo thành phố
  getByCity: async (city) => {
    const res = await axiosClient.get(API_ENDPOINTS.FOOD_RECOMMENDATIONS.GET_BY_CITY(city));
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Tạo gợi ý mới (admin)
  create: async (foodData) => {
    const res = await axiosClient.post(API_ENDPOINTS.FOOD_RECOMMENDATIONS.CREATE, foodData);
    return res.data.data;
  },

  // Cập nhật gợi ý (admin)
  update: async (id, updateData) => {
    const res = await axiosClient.put(API_ENDPOINTS.FOOD_RECOMMENDATIONS.UPDATE(id), updateData);
    return res.data.data;
  },

  // Xóa gợi ý (admin)
  delete: async (id) => {
    const res = await axiosClient.delete(API_ENDPOINTS.FOOD_RECOMMENDATIONS.DELETE(id));
    return res.data.data;
  },
};

export default foodRecommendationService;
