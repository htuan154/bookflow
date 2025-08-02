// src/components/promotions/PromotionDetails.jsx
import  { useEffect } from 'react';
import { usePromotions } from '../../hooks/usePromotions';
import { formatDate, formatCurrency } from '../../utils/formatters';

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
      getPromotionDetails(promotionId);
      getUsageHistory(promotionId);
    }
  }, [promotionId]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>;
  }

  if (!currentPromotion) {
    return <div className="text-center text-gray-500">Promotion not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Thông tin cơ bản */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Thông tin khuyến mãi</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Tên chương trình</p>
            <p className="font-medium">{currentPromotion.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Mã khuyến mãi</p>
            <p className="font-medium">{currentPromotion.code}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Giảm giá</p>
            <p className="font-medium">
              {currentPromotion.promotionType === 'percentage'
                ? `${currentPromotion.discountValue}%`
                : formatCurrency(currentPromotion.discountValue)
              }
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Trạng thái</p>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentPromotion.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {currentPromotion.status === 'active'
                ? 'Đang hoạt động'
                : currentPromotion.status === 'inactive'
                ? 'Không hoạt động'
                : currentPromotion.status === 'expired'
                ? 'Hết hạn'
                : currentPromotion.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Hiệu lực từ</p>
            <p className="font-medium">{formatDate(currentPromotion.validFrom)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Hiệu lực đến</p>
            <p className="font-medium">{formatDate(currentPromotion.validUntil)}</p>
          </div>
        </div>
        {currentPromotion.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Mô tả</p>
            <p className="font-medium">{currentPromotion.description}</p>
          </div>
        )}
      </div>

      {/* Thống kê sử dụng */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Thống kê sử dụng</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{usageHistory?.length || 0}</p>
            <p className="text-sm text-gray-500">Tổng lượt sử dụng</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{currentPromotion.usageLimit}</p>
            <p className="text-sm text-gray-500">Giới hạn sử dụng</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {Math.max(0, currentPromotion.usageLimit - (usageHistory?.length || 0))}
            </p>
            <p className="text-sm text-gray-500">Còn lại</p>
          </div>
        </div>
      </div>

      {/* Lịch sử sử dụng gần đây */}
      {usageHistory && usageHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Lịch sử sử dụng gần đây</h3>
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
                    Số tiền giảm
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usageHistory.slice(0, 5).map((usage, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(usage.usedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usage.customerName || 'Không rõ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(usage.discountAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionDetails;