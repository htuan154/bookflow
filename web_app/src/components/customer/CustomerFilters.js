import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, ChevronDown, ChevronUp, Calendar, SortAsc, SortDesc, Users, Shield, CheckCircle, XCircle, Hotel, Settings } from 'lucide-react';

const CustomerFilters = ({ filters, onFilterChange }) => {
    const [localFilters, setLocalFilters] = useState(filters);
    const [isAdvanced, setIsAdvanced] = useState(false);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFilters = {
            ...localFilters,
            [name]: value,
            role: 'hotel_owner' // Luôn giữ role là hotel_owner
        };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleReset = () => {
        const resetFilters = {
            search: '',
            role: 'hotel_owner',
            page: 1 // Reset về trang đầu
        };
        setLocalFilters(resetFilters);
        onFilterChange(resetFilters); // Trigger local filtering với empty search
    };

    const toggleAdvanced = () => {
        setIsAdvanced(!isAdvanced);
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'inactive': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Users className="w-4 h-4 text-gray-500" />;
        }
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (localFilters.search) count++;
        // Bỏ status filter
        // if (localFilters.dateFrom) count++;
        // if (localFilters.dateTo) count++;
        return count;
    };

    const activeFiltersCount = getActiveFiltersCount();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            <Search className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Bộ lọc và tìm kiếm</h3>
                            <p className="text-sm text-gray-600">Tìm kiếm và lọc danh sách chủ khách sạn</p>
                        </div>
                    </div>
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Filter className="w-3 h-3 mr-1" />
                                {activeFiltersCount} bộ lọc
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Basic Filters */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search Input - Chỉ tìm theo email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            Tìm kiếm theo email
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input 
                                    type="email"
                                    name="search"
                                    value={localFilters.search || ''}
                                    onChange={(e) => {
                                        const { name, value } = e.target;
                                        const newFilters = {
                                            ...localFilters,
                                            [name]: value,
                                            role: 'hotel_owner'
                                        };
                                        setLocalFilters(newFilters);
                                        // Không gọi onFilterChange ngay, chờ user nhấn nút
                                    }}
                                    placeholder="Nhập email của chủ khách sạn..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            onFilterChange(localFilters);
                                        }
                                    }}
                                />
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            </div>
                            <button
                                type="button"
                                onClick={() => onFilterChange(localFilters)}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Role Display */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Shield className="w-4 h-4 inline mr-1" />
                            Vai trò
                        </label>
                        <div className="flex items-center h-10 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                            <Hotel className="w-4 h-4 text-orange-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Chủ khách sạn</span>
                            <Shield className="w-3 h-3 text-gray-400 ml-auto" />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Đặt lại
                    </button>
                    
                    <div className="text-sm text-gray-600">
                        <span className="inline-flex items-center">
                            <Filter className="w-4 h-4 mr-1" />
                            Đang lọc danh sách chủ khách sạn
                        </span>
                    </div>
                </div>

            </div>

            {/* Status Indicator */}
            <div className="bg-blue-50 px-6 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-blue-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Đang áp dụng bộ lọc cho danh sách chủ khách sạn
                    </div>
                    {activeFiltersCount > 0 && (
                        <div className="flex items-center text-sm text-blue-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                            Có {activeFiltersCount} bộ lọc đang hoạt động
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerFilters;