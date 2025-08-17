// src/api/hotelAmenity.service.js
import { API_ENDPOINTS } from '../config/apiEndpoints';

const makeApiCall = async (url, options = {}) => {
  try {
    let token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt');

    console.log('🔍 HotelAmenity API ->', url);
    if (!token) throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      //credentials: 'include',
    });

    console.log('📡 HotelAmenity status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        [
          'accessToken','access_token','token','authToken','jwt',
          'refreshToken','user',
        ].forEach(k => localStorage.removeItem(k));
        window.location.href = '/login';
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('💥 Hotel Amenity API failed:', err);
    throw err;
  }
};

const E = API_ENDPOINTS.HOTEL_AMENITIES || {};
// map đúng tên trong apiEndpoints.js, có fallback cho tên cũ
const urlList   = (hotelId)               => (E.GET_FOR_HOTEL?.(hotelId)      ?? E.LIST?.(hotelId));
const urlAdd    = (hotelId)               => (E.ADD_TO_HOTEL?.(hotelId)       ?? E.ADD?.(hotelId));
const urlRemove = (hotelId, amenityId)    => (E.REMOVE_FROM_HOTEL?.(hotelId, amenityId) ?? E.REMOVE?.(hotelId, amenityId));

const hotelAmenityService = {
  // GET /hotels/:hotelId/amenities
  listByHotel: async (hotelId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page)  query.append('page',  params.page);
    if (params.limit) query.append('limit', params.limit);

    const base = urlList(hotelId);
    if (!base) throw new Error('HOTEL_AMENITIES.GET_FOR_HOTEL chưa được cấu hình');

    const url = `${base}${query.toString() ? `?${query}` : ''}`;
    return makeApiCall(url);
  },

  // POST /hotels/:hotelId/amenities  (body: { amenity_id })
  addToHotel: async (hotelId, payload) => {
    const base = urlAdd(hotelId);
    if (!base) throw new Error('HOTEL_AMENITIES.ADD_TO_HOTEL chưa được cấu hình');

    return makeApiCall(base, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // DELETE /hotels/:hotelId/amenities/:amenityId
  removeFromHotel: async (hotelId, amenityId) => {
    const base = urlRemove(hotelId, amenityId);
    if (!base) throw new Error('HOTEL_AMENITIES.REMOVE_FROM_HOTEL chưa được cấu hình');

    return makeApiCall(base, { method: 'DELETE' });
  },
};

export default hotelAmenityService;
