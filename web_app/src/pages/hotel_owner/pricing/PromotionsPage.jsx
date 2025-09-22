// src/pages/hotel_owner/pricing/PromotionsPage.jsx
import React, { useState } from 'react';
import { BadgePercent, Plus, Edit, Trash2, Calendar, Users, Gift, TrendingUp } from 'lucide-react';

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([
    {
      id: 1,
      name: 'Ưu đãi mùa hè 2024',
      code: 'SUMMER2024',
      type: 'percentage',
      value: 20,
      minAmount: 1000000,
      maxDiscount: 500000,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      usageLimit: 100,
      usedCount: 45,
      status: 'active'
    },
    {
      id: 2,
      name: 'Giảm giá sinh nhật khách sạn',
      code: 'BIRTHDAY50',
      type: 'fixed',
      value: 300000,
      minAmount: 1500000,
      maxDiscount: 300000,
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      usageLimit: 50,
      usedCount: 38,
      status: 'expired'
    },
    {
      id: 3,
      name: 'Khuyến mãi cuối tuần',
      code: 'WEEKEND15',
      type: 'percentage',
      value: 15,
      minAmount: 800000,
      maxDiscount: 400000,
      startDate: '2024-09-01',
      endDate: '2024-12-31',
      usageLimit: 200,
      usedCount: 12,
      status: 'active'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Đang hoạt động' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Đã hết hạn' },
      scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Đã lên lịch' },
      paused: { color: 'bg-yellow-100 text-yellow-800', text: 'Tạm dừng' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getDiscountText = (promotion) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}%`;
    } else {
      return formatCurrency(promotion.value);
    }
  };

  const getUsagePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Khuyến Mãi</h1>
          <p className="text-gray-600">Tạo và quản lý các chương trình khuyến mãi</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Tạo khuyến mãi mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BadgePercent className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Khuyến mãi hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{promotions.filter(p => p.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lượt sử dụng</p>
              <p className="text-2xl font-bold text-gray-900">{promotions.reduce((sum, p) => sum + p.usedCount, 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Gift className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng tiết kiệm</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(25000000)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tỷ lệ chuyển đổi</p>
              <p className="text-2xl font-bold text-gray-900">68%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách khuyến mãi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên khuyến mãi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">
                      {promotion.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      {getDiscountText(promotion)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Tối thiểu: {formatCurrency(promotion.minAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">
                        {promotion.usedCount}/{promotion.usageLimit}
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${getUsagePercentage(promotion.usedCount, promotion.usageLimit)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(promotion.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Promotion Modal - Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tạo khuyến mãi mới</h3>
            <p className="text-gray-600 mb-4">Chức năng này sẽ được phát triển sau.</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionsPage;