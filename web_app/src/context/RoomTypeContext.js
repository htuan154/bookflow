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

// toVM: Xử lý cả snake_case (DB) và camelCase (API response)
function toVM(row) {
  if (!row) return null;
  
  // Ưu tiên camelCase từ API response, fallback về snake_case từ DB
  const id = row.roomTypeId ?? row.room_type_id ?? row.id ?? null;
  const hotelId = row.hotelId ?? row.hotel_id ?? null;

  return {
    ...row, // giữ nguyên dữ liệu gốc

    // Chuẩn hóa thành camelCase
    id,
    roomTypeId: id,
    room_type_id: id, // backup cho UI cũ
    hotelId,
    hotel_id: hotelId, // backup cho UI cũ
    name: row.name ?? '',
    description: row.description ?? '',
    maxOccupancy: row.maxOccupancy ?? row.max_occupancy ?? null,
    max_occupancy: row.maxOccupancy ?? row.max_occupancy ?? null, // backup
    basePrice: row.basePrice ?? row.base_price ?? null,
    base_price: row.basePrice ?? row.base_price ?? null, // backup
    numberOfRooms: row.numberOfRooms ?? row.number_of_rooms ?? null,
    number_of_rooms: row.numberOfRooms ?? row.number_of_rooms ?? null, // backup
    bedType: row.bedType ?? row.bed_type ?? '',
    bed_type: row.bedType ?? row.bed_type ?? '', // backup
    areaSqm: row.areaSqm ?? row.area_sqm ?? null,
    area_sqm: row.areaSqm ?? row.area_sqm ?? null, // backup
    createdAt: row.createdAt ?? row.created_at ?? null,
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
    // Sửa lỗi: validate id trước khi gọi service
    if (!id || id === 'undefined' || id === 'null') {
      console.warn('Invalid room type ID:', id);
      return null;
    }
    
    try {
      const res = await roomTypeService.getById(id);
      if (!res) return null;
      
      const [first] = unwrap(res).map(toVM).filter(Boolean);
      return first ?? toVM(res?.data ?? res);
    } catch (error) {
      console.error('Error in getById:', error);
      setError(error);
      return null;
    }
  }, []);

  // Mutations: xong tự refetch theo currentHotelId
  const create = useCallback(async (payload) => {
    try {
      setError(null);
      const res = await roomTypeService.create(payload);
      if (currentHotelId) {
        await getByHotel(currentHotelId);
      }
      return res?.data ?? res;
    } catch (error) {
      console.error('Error in create room type:', error);
      setError(error);
      throw error;
    }
  }, [currentHotelId, getByHotel]);

  const update = useCallback(async (id, payload) => {
    try {
      setError(null);
      const res = await roomTypeService.update(id, payload);
      if (currentHotelId) {
        await getByHotel(currentHotelId);
      }
      return res?.data ?? res;
    } catch (error) {
      console.error('Error in update room type:', error);
      setError(error);
      throw error;
    }
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
