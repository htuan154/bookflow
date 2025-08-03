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
            status: 'all',
            role: 'hotel_owner',
            dateFrom: '',
            dateTo: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
        setLocalFilters(resetFilters);
        onFilterChange(resetFilters);
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
        if (localFilters.status !== 'all') count++;
        if (localFilters.dateFrom) count++;
        if (localFilters.dateTo) count++;
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Search Input */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search className="w-4 h-4 inline mr-1" />
                            Tìm kiếm
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                name="search"
                                value={localFilters.search || ''}
                                onChange={handleChange}
                                placeholder="Nhập tên, email hoặc username..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Users className="w-4 h-4 inline mr-1" />
                            Trạng thái
                        </label>
                        <div className="relative">
                            <select 
                                name="status"
                                value={localFilters.status || 'all'}
                                onChange={handleChange}
                                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Tạm khóa</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
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
                <div className="flex items-center justify-between">
                    <div className="flex space-x-3">
                        <button 
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Đặt lại
                        </button>
                        
                        <button 
                            type="button"
                            onClick={toggleAdvanced}
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                                isAdvanced 
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Nâng cao
                            {isAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                        </button>
                    </div>

                    {/* Filter Summary */}
                    <div className="text-sm text-gray-600">
                        <span className="inline-flex items-center">
                            <Filter className="w-4 h-4 mr-1" />
                            Đang lọc danh sách chủ khách sạn
                        </span>
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            {isAdvanced && (
                <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <Settings className="w-5 h-5 text-gray-600 mr-2" />
                            <h4 className="text-lg font-medium text-gray-900">Bộ lọc nâng cao</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Date From */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Từ ngày
                                </label>
                                <input 
                                    type="date"
                                    name="dateFrom"
                                    value={localFilters.dateFrom || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Đến ngày
                                </label>
                                <input 
                                    type="date"
                                    name="dateTo"
                                    value={localFilters.dateTo || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <SortAsc className="w-4 h-4 inline mr-1" />
                                    Sắp xếp theo
                                </label>
                                <div className="relative">
                                    <select 
                                        name="sortBy"
                                        value={localFilters.sortBy || 'createdAt'}
                                        onChange={handleChange}
                                        className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="createdAt">Ngày tạo</option>
                                        <option value="fullName">Tên đầy đủ</option>
                                        <option value="email">Email</option>
                                        <option value="status">Trạng thái</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <SortDesc className="w-4 h-4 inline mr-1" />
                                    Thứ tự
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        className={`flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            localFilters.sortOrder === 'desc'
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => handleChange({ target: { name: 'sortOrder', value: 'desc' } })}
                                    >
                                        <SortDesc className="w-4 h-4 mr-1" />
                                        Giảm
                                    </button>
                                    <button
                                        type="button"
                                        className={`flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            localFilters.sortOrder === 'asc'
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => handleChange({ target: { name: 'sortOrder', value: 'asc' } })}
                                    >
                                        <SortAsc className="w-4 h-4 mr-1" />
                                        Tăng
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Filter Summary Tags */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center mb-3">
                                <Filter className="w-4 h-4 text-gray-600 mr-2" />
                                <span className="text-sm font-medium text-gray-900">Tóm tắt bộ lọc:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {localFilters.search && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <Search className="w-3 h-3 mr-1" />
                                        "{localFilters.search}"
                                    </span>
                                )}
                                {localFilters.status && localFilters.status !== 'all' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {getStatusIcon(localFilters.status)}
                                        <span className="ml-1">
                                            {localFilters.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                                        </span>
                                    </span>
                                )}
                                {localFilters.dateFrom && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Từ {new Date(localFilters.dateFrom).toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                                {localFilters.dateTo && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Đến {new Date(localFilters.dateTo).toLocaleDateString('vi-VN')}
                                    </span>
                                )}
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    <Hotel className="w-3 h-3 mr-1" />
                                    Chủ khách sạn
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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