// src/components/Contract/ContractTable.js
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const ContractTable = ({ 
    contracts = [], 
    loading = false, 
    onApprove, 
    onReject, 
    onViewDetail,
    showActions = true 
}) => {
    const [selectedContracts, setSelectedContracts] = useState([]);
    const [currentTab, setCurrentTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    // Status tabs
    const statusTabs = [
        { key: 'ALL', label: 'Tất cả', count: contracts.length },
        { key: 'PENDING', label: 'Chờ duyệt', count: contracts.filter(c => c.status === 'PENDING').length },
        { key: 'APPROVED', label: 'Đã duyệt', count: contracts.filter(c => c.status === 'APPROVED').length },
        { key: 'REJECTED', label: 'Từ chối', count: contracts.filter(c => c.status === 'REJECTED').length },
        { key: 'EXPIRED', label: 'Hết hạn', count: contracts.filter(c => c.status === 'EXPIRED').length },
    ];

    // Filter contracts based on current tab and search
    const filteredContracts = useMemo(() => {
        let filtered = contracts;

        // Filter by status
        if (currentTab !== 'ALL') {
            filtered = filtered.filter(contract => contract.status === currentTab);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(contract =>
                contract.contractNumber?.toLowerCase().includes(term) ||
                contract.title?.toLowerCase().includes(term) ||
                contract.description?.toLowerCase().includes(term) ||
                contract.hotelName?.toLowerCase().includes(term)
            );
        }

        // Sort contracts
        filtered.sort((a, b) => {
            if (sortConfig.key) {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
            }
            return 0;
        });

        return filtered;
    }, [contracts, currentTab, searchTerm, sortConfig]);

    // Handle sort
    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedContracts(filteredContracts.map(c => c.contractId));
        } else {
            setSelectedContracts([]);
        }
    };

    // Handle select contract
    const handleSelectContract = (contractId, checked) => {
        if (checked) {
            setSelectedContracts(prev => [...prev, contractId]);
        } else {
            setSelectedContracts(prev => prev.filter(id => id !== contractId));
        }
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        const getStatusStyle = (status) => {
            switch (status) {
                case 'PENDING':
                    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                case 'APPROVED':
                    return 'bg-green-100 text-green-800 border-green-200';
                case 'REJECTED':
                    return 'bg-red-100 text-red-800 border-red-200';
                case 'EXPIRED':
                    return 'bg-gray-100 text-gray-800 border-gray-200';
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-200';
            }
        };

        const getStatusText = (status) => {
            switch (status) {
                case 'PENDING':
                    return 'Chờ duyệt';
                case 'APPROVED':
                    return 'Đã duyệt';
                case 'REJECTED':
                    return 'Từ chối';
                case 'EXPIRED':
                    return 'Hết hạn';
                default:
                    return 'Không xác định';
            }
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(status)}`}>
                {getStatusText(status)}
            </span>
        );
    };

    // Format currency
    const formatCurrency = (amount, currency = 'VND') => {
        if (!amount) return '0';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg">
            {/* Header with tabs and search */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Status Tabs */}
                    <nav className="flex space-x-8 overflow-x-auto">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setCurrentTab(tab.key)}
                                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                    currentTab === tab.key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </nav>

                    {/* Search */}
                    <div className="flex-1 max-w-lg">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo số hợp đồng, tiêu đề..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Bulk actions */}
                {selectedContracts.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-sm text-blue-800">
                                    Đã chọn {selectedContracts.length} hợp đồng
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => onApprove && onApprove(selectedContracts)}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Duyệt hàng loạt
                                </button>
                                <button
                                    onClick={() => onReject && onReject(selectedContracts)}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Từ chối hàng loạt
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('contractNumber')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Số hợp đồng</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('title')}
                            >
                                Tiêu đề
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                Khách sạn
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('contractValue')}
                            >
                                Giá trị
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('startDate')}
                            >
                                Thời gian
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('status')}
                            >
                                Trạng thái
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('createdAt')}
                            >
                                Ngày tạo
                            </th>
                            {showActions && (
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredContracts.length === 0 ? (
                            <tr>
                                <td colSpan={showActions ? 9 : 8} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-medium">Không có hợp đồng nào</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {searchTerm ? 'Không tìm thấy hợp đồng phù hợp với từ khóa tìm kiếm' : 'Chưa có hợp đồng nào được tạo'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredContracts.map((contract) => (
                                <tr key={contract.contractId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedContracts.includes(contract.contractId)}
                                            onChange={(e) => handleSelectContract(contract.contractId, e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {contract.contractNumber}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {contract.contractType}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                            {contract.title}
                                        </div>
                                        <div className="text-sm text-gray-500 max-w-xs truncate">
                                            {contract.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {contract.hotelName || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatCurrency(contract.contractValue, contract.currency)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatDate(contract.startDate)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            đến {formatDate(contract.endDate)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={contract.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatDate(contract.createdAt)}
                                        </div>
                                    </td>
                                    {showActions && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => onViewDetail && onViewDetail(contract)}
                                                    className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                                                >
                                                    Xem
                                                </button>
                                                {contract.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => onApprove && onApprove([contract.contractId])}
                                                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => onReject && onReject([contract.contractId])}
                                                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredContracts.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Trước
                        </button>
                        <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Sau
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">{filteredContracts.length}</span> trong tổng số <span className="font-medium">{filteredContracts.length}</span> kết quả
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    1
                                </button>
                                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractTable;