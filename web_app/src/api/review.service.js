// src/api/review.service.js

import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const reviewService = {

  // Lấy review theo bookingId
  getByBookingId: async (bookingId) => {
    const res = await axios.get(`${API_ENDPOINTS.REVIEWS.GET_FOR_BOOKING(bookingId)}`);
    return res.data.data;
  },

  // Lấy review phân trang theo hotelId (trả về giống hotel.service.js)
  getPagedByHotelId: async (hotelId, page = 1, limit = 10) => {
    const res = await axios.get(API_ENDPOINTS.REVIEWS.GET_FOR_HOTEL(hotelId), { params: { page, limit } });
    const reviews = Array.isArray(res.data?.data) ? res.data.data : [];
    const totalCount = res.data?.totalCount || res.data?.total || reviews.length;
    return {
      data: reviews,
      totalCount,
      total: totalCount
    };
  },


  // Tạo review mới
  create: async (reviewData) => {
    const res = await axios.post(API_ENDPOINTS.REVIEWS.CREATE, reviewData);
    return res.data.data;
  },


  // Xóa review
  delete: async (reviewId) => {
    const res = await axios.delete(API_ENDPOINTS.REVIEWS.DELETE(reviewId));
    return res.data.data;
  },


  // Cập nhật sub ratings
  updateSubRatings: async (reviewId, ratings) => {
    const res = await axios.patch(`${API_ENDPOINTS.REVIEWS.DELETE(reviewId)}/ratings`, ratings);
    return res.data.data;
  },
};

export default reviewService;
