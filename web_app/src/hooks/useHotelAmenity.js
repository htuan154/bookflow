// src/hooks/useHotelAmenity.js
import { useCallback, useState } from 'react';
import { useHotelAmenityContext } from '../context/HotelAmenityContext';

const useHotelAmenity = () => {
  const ctx = useHotelAmenityContext();
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const clearLocalError = useCallback(() => setLocalError(null), []);
  const setError = useCallback((err) => setLocalError(err), []);

  const getByHotel = useCallback(async (hotelId, params = {}) => {
    try {
      setLocalLoading(true); clearLocalError();
      // TRẢ VỀ mảng từ context.fetchByHotel
      const arr = await ctx.fetchByHotel(hotelId, params);
      return Array.isArray(arr) ? arr : [];
    } catch (error) {
      setError(error.message);
      return [];
    } finally {
      setLocalLoading(false);
    }
  }, [ctx, clearLocalError, setError]);

  const addAmenity = useCallback(async (hotelId, amenityId) => {
    try {
      setLocalLoading(true); clearLocalError();
      return await ctx.addAmenity(hotelId, amenityId);
    } catch (error) {
      setError(error.message); throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [ctx, clearLocalError, setError]);

  const removeAmenity = useCallback(async (hotelId, amenityId) => {
    try {
      setLocalLoading(true); clearLocalError();
      return await ctx.removeAmenity(hotelId, amenityId);
    } catch (error) {
      setError(error.message); throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [ctx, clearLocalError, setError]);

  return {
    items: ctx.items,
    loading: ctx.loading || localLoading,
    error: ctx.error || localError,
    pagination: ctx.pagination,

    getByHotel, addAmenity, removeAmenity,
    clearError: ctx.clearError,
    setPagination: ctx.setPagination,
  };
};

export default useHotelAmenity;
