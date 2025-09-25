// src/hooks/useRoomTypeImage.js
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRoomTypeImageContext } from '../context/RoomTypeImageContext';

/**
 * Hook gốc: trả về toàn bộ context images.
 */
export default function useRoomTypeImage() {
  return useRoomTypeImageContext();
}

/**
 * Quản lý images theo roomTypeId: tự fetch khi id đổi (auto=true),
 * kèm helper upload / delete / setThumbnail với pending state.
 */
export function useRoomTypeImages(roomTypeId, { auto = true } = {}) {
  const { imagesByType, loadingByType, error, getImages, uploadImages, deleteImage, setThumbnail } =
    useRoomTypeImageContext();

  const [uploading, setUploading] = useState(false);
  const [mutating, setMutating] = useState(false);

  const list = useMemo(() => imagesByType[roomTypeId] || [], [imagesByType, roomTypeId]);
  const loading = loadingByType[roomTypeId] || false;

  const refresh = useCallback(async () => {
    if (!roomTypeId) return [];
    return getImages(roomTypeId);
  }, [roomTypeId, getImages]);

  useEffect(() => {
    if (auto && roomTypeId) {
      refresh();
    }
  }, [auto, roomTypeId, refresh]);

  const upload = useCallback(async (files, opts) => {
    if (!roomTypeId || !files?.length) return;
    setUploading(true);
    try { return await uploadImages(roomTypeId, files, opts); }
    finally { setUploading(false); }
  }, [roomTypeId, uploadImages]);

  const remove = useCallback(async (imageId) => {
    if (!roomTypeId || !imageId) return;
    setMutating(true);
    try { return await deleteImage(roomTypeId, imageId); }
    finally { setMutating(false); }
  }, [roomTypeId, deleteImage]);

  const markThumbnail = useCallback(async (imageId) => {
    if (!roomTypeId || !imageId) return;
    setMutating(true);
    try { return await setThumbnail(roomTypeId, imageId); }
    finally { setMutating(false); }
  }, [roomTypeId, setThumbnail]);

  return {
    roomTypeId,
    list,
    loading,
    error,
    uploading,
    mutating,
    refresh,
    upload,
    remove,
    markThumbnail,
  };
}
