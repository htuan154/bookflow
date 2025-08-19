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
    const res = await axiosClient.get(API_ENDPOINTS.ROOM_TYPES.GET_BY_ID(roomTypeId));
    const arr = toArray(res);
    return arr[0] ?? (res?.data ?? res);
  },

  async create(payload) {
    const res = await axiosClient.post(API_ENDPOINTS.ROOM_TYPES.CREATE, payload);
    return res?.data ?? res;
  },

  async update(roomTypeId, payload) {
    const res = await axiosClient.put(API_ENDPOINTS.ROOM_TYPES.UPDATE(roomTypeId), payload);
    return res?.data ?? res;
  },

  async remove(roomTypeId) {
    const res = await axiosClient.delete(API_ENDPOINTS.ROOM_TYPES.DELETE(roomTypeId));
    return res?.data ?? res;
  },
};

export default roomTypeService;
