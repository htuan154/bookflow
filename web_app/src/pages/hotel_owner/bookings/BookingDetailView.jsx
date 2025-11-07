// src/pages/hotel_owner/bookings/BookingDetailView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Users, DollarSign, Clock, 
  CreditCard, FileText, Bed, Package, User, Mail, Phone, MapPin
} from 'lucide-react';
import { useBookingDetail } from '../../../hooks/useBookingDetail';
import userService from '../../../api/user.service';
import { toast } from 'react-toastify';
import { useBookingStatusHistory } from '../../../hooks/useBookingStatusHistory';
import PaymentForm from '../../../components/payment/PaymentForm';
import { bookingApiService } from '../../../api/booking.service';
import { CheckInPayment } from '../../../components/payment/BookingPayment';

const BookingDetailView = () => {
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  // Payment success handler
  const handlePaymentSuccess = async (qrData, paymentInfo) => {
    try {
      // Cập nhật trạng thái booking lên backend
      if (booking?.bookingId) {
        await bookingApiService.updateBooking(booking.bookingId, {
          paymentStatus: 'paid',
          bookingStatus: 'confirmed'
        });
        toast.success('Thanh toán thành công! Booking đã được cập nhật.');
        setShowPaymentModal(false);
        setSelectedBookingForPayment(null);
        // Refetch lại dữ liệu booking
        await loadBookingInfo();
      }
    } catch (error) {
      console.error('❌ Error updating booking status:', error);
      toast.error('Thanh toán thành công nhưng không thể cập nhật trạng thái booking');
    }
  };

  // Payment error handler
  const handlePaymentError = (error) => {
    console.error('❌ Payment error:', error);
    toast.error('Lỗi thanh toán: ' + error.message);
  };
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchFullBookingInfo, fetchBookingDetails, loading } = useBookingDetail();
  const [bookingInfo, setBookingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const { history, fetchHistory } = useBookingStatusHistory(bookingId);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    // Kiểm tra xem có data từ navigation state không
    const bookingFromState = location.state?.booking;
    const userFromState = location.state?.user;
    
    if (bookingFromState && bookingFromState.bookingId === bookingId) {
      // Nếu có data từ state, chỉ cần load booking details
      loadBookingDetailsOnly(bookingFromState, userFromState);
    } else if (bookingId) {
      // Nếu không có, load full info
      loadBookingInfo();
    }
    
    // Load booking status history
    if (bookingId) {
      fetchHistory();
    }
  }, [bookingId]);

  const loadBookingDetailsOnly = async (booking, user) => {
    try {
      setIsLoading(true);
      const details = await fetchBookingDetails(bookingId);
      setBookingInfo({
        booking,
        details: details || []
      });
      // Nếu có user info từ state thì dùng luôn
      if (user) {
        setUserInfo(user);
      } else if (booking.userId) {
        await loadUserInfo(booking.userId);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      // Fallback: load full info nếu lỗi
      await loadBookingInfo();
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookingInfo = async () => {
    try {
      setIsLoading(true);
      const info = await fetchFullBookingInfo(bookingId);
      setBookingInfo(info);
      // Load user info
      if (info?.booking?.userId) {
        await loadUserInfo(info.booking.userId);
      }
    } catch (error) {
      console.error('Error loading booking info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserInfo = async (userId) => {
    try {
      const response = await userService.getUserById(userId);
      setUserInfo(response?.data || response);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const statusConfig = {
    pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    canceled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-300' },
    completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800 border-green-300' },
    no_show: { label: 'Không đến', color: 'bg-gray-100 text-gray-800 border-gray-300' }
  };

  const paymentStatusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    refunded: { label: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' },
    failed: { label: 'Thất bại', color: 'bg-red-100 text-red-800' }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch (error) {
      return dateString;
    }
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!bookingInfo) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Không tìm thấy thông tin booking</p>
      </div>
    );
  }

  const { booking, details } = bookingInfo;

  return (
  <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/hotel-owner/bookings')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span>Quay lại danh sách</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Chi tiết Booking #{booking.bookingId?.substring(0, 8)}
        </h1>
        <button
          onClick={() => navigate(`/hotel-owner/bookings/${bookingId}/edit`, { state: { booking, user: userInfo } })}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Chỉnh sửa
        </button>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="text-blue-500" size={24} />
          Thông tin khách hàng
        </h2>
        
        {userInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {/* Full Name */}
              <div className="flex items-center gap-3">
                <User className="text-blue-500" size={20} />
                <div>
                  <label className="text-sm text-gray-500 block">Họ tên</label>
                  <p className="font-medium text-gray-900">{userInfo.fullName || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="text-blue-500" size={20} />
                <div>
                  <label className="text-sm text-gray-500 block">Email</label>
                  <p className="font-medium text-gray-900">{userInfo.email || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Phone */}
              <div className="flex items-center gap-3">
                <Phone className="text-blue-500" size={20} />
                <div>
                  <label className="text-sm text-gray-500 block">Số điện thoại</label>
                  <p className="font-medium text-gray-900">{userInfo.phoneNumber || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-3">
                <MapPin className="text-blue-500" size={20} />
                <div>
                  <label className="text-sm text-gray-500 block">Địa chỉ</label>
                  <p className="font-medium text-gray-900">{userInfo.address || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            Đang tải thông tin khách hàng...
          </div>
        )}
      </div>

      {/* Booking Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin đặt phòng</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Status */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">Trạng thái booking</label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusConfig[booking.bookingStatus]?.color}`}>
                {statusConfig[booking.bookingStatus]?.label}
              </span>
            </div>

            {/* Payment Status */}
            <div>
              <label className="text-sm text-gray-500 block mb-1">Trạng thái thanh toán</label>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${paymentStatusConfig[booking.paymentStatus]?.color}`}>
                {paymentStatusConfig[booking.paymentStatus]?.label}
              </span>
            </div>

            {/* Check-in Date */}
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-500" size={20} />
              <div>
                <label className="text-sm text-gray-500 block">Ngày check-in</label>
                <p className="font-medium">{formatShortDate(booking.checkInDate)}</p>
              </div>
            </div>

            {/* Check-out Date */}
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-500" size={20} />
              <div>
                <label className="text-sm text-gray-500 block">Ngày check-out</label>
                <p className="font-medium">{formatShortDate(booking.checkOutDate)}</p>
              </div>
            </div>

            {/* Nights */}
            <div className="flex items-center gap-3">
              <Clock className="text-blue-500" size={20} />
              <div>
                <label className="text-sm text-gray-500 block">Số đêm</label>
                <p className="font-medium">{booking.nights} đêm</p>
              </div>
            </div>

            {/* Guests */}
            <div className="flex items-center gap-3">
              <Users className="text-blue-500" size={20} />
              <div>
                <label className="text-sm text-gray-500 block">Số khách</label>
                <p className="font-medium">{booking.totalGuests} khách</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Actual Check-in */}
            {booking.actualCheckInDate && (
              <div className="flex items-center gap-3">
                <Calendar className="text-green-500" size={20} />
                <div>
                  <label className="text-sm text-gray-500 block">Thực tế check-in</label>
                  <p className="font-medium">{formatDate(booking.actualCheckInDate)}</p>
                </div>
              </div>
            )}

            {/* Actual Check-out */}
            {booking.actualCheckOutDate && (
              <div className="flex items-center gap-3">
                <Calendar className="text-green-500" size={20} />
                <div>
                  <label className="text-sm text-gray-500 block">Thực tế check-out</label>
                  <p className="font-medium">{formatDate(booking.actualCheckOutDate)}</p>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="flex items-center gap-3">
              <CreditCard className="text-blue-500" size={20} />
              <div>
                <label className="text-sm text-gray-500 block">Phương thức thanh toán</label>
                <p className="font-medium">
                  {booking.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' : 'Tiền mặt'}
                </p>
              </div>
            </div>

            {/* Total Price */}
            <div className="flex items-center gap-3">
              <DollarSign className="text-green-500" size={20} />
              <div>
                <label className="text-sm text-gray-500 block">Tổng tiền</label>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(booking.totalPrice)}
                </p>
              </div>
            </div>

            {/* Booked At */}
            <div className="flex items-center gap-3">
              <Clock className="text-gray-500" size={20} />
              <div>
                <label className="text-sm text-gray-500 block">Đặt lúc</label>
                <p className="font-medium">{formatDate(booking.bookedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {booking.specialRequests && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-start gap-3">
              <FileText className="text-blue-500 mt-1" size={20} />
              <div className="flex-1">
                <label className="text-sm text-gray-500 block mb-1">Yêu cầu đặc biệt</label>
                <p className="text-gray-700">{booking.specialRequests}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details (Room Types) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bed className="text-blue-500" size={24} />
          Chi tiết phòng đã đặt
        </h2>

        {details && details.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Loại phòng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Số lượng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Khách/phòng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Đơn giá</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {details.map((detail, index) => (
                  <tr key={detail.detailId || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="text-blue-500" size={16} />
                        <span className="font-medium text-gray-900">
                          {detail.roomTypeId?.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{detail.quantity} phòng</td>
                    <td className="px-4 py-3 text-gray-700">{detail.guestsPerRoom} khách</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(detail.unitPrice)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCurrency(detail.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-700">
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-3 text-xl font-bold text-green-600">
                    {formatCurrency(booking.totalPrice)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Không có chi tiết phòng
          </div>
        )}
        {/* Nút thanh toán cuối trang nếu đủ điều kiện */}
        {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'pending' && (
          <div className="mt-8 flex justify-end">
            <button
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold shadow border border-orange-300"
              onClick={() => {
                setSelectedBookingForPayment(booking);
                setShowPaymentModal(true);
              }}
            >
              Thanh toán
            </button>
          </div>
        )}

        {/* Payment Modal - VietQR Check-in Payment */}
        {showPaymentModal && selectedBookingForPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Close button */}
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBookingForPayment(null);
                }}
                aria-label="Đóng"
              >
                ×
              </button>
              {/* Booking info header */}
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Thanh toán Booking
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Khách:</span> {userInfo?.fullName || 'Loading...'}
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
      </div>

      {/* Booking Status History */}
      {history && history.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-blue-500" size={24} />
            Lịch sử thay đổi trạng thái
          </h2>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div 
                key={item.historyId || index} 
                className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${statusConfig[item.oldStatus]?.color || 'bg-gray-200 text-gray-700'}`}>
                      {statusConfig[item.oldStatus]?.label || item.oldStatus || 'Mới'}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${statusConfig[item.newStatus]?.color || 'bg-blue-100 text-blue-700'}`}>
                      {statusConfig[item.newStatus]?.label || item.newStatus}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {item.changedAt ? new Date(item.changedAt).toLocaleString('vi-VN') : 'Invalid Date'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailView;
