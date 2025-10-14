// src/pages/hotel_owner/bookings/BookingManagementPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Search, ChevronDown, Eye, CheckCircle, 
  XCircle, Clock, DollarSign, Users, ArrowUpDown, Edit, Mail, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hotelApiService } from '../../../api/hotel.service';
import { useBooking } from '../../../hooks/useBooking';
import userService from '../../../api/user.service';
import { toast } from 'react-toastify';
import PaymentForm from '../../../components/payment/PaymentForm';

const BookingManagementPage = () => {
  const navigate = useNavigate();
  // States
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState(null);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [checkInDateFilter, setCheckInDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('bookedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [userCache, setUserCache] = useState({}); // Cache user info

  // Use booking hook
  const { 
    bookings, 
    loading: loadingBookings
  } = useBooking(selectedHotelId);

  // Load danh sách khách sạn của owner
  useEffect(() => {
    const loadHotels = async () => {
      try {
        setLoadingHotels(true);
        console.log('🔄 Loading hotels...');
        const response = await hotelApiService.getHotelsForOwner();
        const hotelData = response?.data || [];
        setHotels(hotelData);
        
        // Auto select hotel đầu tiên nếu có
        if (hotelData.length > 0) {
          setSelectedHotelId(hotelData[0].hotelId);
        }
        
        console.log('✅ Hotels loaded:', hotelData.length);
      } catch (error) {
        console.error('❌ Error loading hotels:', error);
        toast.error('Không thể tải danh sách khách sạn');
      } finally {
        setLoadingHotels(false);
      }
    };

    loadHotels();
  }, []);

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
  }, [bookings]);

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

  // Payment form modal
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (loadingHotels) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
        
        {/* Hotel Selector */}
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
                            <button 
                              onClick={() => handleEdit(booking.bookingId)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit size={18} />
                            </button>
                            {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'pending' && (
                              <button
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-orange-300"
                                title="Thanh toán"
                                onClick={() => setShowPaymentForm(true)}
                              >
                                Thanh toán
                              </button>
                            )}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
              onClick={() => setShowPaymentForm(false)}
              aria-label="Đóng"
            >
              ×
            </button>
            <PaymentForm />
          </div>
        </div>
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
    </div>
  );
};

export default BookingManagementPage;
