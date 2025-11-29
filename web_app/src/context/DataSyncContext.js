// src/context/DataSyncContext.js
import React, { createContext, useContext, useState } from 'react';
import { addPlace, addDish, autocompleteProvince } from '../api/dataSync.service';

const DataSyncContext = createContext();

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within DataSyncProvider');
  }
  return context;
};

export const DataSyncProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Thêm địa điểm
   */
  const createPlace = async (placeData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await addPlace(placeData);
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to add place';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Thêm món ăn
   */
  const createDish = async (dishData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await addDish(dishData);
      return response;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'Failed to add dish';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Autocomplete tỉnh/thành phố
   */
  const searchProvince = async (query) => {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    try {
      const response = await autocompleteProvince(query);
      return response?.data || response?.suggestions || [];
    } catch (err) {
      console.error('[DataSync] searchProvince error:', err);
      return [];
    }
  };

  const value = {
    loading,
    error,
    createPlace,
    createDish,
    searchProvince,
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};
