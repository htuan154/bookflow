// src/components/promotions/PromotionCard.jsx
import React from 'react';
import { formatDate, formatCurrency } from '../../utils/formatters';

const PromotionCard = ({ promotion, onEdit, onDelete, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'expired': return 'Hết hạn';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{promotion.name}</h3>
          <p className="text-sm text-gray-600">Mã: {promotion.code}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promotion.status)}`}>
          {getStatusLabel(promotion.status)}
        </span>
      </div>
      
      <p className="text-gray-700 mb-4">{promotion.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Giảm giá</p>
          <p className="font-medium">
            {promotion.promotionType === 'percentage'
              ? `${promotion.discountValue}%`
              : formatCurrency(promotion.discountValue)
            }
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Đặt tối thiểu</p>
          <p className="font-medium">{formatCurrency(promotion.minBookingPrice)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Hiệu lực từ</p>
          <p className="font-medium">{formatDate(promotion.validFrom)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Hiệu lực đến</p>
          <p className="font-medium">{formatDate(promotion.validUntil)}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Số lượt sử dụng: {promotion.usedCount || 0}/{promotion.usageLimit}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onView(promotion)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Xem
          </button>
          <button
            onClick={() => onEdit(promotion)}
            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
          >
            Sửa
          </button>
          <button
            onClick={() => onDelete(promotion)}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionCard;