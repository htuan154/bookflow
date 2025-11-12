// src/pages/hotel_owner/bookings/BookingWrapper.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { BookingProvider } from '../../../context/BookingContext';

/**
 * Wrapper component để wrap BookingProvider bên ngoài tất cả booking routes
 * Giúp preserve state khi navigate giữa các trang booking
 */
const BookingWrapper = () => {
  // hotelId sẽ được lấy từ BookingManagementPage state
  // Provider sẽ tự handle việc fetch khi hotelId thay đổi
  return (
    <BookingProvider hotelId={null}>
      <Outlet />
    </BookingProvider>
  );
};

export default BookingWrapper;
