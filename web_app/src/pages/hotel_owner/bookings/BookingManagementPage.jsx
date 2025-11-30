import { useBookingStatusHistory } from '../../../hooks/useBookingStatusHistory';
// src/pages/hotel_owner/bookings/BookingManagementPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Search, ChevronDown, Eye, CheckCircle, 
  XCircle, Clock, DollarSign, Users, ArrowUpDown, Edit, Mail, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hotelApiService } from '../../../api/hotel.service';
import { useBooking } from '../../../hooks/useBooking';
import { useRoomAssignment } from '../../../hooks/useRoomAssignment';
import userService from '../../../api/user.service';
import { toast } from 'react-toastify';
import { CheckInPayment } from '../../../components/payment/BookingPayment';
import bookingService from '../../../api/booking.service';
import { staffApiService } from '../../../api/staff.service';
import useAuth from '../../../hooks/useAuth';
import { USER_ROLES } from '../../../config/roles';

const BookingManagementPage = () => {
  const navigate = useNavigate();
  const { releaseRooms } = useRoomAssignment();
  const { user } = useAuth();
  
  // States
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(() => {
    // Khôi phục selectedHotelId từ sessionStorage nếu có
    return sessionStorage.getItem('selectedHotelId') || null;
  });
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingStaffInfo, setLoadingStaffInfo] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [checkInDateFilter, setCheckInDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('bookedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [userCache, setUserCache] = useState({}); // Cache user info
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  // Check-in modal state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState(null);

  // Check-out modal state
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedBookingForCheckOut, setSelectedBookingForCheckOut] = useState(null);

  // Use booking hook
  const { 
    bookings, 
    loading: loadingBookings,
    refetchBookings,
    updateBooking,
    updateBookingStatus
  } = useBooking(selectedHotelId);

  // Hook cho booking status history
  const { addHistory } = useBookingStatusHistory(selectedBookingForCheckOut?.bookingId);

  // State lưu trạng thái xếp phòng cho từng booking
  const [roomAssignmentStatus, setRoomAssignmentStatus] = useState({});

  useEffect(() => {
    // Lấy trạng thái xếp phòng cho tất cả booking đã xác nhận (không phụ thuộc vào trạng thái thanh toán)
    const fetchRoomAssignmentStatuses = async () => {
      const statusMap = {};
      for (const booking of bookings) {
        if (booking.bookingStatus === 'confirmed') {
          try {
            // Lấy danh sách phòng đã xếp
            const assignmentsRes = await import('../../../api/roomAssignment.service');
            const roomAssignmentsData = await assignmentsRes.getRoomAssignmentsForBooking(booking.bookingId);
            // Lấy chi tiết booking để lấy quantity
            const bookingDetailRes = await import('../../../api/booking.service');
            const bookingDetailData = await bookingDetailRes.default.getBookingById(booking.bookingId);
            // Lấy đúng mảng details và room assignments từ response
            const detailsArr = bookingDetailData?.data?.details || [];
            const assignmentsArr = roomAssignmentsData?.data || [];
            // Tổng quantity cần xếp = sum của tất cả detail.quantity
            const totalQuantity = detailsArr.reduce((sum, d) => sum + (d.quantity || 0), 0);
            // Debug log chi tiết
            console.log('[RoomAssignment Debug]', {
              bookingId: booking.bookingId,
              roomAssignments: assignmentsArr,
              roomAssignmentsCount: assignmentsArr.length,
              bookingDetails: detailsArr,
              totalQuantity,
              isAssigned: assignmentsArr.length === totalQuantity && totalQuantity > 0
            });
            // Số phòng đã xếp = assignmentsArr.length
            if (assignmentsArr.length === totalQuantity && totalQuantity > 0) {
              statusMap[booking.bookingId] = 'assigned';
            } else {
              statusMap[booking.bookingId] = 'not_assigned';
            }
          } catch (err) {
            console.error('[RoomAssignment Debug][Error]', booking.bookingId, err);
            statusMap[booking.bookingId] = 'not_assigned';
          }
        }
      }
      setRoomAssignmentStatus(statusMap);
    };
    if (bookings && bookings.length > 0) {
      fetchRoomAssignmentStatuses();
    }
  }, [bookings]);

  // Load danh sách khách sạn của owner hoặc load staff info cho hotel_staff
  useEffect(() => {
    const loadData = async () => {
      // Nếu là HOTEL_STAFF, load thông tin staff trước để lấy hotel_id
      if (user?.roleId === USER_ROLES.HOTEL_STAFF && user?.userId) {
        try {
          setLoadingStaffInfo(true);
          console.log('🔄 Loading staff info...');
          const response = await staffApiService.getStaffByUserId(user.userId);

          if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
            const staff = response.data[0];
            const staffHotelId = staff.hotelId || staff.hotel_id;
            
            if (staffHotelId) {
              console.log('✅ Staff hotel_id loaded:', staffHotelId);
              setSelectedHotelId(staffHotelId);
              sessionStorage.setItem('selectedHotelId', staffHotelId);
              
              // Load thông tin khách sạn để hiển thị tên
              try {
                const hotelResponse = await hotelApiService.getHotelById(staffHotelId);
                if (hotelResponse?.data) {
                  setHotels([hotelResponse.data]);
                }
              } catch (err) {
                console.error('❌ Error loading hotel details:', err);
              }
            } else {
              console.warn('⚠️ Staff record found but no hotel_id');
              toast.error('Không tìm thấy khách sạn của nhân viên');
            }
          } else {
            console.warn('⚠️ No staff record found');
            toast.error('Không tìm thấy thông tin nhân viên');
          }
        } catch (error) {
          console.error('❌ Error loading staff hotel info:', error);
          toast.error('Không thể tải thông tin khách sạn của nhân viên');
        } finally {
          setLoadingStaffInfo(false);
          setLoadingHotels(false);
        }
      } else {
        // Nếu là HOTEL_OWNER, load danh sách khách sạn
        try {
          setLoadingHotels(true);
          console.log('🔄 Loading hotels...');
          const response = await hotelApiService.getHotelsForOwner();
          const hotelData = response?.data || [];
          setHotels(hotelData);
          
          // Auto select hotel đầu tiên nếu có (nhưng chỉ khi chưa có selectedHotelId từ sessionStorage)
          if (hotelData.length > 0 && !selectedHotelId) {
            const firstHotelId = hotelData[0].hotelId;
            setSelectedHotelId(firstHotelId);
            sessionStorage.setItem('selectedHotelId', firstHotelId);
          }
          
          console.log('✅ Hotels loaded:', hotelData.length);
        } catch (error) {
          console.error('❌ Error loading hotels:', error);
          toast.error('Không thể tải danh sách khách sạn');
        } finally {
          setLoadingHotels(false);
        }
      }
    };

    loadData();
  }, [user?.roleId, user?.userId]);

  // Lưu selectedHotelId vào sessionStorage mỗi khi thay đổi
  useEffect(() => {
    if (selectedHotelId) {
      sessionStorage.setItem('selectedHotelId', selectedHotelId);
    }
  }, [selectedHotelId]);

  // Load user info cho bookings
  useEffect(() => {
    const loadUsersForBookings = async () => {
      const userIds = [...new Set(bookings.map(b => b.userId))]; // Unique user IDs
      const newUsers = {};
      
      for (const userId of userIds) {
        if (!userCache[userId]) {
          try {
            const response = await userService.getUserById(userId);
            newUsers[userId] = response?.data || response;
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error);
            newUsers[userId] = null;
          }
        }
      }
      
      if (Object.keys(newUsers).length > 0) {
        setUserCache(prev => ({ ...prev, ...newUsers }));
      }
    };

    if (bookings.length > 0) {
      loadUsersForBookings();
    }
  }, [bookings, userCache]);

  // Booking status mapping - Updated theo database schema
  const statusConfig = {
    pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    canceled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
    completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    no_show: { label: 'Không đến', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  };

  const paymentStatusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    refunded: { label: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' },
    failed: { label: 'Thất bại', color: 'bg-red-100 text-red-800' },
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format short date
  const formatShortDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return dateString;
    }
  };

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = [...bookings];

    // Filter by search term (fullName, email, phoneNumber LIKE)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        const user = userCache[b.userId];
        return (
          (user?.fullName && user.fullName.toLowerCase().includes(term)) ||
          (user?.email && user.email.toLowerCase().includes(term)) ||
          (user?.phoneNumber && user.phoneNumber.toLowerCase().includes(term))
        );
      });
    }

    // Filter by check-in date
    if (checkInDateFilter) {
      filtered = filtered.filter(b => {
        if (!b.checkInDate) return false;
        // Chuyển sang local time (UTC+7) và lấy yyyy-mm-dd
        const localDate = new Date(b.checkInDate);
        const yyyy = localDate.getFullYear();
        const mm = String(localDate.getMonth() + 1).padStart(2, '0');
        const dd = String(localDate.getDate()).padStart(2, '0');
        const bookingLocalDateStr = `${yyyy}-${mm}-${dd}`;
        return bookingLocalDateStr === checkInDateFilter;
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.bookingStatus === statusFilter);
    }

    // Filter by payment status
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(b => b.paymentStatus === paymentFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'bookedAt' || sortBy === 'checkInDate' || sortBy === 'checkOutDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortBy === 'totalPrice') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [bookings, searchTerm, statusFilter, paymentFilter, sortBy, sortOrder, checkInDateFilter, userCache]);

  // Statistics
  const statistics = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.bookingStatus === 'pending').length,
      confirmed: bookings.filter(b => b.bookingStatus === 'confirmed').length,
      completed: bookings.filter(b => b.bookingStatus === 'completed').length,
      canceled: bookings.filter(b => b.bookingStatus === 'canceled').length,
      no_show: bookings.filter(b => b.bookingStatus === 'no_show').length,
      totalRevenue: bookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0)
    };
  }, [bookings]);

  // Handle view booking detail
  const handleView = (bookingId) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    const user = userCache[booking.userId];
    navigate(`/hotel-owner/bookings/${bookingId}`, { state: { booking, user } });
  };

  // Handle edit booking
  const handleEdit = (bookingId) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    const user = userCache[booking.userId];
    navigate(`/hotel-owner/bookings/${bookingId}/edit`, { state: { booking, user } });
  };

  // Toggle sort
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Handle open payment modal
  const handleOpenPayment = (booking) => {
    setSelectedBookingForPayment(booking);
    setShowPaymentModal(true);
  };

  // Handle close payment modal
  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setSelectedBookingForPayment(null);
  };

  // Handle payment success - Cập nhật trạng thái booking
  const handlePaymentSuccess = async (qrData, paymentInfo) => {
    try {
      console.log('✅ Payment successful:', paymentInfo);
      
      // Cập nhật trạng thái booking lên backend
      if (selectedBookingForPayment?.bookingId) {
        await bookingService.updateBooking(selectedBookingForPayment.bookingId, {
          paymentStatus: 'paid',
          bookingStatus: 'confirmed'
        });

        toast.success('Thanh toán thành công! Booking đã được cập nhật.');
        
        // Đóng modal
        handleClosePayment();
        
        // Refetch bookings để cập nhật UI (không reload trang)
        if (refetchBookings) {
          await refetchBookings();
        }
      }
    } catch (error) {
      console.error('❌ Error updating booking status:', error);
      toast.error('Thanh toán thành công nhưng không thể cập nhật trạng thái booking');
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('❌ Payment error:', error);
    toast.error('Lỗi thanh toán: ' + error.message);
  };

  // Handle assign room - Navigate to room assignment page
  const handleAssignRoom = (booking) => {
    navigate(`/hotel-owner/bookings/${booking.bookingId}/assign-rooms`, { 
      state: { booking } 
    });
  };

  // Handle open check-in modal
  const handleOpenCheckIn = (booking) => {
    setSelectedBookingForCheckIn(booking);
    setShowCheckInModal(true);
  };

  // Handle close check-in modal
  const handleCloseCheckIn = () => {
    setShowCheckInModal(false);
    setSelectedBookingForCheckIn(null);
  };

  // Handle check-in - Update actual_check_in_date
  const handleCheckIn = async () => {
    try {
      if (!selectedBookingForCheckIn?.bookingId) return;

      const now = new Date().toISOString();
      
      await bookingService.updateBooking(selectedBookingForCheckIn.bookingId, {
        actualCheckInDate: now
      });

      toast.success('Check-in thành công!');
      handleCloseCheckIn();
      
      // Refetch bookings để cập nhật UI
      if (refetchBookings) {
        await refetchBookings();
      }
    } catch (error) {
      console.error('❌ Error checking in:', error);
      toast.error('Lỗi khi check-in: ' + (error.message || 'Vui lòng thử lại'));
    }
  };

  // Handle open check-out modal
  const handleOpenCheckOut = (booking) => {
    setSelectedBookingForCheckOut(booking);
    setShowCheckOutModal(true);
  };

  // Handle close check-out modal
  const handleCloseCheckOut = () => {
    setShowCheckOutModal(false);
    setSelectedBookingForCheckOut(null);
  };

  // Handle check-out - Update actual_check_out_date
  const handleCheckOut = async () => {
    try {
      if (!selectedBookingForCheckOut?.bookingId) return;

      const now = new Date().toISOString();
      const bookingId = selectedBookingForCheckOut.bookingId;
      const oldStatus = selectedBookingForCheckOut.bookingStatus || 'confirmed';
      const newStatus = 'completed';

      // 1. Update actualCheckOutDate
      await updateBooking(bookingId, {
        actualCheckOutDate: now
      });

      // 2. Update booking status
      await updateBookingStatus(bookingId, newStatus);

      // 2.5. Release all assigned rooms for this booking
      try {
        await releaseRooms(bookingId);
      } catch (releaseError) {
        console.error('❌ Error releasing rooms:', releaseError);
        toast.error('Có lỗi khi trả phòng, vui lòng kiểm tra lại trạng thái phòng!');
      }

      // 3. Add booking history
      try {
        await addHistory({
          old_status: oldStatus,
          new_status: newStatus,
          change_reason: 'Check-out',
          notes: null
        });
      } catch (historyError) {
        console.error('❌ Error creating booking history:', historyError);
      }

      toast.success('Check-out thành công!');
      handleCloseCheckOut();

      // Refetch bookings để cập nhật UI
      if (refetchBookings) {
        await refetchBookings();
      }
    } catch (error) {
      console.error('❌ Error checking out:', error);
      toast.error('Lỗi khi check-out: ' + (error.message || 'Vui lòng thử lại'));
    }
  };

  if (loadingHotels || loadingStaffInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">
          {loadingStaffInfo ? 'Đang tải thông tin nhân viên...' : 'Đang tải...'}
        </p>
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Bạn chưa có khách sạn nào. Vui lòng tạo khách sạn trước.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Quản lý Booking</h1>
        
        {/* Hotel Selector - Hide for staff */}
        {user?.roleId !== USER_ROLES.HOTEL_STAFF && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn khách sạn
            </label>
            <div className="relative">
              <select
                value={selectedHotelId || ''}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="w-full md:w-96 px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">-- Chọn khách sạn --</option>
                {hotels.map((hotel) => (
                  <option key={hotel.hotelId} value={hotel.hotelId}>
                    {hotel.name} - {hotel.city} ({hotel.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
        )}
        
        {/* Display hotel name for staff */}
        {user?.roleId === USER_ROLES.HOTEL_STAFF && hotels.length > 0 && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Khách sạn của bạn</p>
                  <p className="font-semibold text-gray-900">{hotels[0].name || hotels[0].hotelName}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {selectedHotelId && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Tổng booking</p>
                  <p className="text-2xl font-bold text-blue-700">{statistics.total}</p>
                </div>
                <Calendar className="text-blue-500" size={32} />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Chờ xác nhận</p>
                  <p className="text-2xl font-bold text-yellow-700">{statistics.pending}</p>
                </div>
                <Clock className="text-yellow-500" size={32} />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Hoàn thành</p>
                  <p className="text-2xl font-bold text-green-700">{statistics.completed}</p>
                </div>
                <CheckCircle className="text-green-500" size={32} />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Doanh thu</p>
                  <p className="text-lg font-bold text-purple-700">
                    {formatCurrency(statistics.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="text-purple-500" size={32} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      {selectedHotelId && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tìm kiếm khách hàng</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm tên, email, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái booking</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="canceled">Đã hủy</option>
                <option value="completed">Hoàn thành</option>
                <option value="no_show">Không đến</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái thanh toán</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái thanh toán</option>
                <option value="pending">Chờ thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="refunded">Đã hoàn tiền</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sắp xếp</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bookedAt">Sắp xếp: Ngày đặt</option>
                <option value="checkInDate">Sắp xếp: Ngày check-in</option>
                <option value="totalPrice">Sắp xếp: Giá</option>
              </select>
            </div>

            {/* Lọc theo ngày check-in */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ngày check-in</label>
              <input
                type="date"
                value={checkInDateFilter}
                onChange={e => setCheckInDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Lọc theo ngày check-in"
                style={{ minWidth: 150 }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Hiển thị {filteredAndSortedBookings.length} / {bookings.length} booking
            </p>
            <button
              onClick={() => toggleSort(sortBy)}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <ArrowUpDown size={16} />
              {sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            </button>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {selectedHotelId && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingBookings ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAndSortedBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">Không có booking nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên lạc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in / Check-out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số khách
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thanh toán
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái xếp phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedBookings.map((booking) => {
                    const StatusIcon = statusConfig[booking.bookingStatus]?.icon || Clock;
                    const user = userCache[booking.userId];
                    
                    return (
                      <tr key={booking.bookingId} className="hover:bg-gray-50">
                        {/* Khách hàng */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {user ? user.fullName : 'Loading...'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {formatDate(booking.bookedAt)}
                            </div>
                          </div>
                        </td>

                        {/* Liên lạc */}
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {user?.email && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                <span className="text-xs">{user.email}</span>
                              </div>
                            )}
                            {user?.phoneNumber && (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Phone size={14} className="text-gray-400" />
                                <span className="text-xs">{user.phoneNumber}</span>
                              </div>
                            )}
                            {!user?.email && !user?.phoneNumber && (
                              <span className="text-xs text-gray-400">Chưa có</span>
                            )}
                          </div>
                        </td>

                        {/* Check-in / Check-out */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />
                              {formatShortDate(booking.checkInDate)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />
                              {formatShortDate(booking.checkOutDate)}
                            </div>
                            <div className="text-xs text-gray-500">{booking.nights} đêm</div>
                          </div>
                        </td>

                        {/* Số khách */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{booking.totalGuests} khách</span>
                          </div>
                        </td>

                        {/* Tổng tiền */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(booking.totalPrice)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.paymentMethod === 'credit_card' ? 'Thẻ' : 'Tiền mặt'}
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[booking.bookingStatus]?.color}`}>
                            <StatusIcon size={14} />
                            {statusConfig[booking.bookingStatus]?.label}
                          </span>
                        </td>

                        {/* Thanh toán */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[booking.paymentStatus]?.color}`}>
                            {paymentStatusConfig[booking.paymentStatus]?.label}
                          </span>
                        </td>

                        {/* Trạng thái xếp phòng */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.bookingStatus === 'completed' ? (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Đã xếp
                            </span>
                          ) : booking.bookingStatus === 'confirmed' ? (
                            roomAssignmentStatus[booking.bookingId] === 'assigned' ? (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Đã xếp
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Chưa xếp
                              </span>
                            )
                          ) : (
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Chưa xếp
                            </span>
                          )}
                        </td>

                        {/* Hành động */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleView(booking.bookingId)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye size={18} />
                            </button>
                            {booking.bookingStatus !== 'completed' && (
                              <button 
                                onClick={() => handleEdit(booking.bookingId)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit size={18} />
                              </button>
                            )}

                            {/* Nút thanh toán cho booking đã xác nhận nhưng chưa thanh toán */}
                            {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'pending' && (
                              <button
                                className="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                                title="Thanh toán tại quầy"
                                onClick={() => handleOpenPayment(booking)}
                              >
                                Thanh toán
                              </button>
                            )}

                            {/* Nút xếp phòng: booking đã xác nhận, chưa xếp phòng, đã thanh toán */}
                            {booking.bookingStatus === 'confirmed' &&
                              (!booking.roomAssignments || booking.roomAssignments.length === 0) &&
                              booking.paymentStatus === 'paid' &&
                              !booking.actualCheckInDate && (
                                <button
                                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                  title="Xếp phòng"
                                  onClick={() => handleAssignRoom(booking)}
                                  disabled={!!booking.actualCheckInDate}
                                >
                                  Xếp phòng
                                </button>
                              )
                            }

                            {/* Nút check-in: booking đã xác nhận, đúng ngày check-in */}
                            {booking.bookingStatus === 'confirmed' && (() => {
                              const today = new Date();
                              const checkInDate = new Date(booking.checkInDate);
                              return (
                                today.getFullYear() === checkInDate.getFullYear() &&
                                today.getMonth() === checkInDate.getMonth() &&
                                today.getDate() === checkInDate.getDate()
                              );
                            })() && !booking.actualCheckInDate && (
                              <button
                                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                title="Check-in"
                                onClick={() => handleOpenCheckIn(booking)}
                                disabled={!!booking.actualCheckInDate}
                              >
                                Check-in
                              </button>
                            )}
                            {/* Nút check-out: chỉ hiển thị nếu đã check-in và đúng ngày check-out */}
                            {booking.bookingStatus === 'confirmed' && booking.actualCheckInDate && !booking.actualCheckOutDate && (
                              <button
                                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                title="Check-out"
                                onClick={() => handleOpenCheckOut(booking)}
                              >
                                Check-out
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal - VietQR Check-in Payment */}
      {showPaymentModal && selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={handleClosePayment}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              aria-label="Đóng"
            >
              <XCircle size={24} />
            </button>

            {/* Booking info header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Thanh toán Booking
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  <span className="font-medium">Khách:</span> {userCache[selectedBookingForPayment.userId]?.fullName || 'Loading...'}
                </div>
                <div>
                  <span className="font-medium">Check-in:</span> {formatShortDate(selectedBookingForPayment.checkInDate)} → {formatShortDate(selectedBookingForPayment.checkOutDate)}
                </div>
                <div>
                  <span className="font-medium">Tổng tiền:</span> <span className="font-semibold text-lg text-blue-600">
                    {formatCurrency(selectedBookingForPayment.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment component */}
            <div className="p-6">
              <CheckInPayment
                bookingId={selectedBookingForPayment.bookingId}
                amount={selectedBookingForPayment.totalPrice}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>

            {/* Footer info */}
            <div className="px-6 pb-6 text-xs text-gray-500 text-center">
              <p>💡 Hướng dẫn: Khách hàng quét mã QR bằng app ngân hàng để thanh toán</p>
              <p className="mt-1">Trạng thái booking sẽ tự động cập nhật sau khi thanh toán thành công</p>
            </div>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckInModal && selectedBookingForCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={handleCloseCheckIn}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              aria-label="Đóng"
            >
              <XCircle size={24} />
            </button>

            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Check-in Booking
              </h3>
              <p className="text-sm text-gray-600">
                Booking ID: <span className="font-semibold">{selectedBookingForCheckIn.bookingId}</span>
              </p>
            </div>

            {/* Booking & User Info */}
            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={20} className="text-gray-600" />
                  Thông tin khách hàng
                </h4>
                {(() => {
                  const user = userCache[selectedBookingForCheckIn.userId];
                  return user ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Họ tên:</span>
                        <p className="font-semibold text-gray-800">{user.fullName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-semibold text-gray-800 flex items-center gap-1">
                          <Mail size={14} className="text-gray-400" />
                          {user.email || 'Chưa có'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Số điện thoại:</span>
                        <p className="font-semibold text-gray-800 flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          {user.phoneNumber || 'Chưa có'}
                        </p>
                      </div>
                      {/* <div>
                        <span className="text-gray-600">Ngày sinh:</span>
                        <p className="font-semibold text-gray-800">
                          {user.dateOfBirth ? formatShortDate(user.dateOfBirth) : 'Chưa có'}
                        </p>
                      </div> */}
                    </div>
                  ) : (
                    <p className="text-gray-500">Đang tải thông tin...</p>
                  );
                })()}
              </div>

              {/* Booking Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar size={20} className="text-gray-600" />
                  Thông tin đặt phòng
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Ngày đặt:</span>
                    <p className="font-semibold text-gray-800">{formatDate(selectedBookingForCheckIn.bookedAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Trạng thái:</span>
                    <p>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedBookingForCheckIn.bookingStatus]?.color}`}>
                        {statusConfig[selectedBookingForCheckIn.bookingStatus]?.label}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-in:</span>
                    <p className="font-semibold text-gray-800">{formatShortDate(selectedBookingForCheckIn.checkInDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-out:</span>
                    <p className="font-semibold text-gray-800">{formatShortDate(selectedBookingForCheckIn.checkOutDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Số đêm:</span>
                    <p className="font-semibold text-gray-800">{selectedBookingForCheckIn.nights} đêm</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Số khách:</span>
                    <p className="font-semibold text-gray-800">{selectedBookingForCheckIn.totalGuests} khách</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tổng tiền:</span>
                    <p className="font-semibold text-lg text-blue-600">{formatCurrency(selectedBookingForCheckIn.totalPrice)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Thanh toán:</span>
                    <p>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[selectedBookingForCheckIn.paymentStatus]?.color}`}>
                        {paymentStatusConfig[selectedBookingForCheckIn.paymentStatus]?.label}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Room Assignment Status */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Trạng thái xếp phòng
                </h4>
                {roomAssignmentStatus[selectedBookingForCheckIn.bookingId] === 'assigned' ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle size={20} />
                    <span className="font-semibold">Đã xếp phòng</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-yellow-700 mb-3">
                      <Clock size={20} />
                      <span className="font-semibold">Chưa xếp phòng</span>
                    </div>
                    <button
                      onClick={() => {
                        handleCloseCheckIn();
                        handleAssignRoom(selectedBookingForCheckIn);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Xếp phòng ngay
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={handleCloseCheckIn}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCheckIn}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${roomAssignmentStatus[selectedBookingForCheckIn.bookingId] !== 'assigned' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={roomAssignmentStatus[selectedBookingForCheckIn.bookingId] !== 'assigned'}
              >
                <CheckCircle size={18} />
                Xác nhận Check-in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-out Modal */}
      {showCheckOutModal && selectedBookingForCheckOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseCheckOut}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              aria-label="Đóng"
            >
              <XCircle size={24} />
            </button>
            <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Check-out Booking
              </h3>
              <p className="text-sm text-gray-600">
                Booking ID: <span className="font-semibold">{selectedBookingForCheckOut.bookingId}</span>
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* Thông tin khách hàng */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={20} className="text-gray-600" />
                  Thông tin khách hàng
                </h4>
                {(() => {
                  const user = userCache[selectedBookingForCheckOut.userId];
                  if (!user) return <div>Loading...</div>;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Họ tên:</span>
                        <p className="font-semibold text-gray-800">{user.fullName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-semibold text-gray-800">{user.email || 'Chưa có'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Số điện thoại:</span>
                        <p className="font-semibold text-gray-800">{user.phoneNumber || 'Chưa có'}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {/* Thông tin đặt phòng */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar size={20} className="text-gray-600" />
                  Thông tin đặt phòng
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Ngày đặt:</span>
                    <p className="font-semibold text-gray-800">{formatDate(selectedBookingForCheckOut.bookedAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Trạng thái:</span>
                    <p>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedBookingForCheckOut.bookingStatus]?.color}`}>
                        {statusConfig[selectedBookingForCheckOut.bookingStatus]?.label}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-in:</span>
                    <p className="font-semibold text-gray-800">{formatShortDate(selectedBookingForCheckOut.checkInDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Check-out:</span>
                    <p className="font-semibold text-gray-800">{formatShortDate(selectedBookingForCheckOut.checkOutDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Số đêm:</span>
                    <p className="font-semibold text-gray-800">{selectedBookingForCheckOut.nights} đêm</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Số khách:</span>
                    <p className="font-semibold text-gray-800">{selectedBookingForCheckOut.totalGuests} khách</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tổng tiền:</span>
                    <p className="font-semibold text-lg text-blue-600">{formatCurrency(selectedBookingForCheckOut.totalPrice)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Thanh toán:</span>
                    <p>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[selectedBookingForCheckOut.paymentStatus]?.color}`}>
                        {paymentStatusConfig[selectedBookingForCheckOut.paymentStatus]?.label}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              {/* Trạng thái thanh toán */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Trạng thái thanh toán
                </h4>
                {selectedBookingForCheckOut.paymentStatus === 'paid' ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle size={20} />
                    <span className="font-semibold">Đã thanh toán</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-yellow-700 mb-3">
                      <Clock size={20} />
                      <span className="font-semibold">Chờ thanh toán</span>
                    </div>
                    <button
                      onClick={() => {
                        handleCloseCheckOut();
                        handleOpenPayment(selectedBookingForCheckOut);
                      }}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                    >
                      Thanh toán ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={handleCloseCheckOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCheckOut}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${selectedBookingForCheckOut.paymentStatus !== 'paid' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                disabled={selectedBookingForCheckOut.paymentStatus !== 'paid'}
              >
                <CheckCircle size={18} />
                Xác nhận Check-out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagementPage;
