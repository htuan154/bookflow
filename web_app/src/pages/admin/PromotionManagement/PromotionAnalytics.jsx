// src/pages/admin/PromotionManagement/PromotionAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { usePromotions } from '../../../hooks/usePromotions';

const PromotionAnalytics = () => {
  const { promotions, loading} = usePromotions({ autoFetch: true });
  const [analyticsData, setAnalyticsData] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    totalUsage: 0,
    totalDiscount: 0,
    topPerformingPromotions: [],
    recentUsage: []
  });

  useEffect(() => {
    if (promotions) {
      calculateAnalytics();
    }
  }, [promotions]);

  const calculateAnalytics = () => {
    const total = promotions.length;
    const active = promotions.filter(p => p.status === 'active').length;
    const totalUsage = promotions.reduce((sum, p) => sum + (p.usedCount || 0), 0);
    const totalDiscount = promotions.reduce((sum, p) => sum + (p.totalDiscountGiven || 0), 0);
    
    const topPerforming = [...promotions]
      .sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0))
      .slice(0, 5);

    setAnalyticsData({
      totalPromotions: total,
      activePromotions: active,
      totalUsage,
      totalDiscount,
      topPerformingPromotions: topPerforming,
      recentUsage: [] // This would come from usage history API
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Phân tích khuyến mãi</h1>
        <p className="text-gray-600">Thống kê chi tiết và hiệu suất chương trình</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{analyticsData.totalPromotions}</div>
          <div className="text-blue-100">Tổng số khuyến mãi</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{analyticsData.activePromotions}</div>
          <div className="text-green-100">Đang hoạt động</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{analyticsData.totalUsage}</div>
          <div className="text-purple-100">Tổng lượt sử dụng</div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{analyticsData.totalDiscount}₫</div>
          <div className="text-orange-100">Tổng số tiền giảm</div>
        </div>
      </div>

      {/* Top Performing Promotions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Khuyến mãi nổi bật</h3>
          <div className="space-y-3">
            {analyticsData.topPerformingPromotions.map((promotion, index) => (
              <div key={promotion.promotionId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{promotion.name}</div>
                  <div className="text-sm text-gray-500">Mã: {promotion.code}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{promotion.usedCount || 0} lượt</div>
                  <div className="text-sm text-gray-500">
                    {promotion.promotionType === 'percentage' 
                      ? `${promotion.discountValue}%` 
                      : `${promotion.discountValue}₫`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Usage by Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Khuyến mãi theo trạng thái</h3>
          <div className="space-y-4">
            {['active', 'inactive', 'expired'].map(status => {
              const count = promotions.filter(p => {
                if (status === 'expired') {
                  return new Date(p.validUntil) < new Date();
                }
                return p.status === status;
              }).length;
              const percentage = analyticsData.totalPromotions > 0 
                ? (count / analyticsData.totalPromotions * 100).toFixed(1) 
                : 0;
              
              return (
                <div key={status} className="flex items-center">
                  <div className="w-20 text-sm capitalize">
                    {status === 'active'
                      ? 'Đang hoạt động'
                      : status === 'inactive'
                      ? 'Không hoạt động'
                      : 'Hết hạn'}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'active' ? 'bg-green-500' :
                          status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-right">
                    {count} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Khuyến mãi gần đây</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên chương trình
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đã sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hiệu lực đến
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.slice(0, 10).map((promotion) => (
                <tr key={promotion.promotionId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {promotion.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      promotion.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {promotion.status === 'active'
                        ? 'Đang hoạt động'
                        : promotion.status === 'inactive'
                        ? 'Không hoạt động'
                        : promotion.status === 'expired'
                        ? 'Hết hạn'
                        : promotion.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.promotionType === 'percentage' 
                      ? `${promotion.discountValue}%` 
                      : `${promotion.discountValue}₫`
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {promotion.usedCount || 0}/{promotion.usageLimit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(promotion.validUntil).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromotionAnalytics;