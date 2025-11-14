// src/context/FoodRecommendationContext.js
import { createContext, useContext, useState, useCallback } from 'react';
import foodRecommendationService from '../api/foodRecommendation.service';

const FoodRecommendationContext = createContext();

export const FoodRecommendationProvider = ({ children }) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy gợi ý món ăn của một địa điểm
  const fetchByLocation = useCallback(async (locationId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await foodRecommendationService.getByLocation(locationId);
      setFoods(data);
      return data;
    } catch (err) {
      setError(err);
      setFoods([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Lấy gợi ý món ăn theo thành phố
  const fetchByCity = useCallback(async (city) => {
    setLoading(true);
    setError(null);
    try {
      const data = await foodRecommendationService.getByCity(city);
      setFoods(data);
      return data;
    } catch (err) {
      setError(err);
      setFoods([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo gợi ý mới (admin)
  const createFood = useCallback(async (foodData) => {
    setLoading(true);
    setError(null);
    try {
      const newFood = await foodRecommendationService.create(foodData);
      setFoods((prev) => [newFood, ...prev]);
      return newFood;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật gợi ý (admin)
  const updateFood = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await foodRecommendationService.update(id, updateData);
      setFoods((prev) => prev.map((food) => (food.food_id === id ? updated : food)));
      return updated;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Xóa gợi ý (admin)
  const deleteFood = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await foodRecommendationService.delete(id);
      setFoods((prev) => prev.filter((food) => food.food_id !== id));
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <FoodRecommendationContext.Provider
      value={{
        foods,
        loading,
        error,
        fetchByLocation,
        fetchByCity,
        createFood,
        updateFood,
        deleteFood,
        setFoods,
      }}
    >
      {children}
    </FoodRecommendationContext.Provider>
  );
};

export const useFoodRecommendationContext = () => useContext(FoodRecommendationContext);
