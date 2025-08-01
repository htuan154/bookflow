// src/components/promotions/PromotionStats.jsx
import React from 'react';
import { usePromotionStats } from '../../hooks/usePromotions';

const PromotionStats = ({ promotionId }) => {
  const { stats, loading, error, usagePercentage, remainingUsage, isFullyUsed } = usePromotionStats(promotionId);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Lỗi khi tải thống kê: {error}</div>;
  }

  if (!stats) {
    return <div className="text-gray-500 text-center">Không có dữ liệu thống kê</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg border text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.totalUsage}</div>
        <div className="text-sm text-gray-500">Tổng lượt sử dụng</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border text-center">
        <div className="text-2xl font-bold text-green-600">{stats.totalDiscount}₫</div>
        <div className="text-sm text-gray-500">Tổng số tiền giảm</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border text-center">
        <div className="text-2xl font-bold text-orange-600">{remainingUsage}</div>
        <div className="text-sm text-gray-500">Số lượt còn lại</div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border text-center">
        <div className="text-2xl font-bold text-purple-600">{usagePercentage.toFixed(1)}%</div>
        <div className="text-sm text-gray-500">Tỷ lệ sử dụng</div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${isFullyUsed ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PromotionStats;