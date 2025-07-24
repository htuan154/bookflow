// src/api/admin.service.js
import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

const getAllHotels = () => {
  return axiosClient.get(API_ENDPOINTS.ADMIN.GET_ALL_HOTELS_ADMIN);
};

const getPendingHotels = () => {
  return axiosClient.get(API_ENDPOINTS.ADMIN.GET_PENDING_HOTELS);
};

const getHotelStatistics = () => {
  return axiosClient.get(API_ENDPOINTS.ADMIN.GET_HOTEL_STATISTICS);
};

const getHotelsByStatus = (status) => {
  return axiosClient.get(API_ENDPOINTS.ADMIN.GET_HOTELS_BY_STATUS(status));
};

const updateHotelStatus = (hotelId, status) => {
  return axiosClient.patch(API_ENDPOINTS.ADMIN.UPDATE_HOTEL_STATUS(hotelId), { status });
};

const approveHotel = (hotelId) => {
  return axiosClient.post(API_ENDPOINTS.ADMIN.APPROVE_HOTEL(hotelId));
};

const rejectHotel = (hotelId) => {
  return axiosClient.post(API_ENDPOINTS.ADMIN.REJECT_HOTEL(hotelId));
};

const restoreHotel = (hotelId) => {
  return axiosClient.post(API_ENDPOINTS.ADMIN.RESTORE_HOTEL(hotelId));
};

export const adminService = {
  getAllHotels,
  getPendingHotels,
  getHotelStatistics,
  getHotelsByStatus,
  updateHotelStatus,
  approveHotel,
  rejectHotel,
  restoreHotel,
};
