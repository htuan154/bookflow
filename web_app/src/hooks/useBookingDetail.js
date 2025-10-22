// src/hooks/useBookingDetail.js
import { useState, useCallback } from 'react';
import { bookingDetailApiService } from '../api/bookingDetail.service';
import { toast } from 'react-toastify';

export const useBookingDetail = () => {
  const [bookingDetails, setBookingDetails] = useState([]);
  const [fullBookingInfo, setFullBookingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Lấy chi tiết booking
   */
  const fetchBookingDetails = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBookingDetail] Fetching booking details:', bookingId);
      const response = await bookingDetailApiService.getBookingDetails(bookingId);
      const details = response?.data || [];
      setBookingDetails(details);
      console.log('✅ [useBookingDetail] Booking details loaded:', details.length);
      return details;
    } catch (err) {
      console.error('❌ [useBookingDetail] Error fetching booking details:', err);
      setError(err.message || 'Không thể tải chi tiết booking');
      toast.error('Không thể tải chi tiết booking');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lấy thông tin đầy đủ (booking + details)
   */
  const fetchFullBookingInfo = useCallback(async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBookingDetail] Fetching full booking info:', bookingId);
      const info = await bookingDetailApiService.getFullBookingInfo(bookingId);
      setFullBookingInfo(info);
      setBookingDetails(info.details || []);
      console.log('✅ [useBookingDetail] Full booking info loaded');
      return info;
    } catch (err) {
      console.error('❌ [useBookingDetail] Error fetching full booking info:', err);
      setError(err.message || 'Không thể tải thông tin booking');
      toast.error('Không thể tải thông tin booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Tạo booking detail
   */
  const createBookingDetail = useCallback(async (detailData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBookingDetail] Creating booking detail:', detailData);
      const response = await bookingDetailApiService.createBookingDetail(detailData);
      toast.success('Tạo chi tiết booking thành công');
      console.log('✅ [useBookingDetail] Booking detail created');
      return response.data;
    } catch (err) {
      console.error('❌ [useBookingDetail] Error creating booking detail:', err);
      setError(err.message || 'Không thể tạo chi tiết booking');
      toast.error('Không thể tạo chi tiết booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cập nhật booking detail
   */
  const updateBookingDetail = useCallback(async (detailId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBookingDetail] Updating booking detail:', detailId);
      const response = await bookingDetailApiService.updateBookingDetail(detailId, updateData);
      
      // Cập nhật lại state
      setBookingDetails(prevDetails =>
        prevDetails.map(detail =>
          detail.detailId === detailId ? { ...detail, ...updateData } : detail
        )
      );
      
      toast.success('Cập nhật chi tiết booking thành công');
      console.log('✅ [useBookingDetail] Booking detail updated');
      return response.data;
    } catch (err) {
      console.error('❌ [useBookingDetail] Error updating booking detail:', err);
      setError(err.message || 'Không thể cập nhật chi tiết booking');
      toast.error('Không thể cập nhật chi tiết booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Xóa booking detail
   */
  const deleteBookingDetail = useCallback(async (detailId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 [useBookingDetail] Deleting booking detail:', detailId);
      await bookingDetailApiService.deleteBookingDetail(detailId);
      
      // Cập nhật lại state
      setBookingDetails(prevDetails =>
        prevDetails.filter(detail => detail.detailId !== detailId)
      );
      
      toast.success('Xóa chi tiết booking thành công');
      console.log('✅ [useBookingDetail] Booking detail deleted');
    } catch (err) {
      console.error('❌ [useBookingDetail] Error deleting booking detail:', err);
      setError(err.message || 'Không thể xóa chi tiết booking');
      toast.error('Không thể xóa chi tiết booking');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bookingDetails,
    fullBookingInfo,
    loading,
    error,
    fetchBookingDetails,
    fetchFullBookingInfo,
    createBookingDetail,
    updateBookingDetail,
    deleteBookingDetail
  };
};

export default useBookingDetail;
