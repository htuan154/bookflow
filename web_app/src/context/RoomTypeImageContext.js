// src/context/RoomTypeImageContext.js
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import roomTypeImageService from '../api/roomTypeImage.service';

const RoomTypeImageContext = createContext(null);

const unwrap = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

export const RoomTypeImageProvider = ({ children }) => {
  // { [roomTypeId]: Image[] }
  const [imagesByType, setImagesByType] = useState({});
  const [loadingByType, setLoadingByType] = useState({}); // optional fine-grain loading
  const [error, setError] = useState(null);

  const setLoading = (id, v) =>
    setLoadingByType((prev) => ({ ...prev, [id]: v }));

  const getImages = useCallback(async (roomTypeId) => {
    setLoading(roomTypeId, true); setError(null);
    try {
      const res = await roomTypeImageService.getImages(roomTypeId);
      const list = unwrap(res);
      setImagesByType((prev) => ({ ...prev, [roomTypeId]: list }));
      return list;
    } catch (e) {
      setError(e); throw e;
    } finally { setLoading(roomTypeId, false); }
  }, []);

  const uploadImages = useCallback(async (roomTypeId, files, options) => {
    await roomTypeImageService.upload(roomTypeId, files, options);
    return getImages(roomTypeId);
  }, [getImages]);

  const deleteImage = useCallback(async (roomTypeId, imageId) => {
    await roomTypeImageService.delete(roomTypeId, imageId);
    return getImages(roomTypeId);
  }, [getImages]);

  const setThumbnail = useCallback(async (roomTypeId, imageId) => {
    await roomTypeImageService.setThumbnail(roomTypeId, imageId);
    return getImages(roomTypeId);
  }, [getImages]);

  const value = useMemo(() => ({
    // state
    imagesByType, loadingByType, error,
    // actions
    getImages, uploadImages, deleteImage, setThumbnail,
  }), [imagesByType, loadingByType, error,
      getImages, uploadImages, deleteImage, setThumbnail]);

  return (
    <RoomTypeImageContext.Provider value={value}>
      {children}
    </RoomTypeImageContext.Provider>
  );
};

export const useRoomTypeImageContext = () => {
  const ctx = useContext(RoomTypeImageContext);
  if (!ctx) throw new Error('useRoomTypeImageContext must be used within a RoomTypeImageProvider');
  return ctx;
};
