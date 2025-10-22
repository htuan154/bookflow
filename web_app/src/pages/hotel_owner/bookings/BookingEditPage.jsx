// src/pages/hotel_owner/bookings/BookingEditPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, User, Mail, Phone } from 'lucide-react';
import { bookingApiService } from '../../../api/booking.service';
import userService from '../../../api/user.service';
import { toast } from 'react-toastify';
import { useBookingStatusHistory } from '../../../hooks/useBookingStatusHistory';

const BookingEditPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [changeReason, setChangeReason] = useState('');
  const [notes, setNotes] = useState('');
  const { history, fetchHistory, addHistory } = useBookingStatusHistory(bookingId);

  useEffect(() => {
    // Kiểm tra xem có data từ navigation state không
    const bookingFromState = location.state?.booking;
    const userFromState = location.state?.user;
    
    if (bookingFromState && bookingFromState.bookingId === bookingId) {
      // Nếu có data từ state, dùng luôn
      setBooking(bookingFromState);
      setNewStatus(bookingFromState.bookingStatus);
      setLoading(false);
      // Nếu có user info từ state thì dùng luôn
      if (userFromState) {
        setUserInfo(userFromState);
      } else if (bookingFromState.userId) {
        loadUserInfo(bookingFromState.userId);
      }
    } else if (bookingId) {
      // Nếu không có, load từ API
      loadBooking();
    }
    
    // Load booking status history
    if (bookingId) {
      fetchHistory();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingApiService.getBookingById(bookingId);
      const bookingData = response?.data || response;
      setBooking(bookingData);
      setNewStatus(bookingData.bookingStatus);
      // Load user info
      if (bookingData.userId) {
        await loadUserInfo(bookingData.userId);
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Không thể tải thông tin booking');
    } finally {
      setLoading(false);
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

  // Logic chuyển đổi trạng thái
  const getAvailableStatuses = (currentStatus) => {
    const statusTransitions = {
      pending: [
        { value: 'pending', label: 'Chờ xác nhận' },
        { value: 'confirmed', label: 'Đã xác nhận' },
        { value: 'canceled', label: 'Đã hủy' }
      ],
      confirmed: [
        { value: 'confirmed', label: 'Đã xác nhận' },
        ...(booking?.paymentStatus === 'paid'
          ? [{ value: 'completed', label: 'Hoàn thành' }]
          : []),
        { value: 'no_show', label: 'Không đến' }
      ],
      canceled: [
        { value: 'canceled', label: 'Đã hủy' }
      ],
      completed: [
        { value: 'completed', label: 'Hoàn thành' }
      ],
      no_show: [
        { value: 'no_show', label: 'Không đến' }
      ]
    };

    return statusTransitions[currentStatus] || [];
  };

  const handleSave = async () => {
    if (newStatus === booking.bookingStatus) {
      toast.info('Không có thay đổi nào');
      return;
    }

    // Kiểm tra nếu chuyển sang canceled thì bắt buộc phải có lý do
    if (newStatus === 'canceled' && !changeReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy booking');
      return;
    }

    if (!window.confirm(`Xác nhận thay đổi trạng thái sang "${getStatusLabel(newStatus)}"?`)) {
      return;
    }

    try {
      setSaving(true);
      
      // Cập nhật trạng thái booking
      await bookingApiService.updateBookingStatus(bookingId, newStatus);
      
      // Tạo bản ghi lịch sử trạng thái
      try {
        await addHistory({
          old_status: booking.bookingStatus,
          new_status: newStatus,
          change_reason: changeReason.trim() || null,
          notes: notes.trim() || null
        });
      } catch (historyError) {
        console.error('Error creating status history:', historyError);
        // Không làm gián đoạn flow chính nếu lỗi khi tạo history
      }
      
      toast.success('Cập nhật trạng thái thành công');
      
      // Cập nhật lại booking status trước khi navigate
      const updatedBooking = { ...booking, bookingStatus: newStatus };
      navigate(`/hotel-owner/bookings/${bookingId}`, { state: { booking: updatedBooking, user: userInfo } });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      canceled: 'Đã hủy',
      completed: 'Hoàn thành',
      no_show: 'Không đến'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      canceled: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      no_show: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Không tìm thấy thông tin booking</p>
      </div>
    );
  }

  const availableStatuses = getAvailableStatuses(booking.bookingStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Chỉnh sửa Booking #{booking.bookingId?.substring(0, 8)}
        </h1>
        <div className="w-24"></div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">Cập nhật trạng thái booking</h2>

        {/* Current Status */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái hiện tại
          </label>
          <span className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium border-2 ${getStatusColor(booking.bookingStatus)}`}>
            {getStatusLabel(booking.bookingStatus)}
          </span>
        </div>

        {/* New Status Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái mới
          </label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Change Reason - Required for canceled status */}
        {newStatus === 'canceled' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do hủy <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Nhập lý do hủy booking..."
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Bắt buộc khi hủy booking</p>
          </div>
        )}

        {/* Optional Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú thêm (Tùy chọn)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Thêm ghi chú về thay đổi trạng thái..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Transition Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Quy tắc chuyển đổi trạng thái:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Chờ xác nhận</strong> → Đã xác nhận hoặc Đã hủy</li>
                <li><strong>Đã xác nhận</strong> → <span className="font-semibold">Hoàn thành</span> <span className="text-xs">(chỉ khi đã thanh toán)</span> hoặc Không đến</li>
                <li><strong>Đã hủy</strong>: Không thể chuyển sang trạng thái khác</li>
                <li><strong>Hoàn thành</strong> và <strong>Không đến</strong>: Không thể thay đổi</li>
              </ul>
              <p className="mt-2 text-xs text-gray-600">Lưu ý: Nếu booking chưa thanh toán, không thể chuyển sang trạng thái Hoàn thành.</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {userInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <div>
                  <span className="text-gray-500 block text-xs">Họ tên</span>
                  <p className="font-medium">{userInfo.fullName || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <div>
                  <span className="text-gray-500 block text-xs">Email</span>
                  <p className="font-medium">{userInfo.email || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <div>
                  <span className="text-gray-500 block text-xs">Số điện thoại</span>
                  <p className="font-medium">{userInfo.phoneNumber || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Info Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Thông tin booking</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Booking ID:</span>
              <p className="font-medium">{booking.bookingId?.substring(0, 13)}...</p>
            </div>
            <div>
              <span className="text-gray-500">Số khách:</span>
              <p className="font-medium">{booking.totalGuests} khách</p>
            </div>
            <div>
              <span className="text-gray-500">Check-in:</span>
              <p className="font-medium">
                {new Date(booking.checkInDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Check-out:</span>
              <p className="font-medium">
                {new Date(booking.checkOutDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        {/* Booking Status History */}
        {history && history.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">Lịch sử thay đổi trạng thái</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((item, index) => (
                <div key={item.historyId || index} className="text-sm border-l-2 border-blue-500 pl-3 py-2 bg-white rounded">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">{item.oldStatus || 'Mới'}</span>
                    <span>→</span>
                    <span className="font-medium text-blue-600">{item.newStatus}</span>
                    <span className="text-xs text-gray-400">
                      {item.changedAt ? new Date(item.changedAt).toLocaleString('vi-VN') : 'Invalid Date'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || newStatus === booking.bookingStatus}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={20} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingEditPage;
