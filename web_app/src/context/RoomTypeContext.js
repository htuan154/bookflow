import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import roomTypeService from '../api/roomType.service'; // service thuộc api

const RoomTypeContext = createContext(null);

// unwrap: phòng khi sau này BE trả object thay vì array
function unwrap(res) {
  if (Array.isArray(res)) return res;
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

// toVM: GIỮ nguyên snake_case + THÊM camelCase (UI cũ & mới đều chạy)
function toVM(row) {
  if (!row) return null;
  const id = row.room_type_id ?? row.roomTypeId ?? row.id ?? null;
  const hotelId = row.hotel_id ?? row.hotelId ?? null;

  return {
    ...row, // giữ nguyên dữ liệu gốc (snake_case)

    // alias camelCase
    id,
    roomTypeId: id,
    hotelId,
    name: row.name ?? '',
    description: row.description ?? '',
    maxOccupancy: row.max_occupancy ?? row.maxOccupancy ?? null,
    basePrice: row.base_price ?? row.basePrice ?? null,
    numberOfRooms: row.number_of_rooms ?? row.numberOfRooms ?? null,
    bedType: row.bed_type ?? row.bedType ?? '',
    areaSqm: row.area_sqm ?? row.areaSqm ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
  };
}

export const RoomTypeProvider = ({ children }) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentHotelId, setCurrentHotelId] = useState(null);

  const getByHotel = useCallback(async (hotelId, params = {}) => {
    if (!hotelId) {
      setCurrentHotelId(null);
      setRoomTypes([]);
      return [];
    }
    setLoading(true);
    setError(null);
    setCurrentHotelId(hotelId);
    try {
      const res = await roomTypeService.getByHotel(hotelId, params); // service trả MẢNG
      const list = unwrap(res).map(toVM).filter(Boolean);
      setRoomTypes(list);
      return list;
    } catch (err) {
      setRoomTypes([]);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const listPaginated = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await roomTypeService.listPaginated(params);
      return res?.data ?? res;
    } catch (err) {
      setError(err);
      return { items: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const getById = useCallback(async (id) => {
    const res = await roomTypeService.getById(id);
    const [first] = unwrap(res).map(toVM).filter(Boolean);
    return first ?? toVM(res?.data ?? res);
  }, []);

  // Mutations: xong tự refetch theo currentHotelId
  const create = useCallback(async (payload) => {
    const res = await roomTypeService.create(payload);
    if (currentHotelId) await getByHotel(currentHotelId);
    return res?.data ?? res;
  }, [currentHotelId, getByHotel]);

  const update = useCallback(async (id, payload) => {
    const res = await roomTypeService.update(id, payload);
    if (currentHotelId) await getByHotel(currentHotelId);
    return res?.data ?? res;
  }, [currentHotelId, getByHotel]);

  const remove = useCallback(async (id) => {
    const res = await roomTypeService.remove(id);
    if (currentHotelId) await getByHotel(currentHotelId);
    return res?.data ?? res;
  }, [currentHotelId, getByHotel]);

  const value = useMemo(() => ({
    roomTypes, loading, error, currentHotelId,
    getByHotel, listPaginated, getById,
    create, update, remove,
  }), [roomTypes, loading, error, currentHotelId, getByHotel, listPaginated, getById, create, update, remove]);

  return <RoomTypeContext.Provider value={value}>{children}</RoomTypeContext.Provider>;
};

export const useRoomTypeContext = () => {
  const ctx = useContext(RoomTypeContext);
  if (!ctx) throw new Error('useRoomTypeContext must be used within a RoomTypeProvider');
  return ctx;
};

export { RoomTypeContext };
