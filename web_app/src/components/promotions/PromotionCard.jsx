// src/components/promotions/PromotionCard.jsx
import React from 'react';
import { formatDate } from '../../utils/formatters';

const PromotionCard = ({ promotion, onDelete, onView, onEdit }) => {
  // ✅ Custom VND formatter
  const formatVND = (amount) => {
    if (!amount || isNaN(amount) || amount === 0) return 'Không giới hạn';
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'expired': return 'Hết hạn';
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Bị từ chối';
      default: return status;
    }
  };

  // ✅ DEFAULT: Always display as percentage
  const formatDiscount = (promotionObj) => {
    if (!promotionObj) return '';
    const value = promotionObj.discountValue || promotionObj.discount_value;
    return value != null ? `${value}%` : '';
  };

  const formatMinBookingPrice = () => {
    const minPrice = promotion.minBookingPrice || promotion.min_booking_price;
    return formatVND(minPrice);
  };

  const formatUsageLimit = () => {
    const usageLimit = promotion.usageLimit || promotion.usage_limit;
    const usedCount = promotion.usedCount || promotion.used_count || 0;
    
    if (!usageLimit || usageLimit === 0) {
      return `${usedCount}/∞`;
    }
    return `${usedCount}/${usageLimit}`;
  };

  // ✅ Calculate usage percentage for progress bar
  const getUsagePercentage = () => {
    const usageLimit = promotion.usageLimit || promotion.usage_limit;
    const usedCount = promotion.usedCount || promotion.used_count || 0;
    
    if (!usageLimit || usageLimit === 0) return 0;
    return Math.min(100, (usedCount / usageLimit) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{promotion.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Mã:</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-900">
                {promotion.code}
              </span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(promotion.status)}`}>
            {getStatusLabel(promotion.status)}
          </span>
        </div>
        
        {/* ✅ Discount Value - Prominent Display */}
        <div className="text-center py-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg mb-4">
          <p className="text-sm text-gray-600 mb-1">Giá trị giảm giá</p>
          <p className="text-3xl font-bold text-blue-600">{formatDiscount(promotion)}</p>
        </div>
        
        {/* Description */}
        {promotion.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">{promotion.description}</p>
        )}
      </div>

      {/* Details Grid */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Đặt tối thiểu</p>
            <p className="font-medium text-sm">{formatMinBookingPrice()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Lượt sử dụng</p>
            <p className="font-medium text-sm">{formatUsageLimit()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Hiệu lực từ</p>
            <p className="font-medium text-sm">{formatDate(promotion.validFrom || promotion.valid_from)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Hiệu lực đến</p>
            <p className="font-medium text-sm">{formatDate(promotion.validUntil || promotion.valid_until)}</p>
          </div>
        </div>

        {/* ✅ Usage Progress Bar */}
        {(promotion.usageLimit || promotion.usage_limit) > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Tiến độ sử dụng</span>
              <span>{Math.round(getUsagePercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getUsagePercentage()}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onView && onView(promotion)}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Xem</span>
          </button>
          
          {onEdit && (
            <button
              onClick={() => onEdit(promotion)}
              disabled={false}
              className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Sửa</span>
            </button>
          )}
          
          <button
            onClick={() => onDelete && onDelete(promotion)}
            className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionCard;