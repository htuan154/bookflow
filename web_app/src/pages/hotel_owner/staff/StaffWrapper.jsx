// src/pages/hotel_owner/staff/StaffWrapper.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { StaffProvider } from '../../../context/StaffContext';

/**
 * Wrapper component để wrap StaffProvider bên ngoài tất cả staff routes
 * Giúp preserve state khi navigate giữa các trang staff
 */
const StaffWrapper = () => {
  return (
    <StaffProvider>
      <Outlet />
    </StaffProvider>
  );
};

export default StaffWrapper;
