// src/hooks/useFoodRecommendation.js
import { useFoodRecommendationContext } from '../context/FoodRecommendationContext';

// Custom hook để dùng FoodRecommendationContext dễ dàng
const useFoodRecommendation = () => {
  const context = useFoodRecommendationContext();
  if (!context) {
    throw new Error('useFoodRecommendation must be used within a FoodRecommendationProvider');
  }
  return context;
};

export default useFoodRecommendation;
