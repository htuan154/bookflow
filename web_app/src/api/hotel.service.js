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
  },
  /**
   * Lấy thông tin chi tiết hotel theo ID
   */
  async getHotelById(hotelId) {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.HOTEL_OWNER.GET_HOTEL_DETAIL(hotelId));
      return response.data;
    } catch (error) {
      console.error('Error fetching hotel by ID:', error);
      throw error;
    }
  },
  async getHotelsForOwner(filters = {}) {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.HOTELS.MY_HOTELS, {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching owner hotels:', error);
      throw error;
    }
  },
  /**
   * Tạo hotel mới
   */
  async createHotel(hotelData) {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.HOTEL_OWNER.CREATE_HOTEL, hotelData);
      return response.data;
    } catch (error) {
      console.error('Error creating hotel:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin hotel
   */
  async updateHotel(hotelId, updateData) {
    try {
      const response = await axiosClient.put(API_ENDPOINTS.HOTEL_OWNER.UPDATE_HOTEL(hotelId), updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating hotel:', error);
      throw error;
    }
  },

  /**
   * Xóa hotel
   */
  async deleteHotel(hotelId) {
    try {
      const response = await axiosClient.delete(API_ENDPOINTS.HOTEL_OWNER.DELETE_HOTEL(hotelId));
      return response.data;
    } catch (error) {
      console.error('Error deleting hotel:', error);
      throw error;
    }
  },

  /**
   * Upload hình ảnh cho hotel
   */
  async uploadHotelImages(hotelId, formData) {
    try {
      const response = await axiosClient.post(
        API_ENDPOINTS.HOTEL_OWNER.UPLOAD_IMAGES(hotelId), 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading hotel images:', error);
      throw error;
    }
  },

  /**
   * Xóa hình ảnh khách sạn
   */
  async deleteHotelImage(hotelId, imageId) {
    try {
      const response = await axiosClient.delete(API_ENDPOINTS.HOTEL_OWNER.DELETE_IMAGE(hotelId, imageId));
      return response.data;
    } catch (error) {
      console.error('Error deleting hotel image:', error);
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái hotel
   */
  async updateHotelStatus(hotelId, status, note = '') {
    try {
      const response = await axiosClient.put(API_ENDPOINTS.HOTEL_OWNER.UPDATE_STATUS(hotelId), {
        status,
        note
      });
      return response.data;
    } catch (error) {
      console.error('Error updating hotel status:', error);
      throw error;
    }
  },

  /**
   * Lấy thống kê hotel của owner
   */
  async getOwnerHotelStatistics(hotelId = null) {
    try {
      const endpoint = hotelId 
        ? API_ENDPOINTS.HOTEL_OWNER.GET_STATISTICS(hotelId)
        : API_ENDPOINTS.HOTEL_OWNER.GET_STATISTICS();
      
      const response = await axiosClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching hotel statistics:', error);
      throw error;
    }
  },

  /**
   * Cập nhật tiện nghi khách sạn
   */
  async updateHotelAmenities(hotelId, amenities) {
    try {
      const response = await axiosClient.put(API_ENDPOINTS.HOTEL_OWNER.UPDATE_AMENITIES(hotelId), {
        amenities
      });
      return response.data;
    } catch (error) {
      console.error('Error updating hotel amenities:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách tiện nghi có sẵn
   */
  async getAvailableAmenities() {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.COMMON.GET_AMENITIES);
      return response.data;
    } catch (error) {
      console.error('Error fetching available amenities:', error);
      throw error;
    }
  },

  /**
   * Submit hotel for approval
   */
  async submitHotelForApproval(hotelId) {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.HOTEL_OWNER.SUBMIT_FOR_APPROVAL(hotelId));
      return response.data;
    } catch (error) {
      console.error('Error submitting hotel for approval:', error);
      throw error;
    }
  },
  /**
   * Tìm kiếm hotels
   */
  async searchHotels(searchParams) {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.COMMON.SEARCH_HOTELS, {
        params: searchParams
      });
      return response.data;
    } catch (error) {
      console.error('Error searching hotels:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách thành phố có hotels
   */
  async getCitiesWithHotels() {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.COMMON.GET_CITIES);
      return response.data;
    } catch (error) {
      console.error('Error fetching cities:', error);
      throw error;
    }
  },

  /**
   * Set thumbnail image
   */
  async setThumbnailImage(hotelId, imageId) {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.HOTEL_OWNER.SET_THUMBNAIL(hotelId, imageId));
      return response.data;
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      throw error;
    }
  },
};