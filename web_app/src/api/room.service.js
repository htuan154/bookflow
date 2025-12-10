// src/services/room.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const { ROOMS } = API_ENDPOINTS;

const roomService = {
  // Core CRUD
  create: (payload) => axiosClient.post(ROOMS.CREATE, payload),
  list: (params = {}) => axiosClient.get(ROOMS.GET_ALL, { params }),
  search: (params = {}) => axiosClient.get(ROOMS.SEARCH, { params }),

  getById: (id) => axiosClient.get(ROOMS.GET_BY_ID(id)),
  getDetails: (id) => axiosClient.get(ROOMS.GET_DETAILS(id)),
  update: (id, payload) => axiosClient.put(ROOMS.UPDATE(id), payload),
  updateStatus: (id, status) => axiosClient.patch(ROOMS.UPDATE_STATUS(id), { status }),
  remove: (id) => axiosClient.delete(ROOMS.DELETE(id)),

  // Filters & relations
  getByStatus: (status, params = {}) =>
    axiosClient.get(ROOMS.GET_BY_STATUS(status), { params }),

  getByHotel: (hotelId, params = {}) =>
    axiosClient.get(ROOMS.GET_BY_HOTEL(hotelId), { params }),

  getAvailableByHotel: (hotelId, params = {}) =>
    axiosClient.get(ROOMS.GET_AVAILABLE_BY_HOTEL(hotelId), { params }),

  getStatsByHotel: (hotelId) => axiosClient.get(ROOMS.GET_STATS_BY_HOTEL(hotelId)),

  getByRoomType: (roomTypeId, params = {}) => {
    console.log('roomService.getByRoomType called with:', roomTypeId);
    return axiosClient.get(ROOMS.GET_BY_ROOM_TYPE(roomTypeId), { params });
  },

  // Bulk create rooms
  bulkCreate: (payload) => axiosClient.post(ROOMS.BULK, payload),

  // Bulk delete rooms
  bulkDelete: (roomIds) => {
    console.log('🔍 [ROOM SERVICE] Bulk delete called with roomIds:', roomIds);
    console.log('🔍 [ROOM SERVICE] Request URL:', ROOMS.BULK);
    console.log('🔍 [ROOM SERVICE] Request payload:', { roomIds });
    return axiosClient.delete(ROOMS.BULK, { data: { roomIds } })
      .catch(error => {
        console.error('❌ [ROOM SERVICE] Bulk delete error:', error);
        console.error('❌ [ROOM SERVICE] Error response:', error.response?.data);
        console.error('❌ [ROOM SERVICE] Error status:', error.response?.status);
        throw error;
      });
  },

  // Availability
  checkAvailability: (id, params = {}) =>
    axiosClient.get(ROOMS.CHECK_AVAILABILITY(id), { params }),
};

export default roomService;
