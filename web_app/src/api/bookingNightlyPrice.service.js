// src/api/bookingNightlyPrice.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export const bookingNightlyPriceService = {
  /**
   * Lấy danh sách giá theo đêm của một booking
   * @param {string} bookingId - ID của booking
   * @returns {Promise<Array>} Danh sách giá theo đêm
   */
  async getByBookingId(bookingId) {
    try {
      const response = await axiosClient.get(
        API_ENDPOINTS.BOOKING_NIGHTLY_PRICE.GET_BY_BOOKING_ID(bookingId)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching booking nightly prices:', error);
      throw error;
    }
  },

  /**
   * Tạo mới giá theo đêm
   * @param {Object} data - Dữ liệu giá theo đêm
   * @returns {Promise<Object>} Giá theo đêm đã tạo
   */
  async create(data) {
    try {
      const response = await axiosClient.post(
        API_ENDPOINTS.BOOKING_NIGHTLY_PRICE.CREATE,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error creating booking nightly price:', error);
      throw error;
    }
  },
};

export default bookingNightlyPriceService;
