// src/pages/hotel_owner/roomtype_management/RoomManagementWrapper.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';

// Create context to share state between management pages
const RoomManagementContext = createContext(null);

export const useRoomManagementState = () => {
  const context = useContext(RoomManagementContext);
  if (!context) {
    return null; // Return null if not within wrapper
  }
  return context;
};

/**
 * Wrapper component để preserve state khi navigate giữa các trang quản lý phòng
 * Giúp tránh reload khi chuyển từ RoomManagementPage sang RoomTypeRoomsPage và ngược lại
 */
const RoomManagementWrapper = () => {
  // Shared state between management pages
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [lastVisitedPath, setLastVisitedPath] = useState(null);

  const contextValue = {
    selectedHotel,
    setSelectedHotel,
    roomTypes,
    setRoomTypes,
    lastVisitedPath,
    setLastVisitedPath,
  };

  return (
    <RoomManagementContext.Provider value={contextValue}>
      <Outlet />
    </RoomManagementContext.Provider>
  );
};

export default RoomManagementWrapper;
