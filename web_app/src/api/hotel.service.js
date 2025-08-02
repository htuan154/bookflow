// src/api/hotel.service.js
import { API_ENDPOINTS } from '../config/apiEndpoints';
import axiosClient from '../config/axiosClient';

export const hotelApiService = {
  // Existing methods...

  /**
   * Lấy tất cả hotels cho admin (existing method)
   */
  async getHotelsForAdmin(filters = {}) {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_ALL_HOTELS, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching hotels for admin:', error);
      throw error;
    }
  },

  /**
   * NEW - Lấy danh sách hotels đã duyệt
   */
  async getApprovedHotels(filters = {}) {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_APPROVED_HOTELS, {
        params: {
          ...filters,
           // Đảm bảo chỉ lấy hotels đã duyệt
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching approved hotels:', error);
      throw error;
    }
  },

  /**
   * NEW - Lấy danh sách hotels chờ duyệt/từ chối
   */
  async getPendingRejectedHotels(filters = {}) {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_PENDING_REJECTED_HOTELS, {
        params: {
          ...filters,
          status: ['pending', 'rejected']
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending/rejected hotels:', error);
      throw error;
    }
  },
  

  /**
   * Lấy hotels theo status cụ thể (có thể dùng thay thế)
   */
  async getHotelsByStatus(status, filters = {}) {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_HOTELS_BY_STATUS(status), {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching hotels with status ${status}:`, error);
      throw error;
    }
  },

  /**
   * Approve hotel
   */
  async approveHotel(hotelId, approvalNote = '') {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.ADMIN.APPROVE_HOTEL(hotelId), {
        approvalNote
      });
      return response.data;
    } catch (error) {
      console.error('Error approving hotel:', error);
      throw error;
    }
  },

  /**
   * Reject hotel
   */
  async rejectHotel(hotelId, rejectionReason = '') {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.ADMIN.REJECT_HOTEL(hotelId), {
        rejectionReason
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting hotel:', error);
      throw error;
    }
  },

  /**
   * Restore hotel
   */
  async restoreHotel(hotelId) {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.ADMIN.RESTORE_HOTEL(hotelId));
      return response.data;
    } catch (error) {
      console.error('Error restoring hotel:', error);
      throw error;
    }
  },

  /**
   * Update hotel status
   */
  async updateHotelStatus(hotelId, status, note = '') {
    try {
      const response = await axiosClient.put(API_ENDPOINTS.ADMIN.UPDATE_HOTEL_STATUS(hotelId), {
        status,
        note
      });
      return response.data;
    } catch (error) {
      console.error('Error updating hotel status:', error);
      throw error;
    }
  }
};