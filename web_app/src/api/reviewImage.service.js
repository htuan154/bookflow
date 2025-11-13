// src/api/reviewImage.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const reviewImageService = {
  /**
   * Lấy tất cả hình ảnh của một review
   * @param {string} reviewId - ID của review
   * @returns {Promise<Array>} Danh sách hình ảnh
   */
  getImagesByReviewId: async (reviewId) => {
    try {
      const res = await axiosClient.get(API_ENDPOINTS.REVIEW_IMAGES.GET_IMAGES(reviewId));
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (error) {
      console.error('Error fetching review images:', error);
      throw error;
    }
  },

  /**
   * Upload hình ảnh cho review
   * @param {string} reviewId - ID của review
   * @param {Array<string>} imageUrls - Mảng các URL hình ảnh
   * @returns {Promise<Array>} Danh sách hình ảnh đã upload
   */
  uploadImages: async (reviewId, imageUrls) => {
    try {
      const res = await axiosClient.post(API_ENDPOINTS.REVIEW_IMAGES.UPLOAD(reviewId), {
        image_urls: imageUrls
      });
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (error) {
      console.error('Error uploading review images:', error);
      throw error;
    }
  },

  /**
   * Xóa một hình ảnh của review
   * @param {string} imageId - ID của hình ảnh
   * @returns {Promise<boolean>}
   */
  deleteImage: async (imageId) => {
    try {
      await axiosClient.delete(API_ENDPOINTS.REVIEW_IMAGES.DELETE(imageId));
      return true;
    } catch (error) {
      console.error('Error deleting review image:', error);
      throw error;
    }
  },
};

export default reviewImageService;
