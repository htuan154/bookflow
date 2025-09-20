import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRoomTypeContext } from '../context/RoomTypeContext';

export default function useRoomType() {
  return useRoomTypeContext();
}

export function useRoomTypeList({
  hotelId,
  auto = true,
  initialParams = { page: 1, limit: 10, search: '', sortBy: 'created_at', sortOrder: 'desc' },
} = {}) {
  const { roomTypes, loading, error, getByHotel } = useRoomTypeContext();
  const [params, setParams] = useState(initialParams);

  const refresh = useCallback(async (override) => {
    if (!hotelId) return [];
    const p = { ...params, ...(override || {}) };
    return getByHotel(hotelId, p);
  }, [hotelId, params, getByHotel]);

  useEffect(() => {
    if (auto && hotelId) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, auto]); // Loại bỏ các params phụ nếu không cần thiết

  return { list: roomTypes, loading, error, params, setParams, refresh };
}

export function useRoomTypeEditor() {
  const { create, update, remove } = useRoomTypeContext();
  const [pending, setPending] = useState(false);

  const createType = useCallback(async (payload) => {
    setPending(true);
    try { return await create(payload); }
    finally { setPending(false); }
  }, [create]);

  const updateType = useCallback(async (id, payload) => {
    setPending(true);
    try { return await update(id, payload); }
    finally { setPending(false); }
  }, [update]);

  const deleteType = useCallback(async (id) => {
    setPending(true);
    try { return await remove(id); }
    finally { setPending(false); }
  }, [remove]);

  return { pending, createType, updateType, deleteType };
}

export function useRoomTypeById(roomTypeId) {
  const { roomTypes } = useRoomTypeContext();
  return useMemo(() => {
    // Sửa lỗi: validate roomTypeId trước khi tìm
    if (!roomTypeId || roomTypeId === 'undefined' || roomTypeId === 'null') {
      return null;
    }
    
    // So sánh UUID string trực tiếp
    const searchId = String(roomTypeId).toLowerCase();
    return roomTypes.find(rt => {
      const rtId = rt?.room_type_id ?? rt?.id;
      return String(rtId).toLowerCase() === searchId;
    }) || null;
  }, [roomTypes, roomTypeId]);
}
