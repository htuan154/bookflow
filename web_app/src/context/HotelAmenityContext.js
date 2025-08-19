// src/context/HotelAmenityContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import hotelAmenityService from '../api/hotelAmenity.service';

const HotelAmenityContext = createContext();

export const useHotelAmenityContext = () => {
  const ctx = useContext(HotelAmenityContext);
  if (!ctx) throw new Error('useHotelAmenityContext must be used within a HotelAmenityProvider');
  return ctx;
};

const normalize = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.amenities)) return res.data.amenities;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

export const HotelAmenityProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1, totalPages: 1, totalItems: 0,
    itemsPerPage: 10, hasNextPage: false, hasPrevPage: false,
  });

  const fetchByHotel = useCallback(async (hotelId, options = {}) => {
    try {
      setLoading(true); setError(null);
      const params = {
        page: options.page || pagination.currentPage,
        limit: options.limit || pagination.itemsPerPage,
      };
      const res = await hotelAmenityService.listByHotel(hotelId, params);

      // luôn chuẩn hoá thành mảng & TRẢ VỀ
      const arr = normalize(res);
      setItems(arr);

      // cố gắng đồng bộ phân trang nếu có
      const p = res?.data?.pagination || res?.pagination;
      if (p) setPagination(prev => ({ ...prev, ...p }));

      return arr; // <<< QUAN TRỌNG
    } catch (err) {
      console.error('fetchByHotel error:', err);
      setError(err.message || 'Không thể tải danh sách tiện nghi của khách sạn');
      setItems([]);
      return []; // <<< luôn trả mảng
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage]);

  const addAmenity = useCallback(async (hotelId, amenityId) => {
    try {
      setLoading(true); setError(null);
      const res = await hotelAmenityService.addToHotel(hotelId, { amenity_id: amenityId });
      await fetchByHotel(hotelId);
      return res;
    } catch (err) {
      setError(err.message || 'Không thể gán tiện nghi cho khách sạn');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchByHotel]);

  const removeAmenity = useCallback(async (hotelId, amenityId) => {
    try {
      setLoading(true); setError(null);
      const res = await hotelAmenityService.removeFromHotel(hotelId, amenityId);
      await fetchByHotel(hotelId);
      return res;
    } catch (err) {
      setError(err.message || 'Không thể gỡ tiện nghi khỏi khách sạn');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchByHotel]);

  const clearError = () => setError(null);

  return (
    <HotelAmenityContext.Provider value={{
      items, loading, error, pagination,
      fetchByHotel, addAmenity, removeAmenity,
      setPagination: (p) => setPagination(prev => ({ ...prev, ...p })),
      clearError,
    }}>
      {children}
    </HotelAmenityContext.Provider>
  );
};
