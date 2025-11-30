// src/hooks/useTouristLocation.js
import { useContext } from 'react';
import { useTouristLocationContext } from '../context/TouristLocationContext';

// Custom hook để dùng TouristLocationContext dễ dàng
const useTouristLocation = () => {
  const context = useTouristLocationContext();
  if (!context) {
    throw new Error('useTouristLocation must be used within a TouristLocationProvider');
  }
  return context;
};

export default useTouristLocation;
