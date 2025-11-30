// src/api/touristLocation.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const touristLocationService = {
  // Lấy tất cả địa điểm du lịch
  getAll: async () => {
    const res = await axiosClient.get(API_ENDPOINTS.TOURIST_LOCATIONS.GET_ALL);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Lấy địa điểm du lịch theo thành phố
  getByCity: async (city) => {
    const res = await axiosClient.get(API_ENDPOINTS.TOURIST_LOCATIONS.GET_BY_CITY(city));
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Lấy địa điểm du lịch theo đúng tên thành phố (phân biệt hoa thường, hỗ trợ tiếng Việt)
  getByCityVn: async (city) => {
    const res = await axiosClient.get(API_ENDPOINTS.TOURIST_LOCATIONS.GET_BY_CITY_VN(city));
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Tạo địa điểm mới (admin)
  create: async (locationData) => {
    const res = await axiosClient.post(API_ENDPOINTS.TOURIST_LOCATIONS.CREATE, locationData);
    return res.data.data;
  },

  // Cập nhật địa điểm (admin)
  update: async (id, updateData) => {
    const res = await axiosClient.put(API_ENDPOINTS.TOURIST_LOCATIONS.UPDATE(id), updateData);
    return res.data.data;
  },

  // Xóa địa điểm (admin)
  delete: async (id) => {
    const res = await axiosClient.delete(API_ENDPOINTS.TOURIST_LOCATIONS.DELETE(id));
    return res.data.data;
  },
};

export default touristLocationService;
