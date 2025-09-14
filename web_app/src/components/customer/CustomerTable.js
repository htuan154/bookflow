// src/components/customer/CustomerTable.js
import React, { useState } from 'react';

const CustomerTable = ({ 
    customers, 
    loading, 
    pagination, 
    onPageChange, 
    onView, 
    onEdit, 
    onDelete, 
    onToggleStatus 
}) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Handle loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang tải dữ liệu</h3>
                    <p className="text-gray-600">Vui lòng chờ trong giây lát...</p>
                </div>
            </div>
        );
    }

    // Handle empty state
    if (!customers || customers.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có dữ liệu</h3>
                    <p className="text-gray-600 mb-6">
                        Hiện tại chưa có chủ khách sạn nào phù hợp với bộ lọc của bạn
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 text-left">
                        <p className="font-medium text-blue-900 mb-2">💡 Gợi ý:</p>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Thử thay đổi điều kiện tìm kiếm</li>
                            <li>• Kiểm tra lại bộ lọc trạng thái</li>
                            <li>• Làm mới trang để tải lại dữ liệu</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Handle row selection
    const handleSelectRow = (customerId) => {
        setSelectedRows(prev => 
            prev.includes(customerId) 
                ? prev.filter(id => id !== customerId)
                : [...prev, customerId]
        );
    };

    const handleSelectAll = () => {
        setSelectedRows(
            selectedRows.length === customers.length 
                ? [] 
                : customers.map(c => c.userId)
        );
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) return (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        );
        return sortConfig.direction === 'asc' ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    return (
        <div className="bg-white">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                                <span className="text-green-600">📊</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Danh sách chủ khách sạn
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Tổng: <span className="font-medium text-gray-900">{pagination.total}</span> chủ khách sạn
                                </p>
                            </div>
                        </div>
                        
                        {selectedRows.length > 0 && (
                            <div className="flex items-center space-x-2 ml-6">
                                <span className="text-sm text-gray-600">
                                    Đã chọn: <span className="font-medium text-blue-600">{selectedRows.length}</span>
                                </span>
                                <div className="h-6 w-px bg-gray-300"></div>
                                <button className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-md hover:bg-green-200 transition-colors">
                                    <span className="mr-1">🔓</span>
                                    Mở khóa
                                </button>
                                <button className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 transition-colors">
                                    <span className="mr-1">🔒</span>
                                    Khóa
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === customers.length}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chọn tất cả
                                    </span>
                                </div>
                            </th>
                            
                            <th 
                                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('userId')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</span>
                                    {getSortIcon('userId')}
                                </div>
                            </th>
                            
                            <th 
                                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('fullName')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin khách hàng</span>
                                    {getSortIcon('fullName')}
                                </div>
                            </th>
                            
                            <th className="px-6 py-3 text-left">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</span>
                            </th>
                            
                            <th 
                                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</span>
                                    {getSortIcon('status')}
                                </div>
                            </th>
                            
                            <th 
                                className="px-6 py-3 text-left cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('createdAt')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</span>
                                    {getSortIcon('createdAt')}
                                </div>
                            </th>
                            
                            <th className="px-6 py-3 text-left">
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</span>
                            </th>
                        </tr>
                    </thead>
                    
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((customer, index) => (
                            <tr 
                                key={customer.userId} 
                                className={`hover:bg-gray-50 transition-colors ${
                                    selectedRows.includes(customer.userId) ? 'bg-blue-50' : ''
                                }`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.includes(customer.userId)}
                                        onChange={() => handleSelectRow(customer.userId)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded inline-block">
                                        {customer.userId}
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-blue-700">
                                                    {customer.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {customer.fullName}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center">
                                                <span className="mr-1">🏨</span>
                                                <span className="mr-2">Chủ khách sạn</span>
                                                <span className="text-gray-400">@{customer.username}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-1">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <span className="mr-2">📧</span>
                                            <a 
                                                href={`mailto:${customer.email}`} 
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {customer.email}
                                            </a>
                                        </div>
                                        {customer.phoneNumber && (
                                            <div className="flex items-center text-sm text-gray-900">
                                                <span className="mr-2">📞</span>
                                                <a 
                                                    href={`tel:${customer.phoneNumber}`} 
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {customer.phoneNumber}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        customer.isActive === true 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                                            customer.isActive === true ? 'bg-green-400' : 'bg-red-400'
                                        }`}></span>
                                        {customer.isActive === true ? 'Hoạt động' : 'Tạm khóa'}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <span className="mr-1">📅</span>
                                            {new Date(customer.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="flex items-center text-gray-500 mt-1">
                                            <span className="mr-1">🕐</span>
                                            {new Date(customer.createdAt).toLocaleTimeString('vi-VN', { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => onView(customer)}
                                            className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <span className="mr-1">👁️</span>
                                            Xem
                                        </button>
                                        
                                        <button 
                                            onClick={() => onEdit(customer)}
                                            className="inline-flex items-center px-2 py-1 border border-yellow-300 rounded-md text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                            title="Chỉnh sửa thông tin"
                                        >
                                            <span className="mr-1">✏️</span>
                                            Sửa
                                        </button>
                                        
                                        <button 
                                            onClick={() => onToggleStatus(customer.userId, customer.status)}
                                            className={`inline-flex items-center px-2 py-1 border rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                                                customer.status === 'active' 
                                                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500' 
                                                    : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 focus:ring-green-500'
                                            }`}
                                            title={customer.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                        >
                                            <span className="mr-1">
                                                {customer.status === 'active' ? '🔒' : '🔓'}
                                            </span>
                                            {customer.status === 'active' ? 'Khóa' : 'Mở'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => onDelete(customer.userId)}
                                            className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                            title="Xóa tài khoản"
                                        >
                                            <span className="mr-1">🗑️</span>
                                            Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Enhanced Pagination */}
            <div className="bg-white px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-700">
                            <span className="mr-2">📊</span>
                            Hiển thị <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> - 
                            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> 
                            trong tổng số <span className="font-medium">{pagination.total}</span> chủ khách sạn
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-700 flex items-center">
                                <span className="mr-2">📄</span>
                                Hiển thị:
                            </label>
                            <select 
                                value={pagination.limit} 
                                onChange={(e) => onPageChange(1, parseInt(e.target.value))}
                                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value={5}>5 mục</option>
                                <option value={10}>10 mục</option>
                                <option value={20}>20 mục</option>
                                <option value={50}>50 mục</option>
                                <option value={100}>100 mục</option>
                            </select>
                        </div>
                        
                        {/* Quick navigation buttons */}
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => onPageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="mr-1">⬅️</span>
                                Trước
                            </button>
                            
                            <span className="text-sm text-gray-600">
                                Trang <span className="font-bold text-blue-600">{pagination.page}</span> / {pagination.totalPages}
                            </span>
                            
                            <button 
                                onClick={() => onPageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Tiếp
                                <span className="ml-1">➡️</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button 
                                onClick={() => onPageChange(1)}
                                disabled={pagination.page <= 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Trang đầu"
                            >
                                <span className="sr-only">Đầu</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            
                            <button 
                                onClick={() => onPageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Trang trước"
                            >
                                <span className="sr-only">Trước</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const pageNum = Math.max(1, pagination.page - 2) + i;
                                if (pageNum <= pagination.totalPages) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => onPageChange(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                pageNum === pagination.page
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                            
                            <button 
                                onClick={() => onPageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Trang sau"
                            >
                                <span className="sr-only">Sau</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            
                            <button 
                                onClick={() => onPageChange(pagination.totalPages)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Trang cuối"
                            >
                                <span className="sr-only">Cuối</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm-6 0a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                        
                        <div className="flex items-center space-x-2 ml-4">
                            <label className="text-sm text-gray-700 flex items-center">
                                <span className="mr-1">🎯</span>
                                Đến trang:
                            </label>
                            <input 
                                type="number" 
                                min="1" 
                                max={pagination.totalPages}
                                placeholder="1"
                                className="border border-gray-300 rounded-md px-2 py-1 w-16 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const page = parseInt(e.target.value);
                                        if (page >= 1 && page <= pagination.totalPages) {
                                            onPageChange(page);
                                            e.target.value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerTable;