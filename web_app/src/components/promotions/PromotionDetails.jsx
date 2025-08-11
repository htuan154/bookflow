// src/components/promotions/PromotionDetails.jsx
import React, { useEffect } from 'react';
import { usePromotions } from '../../hooks/usePromotions';
import { formatDate } from '../../utils/formatters';

const PromotionDetails = ({ promotionId }) => {
  const { 
    currentPromotion,  
    usageHistory, 
    loading, 
    getPromotionDetails, 
    getUsageHistory 
  } = usePromotions();

  useEffect(() => {
    if (promotionId) {
      if (getPromotionDetails) {
        getPromotionDetails(promotionId);
      }
      
      if (getUsageHistory) {
        getUsageHistory(promotionId);
      }
    }
  }, [promotionId, getPromotionDetails, getUsageHistory]);

  // ✅ Custom VND formatter
  const formatVND = (amount) => {
    if (!amount || isNaN(amount)) return '0 VND';
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-64 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Đang tải dữ liệu khuyến mãi...</span>
      </div>
    );
  }

  if (!currentPromotion) {
    return (
      <div className="text-center text-gray-500 p-8">
        <p>Không tìm thấy thông tin khuyến mãi</p>
        {promotionId && (
          <p className="text-sm mt-2">ID: {promotionId}</p>
        )}
      </div>
    );
  }

  const promotionData = currentPromotion.data || currentPromotion;

  const getPromotionField = (field, fallback = 'N/A') => {
    return promotionData?.[field] || fallback;
  };

  // ✅ Updated discount formatting with VND
  const formatDiscount = () => {
  const discountValue = parseFloat(getPromotionField('discountValue', 0));
  // Luôn hiển thị phần trăm
  return `${discountValue}%`;
  };

  const getStatusInfo = () => {
    const status = getPromotionField('status', 'unknown');
    
    const statusConfig = {
      'active': { label: 'Đang hoạt động', class: 'bg-green-100 text-green-800' },
      'inactive': { label: 'Không hoạt động', class: 'bg-red-100 text-red-800' },
      'expired': { label: 'Hết hạn', class: 'bg-gray-100 text-gray-800' },
      'upcoming': { label: 'Sắp diễn ra', class: 'bg-yellow-100 text-yellow-800' },
      'success': { label: 'Thành công', class: 'bg-blue-100 text-blue-800' },
      'pending': { label: 'Chờ duyệt', class: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: 'Đã duyệt', class: 'bg-green-100 text-green-800' },
      'rejected': { label: 'Bị từ chối', class: 'bg-red-100 text-red-800' }
    };
    
    return statusConfig[status] || { label: status, class: 'bg-gray-100 text-gray-600' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-6">
      {/* Thông tin cơ bản */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Thông tin khuyến mãi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Tên chương trình</p>
            <p className="font-medium text-gray-900">{getPromotionField('name')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Mã khuyến mãi</p>
            <p className="font-medium text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
              {getPromotionField('code')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Loại khuyến mãi</p>
            <p className="font-medium text-gray-900">
              {getPromotionField('promotionType') === 'room_specific' 
                ? 'Theo phòng' 
                : getPromotionField('promotionType') === 'percentage'
                ? 'Theo phần trăm'
                : 'Khuyến mãi chung'
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Giá trị giảm</p>
            <p className="font-medium text-gray-900 text-lg text-green-600">
              {formatDiscount()}
            </p>
          </div>

            <div>
                <p className="text-sm text-gray-500 mb-1">Số tiền giảm tối đa</p>
                <p className="font-medium text-gray-900">
                  {getPromotionField('maxDiscountAmount') !== 'N/A' && Number(getPromotionField('maxDiscountAmount', 0)) > 0
                    ? formatVND(parseFloat(getPromotionField('maxDiscountAmount', 0)))
                    : 'Không giới hạn'}
                </p>
            </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Giá trị đơn hàng tối thiểu</p>
            <p className="font-medium text-gray-900">
              {getPromotionField('minBookingPrice') !== 'N/A' && getPromotionField('minBookingPrice') > 0
                ? formatVND(parseFloat(getPromotionField('minBookingPrice', 0)))
                : 'Không giới hạn'
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
              {statusInfo.label}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Hiệu lực từ</p>
            <p className="font-medium text-gray-900">
              {getPromotionField('validFrom') !== 'N/A' 
                ? formatDate(getPromotionField('validFrom'))
                : 'N/A'
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Hiệu lực đến</p>
            <p className="font-medium text-gray-900">
              {getPromotionField('validUntil') !== 'N/A'
                ? formatDate(getPromotionField('validUntil'))
                : 'N/A'
              }
            </p>
          </div>
        </div>
        
        {getPromotionField('description') !== 'N/A' && getPromotionField('description').trim() && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Mô tả</p>
            <p className="text-gray-900">{getPromotionField('description')}</p>
          </div>
        )}
      </div>

      {/* Thống kê sử dụng */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Thống kê sử dụng</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {getPromotionField('usedCount', 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Tổng lượt sử dụng</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {getPromotionField('usageLimit', 0) || '∞'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {getPromotionField('usageLimit', 0) ? 'Giới hạn sử dụng' : 'Không giới hạn'}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-600">
              {getPromotionField('usageLimit', 0) 
                ? Math.max(0, parseInt(getPromotionField('usageLimit', 0)) - parseInt(getPromotionField('usedCount', 0)))
                : '∞'
              }
            </p>
            <p className="text-sm text-gray-600 mt-1">Còn lại</p>
          </div>
        </div>

        {/* Progress bar - only show if there's a usage limit */}
        {getPromotionField('usageLimit', 0) > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Tiến độ sử dụng</span>
              <span>
                {getPromotionField('usedCount', 0)}/{getPromotionField('usageLimit', 0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (parseInt(getPromotionField('usedCount', 0)) / Math.max(1, parseInt(getPromotionField('usageLimit', 1)))) * 100)}%`
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Hotel Information */}
      {getPromotionField('hotelId') !== 'N/A' && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Thông tin khách sạn</h3>
          <div>
            <p className="text-sm text-gray-500 mb-1">Mã khách sạn</p>
            <p className="font-medium text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {getPromotionField('hotelId')}
            </p>
          </div>
        </div>
      )}

      {/* Lịch sử sử dụng gần đây */}
      {usageHistory && usageHistory.length > 0 ? (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Lịch sử sử dụng gần đây</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày sử dụng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền giảm (VND)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageHistory.slice(0, 5).map((usage, index) => (
                  <tr key={usage.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usage.usedAt ? formatDate(usage.usedAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usage.customerName || usage.customer?.name || 'Không rõ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                      {usage.discountAmount ? formatVND(usage.discountAmount) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Lịch sử sử dụng</h3>
          <div className="text-center text-gray-500 py-8">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p>Chưa có lịch sử sử dụng</p>
            <p className="text-sm mt-1">Khuyến mãi này chưa được sử dụng bởi khách hàng nào.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionDetails;