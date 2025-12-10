// src/components/promotions/PromotionFilters.jsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { usePromotionFilters } from '../../hooks/usePromotions';

const PromotionFilters = ({ onSearchChange }) => {
  const {
    filters,
    filterByStatus,
    searchPromotions,
    filterByStartDate, // ✅ THÊM
    filterByEndDate,   // ✅ THÊM
    clearAllFilters,
    hasActiveFilters
  } = usePromotionFilters();

  // Local state for form inputs
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  const handleApplyFilters = (e) => {
    e.preventDefault();
    // Client-side search with accent removal
    if (onSearchChange) {
      onSearchChange(localFilters.search);
    }
    // Server-side filters
    filterByStatus(localFilters.status === 'all' ? '' : localFilters.status);
    filterByStartDate(localFilters.startDate);
    filterByEndDate(localFilters.endDate);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      search: '',
      status: 'all',
      startDate: '',
      endDate: ''
    });
    // Clear client-side search
    if (onSearchChange) {
      onSearchChange('');
    }
    clearAllFilters();
  };

  return (
    <form onSubmit={handleApplyFilters} className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tìm kiếm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm kiếm khuyến mãi..."
            value={localFilters.search}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Trạng thái */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
          <select
            value={localFilters.status}
            onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
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

        {/* Từ ngày */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
          <input
            type="date"
            value={localFilters.startDate}
            onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Đến ngày */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
          <input
            type="date"
            value={localFilters.endDate}
            onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex justify-end gap-3">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
        <button
          type="submit"
          className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Tìm kiếm</span>
        </button>
      </div>
    </form>
  );
};

export default PromotionFilters;