// src/context/StaffContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { staffApiService } from '../api/staff.service';
import userService from '../api/user.service';

const StaffContext = createContext();

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaff must be used within StaffProvider');
  }
  return context;
};

export const StaffProvider = ({ children, hotelId: initialHotelId }) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  
  // Filter & pagination states (preserved across navigation)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadStaff = useCallback(async (hotelId) => {
    if (!hotelId) {
      console.warn('No hotel ID provided to loadStaff');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await staffApiService.getHotelStaff(hotelId);
      
      let staffList = [];
      if (response && response.data) {
        staffList = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        staffList = response;
      }
      
      setStaff(staffList);
    } catch (error) {
      console.error('Error loading staff:', error);
      setError('Không thể tải danh sách nhân viên: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load staff when selectedHotel changes
  useEffect(() => {
    if (selectedHotel) {
      const hotelId = selectedHotel.hotelId || selectedHotel.hotel_id || selectedHotel.id || selectedHotel._id;
      if (hotelId) {
        loadStaff(hotelId);
      }
    }
  }, [selectedHotel, loadStaff]);

  const updateStaffStatus = useCallback(async (staffId, newStatus) => {
    try {
      await staffApiService.updateStaffStatus(staffId, newStatus);
      const hotelId = selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id;
      if (hotelId) {
        await loadStaff(hotelId);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating staff status:', error);
      return { success: false, error: error.message };
    }
  }, [selectedHotel, loadStaff]);

  const terminateStaff = useCallback(async (staffId, userId) => {
    try {
      // 1. Update staff status to terminated
      await staffApiService.updateStaffStatus(staffId, 'terminated');
      
      // 2. Update user is_active to false if userId is provided
      if (userId) {
        await userService.updateUserStatus(userId, false);
      }
      
      // 3. Reload staff list
      const hotelId = selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id;
      if (hotelId) {
        await loadStaff(hotelId);
      }
      return { success: true };
    } catch (error) {
      console.error('Error terminating staff:', error);
      return { success: false, error: error.message };
    }
  }, [selectedHotel, loadStaff]);

    // Lấy staff theo userId (utility)
  const loadStaffByUserId = useCallback(async (userId) => {
    if (!userId) {
      console.warn('No user ID provided to loadStaffByUserId');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await staffApiService.getStaffByUserId(userId);
      let staffList = [];
      if (response && response.data) {
        staffList = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        staffList = response;
      }
      setStaff(staffList);
    } catch (error) {
      console.error('Error loading staff by userId:', error);
      setError('Không thể tải danh sách nhân viên: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current user's staff info (for HOTEL_STAFF role)
  const getCurrentUserStaffInfo = useCallback(() => {
    if (!staff || staff.length === 0) return null;
    return staff[0]; // Return first staff record
  }, [staff]);

  const value = {
    // Data
    staff,
    loading,
    error,
    selectedHotel,
    
    // Filter & pagination states
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    
    // Actions
    setSelectedHotel,
    loadStaff,
    loadStaffByUserId,
    updateStaffStatus,
    terminateStaff,
    getCurrentUserStaffInfo,
    refreshStaff: () => {
      const hotelId = selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id;
      if (hotelId) {
        loadStaff(hotelId);
      }
    }
  };

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
};
