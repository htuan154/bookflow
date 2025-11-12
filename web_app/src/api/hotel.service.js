// src/api/hotel.service.js
import { API_ENDPOINTS } from '../config/apiEndpoints';
import axiosClient from '../config/axiosClient';

export const hotelApiService = {
  /**
   * Lấy tất cả booking theo hotelId
   */
  async getBookingsByHotelId(hotelId) {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.BOOKINGS.GET_BY_HOTEL(hotelId));
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings by hotel ID:', error);
      throw error;
    }
  },
  /**
   * Lấy danh sách hình ảnh theo hotelId thêm vào ngày 12/9
   */
    async getImagesByHotelId(hotelId) {
      try {
        const response = await axiosClient.get(API_ENDPOINTS.HOTEL_OWNER.GET_IMAGES_BY_HOTEL_ID(hotelId));
        return response.data;
      } catch (error) {
        console.error('Error fetching images by hotel ID:', error);
        throw error;
      }
    },
 

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
   * NEW - Lấy danh sách hotels đã duyệt và đang hoạt động
   */
  async getApprovedHotels(filters = {}) {
    try {
      console.log('🔄 Fetching approved and active hotels for OWNER...');
   const [approvedResponse, activeResponse] = await Promise.all([
     axiosClient.get(API_ENDPOINTS.HOTELS.MY_HOTELS, {
       params: { ...filters, status: 'approved' }
     }),
     axiosClient.get(API_ENDPOINTS.HOTELS.MY_HOTELS, {
       params: { ...filters, status: 'active' }
     })
   ]);

      console.log('✅ Approved hotels response:', approvedResponse.data);
      console.log('✅ Active hotels response:', activeResponse.data);

      // Merge kết quả từ 2 API calls
      const approvedHotels = Array.isArray(approvedResponse.data?.data) ? approvedResponse.data.data : 
                            Array.isArray(approvedResponse.data?.hotels) ? approvedResponse.data.hotels :
                            Array.isArray(approvedResponse.data) ? approvedResponse.data : [];
      
      const activeHotels = Array.isArray(activeResponse.data?.data) ? activeResponse.data.data : 
                          Array.isArray(activeResponse.data?.hotels) ? activeResponse.data.hotels :
                          Array.isArray(activeResponse.data) ? activeResponse.data : [];

      // Combine và remove duplicates dựa trên hotel_id
      const combinedHotels = [...approvedHotels, ...activeHotels];
      const uniqueHotels = combinedHotels.filter((hotel, index, self) => 
        index === self.findIndex(h => (h.hotel_id || h.hotelId) === (hotel.hotel_id || hotel.hotelId))
      );

      console.log('✅ Combined unique hotels:', uniqueHotels.length);

      // Trả về format giống như API gốc
      return {
        data: uniqueHotels,
        totalCount: uniqueHotels.length,
        total: uniqueHotels.length
      };
    } catch (error) {
      console.error('Error fetching approved and active hotels:', error);
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
      console.log('🔄 [HOTEL SERVICE] Fetching hotel by ID:', hotelId);
      const url = `/hotels/${hotelId}`;
      console.log('🔄 [HOTEL SERVICE] Request URL:', url);
      
      const response = await axiosClient.get(url);
      console.log('✅ [HOTEL SERVICE] Hotel response:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching hotel by ID:', error.response?.status, error.response?.data || error.message);
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
  async uploadHotelImages(hotelId, images) {  
    try {
      const endpoint = API_ENDPOINTS.HOTEL_OWNER.UPLOAD_IMAGES(hotelId);
      // Kiểm tra kiểu dữ liệu images trước khi gửi lên backend
      console.log('DEBUG images:', images, Array.isArray(images));
      if (!Array.isArray(images)) {
        throw new Error('images phải là một mảng');
      }
      const response = await axiosClient.post(
        endpoint,
        { images }, // truyền đúng format JSON
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading hotel images:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
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

  /**
   * Lấy danh sách khách sạn đã duyệt của user hiện tại (cho dropdown) ngày 28/8 
   */
  async getApprovedHotelsDropdown() {
    try {
      console.log('🔍 Frontend calling endpoint:', API_ENDPOINTS.HOTELS.GET_APPROVED_HOTELS_DROPDOWN);
      const response = await axiosClient.get(API_ENDPOINTS.HOTELS.GET_APPROVED_HOTELS_DROPDOWN);
      console.log('✅ Frontend received response:', response.data);
      return response.data;
    } catch (error) {
      // Thêm log chi tiết lỗi để debug
      console.error('❌ Frontend error:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url
      });
      throw error;
    }
  },
  /**
   * Lấy thông tin chi tiết hotel theo ID
   */
  async getHotelById(hotelId) {
    try {
      console.log('🔄 [HOTEL SERVICE] Fetching hotel by ID:', hotelId);
      const response = await axiosClient.get(`/hotels/${hotelId}`);
      console.log('✅ [HOTEL SERVICE] Hotel response:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching hotel by ID:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách amenities của hotel
   */
  async getHotelAmenities(hotelId) {
    try {
      console.log('🔄 [HOTEL SERVICE] Fetching hotel amenities for ID:', hotelId);
      const response = await axiosClient.get(`/hotels/${hotelId}/amenities`);
      console.log('✅ [HOTEL SERVICE] Hotel amenities response:', response.data);
      
      // Extract data from response - API trả về {status, message, data}
      const amenities = response.data?.data || [];
      console.log('✅ [HOTEL SERVICE] Extracted amenities:', amenities);
      
      return amenities;
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching hotel amenities:', error);
      // Return empty array thay vì throw error để không break UI
      return [];
    }
  },

  /**
   * Lấy danh sách images của hotel
   */
  async getHotelImages(hotelId) {
    try {
      console.log('🔄 [HOTEL SERVICE] Fetching hotel images for ID:', hotelId);
      const response = await axiosClient.get(`/hotels/${hotelId}/images`);
      console.log('✅ [HOTEL SERVICE] Hotel images response:', response.data);
      
      // Extract data from response - API trả về {status, message, data}
      const images = response.data?.data || [];
      console.log('✅ [HOTEL SERVICE] Extracted images:', images);
      
      return images;
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching hotel images:', error);
      // Return empty array thay vì throw error để không break UI
      return [];
    }
  },

  /**
   * Lấy danh sách room types của hotel
   */
  async getHotelRoomTypes(hotelId) {
    try {
      console.log('🔄 [HOTEL SERVICE] Fetching room types for hotel ID:', hotelId);
      
      // Sử dụng endpoint chính xác từ backend
      const response = await axiosClient.get(`/roomtypes/hotel/${hotelId}`);
      
      const roomTypes = response.data?.data || response.data || [];
      console.log('✅ [HOTEL SERVICE] Room types fetched:', roomTypes.length, 'items');
      
      return roomTypes;
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching hotel room types:', error);
      // Return empty array thay vì throw error để không break UI
      return [];
    }
  },

  /**
   * Lấy thumbnail của room type
   */
  async getRoomTypeThumbnail(roomTypeId) {
    try {
      console.log('🔄 [HOTEL SERVICE] Fetching room type thumbnail for ID:', roomTypeId);
      const response = await axiosClient.get(`/room-types/${roomTypeId}/thumbnail`);
      console.log('✅ [HOTEL SERVICE] Room type thumbnail response:', response.data);
      return response.data?.data || null;
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching room type thumbnail:', error);
      return null;
    }
  },

  /**
   * Lấy danh sách hình ảnh của room type
   */
  async getRoomTypeImages(roomTypeId) {
    try {
      console.log('🔄 [HOTEL SERVICE] Fetching room type images for ID:', roomTypeId);
      const response = await axiosClient.get(`/room-types/${roomTypeId}/images`);
      console.log('✅ [HOTEL SERVICE] Room type images response:', response.data);
      return response.data?.data || [];
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching room type images:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách phòng của room type
   */
  async getRoomsByRoomType(roomTypeId) {
    try {
      console.log('🔄 [HOTEL SERVICE] Fetching rooms for room type ID:', roomTypeId);
      const response = await axiosClient.get(`/rooms/room-type/${roomTypeId}`);
      console.log('✅ [HOTEL SERVICE] Rooms response:', response.data);
      return response.data?.data || [];
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching rooms by room type:', error);
      return [];
    }
  },

  // Get complete hotel data (hotel + amenities + images + room types)
  async getCompleteHotelData(hotelId) {
    try {
      console.log('🔄 [HOTEL SERVICE] Fetching complete hotel data for ID:', hotelId);
      
      // Fetch hotel data first
      let hotel = null;
      try {
        console.log('🔄 [HOTEL SERVICE] Fetching hotel by ID...');
        const hotelResponse = await this.getHotelById(hotelId);
        hotel = hotelResponse?.data || hotelResponse;
        console.log('✅ [HOTEL SERVICE] Hotel data fetched:', hotel);
      } catch (hotelError) {
        console.error('❌ [HOTEL SERVICE] Error fetching hotel:', hotelError);
        // Continue with other data even if hotel fetch fails
      }

      // Fetch other data in parallel with better error handling
      console.log('🔄 [HOTEL SERVICE] Fetching amenities, images, and room types...');
      const [amenities, images, roomTypes] = await Promise.allSettled([
        this.getHotelAmenities(hotelId),
        this.getHotelImages(hotelId),
        this.getHotelRoomTypes(hotelId)
      ]);

      const completeData = {
        hotel: hotel,
        amenities: amenities.status === 'fulfilled' ? (amenities.value || []) : [],
        images: images.status === 'fulfilled' ? (images.value || []) : [],  
        roomTypes: roomTypes.status === 'fulfilled' ? (roomTypes.value || []) : []
      };

      console.log('✅ [HOTEL SERVICE] Complete hotel data assembled:', {
        hotel: !!completeData.hotel,
        amenitiesCount: completeData.amenities.length,
        imagesCount: completeData.images.length,
        roomTypesCount: completeData.roomTypes.length
      });
      
      return completeData;
    } catch (error) {
      console.error('❌ [HOTEL SERVICE] Error fetching complete hotel data:', error);
      throw error;
    }
  },
  /**
   * Đặt hình ảnh đại diện cho khách sạn (thumbnail) ngay 18/9
   */
  async setThumbnail(hotelId, imageId) {
    // PATCH endpoint giống như hình ảnh phòng
    return axiosClient.patch(API_ENDPOINTS.HOTEL_IMAGES.SET_THUMBNAIL(hotelId, imageId));
  },
};