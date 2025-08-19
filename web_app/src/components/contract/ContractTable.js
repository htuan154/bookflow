// src/components/Contract/ContractTable.js
import  { useState, useMemo } from 'react';

const ContractTable = ({ 
    contracts = [], 
    loading = false, 
    onApprove, 
    onReject, 
    onViewDetail,
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

    // Status tabs with improved styling
    const statusTabs = [
        { key: 'ALL', label: 'Tất cả', count: contracts.length, color: 'orange' },
        { key: 'draft', label: 'Nháp', count: contracts.filter(c => c.status === 'draft').length, color: 'gray' },
        { key: 'pending', label: 'Chờ duyệt', count: contracts.filter(c => c.status === 'pending').length, color: 'yellow' },
        { key: 'active', label: 'Đang hiệu lực', count: contracts.filter(c => c.status === 'active').length, color: 'green' },
        { key: 'expired', label: 'Hết hạn', count: contracts.filter(c => c.status === 'expired').length, color: 'orange' },
        { key: 'terminated', label: 'Đã chấm dứt', count: contracts.filter(c => c.status === 'terminated').length, color: 'red' },
        { key: 'cancelled', label: 'Đã hủy', count: contracts.filter(c => c.status === 'cancelled').length, color: 'red' },
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
                    return 'Nháp';
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

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(status)}`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'active' ? 'bg-emerald-600' : status === 'pending' ? 'bg-amber-600' : status === 'draft' ? 'bg-slate-600' : 'bg-red-600'}`}></div>
                {getStatusText(status)}
            </span>
        );
    };

    // Format currency with enhanced formatting
    const formatCurrency = (amount, currency = 'VND') => {
        if (!amount) return '0 ₫';
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
            {/* Header with tabs and search */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    {/* Status Tabs */}
                    <nav className="flex space-x-1 overflow-x-auto">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setCurrentTab(tab.key)}
                                className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                    currentTab === tab.key
                                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25 transform scale-105'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-white hover:shadow-md'
                                }`}
                            >
                                {tab.label}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    currentTab === tab.key 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-gray-100 text-gray-700'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </nav>

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
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                    checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                />
                            </th>
                            <th 
                                scope="col" 
                                className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => handleSort('contractNumber')}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>Số hợp đồng</span>
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                </div>
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
                                onClick={() => handleSort('contractValue')}
                            >
                                Giá trị
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
                                <td colSpan={showActions ? 9 : 8} className="px-6 py-16 text-center text-gray-500">
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
                            filteredContracts.map((contract, index) => {
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
                                        <div className="text-sm font-bold text-gray-900 mb-1">
                                            {contract.contractNumber}
                                        </div>
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md inline-block">
                                            {contract.contractType}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-semibold text-gray-900 max-w-xs truncate mb-1">
                                            {contract.title}
                                        </div>
                                        <div className="text-xs text-gray-600 max-w-xs truncate">
                                            {contract.description}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 bg-orange-50 px-3 py-1 rounded-lg inline-block">
                                            {contract.hotelId || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm font-bold text-emerald-700">
                                            {formatCurrency(contract.contractValue, contract.currency)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">
                                            {formatDate(contract.startDate)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            đến {formatDate(contract.endDate)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <StatusBadge status={contract.status} />
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">
                                            {(() => {
                                                // Tìm tất cả các trường có thể chứa ngày tạo
                                                const possibleDateFields = [
                                                    'createdAt', 'created_at', 'created_date', 
                                                    'createDate', 'dateCreated', 'timestamp',
                                                    'createdAtSupabase', 'date_created',
                                                    'creation_date', 'created_time'
                                                ];
                                                
                                                console.log(`=== Contract ${contract.contractId || contract.contract_id} date debug ===`);
                                                console.log('Full contract object:', contract);
                                                console.log('All contract keys:', Object.keys(contract));
                                                
                                                const dateFieldsFound = {};
                                                possibleDateFields.forEach(field => {
                                                    if (contract.hasOwnProperty(field)) {
                                                        dateFieldsFound[field] = contract[field];
                                                    }
                                                });
                                                
                                                console.log('Date fields found:', dateFieldsFound);
                                                
                                                // Tìm trường đầu tiên có giá trị
                                                let dateValue = null;
                                                let fieldUsed = null;
                                                
                                                for (const field of possibleDateFields) {
                                                    if (contract[field] && 
                                                        contract[field] !== null && 
                                                        contract[field] !== undefined &&
                                                        contract[field] !== 'null' &&
                                                        contract[field] !== '') {
                                                        dateValue = contract[field];
                                                        fieldUsed = field;
                                                        console.log(`✅ Using date field '${field}' with value:`, dateValue);
                                                        break;
                                                    }
                                                }
                                                
                                                if (!dateValue) {
                                                    console.log('❌ No valid date field found for contract:', contract.contractId || contract.contract_id);
                                                    console.log('Available fields:', Object.keys(contract));
                                                    return 'Không có ngày';
                                                }
                                                
                                                const result = formatDate(dateValue);
                                                console.log(`Final result for field '${fieldUsed}':`, result);
                                                return result;
                                            })()}
                                        </div>
                                    </td>
                                    {showActions && (
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {/* Chỉ hiển thị nút Duyệt và Từ chối nếu trạng thái là 'pending' */}
                                                {contract.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => onApprove && onApprove([contract.contractId])}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105"
                                                        >
                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => onReject && onReject([contract.contractId])}
                                                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105"
                                                        >
                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => onViewDetail && onViewDetail(contract)}
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 transition-all duration-200 transform hover:scale-105"
                                                >
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Xem
                                                </button>
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
            {filteredContracts.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all duration-200">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Trước
                        </button>
                        <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all duration-200">
                            Sau
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                                Hiển thị <span className="font-bold text-orange-600">1</span> đến <span className="font-bold text-orange-600">{filteredContracts.length}</span> trong tổng số <span className="font-bold text-orange-600">{filteredContracts.length}</span> kết quả
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                                <button className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-orange-600 text-sm font-bold text-white hover:bg-orange-700 transition-all duration-200">
                                    1
                                </button>
                                <button className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
                                    <span className="sr-only">Next</span>
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
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