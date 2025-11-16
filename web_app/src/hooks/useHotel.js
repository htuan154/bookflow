// src/hooks/useHotel.js
import { useContext, useCallback } from 'react';
import HotelContext from '../context/HotelContext';

/**
 * Custom hook để sử dụng HotelContext với các utility functions
 * @returns {Object} Hotel context state và actions
 */
export const useHotel = () => {
  const context = useContext(HotelContext);
  
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }

  const {
    // State (theo HotelContext đã cập nhật)
    hotels,
    approvedHotels,                 // NEW
    pendingRejectedHotels,          // NEW
    loading,
    error,
    currentHotel,
    totalCount,
    approvedCount,                  // NEW
    pendingRejectedCount,           // NEW
    currentPage,
    pageSize,
    
    fetchAllHotels,
    fetchApprovedHotels,            // NEW
    fetchPendingRejectedHotels,     // NEW
    setPage,
    clearError
  } = context;

  // Utility functions
  const isLoading = loading;
  const hasError = !!error;
  const hasHotels = hotels.length > 0;
  const hotelCount = hotels.length;
  const totalHotels = totalCount;

  // NEW - Utility functions cho approved hotels
  const hasApprovedHotels = approvedHotels.length > 0;
  const approvedHotelCount = approvedHotels.length;
  const totalApprovedHotels = approvedCount;

  // NEW - Utility functions cho pending/rejected hotels
  const hasPendingRejectedHotels = pendingRejectedHotels.length > 0;
  const pendingRejectedHotelCount = pendingRejectedHotels.length;
  const totalPendingRejectedHotels = pendingRejectedCount;

  /**
   * Tìm hotel theo ID trong tất cả các danh sách
   * @param {string} hotelId - ID của hotel
   * @returns {Object|null} Hotel object hoặc null
   */
  const findHotelById = useCallback((hotelId) => {
    // Tìm trong danh sách chính
    let hotel = hotels.find(hotel => hotel.hotel_id === hotelId);
    if (hotel) return hotel;
    
    // Tìm trong danh sách approved
    hotel = approvedHotels.find(hotel => hotel.hotel_id === hotelId);
    if (hotel) return hotel;
    
    // Tìm trong danh sách pending/rejected
    hotel = pendingRejectedHotels.find(hotel => hotel.hotel_id === hotelId);
    return hotel || null;
  }, [hotels, approvedHotels, pendingRejectedHotels]);

  /**
   * Kiểm tra xem hotel có tồn tại trong bất kỳ danh sách nào không
   * @param {string} hotelId - ID của hotel
   * @returns {boolean} True nếu hotel tồn tại
   */
  const hotelExists = useCallback((hotelId) => {
    return hotels.some(hotel => hotel.hotel_id === hotelId) ||
           approvedHotels.some(hotel => hotel.hotel_id === hotelId) ||
           pendingRejectedHotels.some(hotel => hotel.hotel_id === hotelId);
  }, [hotels, approvedHotels, pendingRejectedHotels]);

  /**
   * Lọc hotels theo trạng thái từ danh sách chính
   * @param {string} status - Trạng thái hotel (pending, approved, rejected)
   * @returns {Array} Danh sách hotels đã lọc
   */
  const getHotelsByStatus = useCallback((status) => {
    return hotels.filter(hotel => hotel.status === status);
  }, [hotels]);

  /**
   * Lấy danh sách loại phòng còn trống của 1 khách sạn
   * @param {string} hotelId
   * @param {string} checkInDate
   * @param {string} checkOutDate
   * @returns {Promise<Array>}
   */
  const getAvailableRoomsByHotelId = context.getAvailableRoomsByHotelId;

  /**
   * NEW - Lọc approved hotels theo điều kiện
   * @param {Function} filterFn - Function để lọc
   * @returns {Array} Danh sách approved hotels đã lọc
   */
  const getFilteredApprovedHotels = useCallback((filterFn) => {
    return approvedHotels.filter(filterFn);
  }, [approvedHotels]);

  /**
   * NEW - Lọc pending/rejected hotels theo điều kiện
   * @param {Function} filterFn - Function để lọc
   * @returns {Array} Danh sách pending/rejected hotels đã lọc
   */
  const getFilteredPendingRejectedHotels = useCallback((filterFn) => {
    return pendingRejectedHotels.filter(filterFn);
  }, [pendingRejectedHotels]);

  /**
   * Đếm số lượng hotels theo trạng thái từ danh sách chính
   * @param {string} status - Trạng thái hotel
   * @returns {number} Số lượng hotels
   */
  const getHotelCountByStatus = useCallback((status) => {
    return hotels.filter(hotel => hotel.status === status).length;
  }, [hotels]);

  /**
   * NEW - Lấy tổng quan thống kê
   * @returns {Object} Object chứa thống kê
   */
  const getHotelStatistics = useCallback(() => {
    return {
      total: totalHotels,
      approved: totalApprovedHotels,
      pendingRejected: totalPendingRejectedHotels,
      pending: getHotelCountByStatus('pending'),
      rejected: getHotelCountByStatus('rejected'),
      // Từ danh sách chính
      allHotels: {
        total: hotelCount,
        approved: getHotelCountByStatus('approved'),
        pending: getHotelCountByStatus('pending'),
        rejected: getHotelCountByStatus('rejected')
      }
    };
  }, [
    totalHotels, 
    totalApprovedHotels, 
    totalPendingRejectedHotels, 
    hotelCount, 
    getHotelCountByStatus
  ]);

  /**
   * Refresh tất cả danh sách hotels
   */
  const refreshAllHotels = useCallback(async (filters = {}) => {
    await Promise.all([
      fetchAllHotels(filters),
      fetchApprovedHotels(filters),
      fetchPendingRejectedHotels(filters)
    ]);
  }, [fetchAllHotels, fetchApprovedHotels, fetchPendingRejectedHotels]);

  /**
   * Refresh danh sách hotels với params hiện tại
   */
  const refreshHotels = useCallback(async (filters = {}) => {
    await fetchAllHotels(filters);
  }, [fetchAllHotels]);

  /**
   * NEW - Refresh chỉ approved hotels
   */
  const refreshApprovedHotels = useCallback(async (filters = {}) => {
    await fetchApprovedHotels(filters);
  }, [fetchApprovedHotels]);

  /**
   * NEW - Refresh chỉ pending/rejected hotels
   */
  const refreshPendingRejectedHotels = useCallback(async (filters = {}) => {
    await fetchPendingRejectedHotels(filters);
  }, [fetchPendingRejectedHotels]);

  /**
   * Tìm kiếm hotels theo tên trong danh sách chính
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @returns {Array} Danh sách hotels phù hợp
   */
  const searchHotels = useCallback((searchTerm) => {
    if (!searchTerm) return hotels;
    const term = searchTerm.toLowerCase();
    return hotels.filter(hotel => 
      hotel.name?.toLowerCase().includes(term) ||
      hotel.address?.toLowerCase().includes(term) ||
      hotel.city?.toLowerCase().includes(term) ||
      hotel.description?.toLowerCase().includes(term) ||
      hotel.email?.toLowerCase().includes(term) ||
      hotel.phone_number?.includes(term)
    );
  }, [hotels]);

  /**
   * NEW - Tìm kiếm trong approved hotels
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @returns {Array} Danh sách approved hotels phù hợp
   */
  const searchApprovedHotels = useCallback((searchTerm) => {
    if (!searchTerm) return approvedHotels;
    const term = searchTerm.toLowerCase();
    return approvedHotels.filter(hotel => 
      hotel.name?.toLowerCase().includes(term) ||
      hotel.address?.toLowerCase().includes(term) ||
      hotel.city?.toLowerCase().includes(term) ||
      hotel.description?.toLowerCase().includes(term) ||
      hotel.email?.toLowerCase().includes(term) ||
      hotel.phone_number?.includes(term)
    );
  }, [approvedHotels]);

  /**
   * NEW - Tìm kiếm trong pending/rejected hotels
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @returns {Array} Danh sách pending/rejected hotels phù hợp
   */
  const searchPendingRejectedHotels = useCallback((searchTerm) => {
    if (!searchTerm) return pendingRejectedHotels;
    const term = searchTerm.toLowerCase();
    return pendingRejectedHotels.filter(hotel => 
      hotel.name?.toLowerCase().includes(term) ||
      hotel.address?.toLowerCase().includes(term) ||
      hotel.city?.toLowerCase().includes(term) ||
      hotel.description?.toLowerCase().includes(term) ||
      hotel.email?.toLowerCase().includes(term) ||
      hotel.phone_number?.includes(term)
    );
  }, [pendingRejectedHotels]);

  /**
   * NEW - Tìm kiếm trong tất cả danh sách
   * @param {string} searchTerm - Từ khóa tìm kiếm
   * @returns {Object} Object chứa kết quả tìm kiếm từ tất cả danh sách
   */
  const searchAllHotels = useCallback((searchTerm) => {
    return {
      all: searchHotels(searchTerm),
      approved: searchApprovedHotels(searchTerm),
      pendingRejected: searchPendingRejectedHotels(searchTerm)
    };
  }, [searchHotels, searchApprovedHotels, searchPendingRejectedHotels]);

  return {
    // State - Existing
    hotels,
    selectedHotel: currentHotel,
    loading,
    error,
    totalCount,
    currentPage,
    pageSize,

    // State - NEW
    approvedHotels,
    pendingRejectedHotels,
    approvedCount,
    pendingRejectedCount,

    // Computed state - Existing
    isLoading,
    hasError,
    hasHotels,
    hotelCount,
    totalHotels,

    // Computed state - NEW
    hasApprovedHotels,
    approvedHotelCount,
    totalApprovedHotels,
    hasPendingRejectedHotels,
    pendingRejectedHotelCount,
    totalPendingRejectedHotels,

    // Available actions - Existing
    fetchAllHotels,
    setPage,
    clearError,

    // Available actions - NEW
    fetchApprovedHotels,
    fetchPendingRejectedHotels,

    // Utility functions - Existing (updated)
    findHotelById,
    hotelExists,
    getHotelsByStatus,
    getHotelCountByStatus,
    searchHotels,
    refreshHotels,

    // Utility functions - NEW
    getFilteredApprovedHotels,
    getFilteredPendingRejectedHotels,
    getHotelStatistics,
    refreshAllHotels,
    refreshApprovedHotels,
    refreshPendingRejectedHotels,
    searchApprovedHotels,
    searchPendingRejectedHotels,
    searchAllHotels,
    getAvailableRoomsByHotelId
  };
};

export default useHotel;