// src/context/TouristLocationContext.js
import { createContext, useContext, useState, useCallback } from 'react';
import touristLocationService from '../api/touristLocation.service';

const TouristLocationContext = createContext();

export const TouristLocationProvider = ({ children }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy tất cả địa điểm
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await touristLocationService.getAll();
      setLocations(data);
      return data;
    } catch (err) {
      setError(err);
      setLocations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy địa điểm theo thành phố
  const fetchByCity = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    try {
      const data = await touristLocationService.getByCity(city);
      setLocations(data);
      return data;
    } catch (err) {
      setError(err);
      setLocations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy địa điểm theo đúng tên thành phố (phân biệt hoa thường, hỗ trợ tiếng Việt)
  const fetchByCityVn = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    try {
      const data = await touristLocationService.getByCityVn(city);
      setLocations(data);
      return data;
    } catch (err) {
      setError(err);
      setLocations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo địa điểm mới (admin)
  const createLocation = useCallback(async (locationData) => {
    setLoading(true);
    setError(null);
    try {
      const newLoc = await touristLocationService.create(locationData);
      setLocations((prev) => [newLoc, ...prev]);
      return newLoc;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật địa điểm (admin)
  const updateLocation = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await touristLocationService.update(id, updateData);
      setLocations((prev) => prev.map((loc) => (loc.locationId === id ? updated : loc)));
      return updated;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa địa điểm (admin)
  const deleteLocation = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await touristLocationService.delete(id);
      setLocations((prev) => prev.filter((loc) => loc.locationId !== id));
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <TouristLocationContext.Provider
      value={{
        locations,
        loading,
        error,
        fetchAll,
        fetchByCity,
        fetchByCityVn,
        createLocation,
        updateLocation,
        deleteLocation,
        setLocations,
      }}
    >
      {children}
    </TouristLocationContext.Provider>
  );
};

export const useTouristLocationContext = () => useContext(TouristLocationContext);
