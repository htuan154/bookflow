import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

function toArray(res) {
  const p = res?.data ?? res;
  if (Array.isArray(p)) return p;
  if (Array.isArray(p?.data)) return p.data;
  if (Array.isArray(p?.items)) return p.items;
  if (Array.isArray(p?.data?.items)) return p.data.items;
  if (Array.isArray(p?.data?.data)) return p.data.data;
  return [];
}

const roomTypeService = {
  async getByHotel(hotelId, params = {}) {
    if (!hotelId) return [];
    const res = await axiosClient.get(API_ENDPOINTS.ROOM_TYPES.GET_BY_HOTEL(hotelId), { params });
    return toArray(res); // ⬅️ trả về MẢNG luôn
  },

  async listPaginated(params = {}) {
    const res = await axiosClient.get(API_ENDPOINTS.ROOM_TYPES.GET_PAGINATED, { params });
    return res?.data ?? res;
  },

  async getById(roomTypeId) {
    // Sửa lỗi: UUID không cần parse thành integer
    if (!roomTypeId || roomTypeId === 'undefined' || roomTypeId === 'null') {
      console.warn('Invalid roomTypeId:', roomTypeId);
      return null;
    }
    
    // Validate UUID format (optional)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomTypeId)) {
      console.warn('roomTypeId is not a valid UUID:', roomTypeId);
      return null;
    }
    
    try {
      const res = await axiosClient.get(API_ENDPOINTS.ROOM_TYPES.GET_BY_ID(roomTypeId));
      const arr = toArray(res);
      return arr[0] ?? (res?.data ?? res);
    } catch (error) {
      console.error('Error fetching room type by ID:', error);
      throw error;
    }
  },

  async create(payload) {
    try {
      const res = await axiosClient.post(API_ENDPOINTS.ROOM_TYPES.CREATE, payload);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  async update(roomTypeId, payload) {
    try {
      // Sửa lỗi: UUID không cần validate như integer
      if (!roomTypeId || roomTypeId === 'undefined' || roomTypeId === 'null') {
        throw new Error('Invalid room type ID for update');
      }
      
      const res = await axiosClient.put(API_ENDPOINTS.ROOM_TYPES.UPDATE(roomTypeId), payload);
      return res?.data ?? res;
    } catch (error) {
      throw error;
    }
  },

  async remove(roomTypeId) {
    const res = await axiosClient.delete(API_ENDPOINTS.ROOM_TYPES.DELETE(roomTypeId));
    return res?.data ?? res;
  },
};


export default roomTypeService;
