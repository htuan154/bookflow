// src/context/RoomContext.js
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import roomService from '../api/room.service'; // chỉnh path nếu bạn đặt khác

export const RoomContext = createContext(null);

const asArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);           // list theo KS
  const [roomsByType, setRoomsByType] = useState({}); // map roomTypeId -> list
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentHotelId, setCurrentHotelId] = useState(null);

  const getByHotel = useCallback(async (hotelId, params = {}) => {
    if (!hotelId) { setRooms([]); return []; }
    setLoading(true); setError(null); setCurrentHotelId(hotelId);
    try {
      const res = await roomService.getByHotel(hotelId, params);
      const list = asArray(res);
      setRooms(list);
      return list;
    } catch (e) {
      setError(e);
      throw e;
    } finally { setLoading(false); }
  }, []);

  const getByRoomType = useCallback(async (roomTypeId, params = {}) => {
    if (!roomTypeId) return [];
    if (error) return []; // Nếu đang có lỗi, không gọi lại API
    setLoading(true); setError(null);
    try {
      const res = await roomService.getByRoomType(roomTypeId, params);
      const list = asArray(res);
      setRoomsByType(prev => ({ ...prev, [roomTypeId]: list }));
      return list;
    } catch (e) {
      setError(e);
      return [];
    } finally { setLoading(false); }
  }, [error]);

  const create = useCallback(async (payload) => {
    const res = await roomService.create(payload);
    const typeId = payload?.room_type_id ?? payload?.roomTypeId;
    const hid = currentHotelId;
    if (typeId) await getByRoomType(typeId);
    if (hid) await getByHotel(hid);
    return res?.data ?? res;
  }, [currentHotelId, getByHotel, getByRoomType]);

  const update = useCallback(async (roomId, payload) => {
    const res = await roomService.update(roomId, payload);
    const typeId = payload?.room_type_id ?? payload?.roomTypeId;
    const hid = currentHotelId;
    if (typeId) await getByRoomType(typeId);
    if (hid) await getByHotel(hid);
    return res?.data ?? res;
  }, [currentHotelId, getByHotel, getByRoomType]);

  const updateStatus = useCallback(async (roomId, status) => {
    const res = await roomService.updateStatus(roomId, status);
    const hid = currentHotelId;
    if (hid) await getByHotel(hid);
    return res?.data ?? res;
  }, [currentHotelId, getByHotel]);

  const remove = useCallback(async (roomId, { roomTypeId } = {}) => {
    const res = await roomService.remove(roomId);
    if (roomTypeId) await getByRoomType(roomTypeId);
    if (currentHotelId) await getByHotel(currentHotelId);
    return res?.data ?? res;
  }, [currentHotelId, getByHotel, getByRoomType]);

  const value = useMemo(() => ({
    rooms, roomsByType, loading, error, currentHotelId,
    getByHotel, getByRoomType, create, update, updateStatus, remove
  }), [rooms, roomsByType, loading, error, currentHotelId,
      getByHotel, getByRoomType, create, update, updateStatus, remove]);

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRoomContext = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoomContext must be used within a RoomProvider');
  return ctx;
};
