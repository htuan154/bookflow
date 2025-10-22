// src/components/bookings/BookingCard.jsx
import React from 'react';
import { 
  Calendar, Users, DollarSign, Clock, CheckCircle, 
  XCircle, CreditCard
} from 'lucide-react';

const BookingCard = ({ booking, onConfirm, onCancel, onViewDetail }) => {
  const statusConfig = {
    pending: { 
      label: 'Chờ xác nhận', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: Clock 
    },
    confirmed: { 
      label: 'Đã xác nhận', 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: CheckCircle 
    },
    checked_in: { 
      label: 'Đã check-in', 
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle 
    },
    completed: { 
      label: 'Hoàn thành', 
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: CheckCircle 
    },
    cancelled: { 
      label: 'Đã hủy', 
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: XCircle 
    },
  };

  const paymentStatusConfig = {
    pending: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-800' },
    failed: { label: 'Thất bại', color: 'bg-red-100 text-red-800' },
    refunded: { label: 'Đã hoàn tiền', color: 'bg-purple-100 text-purple-800' },
  };

  const status = statusConfig[booking.bookingStatus] || statusConfig.pending;
  const StatusIcon = status.icon;
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 ${status.color.split(' ')[2]} p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Booking #{booking.bookingId.substring(0, 8)}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Đặt ngày: {formatDate(booking.bookedAt)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
            <StatusIcon size={16} />
            {status.label}
          </span>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${paymentStatusConfig[booking.paymentStatus]?.color}`}>
            {paymentStatusConfig[booking.paymentStatus]?.label}
          </span>
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-3 mb-4">
        {/* Dates */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="text-blue-500" size={18} />
            <div>
              <p className="text-xs text-gray-500">Check-in</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(booking.checkInDate)}</p>
            </div>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="text-blue-500" size={18} />
            <div>
              <p className="text-xs text-gray-500">Check-out</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(booking.checkOutDate)}</p>
            </div>
          </div>
        </div>

        {/* Nights and Guests */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="text-gray-400" size={18} />
            <span className="text-sm text-gray-700">{booking.nights} đêm</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="text-gray-400" size={18} />
            <span className="text-sm text-gray-700">{booking.totalGuests} khách</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="text-green-500" size={18} />
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(booking.totalPrice)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard size={16} />
            {booking.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' : 'Tiền mặt'}
          </div>
        </div>

        {/* Special Requests */}
        {booking.specialRequests && (
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500 mb-1">Yêu cầu đặc biệt:</p>
            <p className="text-sm text-gray-700">{booking.specialRequests}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t">
        <button
          onClick={() => onViewDetail?.(booking)}
          className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
        >
          Xem chi tiết
        </button>
        
        {booking.bookingStatus === 'pending' && (
          <>
            <button
              onClick={() => onConfirm?.(booking.bookingId)}
              className="flex-1 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-medium transition-colors"
            >
              Xác nhận
            </button>
            <button
              onClick={() => onCancel?.(booking.bookingId)}
              className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
