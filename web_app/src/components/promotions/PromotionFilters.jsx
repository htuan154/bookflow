// src/components/promotions/PromotionFilters.jsx
import React from 'react';
import { usePromotionFilters } from '../../hooks/usePromotions';

const PromotionFilters = () => {
  const {
    filters,
    filterByStatus,
    searchPromotions,
    filterByDateRange,
    clearAllFilters,
    hasActiveFilters
  } = usePromotionFilters();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tìm kiếm
          </label>
          <input
            type="text"
            placeholder="Tìm kiếm khuyến mãi..."
            value={filters.search || ''}
            onChange={(e) => searchPromotions(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => filterByStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="expired">Hết hạn</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Từ ngày
          </label>
          <input
            type="date"
            value={filters.dateRange?.from || ''}
            onChange={(e) => filterByDateRange({ 
              ...filters.dateRange, 
              from: e.target.value 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đến ngày
          </label>
          <input
            type="date"
            value={filters.dateRange?.to || ''}
            onChange={(e) => filterByDateRange({ 
              ...filters.dateRange, 
              to: e.target.value 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4">
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default PromotionFilters;