// src/components/promotions/PromotionFilters.jsx
import React from 'react';
import { usePromotionFilters } from '../../hooks/usePromotions';

const PromotionFilters = () => {
  const {
    filters,
    filterByStatus,
    searchPromotions,
    filterByStartDate, // ✅ THÊM
    filterByEndDate,   // ✅ THÊM
    clearAllFilters,
    hasActiveFilters
  } = usePromotionFilters();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow-sm border">
      {/* Tìm kiếm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
        <input
          type="text"
          placeholder="Tìm kiếm khuyến mãi..."
          value={filters.code || ''}
          onChange={(e) => searchPromotions(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Trạng thái */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
        <select
          value={filters.status || 'all'}
          onChange={(e) => {
            const selectedStatus = e.target.value;
            const statusToFilter = selectedStatus === 'all' ? '' : selectedStatus;
            filterByStatus(statusToFilter);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Không hoạt động</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>

      {/* ✅ SỬA: Từ ngày */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => filterByStartDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ✅ SỬA: Đến ngày */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => filterByEndDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Xóa bộ lọc */}
      {hasActiveFilters && (
        <div className="md:col-span-4 flex justify-end">
          <button
            onClick={() => {
              console.log('🗑️ Clearing all filters');
              clearAllFilters();
            }}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default PromotionFilters;