// src/hooks/useBooking.js
import { useState, useEffect, useCallback } from 'react';
import { bookingApiService } from '../api/booking.service';
import { toast } from 'react-toastify';

export const useBooking = (hotelId = null) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);

  /**
   * Lấy danh sách bookings theo hotelId
   */
  const fetchBookings = useCallback(async (filters = {}) => {
    if (!hotelId) {
      console.log('⚠️ No hotelId provided');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Fetching bookings for hotel:', hotelId);
      const response = await bookingApiService.getBookingsByHotelId(hotelId);
      const bookingData = response?.data || [];
      setBookings(bookingData);
      console.log('✅ [useBooking] Bookings loaded:', bookingData.length);
      return bookingData;
    } catch (err) {
      console.error('❌ [useBooking] Error fetching bookings:', err);
      setError(err.message || 'Không thể tải danh sách booking');
      toast.error('Không thể tải danh sách booking');
      return [];
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  /**
   * Cập nhật thông tin booking (generic update - nhiều fields)
   */
  const updateBooking = useCallback(async (bookingId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Updating booking:', bookingId, updateData);
      const response = await bookingApiService.updateBooking(bookingId, updateData);
      // Cập nhật lại danh sách bookings
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.bookingId === bookingId
            ? { ...booking, ...updateData }
            : booking
        )
      );
      toast.success('Cập nhật thông tin booking thành công');
      console.log('✅ [useBooking] Booking updated successfully');
      return response.data;
    } catch (err) {
      console.error('❌ [useBooking] Error updating booking:', err);
      setError(err.message || 'Không thể cập nhật thông tin booking');
      toast.error('Không thể cập nhật thông tin booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy chi tiết booking
   */
  const fetchBookingDetail = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Fetching booking detail:', bookingId);
      const response = await bookingApiService.getBookingById(bookingId);
      console.log('✅ [useBooking] Booking detail loaded:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ [useBooking] Error fetching booking detail:', err);
      setError(err.message || 'Không thể tải chi tiết booking');
      toast.error('Không thể tải chi tiết booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật trạng thái booking
   */
  const updateBookingStatus = useCallback(async (bookingId, status) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Updating booking status:', bookingId, status);
      const response = await bookingApiService.updateBookingStatus(bookingId, status);
      
      // Cập nhật lại danh sách bookings
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.bookingId === bookingId 
            ? { ...booking, bookingStatus: status }
            : booking
        )
      );
      
      toast.success('Cập nhật trạng thái thành công');
      console.log('✅ [useBooking] Status updated successfully');
      return response.data;
    } catch (err) {
      console.error('❌ [useBooking] Error updating status:', err);
      setError(err.message || 'Không thể cập nhật trạng thái');
      toast.error('Không thể cập nhật trạng thái');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xác nhận booking
   */
  const confirmBooking = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Confirming booking:', bookingId);
      const response = await bookingApiService.confirmBooking(bookingId);
      
      // Cập nhật lại danh sách bookings
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.bookingId === bookingId 
            ? { ...booking, bookingStatus: 'confirmed' }
            : booking
        )
      );
      
      toast.success('Xác nhận booking thành công');
      console.log('✅ [useBooking] Booking confirmed');
      return response.data;
    } catch (err) {
      console.error('❌ [useBooking] Error confirming booking:', err);
      setError(err.message || 'Không thể xác nhận booking');
      toast.error('Không thể xác nhận booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Hủy booking
   */
  const cancelBooking = useCallback(async (bookingId, reason) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Cancelling booking:', bookingId);
      const response = await bookingApiService.cancelBooking(bookingId, reason);
      
      // Cập nhật lại danh sách bookings
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.bookingId === bookingId 
            ? { ...booking, bookingStatus: 'cancelled' }
            : booking
        )
      );
      
      toast.success('Hủy booking thành công');
      console.log('✅ [useBooking] Booking cancelled');
      return response.data;
    } catch (err) {
      console.error('❌ [useBooking] Error cancelling booking:', err);
      setError(err.message || 'Không thể hủy booking');
      toast.error('Không thể hủy booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check-in
   */
  const checkIn = useCallback(async (bookingId, actualCheckInDate = new Date()) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Checking in:', bookingId);
      const response = await bookingApiService.checkIn(bookingId, actualCheckInDate);
      
      // Cập nhật lại danh sách bookings
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.bookingId === bookingId 
            ? { ...booking, actualCheckInDate, bookingStatus: 'checked_in' }
            : booking
        )
      );
      
      toast.success('Check-in thành công');
      console.log('✅ [useBooking] Checked in successfully');
      return response.data;
    } catch (err) {
      console.error('❌ [useBooking] Error checking in:', err);
      setError(err.message || 'Không thể check-in');
      toast.error('Không thể check-in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check-out
   */
  const checkOut = useCallback(async (bookingId, actualCheckOutDate = new Date()) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Checking out:', bookingId);
      const response = await bookingApiService.checkOut(bookingId, actualCheckOutDate);
      
      // Cập nhật lại danh sách bookings
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.bookingId === bookingId 
            ? { ...booking, actualCheckOutDate, bookingStatus: 'completed' }
            : booking
        )
      );
      
      toast.success('Check-out thành công');
      console.log('✅ [useBooking] Checked out successfully');
      return response.data;
    } catch (err) {
      console.error('❌ [useBooking] Error checking out:', err);
      setError(err.message || 'Không thể check-out');
      toast.error('Không thể check-out');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy thống kê bookings
   */
  const fetchStatistics = useCallback(async () => {
    if (!hotelId) return;

    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBooking] Fetching statistics for hotel:', hotelId);
      const response = await bookingApiService.getBookingStatistics(hotelId);
      setStatistics(response.data);
      console.log('✅ [useBooking] Statistics loaded:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ [useBooking] Error fetching statistics:', err);
      // Don't show error toast for statistics as it's not critical
      return null;
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  /**
   * Lọc bookings
   */
  const filterBookings = useCallback((filters) => {
    let filtered = [...bookings];

    if (filters.status) {
      filtered = filtered.filter(b => b.bookingStatus === filters.status);
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(b => b.paymentStatus === filters.paymentStatus);
    }

    if (filters.fromDate) {
      filtered = filtered.filter(b => new Date(b.checkInDate) >= new Date(filters.fromDate));
    }

    if (filters.toDate) {
      filtered = filtered.filter(b => new Date(b.checkOutDate) <= new Date(filters.toDate));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.bookingId.toLowerCase().includes(term) ||
        b.userId.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [bookings]);

  /**
   * Load bookings khi hotelId thay đổi
   */
  useEffect(() => {
    if (hotelId) {
      fetchBookings();
    }
  }, [hotelId, fetchBookings]);

  return {
    bookings,
    loading,
    error,
    statistics,
    fetchBookings,
    refetchBookings: fetchBookings, // Alias để dễ sử dụng
    fetchBookingDetail,
    updateBookingStatus,
    confirmBooking,
    cancelBooking,
    checkIn,
    checkOut,
    fetchStatistics,
    filterBookings,
    updateBooking
  };
};

export default useBooking;
