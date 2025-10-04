// src/services/roomTypeImage.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import axios from 'axios';

const roomTypeImageService = {
  /**
   * Lấy tất cả hình ảnh của một loại phòng
   * @param {string} roomTypeId - ID của loại phòng
   * @returns {Promise<Array>} Danh sách hình ảnh
   */
  getImages: async (roomTypeId) => {
    try {
      const response = await axiosClient.get(API_ENDPOINTS.ROOM_TYPE_IMAGES.GET_IMAGES(roomTypeId));
      return response?.data?.data || response?.data || [];
    } catch (error) {
      console.error('Error fetching room type images:', error);
      throw error;
    }
  },

  /**
   * Upload hình ảnh bằng file
   * @param {string} roomTypeId - ID của loại phòng
   * @param {FormData} formData - FormData chứa file và caption
   * @returns {Promise<Object>} Response từ server
   */
  uploadFile: async (roomTypeId, formData) => {
    try {
      const response = await axiosClient.post(
        API_ENDPOINTS.ROOM_TYPE_IMAGES.UPLOAD(roomTypeId), 
        formData, 
        {
          headers: { 
            'Content-Type': 'multipart/form-data' 
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Upload hình ảnh bằng URL
   * @param {string} roomTypeId - ID của loại phòng
   * @param {Object} payload - { image_url, caption }
   * @returns {Promise<Object>} Response từ server
   */
  uploadUrl: async (roomTypeId, payload) => {
    // Kiểm tra roomTypeId hợp lệ
    if (!roomTypeId || typeof roomTypeId !== 'string' || roomTypeId.length < 10) {
      throw new Error('Room Type ID không hợp lệ');
    }

    // Kiểm tra image_url hợp lệ - chỉ kiểm tra format URL cơ bản
    if (!payload.image_url || !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(payload.image_url)) {
      throw new Error('URL hình ảnh phải là URL hợp lệ và có định dạng ảnh (jpg, png, gif, webp)');
    }

    // Gửi theo format mà BE expect: { images: [...] }
    const requestData = {
      images: [
        {
          image_url: payload.image_url,
          caption: payload.caption || '',
          is_thumbnail: false
        }
      ]
    };

    try {
      const response = await axiosClient.post(
        API_ENDPOINTS.ROOM_TYPE_IMAGES.UPLOAD(roomTypeId),
        requestData
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading URL:', error);
      
      // Xử lý error message từ server
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Có lỗi xảy ra khi thêm hình ảnh từ URL');
    }
  },

  /**
   * Upload nhiều file cùng lúc
   * @param {string} roomTypeId - ID của loại phòng
   * @param {Array<File>} files - Danh sách file
   * @param {Array<string>} captions - Danh sách caption tương ứng
   * @returns {Promise<Object>} Response từ server
   */
  uploadMultiple: async (roomTypeId, files, captions = []) => {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file);
        formData.append('captions', captions[index] || '');
      });
      
      const response = await axiosClient.post(
        `${API_ENDPOINTS.ROOM_TYPE_IMAGES.UPLOAD(roomTypeId)}/multiple`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  },

  /**
   * Xóa hình ảnh
   * @param {string} roomTypeId - ID của loại phòng
   * @param {string} imageId - ID của hình ảnh
   * @returns {Promise<Object>} Response từ server
   */
  deleteImage: async (roomTypeId, imageId) => {
    try {
      const response = await axiosClient.delete(API_ENDPOINTS.ROOM_TYPE_IMAGES.DELETE(roomTypeId, imageId));
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  /**
   * Đặt hình ảnh làm thumbnail
   * @param {string} roomTypeId - ID của loại phòng
   * @param {string} imageId - ID của hình ảnh
   * @returns {Promise<Object>} Response từ server
   */
  setThumbnail: async (roomTypeId, imageId) => {
    try {
      // Đúng: dùng PATCH và endpoint khớp với backend
      const response = await axiosClient.patch(API_ENDPOINTS.ROOM_TYPE_IMAGES.SET_THUMBNAIL(roomTypeId, imageId));
      return response.data;
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin hình ảnh (caption, thứ tự...)
   * @param {string} roomTypeId - ID của loại phòng
   * @param {string} imageId - ID của hình ảnh
   * @param {Object} updateData - Dữ liệu cập nhật
   * @returns {Promise<Object>} Response từ server
   */
  updateImage: async (roomTypeId, imageId, updateData) => {
    try {
      const response = await axiosClient.put(
        `${API_ENDPOINTS.ROOM_TYPE_IMAGES.DELETE(roomTypeId, imageId)}`,
        updateData
      );
      return response.data;
    } catch (error) {
      console.error('Error updating image:', error);
      throw error;
    }
  },

  /**
   * Sắp xếp thứ tự hình ảnh
   * @param {string} roomTypeId - ID của loại phòng
   * @param {Array<string>} imageIds - Danh sách ID hình ảnh theo thứ tự mới
   * @returns {Promise<Object>} Response từ server
   */
  reorderImages: async (roomTypeId, imageIds) => {
    try {
      const response = await axiosClient.put(
        `${API_ENDPOINTS.ROOM_TYPE_IMAGES.GET_IMAGES(roomTypeId)}/reorder`,
        { imageIds }
      );
      return response.data;
    } catch (error) {
      console.error('Error reordering images:', error);
      throw error;
    }
  },

  /**
   * Xóa nhiều hình ảnh cùng lúc
   * @param {string} roomTypeId - ID của loại phòng
   * @param {Array<string>} imageIds - Danh sách ID hình ảnh cần xóa
   * @returns {Promise<Object>} Response từ server
   */
  deleteMultiple: async (roomTypeId, imageIds) => {
    try {
      const response = await axiosClient.delete(
        `${API_ENDPOINTS.ROOM_TYPE_IMAGES.GET_IMAGES(roomTypeId)}/multiple`,
        { data: { imageIds } }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      throw error;
    }
  },

  /**
   * Lấy thông tin chi tiết của một hình ảnh
   * @param {string} roomTypeId - ID của loại phòng
   * @param {string} imageId - ID của hình ảnh
   * @returns {Promise<Object>} Thông tin hình ảnh
   */
  getImageDetails: async (roomTypeId, imageId) => {
    try {
      const response = await axiosClient.get(
        API_ENDPOINTS.ROOM_TYPE_IMAGES.DELETE(roomTypeId, imageId)
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching image details:', error);
      throw error;
    }
  }
};

export default roomTypeImageService;

