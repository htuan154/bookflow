// src/hooks/useRoom.js
import { useCallback, useEffect, useState } from 'react';
import { useRoomContext } from '../context/RoomContext';

/**
 * Lấy danh sách phòng theo roomTypeId.
 * options: { auto?: boolean, params?: object }
 */
export function useRoomsOfType(roomTypeId, { auto = true, params = {} } = {}) {
  const { getByRoomType, loading, error } = useRoomContext();
  const [list, setList] = useState([]);

  const load = useCallback(async () => {
    if (!roomTypeId) { setList([]); return []; }
    const data = await getByRoomType(roomTypeId, params);
    setList(Array.isArray(data) ? data : []);
    return data;
  }, [roomTypeId, params, getByRoomType]);

  // Sửa lại dependency cho useEffect, chỉ phụ thuộc vào roomTypeId, auto, params
  useEffect(() => {
    if (auto) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, roomTypeId, JSON.stringify(params)]);

  return { list, loading, error, refresh: load };
}

/**
 * Các hành động tạo/sửa/xóa… phòng.
 * opts: { roomTypeId?: number|string, hotelId?: number|string }
 */
export function useRoomEditor({ roomTypeId, hotelId } = {}) {
  const { create, update, remove, updateStatus, getByRoomType } = useRoomContext();
  const [pending, setPending] = useState(false);

  const wrap = (fn) => async (...args) => {
    try {
      setPending(true);
      const res = await fn(...args);
      if (roomTypeId) await getByRoomType(roomTypeId);
      return res;
    } finally {
      setPending(false);
    }
  };

  const createRoom = wrap(async (payload) => {
    const data = {
      ...payload,
      room_type_id: payload?.room_type_id ?? roomTypeId,
      hotel_id: payload?.hotel_id ?? hotelId,
    };
    return create(data);
  });

  const updateRoom = wrap((roomId, payload) => update(roomId, payload));
  const deleteRoom = wrap((roomId) => remove(roomId, { roomTypeId }));
  const changeStatus = wrap((roomId, status) => updateStatus(roomId, status));

  return { pending, createRoom, updateRoom, deleteRoom, changeStatus };
}

/**
 * Export mặc định: trả về toàn bộ context phòng.
 */
export default function useRoom() {
  return useRoomContext();
}

