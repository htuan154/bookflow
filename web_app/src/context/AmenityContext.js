// src/context/AmenityContext.js


import React, { createContext, useContext, useState, useCallback } from 'react';
import amenityService from '../api/amenity.service';

const AmenityContext = createContext();

export const useAmenityContext = () => {
  const ctx = useContext(AmenityContext);
  if (!ctx) throw new Error('useAmenityContext must be used within an AmenityProvider');
  return ctx;
};

export const AmenityProvider = ({ children }) => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Fetch danh sách tiện nghi (public hoặc admin đều dùng)
  const fetchAmenities = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: options.page || pagination.currentPage,
        limit: options.limit || pagination.itemsPerPage,
        search: options.search || '',
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'desc',
        hotelId: options.hotelId,
      };

      const response = await amenityService.getAllAmenities(params);

      if (response.success) {
        // giả định backend trả { success, data: { amenities, pagination } }
        setAmenities(response.data.amenities || response.data.items || []);
        setPagination(prev => ({
          ...prev,
          ...(response.data.pagination || {}),
        }));
      } else {
        // fallback: nếu trả mảng thuần hoặc cấu trúc khác
        const items = response.data?.amenities || response.items || response.data || response || [];
        setAmenities(Array.isArray(items) ? items : []);
        if (response.pagination) {
          setPagination(prev => ({ ...prev, ...response.pagination }));
        }
      }
    } catch (err) {
      console.error('Error fetching amenities:', err);
      setError(err.message || 'Không thể tải danh sách tiện nghi');
      setAmenities([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage]);

  const createAmenity = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await amenityService.createAmenity(data);
      // Option 1: refetch list
      await fetchAmenities();
      return res;
    } catch (err) {
      setError(err.message || 'Không thể tạo tiện nghi');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAmenities]);

  const updateAmenity = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const res = await amenityService.updateAmenity(id, data);
      await fetchAmenities();
      return res;
    } catch (err) {
      setError(err.message || 'Không thể cập nhật tiện nghi');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAmenities]);

  const deleteAmenity = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const res = await amenityService.deleteAmenity(id);
      await fetchAmenities();
      return res;
    } catch (err) {
      setError(err.message || 'Không thể xoá tiện nghi');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAmenities]);

  const clearError = () => setError(null);

  const value = {
    amenities,
    loading,
    error,
    pagination,
    fetchAmenities,
    createAmenity,
    updateAmenity,
    deleteAmenity,
    setPagination: (p) => setPagination(prev => ({ ...prev, ...p })),
    clearError,
  };

  return (
    <AmenityContext.Provider value={value}>
      {children}
    </AmenityContext.Provider>
  );
};
