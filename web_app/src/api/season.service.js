// src/api/season.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const seasonService = {
  // Lấy tất cả seasons
  getAllSeasons: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.SEASONS.GET_ALL);
    return response.data;
  },

  // Lấy seasons theo năm
  getSeasonsByYear: async (year) => {
    const response = await axiosClient.get(API_ENDPOINTS.SEASONS.GET_BY_YEAR(year));
    return response.data;
  },

  // Lấy season theo ID
  getSeasonById: async (seasonId) => {
    const response = await axiosClient.get(`${API_ENDPOINTS.SEASONS.GET_ALL}/${seasonId}`);
    return response.data;
  },

  // Tạo season mới
  createSeason: async (seasonData) => {
    const response = await axiosClient.post(API_ENDPOINTS.SEASONS.CREATE, seasonData);
    return response.data;
  },

  // Cập nhật season
  updateSeason: async (seasonId, seasonData) => {
    const response = await axiosClient.put(API_ENDPOINTS.SEASONS.UPDATE(seasonId), seasonData);
    return response.data;
  },

  // Xóa season
  deleteSeason: async (seasonId) => {
    const response = await axiosClient.delete(API_ENDPOINTS.SEASONS.DELETE(seasonId));
    return response.data;
  }
};

export default seasonService;
