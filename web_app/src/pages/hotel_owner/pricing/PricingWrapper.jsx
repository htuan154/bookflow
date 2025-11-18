// src/pages/hotel_owner/pricing/PricingWrapper.jsx
import React, { createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';

// Create context to share state between pricing pages
const PricingContext = createContext(null);

export const usePricingState = () => {
  const context = useContext(PricingContext);
  if (!context) {
    return null; // Return null if not within wrapper
  }
  return context;
};

/**
 * Wrapper component để preserve state khi navigate giữa các trang pricing
 * Giúp tránh reload khi chuyển từ SeasonalPricingPage sang SeasonalPricingDetailPage và ngược lại
 */
const PricingWrapper = () => {
  // Shared state between pricing pages
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [lastVisitedPath, setLastVisitedPath] = useState(null);

  const contextValue = {
    selectedHotelId,
    setSelectedHotelId,
    hotels,
    setHotels,
    roomTypes,
    setRoomTypes,
    lastVisitedPath,
    setLastVisitedPath,
  };

  return (
    <PricingContext.Provider value={contextValue}>
      <Outlet />
    </PricingContext.Provider>
  );
};

export default PricingWrapper;
