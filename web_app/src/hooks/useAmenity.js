// src/hooks/useAmenity.js


import { useCallback, useState } from 'react';
import { useAmenityContext } from '../context/AmenityContext';
import { API_ENDPOINTS } from '../config/apiEndpoints';

// Helper giống mẫu
const makeApiCall = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('accessToken');
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

const useAmenity = () => {
  const ctx = useAmenityContext();
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const clearLocalError = useCallback(() => setLocalError(null), []);
  const setError = useCallback((err) => setLocalError(err), []);

  // Get all amenities
  const getAmenities = useCallback(async (params = {}) => {
    try {
      setLocalLoading(true);
      clearLocalError();
      await ctx.fetchAmenities(params);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [ctx, clearLocalError, setError]);

  // Search amenities (optional endpoint)
  const searchAmenities = useCallback(async (q, params = {}) => {
    try {
      setLocalLoading(true);
      clearLocalError();

      const query = new URLSearchParams({
        q: q || '',
        page: params.page || 1,
        limit: params.limit || 10,
      });

      const res = await makeApiCall(`${API_ENDPOINTS.AMENITIES.SEARCH}?${query}`);
      return res.data || res.items || res;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [clearLocalError, setError]);

  // CRUD via context
  const createAmenity = useCallback(async (data) => {
    try {
      setLocalLoading(true);
      clearLocalError();
      return await ctx.createAmenity(data);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [ctx, clearLocalError, setError]);

  const updateAmenity = useCallback(async (id, data) => {
    try {
      setLocalLoading(true);
      clearLocalError();
      return await ctx.updateAmenity(id, data);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [ctx, clearLocalError, setError]);

  const deleteAmenity = useCallback(async (id) => {
    try {
      setLocalLoading(true);
      clearLocalError();
      await ctx.deleteAmenity(id);
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [ctx, clearLocalError, setError]);

  // Get by hotel (optional)
  const getAmenitiesByHotel = useCallback(async (hotelId, params = {}) => {
    try {
      setLocalLoading(true);
      clearLocalError();

      const query = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
      });

      const res = await makeApiCall(`${API_ENDPOINTS.AMENITIES.GET_BY_HOTEL(hotelId)}?${query}`);
      return res.data || res.items || res;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [clearLocalError, setError]);

  return {
    // context state
    amenities: ctx.amenities,
    loading: ctx.loading || localLoading,
    error: ctx.error || localError,
    pagination: ctx.pagination,

    // local helpers
    localLoading,
    localError,
    clearLocalError,

    // actions
    getAmenities,
    searchAmenities,
    createAmenity,
    updateAmenity,
    deleteAmenity,
    getAmenitiesByHotel,

    // passthrough
    setPagination: ctx.setPagination,
    clearError: ctx.clearError,
  };
};

export default useAmenity;
