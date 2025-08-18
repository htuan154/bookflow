// src/services/roomTypeImage.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const { ROOM_TYPE_IMAGES } = API_ENDPOINTS;

const roomTypeImageService = {
  getImages: (roomTypeId) =>
    axiosClient.get(ROOM_TYPE_IMAGES.GET_IMAGES(roomTypeId)),

  upload: (roomTypeId, files = [], { captions = [], thumbnailIndex = null } = {}) => {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    captions.forEach((c) => form.append('captions[]', c));
    if (thumbnailIndex !== null && thumbnailIndex !== undefined) {
      form.append('thumbnailIndex', String(thumbnailIndex));
    }
    return axiosClient.post(ROOM_TYPE_IMAGES.UPLOAD(roomTypeId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (roomTypeId, imageId) =>
    axiosClient.delete(ROOM_TYPE_IMAGES.DELETE(roomTypeId, imageId)),

  setThumbnail: (roomTypeId, imageId) =>
    axiosClient.patch(ROOM_TYPE_IMAGES.SET_THUMBNAIL(roomTypeId, imageId)),
};

export default roomTypeImageService;
