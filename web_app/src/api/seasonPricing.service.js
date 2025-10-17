// src/api/seasonPricing.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const seasonPricingService = {
  // Lấy tất cả season pricing
  getAllSeasonPricing: async () => {
    const response = await axiosClient.get(`${API_ENDPOINTS.SEASONAL_PRICINGS.CREATE}`);
    return response.data;
  },

  // Lấy season pricing theo hotel
  getSeasonPricingByHotel: async (hotelId) => {
    const response = await axiosClient.get(`${API_ENDPOINTS.SEASONAL_PRICINGS.CREATE}/hotel/${hotelId}`);
    return response.data;
  },

  // Lấy season pricing theo room type
  getSeasonPricingByRoomType: async (roomTypeId) => {
    const response = await axiosClient.get(API_ENDPOINTS.SEASONAL_PRICINGS.GET_FOR_ROOM_TYPE(roomTypeId));
    return response.data;
  },

  // Lấy các seasons chưa có seasonal pricing cho một room type trong một năm
  getAvailableSeasonsForRoomType: async (roomTypeId, year) => {
    const response = await axiosClient.get(API_ENDPOINTS.SEASONAL_PRICINGS.GET_AVAILABLE_SEASONS(roomTypeId, year));
    return response.data;
  },

  // Lấy season pricing theo season
  getSeasonPricingBySeason: async (seasonId) => {
    const response = await axiosClient.get(`${API_ENDPOINTS.SEASONAL_PRICINGS.CREATE}/season/${seasonId}`);
    return response.data;
  },

  // Tạo season pricing mới
  createSeasonPricing: async (pricingData) => {
    const response = await axiosClient.post(API_ENDPOINTS.SEASONAL_PRICINGS.CREATE, pricingData);
    return response.data;
  },

  // Cập nhật season pricing
  updateSeasonPricing: async (pricingId, pricingData) => {
    const response = await axiosClient.put(API_ENDPOINTS.SEASONAL_PRICINGS.UPDATE(pricingId), pricingData);
    return response.data;
  },

  // Xóa season pricing
  deleteSeasonPricing: async (pricingId) => {
    const response = await axiosClient.delete(API_ENDPOINTS.SEASONAL_PRICINGS.DELETE(pricingId));
    return response.data;
  },

  // Tạo bulk seasonal pricing cho một room type với tất cả seasons của một năm
  bulkCreateSeasonPricing: async (bulkData) => {
    const response = await axiosClient.post(API_ENDPOINTS.SEASONAL_PRICINGS.BULK_CREATE, bulkData);
    return response.data;
  }
};

export default seasonPricingService;
