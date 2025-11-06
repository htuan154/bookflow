// src/context/booking.context.js
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useBooking } from '../hooks/useBooking';

/**
 * @typedef {Object} BookingContextValue
 * @property {string|null} hotelId
 * @property {Array<any>} bookings
 * @property {boolean} loading
 * @property {string|null} error
 * @property {any} statistics
 * @property {{currentPage:number,itemsPerPage:number,totalItems:number,totalPages:number}} pagination
 * @property {any|null} currentBooking
 * @property {(opts?:Object)=>Promise<void>} fetchBookings
 * @property {(opts?:Object)=>Promise<void>} refetchBookings
 * @property {(bookingId:string)=>Promise<any>} fetchBookingDetail
 * @property {(bookingId:string, status:string)=>Promise<any>} updateBookingStatus
 * @property {(bookingId:string)=>Promise<any>} confirmBooking
 * @property {(bookingId:string, reason?:string)=>Promise<any>} cancelBooking
 * @property {(bookingId:string, payload?:Object)=>Promise<any>} checkIn
 * @property {(bookingId:string, payload?:Object)=>Promise<any>} checkOut
 * @property {()=>Promise<void>} fetchStatistics
 * @property {(filters:Object)=>any[]} filterBookings
 * @property {(bookingId:string, updateData:Object)=>Promise<any>} updateBooking
 * @property {()=>Promise<void>} refreshBookings
 * @property {()=>void} clearError
 * @property {(newPagination:Object)=>void} updatePagination
 * @property {(b:any)=>void} setCurrentBooking
 * @property {()=>void} clearCurrentBooking
 * @property {{[status:string]:number}} countsByStatus
 */

const BookingContext = createContext(/** @type {BookingContextValue|null} */(null));

/**
 * BookingProvider – bọc toàn bộ logic từ useBooking + thêm utilities giống BlogContext
 *
 * Lưu ý: Pagination ở đây là client-side (dựa trên mảng bookings đã tải).
 * Nếu backend có phân trang, bạn có thể thay fetchBookings để nhận page/limit từ options.
 */
export function BookingProvider({ hotelId = null, children }) {
  // ===== Hook gốc: lấy state + actions từ useBooking (đồng bộ 1 nguồn)
  const {
    bookings,
    loading,
    error,
    statistics,
    fetchBookings,
    refetchBookings,
    fetchBookingDetail,
    updateBookingStatus,
    confirmBooking,
    cancelBooking,
    checkIn,
    checkOut,
    fetchStatistics,
    filterBookings,
    updateBooking,
  } = useBooking(hotelId);

  // ===== Phần “tiện ích” giống BlogContext
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [currentBooking, setCurrentBooking] = useState(null);
  const [localError, setLocalError] = useState(null);

  // Clear error (tự động 5s) – gom error từ hook + localError
  const mergedError = useMemo(() => error || localError, [error, localError]);

  useEffect(() => {
    if (mergedError) {
      const t = setTimeout(() => setLocalError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [mergedError]);

  const clearError = useCallback(() => {
    setLocalError(null);
    // không can thiệp error của hook; hook sẽ tự setError(null) khi call action mới
  }, []);

  // Đếm số lượng theo trạng thái (để show dashboard nhanh)
  const countsByStatus = useMemo(() => {
    if (!Array.isArray(bookings)) return {};
    return bookings.reduce((acc, b) => {
      const s = b?.bookingStatus || 'unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, /** @type {{[k:string]:number}} */({}));
  }, [bookings]);

  // Cập nhật pagination.total khi bookings thay đổi (client-side)
  useEffect(() => {
    setPagination(prev => {
      const totalItems = Array.isArray(bookings) ? bookings.length : 0;
      const itemsPerPage = Math.max(1, prev.itemsPerPage);
      const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      const currentPage = Math.min(prev.currentPage, totalPages);
      return { ...prev, totalItems, totalPages, currentPage };
    });
  }, [bookings]);

  // Hàm update pagination
  const updatePagination = useCallback((patch) => {
    setPagination(prev => {
      const next = { ...prev, ...patch };
      const itemsPerPage = Math.max(1, next.itemsPerPage);
      const totalPages = Math.max(1, Math.ceil((next.totalItems || prev.totalItems) / itemsPerPage));
      if (next.currentPage > totalPages) next.currentPage = totalPages;
      return { ...next, itemsPerPage, totalPages };
    });
  }, []);

  // Lấy subset cho trang hiện tại (nếu bạn muốn render “pagedBookings”)
  const pagedBookings = useMemo(() => {
    const { currentPage, itemsPerPage } = pagination;
    if (!Array.isArray(bookings) || bookings.length === 0) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return bookings.slice(start, start + itemsPerPage);
  }, [bookings, pagination]);

  // Refresh: gọi lại fetchBookings (có thể nhận filter nếu cần)
  const refreshBookings = useCallback(async () => {
    try {
      await fetchBookings();
    } catch (err) {
      setLocalError(err?.message || 'Không thể tải lại danh sách đặt phòng');
    }
  }, [fetchBookings]);

  // Helper: lấy chi tiết và set currentBooking (để modal/view chi tiết)
  const loadBookingDetail = useCallback(async (bookingId) => {
    try {
      const detail = await fetchBookingDetail(bookingId);
      setCurrentBooking(detail);
      return detail;
    } catch (err) {
      setLocalError(err?.message || 'Không thể tải chi tiết booking');
      throw err;
    }
  }, [fetchBookingDetail]);

  const clearCurrentBooking = useCallback(() => setCurrentBooking(null), []);

  // Giá trị context (đầy đủ + có memo để tránh re-render)
  const value = useMemo(() => ({
    // ===== States
    hotelId,
    bookings,           // danh sách “thô” từ hook
    pagedBookings,      // trang hiện tại (client-side)
    loading,
    error: mergedError, // gộp error
    statistics,
    pagination,
    currentBooking,

    // ===== Actions (từ hook)
    fetchBookings,
    refetchBookings,
    fetchBookingDetail,
    updateBookingStatus,
    confirmBooking,
    cancelBooking,
    checkIn,
    checkOut,
    fetchStatistics,
    filterBookings,
    updateBooking,

    // ===== Utilities (bổ sung cho tiện như BlogContext)
    refreshBookings,
    clearError,
    updatePagination,
    setCurrentBooking,
    clearCurrentBooking,
    loadBookingDetail,
    countsByStatus,
  }), [
    hotelId,
    bookings,
    pagedBookings,
    loading,
    mergedError,
    statistics,
    pagination,
    currentBooking,

    fetchBookings,
    refetchBookings,
    fetchBookingDetail,
    updateBookingStatus,
    confirmBooking,
    cancelBooking,
    checkIn,
    checkOut,
    fetchStatistics,
    filterBookings,
    updateBooking,

    refreshBookings,
    clearError,
    updatePagination,
    loadBookingDetail,
    countsByStatus,
  ]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

/**
 * Hook tiện lợi
 * @returns {BookingContextValue}
 */
export function useBookingContext() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return ctx;
}

export default BookingContext;
