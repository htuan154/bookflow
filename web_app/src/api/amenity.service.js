// src/api/amenity.service.js
import { API_ENDPOINTS } from '../config/apiEndpoints';


const makeApiCall = async (url, options = {}) => {
  try {
    // Lấy token theo nhiều key giống mẫu
    let token = localStorage.getItem('accessToken') ||
                localStorage.getItem('access_token') ||
                localStorage.getItem('token') ||
                localStorage.getItem('authToken') ||
                localStorage.getItem('jwt');

    // Debug (giữ lại nếu bạn muốn theo dõi như mẫu blog)
    console.log('🔍 Amenity API call ->', url);
    console.log('👤 Token exists:', !!token);

    if (!token) {
      console.error('❌ No authentication token found!');
      throw new Error('Bạn cần đăng nhập để truy cập tính năng này');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    console.log('📡 Amenity response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        console.error('🚫 401 Unauthorized - Token expired or invalid');
        // Clear các key phổ biến
        localStorage.removeItem('accessToken');
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('jwt');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        window.location.href = '/login';
        throw new Error('Phiên đăng nhập đã hết hạn');
      }

      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('💥 Amenity API call failed:', error);
    throw error;
  }
};

/**
 * Amenity Service - API functions
 * Bạn cần định nghĩa các endpoint sau trong API_ENDPOINTS.AMENITIES giống cách BLOGS được làm:
 * - GET_ALL:        string
 * - GET_BY_ID:      (id) => string
 * - CREATE:         string
 * - UPDATE:         (id) => string
 * - DELETE:         (id) => string
 * - SEARCH:         string (optional)
 * - GET_BY_HOTEL:   (hotelId) => string (optional)
 */
const amenityService = {
  // PUBLIC ENDPOINTS
  getAllAmenities: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.hotelId) query.append('hotelId', params.hotelId);

    const url = `${API_ENDPOINTS.AMENITIES.GET_ALL}${query.toString() ? `?${query}` : ''}`;
    return await makeApiCall(url);
  },

  getAmenityById: async (amenityId) => {
    return await makeApiCall(API_ENDPOINTS.AMENITIES.GET_BY_ID(amenityId));
  },

  searchAmenities: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.append('q', params.q);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.hotelId) query.append('hotelId', params.hotelId);

    const url = `${API_ENDPOINTS.AMENITIES.SEARCH}?${query}`;
    return await makeApiCall(url);
  },

  getAmenitiesByHotel: async (hotelId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const url = `${API_ENDPOINTS.AMENITIES.GET_BY_HOTEL(hotelId)}${query.toString() ? `?${query}` : ''}`;
    return await makeApiCall(url);
  },

  // ADMIN ENDPOINTS
  createAmenity: async (data) => {
    return await makeApiCall(API_ENDPOINTS.AMENITIES.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAmenity: async (amenityId, data) => {
    return await makeApiCall(API_ENDPOINTS.AMENITIES.UPDATE(amenityId), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAmenity: async (amenityId) => {
    return await makeApiCall(API_ENDPOINTS.AMENITIES.DELETE(amenityId), {
      method: 'DELETE',
    });
  },
};

export default amenityService;
