// src/components/Contract/ContractTable.js
import React, { useState, useMemo } from 'react';
import ActionButton from '../common/ActionButton';

const ContractTable = ({ 
    contracts = [], 
    loading = false, 
    onApprove, 
    onReject, 
    onViewDetail,
    onUpdateStatus,
    showActions = true 
}) => {
    console.log('=== CONTRACT TABLE DEBUG ===');
    console.log('Contracts received:', contracts);
    console.log('Number of contracts:', contracts.length);
    
    // Debug chi tiết từng contract
    if (contracts.length > 0) {
        console.log('Sample contract structure:');
        contracts.forEach((contract, index) => {
            if (index < 2) { // Chỉ log 2 contract đầu
                console.log(`Contract ${index}:`, contract);
                console.log(`Contract ${index} keys:`, Object.keys(contract));
                console.log(`Contract ${index} date fields:`, {
                    created_at: contract.created_at,
                    createdAt: contract.createdAt,
                    start_date: contract.start_date,
                    startDate: contract.startDate,
                    end_date: contract.end_date,
                    endDate: contract.endDate
                });
            }
        });
    }

    const [selectedContracts, setSelectedContracts] = useState([]);
    const [currentTab, setCurrentTab] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [editingContract, setEditingContract] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Status options for dropdown filter
    const statusOptions = [
        { key: 'ALL', label: 'Tất cả' },
        { key: 'pending', label: 'Chờ duyệt' },
        { key: 'active', label: 'Đang hiệu lực' },
        { key: 'expired', label: 'Hết hạn' },
        { key: 'terminated', label: 'Đã chấm dứt' },
        { key: 'cancelled', label: 'Đã hủy' },
    ];

    // Filter contracts based on current tab and search
    const filteredContracts = useMemo(() => {
        // Ẩn các contracts có status 'draft' khỏi UI
        let filtered = contracts.filter(contract => contract.status !== 'draft');

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

    // Calculate pagination data
    const totalItems = filteredContracts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Get current page data
    const paginatedContracts = useMemo(() => {
        const startIdx = (currentPage - 1) * itemsPerPage;
        return filteredContracts.slice(startIdx, startIdx + itemsPerPage);
    }, [filteredContracts, currentPage, itemsPerPage]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Handle items per page change
    const handleItemsPerPageChange = (newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setCurrentTab(tab);
        setCurrentPage(1); // Reset to first page when changing filter
    };

    // Handle search change
    const handleSearchChange = (term) => {
        setSearchTerm(term);
        setCurrentPage(1); // Reset to first page when searching
    };

    // Handle sort
    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Handle select all contracts
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedContracts(paginatedContracts.map(c => c.contractId));
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

    // Check if all selected contracts are pending
    const areAllSelectedPending = useMemo(() => {
        if (selectedContracts.length === 0) return false;
        
        const selectedContractObjects = contracts.filter(contract => {
            const contractId = contract.contractId || contract.contract_id || contract.id || contract._id;
            return selectedContracts.includes(contractId);
        });
        
        return selectedContractObjects.every(contract => contract.status === 'pending');
    }, [selectedContracts, contracts]);

    // Handle edit contract
    const handleEditContract = (contract) => {
        setEditingContract(contract);
        setEditFormData({
            status: contract.status,
            // Có thể thêm các trường khác nếu cần
        });
    };

    // Handle save edit
    const handleSaveEdit = async () => {
        if (!editingContract || !editFormData.status) return;
        
        try {
            // Get contract ID with flexible field detection
            const contractId = editingContract.contractId || 
                              editingContract.contract_id || 
                              editingContract.id || 
                              editingContract._id;
            
            console.log('=== UPDATING CONTRACT STATUS ===');
            console.log('Contract ID:', contractId);
            console.log('Current status:', editingContract.status);
            console.log('New status:', editFormData.status);
            
            if (!contractId) {
                console.error('Contract ID not found');
                alert('Không tìm thấy ID hợp đồng');
                return;
            }
            
            // Call the onUpdateStatus function to update in database
            if (onUpdateStatus) {
                // Kiểm tra nếu status là 'active' và contract chưa có signed_date
                const updateData = {
                    status: editFormData.status
                };
                
                if (editFormData.status === 'active' && !editingContract.signed_date && !editingContract.signedDate) {
                    updateData.signed_date = new Date().toISOString();
                    console.log('✅ Adding signed_date for approval:', updateData.signed_date);
                }
                
                await onUpdateStatus(contractId, updateData);
            } else {
                // Fallback to old method if onUpdateStatus is not provided
                console.warn('onUpdateStatus not provided, using fallback method');
                if (editFormData.status === 'active') {
                    await onApprove([contractId]);
                } else if (editFormData.status === 'cancelled') {
                    await onReject([contractId]);
                } else {
                    console.warn('No handler for status:', editFormData.status);
                    alert('Chưa hỗ trợ cập nhật trạng thái này');
                    return;
                }
            }
            
            console.log('✅ Contract status updated successfully');
            
            // Close modal
            setEditingContract(null);
            setEditFormData({});
            
        } catch (error) {
            console.error('Error updating contract:', error);
            alert('Có lỗi xảy ra khi cập nhật trạng thái hợp đồng: ' + error.message);
        }
    };

    // Handle close edit modal
    const handleCloseEdit = () => {
        setEditingContract(null);
        setEditFormData({});
    };

    // Status badge component with enhanced styling
    const StatusBadge = ({ status }) => {
        const getStatusStyle = (status) => {
            switch (status) {
                case 'draft':
                    return 'bg-slate-100 text-slate-800 border-slate-200 shadow-sm';
                case 'pending':
                    return 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm';
                case 'active':
                    return 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm';
                case 'expired':
                    return 'bg-orange-100 text-orange-800 border-orange-200 shadow-sm';
                case 'terminated':
                    return 'bg-red-100 text-red-800 border-red-200 shadow-sm';
                case 'cancelled':
                    return 'bg-red-200 text-red-900 border-red-300 shadow-sm';
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-200 shadow-sm';
            }
        };

        const getStatusText = (status) => {
            switch (status) {
                case 'draft':
                    return null; // Ẩn trạng thái draft khỏi UI
                case 'pending':
                    return 'Chờ duyệt';
                case 'active':
                    return 'Đang hiệu lực';
                case 'expired':
                    return 'Hết hạn';
                case 'terminated':
                    return 'Đã chấm dứt';
                case 'cancelled':
                    return 'Đã hủy';
                default:
                    return 'Không xác định';
            }
        };

        // Ẩn hoàn toàn badge nếu là draft status
        if (status === 'draft') {
            return null;
        }

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(status)}`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'active' ? 'bg-emerald-600' : status === 'pending' ? 'bg-amber-600' : 'bg-red-600'}`}></div>
                {getStatusText(status)}
            </span>
        );
    };

    // Format currency with enhanced formatting
    const formatCurrency = (amount, currency = 'VND') => {
        if (!amount) return '0 ₫';
        
        // Nếu là phần trăm (%), hiển thị số với ký hiệu %
        if (currency === '%' || currency === 'Phần trăm' || currency === 'percent') {
            return `${parseFloat(amount).toFixed(2)}%`;
        }
        
        // Format tiền tệ bình thường
        const formatted = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
        return formatted.replace('₫', '').trim() + ' ₫';
    };

    // Format date - cải thiện để xử lý nhiều format
    const formatDate = (dateString) => {
        console.log('formatDate input:', dateString, typeof dateString);
        
        if (!dateString || 
            dateString === null || 
            dateString === undefined || 
            dateString === 'null' || 
            dateString === 'undefined' ||
            dateString === '') {
            console.log('formatDate: No valid date string provided');
            return '-';
        }
        
        try {
            // Xử lý các format ngày khác nhau
            let date;
            
            // Nếu đã là Date object
            if (dateString instanceof Date) {
                date = dateString;
            }
            // Nếu là timestamp (number)
            else if (typeof dateString === 'number') {
                date = new Date(dateString);
            }
            // Nếu là string
            else if (typeof dateString === 'string') {
                // Thử parse trực tiếp
                date = new Date(dateString);
                
                // Nếu không hợp lệ, thử với format khác
                if (isNaN(date.getTime())) {
                    // Thử với ISO format
                    date = new Date(dateString.replace(/\s/g, 'T'));
                }
            }
            
            if (isNaN(date.getTime())) {
                console.log('formatDate: Invalid date after parsing:', dateString);
                return 'Invalid Date';
            }
            
            const formatted = date.toLocaleDateString('vi-VN');
            console.log('formatDate result:', formatted);
            return formatted;
        } catch (error) {
            console.log('formatDate error:', error);
            return 'Error';
        }
    };

    if (loading) {
        return (
            <div className="bg-white shadow-lg rounded-xl">
                <div className="flex justify-center items-center h-64">
                    <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-600"></div>
                        <span className="text-gray-600 font-medium">Đang tải dữ liệu...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
            {/* Header with status filter and search */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Status Filter Dropdown */}
                    <div className="flex items-center mb-2">
                        <label htmlFor="statusFilter" className="mr-2 font-medium">Trạng thái:</label>
                        <select
                            id="statusFilter"
                            value={currentTab}
                            onChange={e => handleTabChange(e.target.value)}
                            className="border rounded px-3 py-1 focus:outline-none focus:ring"
                        >
                            {statusOptions.map(option => (
                                <option key={option.key} value={option.key}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search with enhanced styling */}
                    <div className="flex-1 max-w-lg">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo số hợp đồng, tiêu đề..."
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="block w-full pl-12 pr-4 py-3 border-0 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm transition-all duration-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Bulk actions with enhanced styling */}
                {selectedContracts.length > 0 && (
                    <div className="mt-5 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-sm font-semibold text-orange-800">
                                    Đã chọn {selectedContracts.length} hợp đồng
                                </span>
                            </div>
                            <div className="flex space-x-3">
                                {areAllSelectedPending && (
                                    <>
                                        <button
                                            onClick={() => onApprove && onApprove(selectedContracts)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Duyệt 
                                        </button>
                                        <button
                                            onClick={() => onReject && onReject(selectedContracts)}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            Từ chối 
                                        </button>
                                    </>
                                )}
                                {!areAllSelectedPending && selectedContracts.length > 0 && (
                                    <div className="text-sm text-gray-600 italic">
                                        Chỉ có thể duyệt/từ chối khi tất cả hợp đồng được chọn đều ở trạng thái "Chờ duyệt"
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Table with enhanced styling */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedContracts.length === paginatedContracts.length && paginatedContracts.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                />
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleSort('contractNumber')}
                            >
                                Số HĐ
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleSort('title')}
                            >
                                Tiêu đề
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                            >
                                Khách sạn
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleSort('startDate')}
                            >
                                Thời gian
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleSort('status')}
                            >
                                Trạng thái
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleSort('createdAt')}
                            >
                                Ngày tạo
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                            >
                                File
                            </th>
                            {showActions && (
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredContracts.length === 0 ? (
                            <tr>
                                <td colSpan={showActions ? 8 : 7} className="px-6 py-16 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Không có hợp đồng nào</h3>
                                        <p className="text-sm text-gray-500 max-w-md">
                                            {searchTerm ? 'Không tìm thấy hợp đồng phù hợp với từ khóa tìm kiếm' : 'Chưa có hợp đồng nào được tạo'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedContracts.map((contract, index) => {
                                // Debug: log chi tiết contract để kiểm tra dữ liệu
                                console.log('=== CONTRACT DEBUG ===');
                                console.log('Full contract object:', contract);
                                console.log('CreatedAt variants:', {
                                    createdAt: contract.createdAt,
                                    created_at: contract.created_at,
                                    created_date: contract.created_date,
                                    createdAtSupabase: contract.createdAtSupabase
                                });
                                
                                return (
                                <tr key={contract.contractId} className={`hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedContracts.includes(contract.contractId)}
                                            onChange={(e) => handleSelectContract(contract.contractId, e.target.checked)}
                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            {contract.contractNumber}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-semibold text-gray-900 max-w-xs truncate">
                                            {contract.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {contract.hotelName || contract.hotelId || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {contract.startDate && contract.endDate 
                                                ? `${formatDate(contract.startDate)} - ${formatDate(contract.endDate)}`
                                                : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <StatusBadge status={contract.status} />
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">
                                            {formatDate(contract.createdAt || contract.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {contract.fileUrl ? (
                                                <a 
                                                    href={contract.fileUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    Tải file
                                                </a>
                                            ) : (
                                                <span className="text-gray-500">Không có</span>
                                            )}
                                        </div>
                                    </td>
                                    {showActions && (
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {contract.status === 'pending' ? (
                                                    <ActionButton
                                                        type="view"
                                                        onClick={() => onViewDetail && onViewDetail(contract)}
                                                        title="Xem"
                                                    />
                                                ) : (
                                                    <>
                                                        <ActionButton
                                                            type="view"
                                                            onClick={() => onViewDetail && onViewDetail(contract)}
                                                            title="Xem"
                                                        />
                                                        {contract.status === 'active' && (
                                                            <ActionButton
                                                                type="edit"
                                                                onClick={() => handleEditContract(contract)}
                                                                title="Sửa"
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Enhanced Pagination */}
            {totalItems > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Trước
                        </button>
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sau
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-700">
                                Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-{Math.min(currentPage * itemsPerPage, totalItems)} trong tổng số {totalItems} kết quả
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">Hiển thị:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                >
                                    <option value={5}>5 mục</option>
                                    <option value={10}>10 mục</option>
                                    <option value={15}>15 mục</option>
                                    <option value={20}>20 mục</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                &lt;&lt;
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                currentPage === pageNum
                                                    ? 'z-10 bg-orange-600 border-orange-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Tiếp
                            </button>
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                &gt;&gt;
                            </button>
                            
                            <div className="flex items-center gap-2 ml-4">
                                <span className="text-sm text-gray-700">Đến trang:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={(e) => {
                                        const page = Number(e.target.value);
                                        if (page >= 1 && page <= totalPages) {
                                            handlePageChange(page);
                                        }
                                    }}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-16 text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Contract Modal */}
            {editingContract && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-xl bg-white">
                        <div className="mt-3">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            Sửa hợp đồng
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Chỉnh sửa thông tin hợp đồng {editingContract.contractNumber}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseEdit}
                                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Contract Information Display */}
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column - Contract Details */}
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Thông tin hợp đồng</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-gray-500">Số hợp đồng</label>
                                                    <p className="text-sm font-medium text-gray-900">{editingContract.contractNumber}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500">Tiêu đề</label>
                                                    <p className="text-sm font-medium text-gray-900">{editingContract.title}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500">Mô tả</label>
                                                    <p className="text-sm text-gray-700">{editingContract.description}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500">Loại hợp đồng</label>
                                                    <p className="text-sm font-medium text-gray-900">{editingContract.contractType}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Thông tin khách sạn</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-gray-500">ID Khách sạn</label>
                                                    <p className="text-sm font-medium text-gray-900">{editingContract.hotelId || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500">Tên khách sạn</label>
                                                    <p className="text-sm font-medium text-gray-900">{editingContract.hotelName || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Financial & Dates */}
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Thông tin tài chính</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-gray-500">
                                                        {editingContract.currency === '%' || editingContract.currency === 'Phần trăm' ? 'Hoa hồng' : 'Giá trị hợp đồng'}
                                                    </label>
                                                    <p className="text-sm font-bold text-emerald-700">
                                                        {formatCurrency(editingContract.contractValue, editingContract.currency)}
                                                    </p>
                                                </div>
                                                {(editingContract.currency !== '%' && editingContract.currency !== 'Phần trăm') && (
                                                    <div>
                                                        <label className="text-xs text-gray-500">Đơn vị tiền tệ</label>
                                                        <p className="text-sm font-medium text-gray-900">{editingContract.currency || 'VND'}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Thời gian hiệu lực</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs text-gray-500">Ngày bắt đầu</label>
                                                    <p className="text-sm font-medium text-gray-900">{formatDate(editingContract.startDate)}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500">Ngày kết thúc</label>
                                                    <p className="text-sm font-medium text-gray-900">{formatDate(editingContract.endDate)}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500">Ngày tạo</label>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {formatDate(editingContract.createdAt || editingContract.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Edit Section */}
                                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                            <h4 className="text-sm font-semibold text-blue-700 mb-3">Chỉnh sửa trạng thái</h4>
                                            <div>
                                                <label className="text-xs text-gray-600 mb-2 block">Trạng thái hiện tại</label>
                                                <div className="mb-4">
                                                    <StatusBadge status={editingContract.status} />
                                                </div>
                                                
                                                <label className="text-xs text-gray-600 mb-2 block">Trạng thái mới</label>
                                                <select
                                                    value={editFormData.status || editingContract.status}
                                                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                >
                                                    {editingContract.status === 'active' ? (
                                                        <>
                                                            <option value="active">Đang hiệu lực</option>
                                                            <option value="terminated">Đã chấm dứt</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="pending">Chờ duyệt</option>
                                                            <option value="active">Đang hiệu lực</option>
                                                            <option value="expired">Hết hạn</option>
                                                            <option value="terminated">Đã chấm dứt</option>
                                                            <option value="cancelled">Đã hủy</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseEdit}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        disabled={!editFormData.status || editFormData.status === editingContract.status}
                                        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                                            !editFormData.status || editFormData.status === editingContract.status
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-lg transform hover:-translate-y-0.5'
                                        }`}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractTable;