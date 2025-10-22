// src/api/bookingDetail.service.js
import axiosClient from '../config/axiosClient';

export const bookingDetailApiService = {
  /**
   * Lấy chi tiết booking (booking details - room types, quantities, prices)
   */
  async getBookingDetails(bookingId) {
    try {
      console.log('🔄 [BOOKING DETAIL SERVICE] Fetching booking details:', bookingId);
      const response = await axiosClient.get(`/booking-details/booking/${bookingId}`);
      console.log('✅ [BOOKING DETAIL SERVICE] Booking details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING DETAIL SERVICE] Error fetching booking details:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin đầy đủ booking + details
   */
  async getFullBookingInfo(bookingId) {
    try {
      console.log('🔄 [BOOKING DETAIL SERVICE] Fetching full booking info:', bookingId);
      
      // Gọi cả 2 API song song
      const [bookingResponse, detailsResponse] = await Promise.all([
        axiosClient.get(`/bookings/${bookingId}`),
        axiosClient.get(`/booking-details/booking/${bookingId}`)
      ]);

      const fullInfo = {
        booking: bookingResponse.data?.data || bookingResponse.data,
        details: detailsResponse.data?.data || []
      };

      console.log('✅ [BOOKING DETAIL SERVICE] Full booking info:', fullInfo);
      return fullInfo;
    } catch (error) {
      console.error('❌ [BOOKING DETAIL SERVICE] Error fetching full booking info:', error);
      throw error;
    }
  },

  /**
   * Tạo booking detail
   */
  async createBookingDetail(detailData) {
    try {
      console.log('🔄 [BOOKING DETAIL SERVICE] Creating booking detail:', detailData);
      const response = await axiosClient.post('/booking-details', detailData);
      console.log('✅ [BOOKING DETAIL SERVICE] Booking detail created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING DETAIL SERVICE] Error creating booking detail:', error);
      throw error;
    }
  },

  /**
   * Cập nhật booking detail
   */
  async updateBookingDetail(detailId, updateData) {
    try {
      console.log('🔄 [BOOKING DETAIL SERVICE] Updating booking detail:', detailId);
      const response = await axiosClient.put(`/booking-details/${detailId}`, updateData);
      console.log('✅ [BOOKING DETAIL SERVICE] Booking detail updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING DETAIL SERVICE] Error updating booking detail:', error);
      throw error;
    }
  },

  /**
   * Xóa booking detail
   */
  async deleteBookingDetail(detailId) {
    try {
      console.log('🔄 [BOOKING DETAIL SERVICE] Deleting booking detail:', detailId);
      const response = await axiosClient.delete(`/booking-details/${detailId}`);
      console.log('✅ [BOOKING DETAIL SERVICE] Booking detail deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING DETAIL SERVICE] Error deleting booking detail:', error);
      throw error;
    }
  }
};
