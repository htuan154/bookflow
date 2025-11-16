// src/api/booking.service.js
import axiosClient from '../config/axiosClient';

const bookingApiService = {
  /**
   * Tạo booking mới
   */
  async createBooking(bookingData) {
    try {
      console.log('🔄 [BOOKING SERVICE] Creating booking:', bookingData);
      const response = await axiosClient.post('/bookings', bookingData);
      console.log('✅ [BOOKING SERVICE] Booking created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error creating booking:', error);
      throw error;
    }
  },

  /**
   * Tạo booking cho khách hàng (userId truyền vào)
   */
  async createBookingForCustomer(userId, bookingData) {
    try {
      console.log('🔄 [BOOKING SERVICE] Creating booking for customer:', userId, bookingData);
      const response = await axiosClient.post(`/bookings/customer/${userId}`, bookingData);
      console.log('✅ [BOOKING SERVICE] Booking for customer created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error creating booking for customer:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách booking no_show của user
   */
  async getUserNoShowBookings(userId) {
    try {
      console.log('🔄 [BOOKING SERVICE] Fetching no_show bookings for user:', userId);
      const response = await axiosClient.get(`/bookings/user/${userId}/no_show`);
      console.log('✅ [BOOKING SERVICE] No_show bookings:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error fetching no_show bookings:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách bookings theo hotelId
   */
  async getBookingsByHotelId(hotelId) {
    try {
      console.log('🔄 [BOOKING SERVICE] Fetching bookings for hotel:', hotelId);
      const response = await axiosClient.get(`/bookings/hotel/${hotelId}`);
      console.log('✅ [BOOKING SERVICE] Bookings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error fetching bookings:', error);
      throw error;
    }
  },

    /**
   * Cập nhật thông tin booking (generic update - nhiều fields)
   */
  async updateBooking(bookingId, updateData) {
    try {
      console.log('🔄 [BOOKING SERVICE] Updating booking:', bookingId, updateData);
      const response = await axiosClient.patch(`/bookings/${bookingId}`, updateData);
      console.log('✅ [BOOKING SERVICE] Booking updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error updating booking:', error);
      throw error;
    }
  },
  
  /**
   * Lấy chi tiết booking theo bookingId
   */
  async getBookingById(bookingId) {
    try {
      console.log('🔄 [BOOKING SERVICE] Fetching booking detail:', bookingId);
      const response = await axiosClient.get(`/bookings/${bookingId}`);
      console.log('✅ [BOOKING SERVICE] Booking detail:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error fetching booking detail:', error);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái booking
   */
    async updateBookingStatus(bookingId, status) {
      try {
        console.log('🔄 [BOOKING SERVICE] Updating booking status:', bookingId, status);
        const response = await axiosClient.patch(`/bookings/${bookingId}/status`, { status });
        console.log('✅ [BOOKING SERVICE] Status updated:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ [BOOKING SERVICE] Error updating status:', error);
        throw error;
      }
    },

  /**
   * Cập nhật booking (generic update - có thể update nhiều fields)
   */
  async updateBooking(bookingId, updateData) {
    try {
      console.log('🔄 [BOOKING SERVICE] Updating booking:', bookingId, updateData);
      const response = await axiosClient.patch(`/bookings/${bookingId}`, updateData);
      console.log('✅ [BOOKING SERVICE] Booking updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error updating booking:', error);
      throw error;
    }
  },

  /**
   * Xác nhận booking
   */
  async confirmBooking(bookingId) {
    try {
      console.log('🔄 [BOOKING SERVICE] Confirming booking:', bookingId);
      const response = await axiosClient.post(`/bookings/${bookingId}/confirm`);
      console.log('✅ [BOOKING SERVICE] Booking confirmed:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error confirming booking:', error);
      throw error;
    }
  },

  /**
   * Hủy booking
   */
  async cancelBooking(bookingId, reason) {
    try {
      console.log('🔄 [BOOKING SERVICE] Cancelling booking:', bookingId);
      const response = await axiosClient.post(`/bookings/${bookingId}/cancel`, { reason });
      console.log('✅ [BOOKING SERVICE] Booking cancelled:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error cancelling booking:', error);
      throw error;
    }
  },

  /**
   * Check-in
   */
  async checkIn(bookingId, actualCheckInDate) {
    try {
      console.log('🔄 [BOOKING SERVICE] Check-in booking:', bookingId);
      const response = await axiosClient.post(`/bookings/${bookingId}/checkin`, { actualCheckInDate });
      console.log('✅ [BOOKING SERVICE] Checked in:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error checking in:', error);
      throw error;
    }
  },

  /**
   * Check-out
   */
  async checkOut(bookingId, actualCheckOutDate) {
    try {
      console.log('🔄 [BOOKING SERVICE] Check-out booking:', bookingId);
      const response = await axiosClient.post(`/bookings/${bookingId}/checkout`, { actualCheckOutDate });
      console.log('✅ [BOOKING SERVICE] Checked out:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error checking out:', error);
      throw error;
    }
  },

  /**
   * Lấy bookings với filters
   */
  async getBookingsWithFilters(hotelId, filters = {}) {
    try {
      console.log('🔄 [BOOKING SERVICE] Fetching bookings with filters:', filters);
      const response = await axiosClient.get(`/bookings/hotel/${hotelId}`, {
        params: filters
      });
      console.log('✅ [BOOKING SERVICE] Filtered bookings:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error fetching filtered bookings:', error);
      throw error;
    }
  },

  /**
   * Lấy thống kê bookings
   */
  async getBookingStatistics(hotelId) {
    try {
      console.log('🔄 [BOOKING SERVICE] Fetching booking statistics:', hotelId);
      const response = await axiosClient.get(`/bookings/hotel/${hotelId}/statistics`);
      console.log('✅ [BOOKING SERVICE] Statistics:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [BOOKING SERVICE] Error fetching statistics:', error);
      throw error;
    }
  }
};

// Export thêm alias để tương thích với code mới
export const bookingService = bookingApiService;
export { bookingApiService };
export default bookingApiService;
