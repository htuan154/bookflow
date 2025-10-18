// src/pages/admin/CustomerManagement.js - Updated with fixed API endpoints
import React, { useState, useEffect } from 'react';
import { useCustomer } from '../../../context/CustomerContext';
import { toast } from 'react-toastify';

// Components
import CustomerTable from '../../../components/customer/CustomerTable';
import CustomerModal from '../../../components/customer/CustomerModal';
import CustomerFilters from '../../../components/customer/CustomerFilters';

const CustomerManagement = () => {
    const {
        customers,
        loading,
        error,
        pagination,
        filters,
        fetchCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        updateCustomerStatus,
        setFilters,
        clearError
    } = useCustomer();

    const [showModal, setShowModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalMode, setModalMode] = useState('view');
    const [localLoading, setLocalLoading] = useState(false);
    
    // State for local filtering
    const [originalCustomers, setOriginalCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Load customers on mount - Fetch hotel owners only (chỉ load 1 lần)
    useEffect(() => {
        const hotelOwnerFilters = {
            page: 1,
            limit: 100, // Load nhiều record để filter local
            roleId: 2,
            role: 'hotel_owner'
        };
        
        console.log('🔄 Loading all hotel owners for local filtering:', hotelOwnerFilters);
        fetchCustomers(hotelOwnerFilters);
    }, []); // Chỉ load 1 lần khi component mount

    // Lưu original data khi customers từ API thay đổi
    useEffect(() => {
        if (customers && customers.length > 0) {
            setOriginalCustomers(customers);
            setFilteredCustomers(customers); // Mặc định hiển thị tất cả
        }
    }, [customers]);

    // Handle filter changes - Filter theo data có sẵn
    const handleFilterChange = (newFilters) => {
        console.log('🔍 Filtering locally with:', newFilters);
        
        let filtered = [...originalCustomers];
        
        // Filter theo email nếu có search
        if (newFilters.search && newFilters.search.trim()) {
            const searchTerm = newFilters.search.toLowerCase().trim();
            filtered = filtered.filter(customer => 
                customer.email && customer.email.toLowerCase().includes(searchTerm)
            );
        }
        
        setFilteredCustomers(filtered);
        setCurrentPage(1); // Reset về trang đầu khi filter
        
        // Cập nhật filters cho UI
        const updatedFilters = {
            ...newFilters,
            roleId: 2,
            role: 'hotel_owner'
        };
        setFilters(updatedFilters);
    };

    // Handle pagination - Local pagination
    const handlePageChange = (page, limit) => {
        console.log('� Page change requested:', { page, limit, currentPage });
        
        if (limit && limit !== itemsPerPage) {
            setItemsPerPage(limit);
            setCurrentPage(1); // Reset về trang đầu khi thay đổi limit
        } else if (page) {
            setCurrentPage(page);
        }
    };

    // Handle create customer - Create hotel owner specifically
    const handleCreateCustomer = () => {
        try {
            if (!createCustomer) {
                console.error('createCustomer function is not available');
                toast.error('Chức năng tạo mới chưa được cài đặt!', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
                return;
            }
            
            setSelectedCustomer(null);
            setModalMode('create');
            setShowModal(true);
        } catch (error) {
            console.error('Error in handleCreateCustomer:', error);
            toast.error('Có lỗi xảy ra khi mở form tạo mới!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        }
    };

    // Handle view customer
    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        setModalMode('view');
        setShowModal(true);
    };

    // Handle edit customer
    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setModalMode('edit');
        setShowModal(true);
    };

    // Handle delete customer
    const handleDeleteCustomer = async (customerId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa chủ khách sạn này? Hành động này không thể hoàn tác!')) {
            try {
                setLocalLoading(true);
                await deleteCustomer(customerId);
                toast.success('Xóa chủ khách sạn thành công!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
                await handleRefresh();
            } catch (error) {
                console.error('Delete customer error:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa chủ khách sạn!';
                toast.error(errorMessage, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
            } finally {
                setLocalLoading(false);
            }
        }
    };

    // Handle status toggle - Fixed version with improved error handling
    const handleToggleStatus = async (customerId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'mở khóa' : 'khóa';
        
        if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản chủ khách sạn này?`)) {
            try {
                setLocalLoading(true);
                console.log('Toggling status:', { customerId, currentStatus, newStatus });
                
                // Call API to update status
                if (updateCustomerStatus && typeof updateCustomerStatus === 'function') {
                    await updateCustomerStatus(customerId, newStatus);
                } else if (updateCustomer && typeof updateCustomer === 'function') {
                    // Fallback using updateCustomer if updateCustomerStatus is not available
                    const customerToUpdate = customers.find(c => c.userId === customerId);
                    await updateCustomer(customerId, { 
                        ...customerToUpdate, 
                        status: newStatus 
                    });
                } else {
                    throw new Error('Không tìm thấy function để cập nhật trạng thái');
                }
                
                toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công!`, {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
                
                // Force refresh to ensure sync with server
                await handleRefresh();
                
            } catch (error) {
                console.error(`Error ${action} customer status:`, error);
                
                let errorMessage = `Có lỗi xảy ra khi ${action} tài khoản!`;
                
                if (error.response) {
                    const { status, data } = error.response;
                    const serverMessage = data?.message || data?.error || data?.details;
                    
                    switch (status) {
                        case 400:
                            errorMessage = `Dữ liệu không hợp lệ: ${serverMessage || 'Bad Request'}`;
                            break;
                        case 401:
                            errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
                            break;
                        case 403:
                            errorMessage = 'Bạn không có quyền thực hiện thao tác này!';
                            break;
                        case 404:
                            errorMessage = 'Không tìm thấy thông tin chủ khách sạn!';
                            break;
                        case 500:
                            errorMessage = `Lỗi server: ${serverMessage || 'Internal Server Error'}`;
                            break;
                        default:
                            errorMessage = `Lỗi ${status}: ${serverMessage || 'Unknown error'}`;
                    }
                } else if (error.request) {
                    errorMessage = `Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!`;
                } else {
                    errorMessage = error.message || errorMessage;
                }
                
                toast.error(errorMessage, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
                
                // Force refresh to revert and sync with server
                await handleRefresh();
            } finally {
                setLocalLoading(false);
            }
        }
    };

    // Handle modal close
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCustomer(null);
        setModalMode('view');
    };

    // Handle save customer - Fixed to properly create hotel owner
    const handleSaveCustomer = async (customerData) => {
        try {
            setLocalLoading(true);
            
            console.log('CustomerManagement - Received customerData:', customerData);
            
            if (modalMode === 'create') {
                if (!createCustomer) {
                    throw new Error('createCustomer function is not available');
                }
                
                // ✅ FIXED: Chuẩn bị dữ liệu đúng format backend mong đợi
                const newCustomerData = {
                    fullName: customerData.fullName,
                    email: customerData.email,
                    username: customerData.username,
                    password: customerData.password,
                    phoneNumber: customerData.phoneNumber, // ✅ Đúng field name
                    address: customerData.address,
                    roleId: 2 // Hotel owner role
                };
                
                console.log('CustomerManagement - Sending to createCustomer:', newCustomerData);
                
                await createCustomer(newCustomerData);
                toast.success('Tạo tài khoản chủ khách sạn thành công!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
            } else {
                // Update existing customer
                const updatedData = {
                    fullName: customerData.fullName,
                    email: customerData.email,
                    phoneNumber: customerData.phoneNumber,
                    address: customerData.address,
                    roleId: 2 // Ensure role remains hotel owner
                };
                
                await updateCustomer(selectedCustomer.userId, updatedData);
                toast.success('Cập nhật thông tin chủ khách sạn thành công!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                });
            }
            
            handleCloseModal();
            await handleRefresh();
        } catch (error) {
            const action = modalMode === 'create' ? 'tạo' : 'cập nhật';
            console.error(`Error ${action} customer:`, error);
            
            let errorMessage = `Có lỗi xảy ra khi ${action} thông tin!`;
            
            if (error.response) {
                const { status, data } = error.response;
                const serverMessage = data?.message || data?.error || data?.details;
                
                switch (status) {
                    case 400:
                        errorMessage = `Dữ liệu không hợp lệ: ${serverMessage || 'Vui lòng kiểm tra lại thông tin'}`;
                        break;
                    case 401:
                        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
                        break;
                    case 403:
                        errorMessage = 'Bạn không có quyền thực hiện thao tác này!';
                        break;
                    case 404:
                        errorMessage = `Endpoint API không tồn tại. Vui lòng liên hệ admin!`;
                        break;
                    case 409:
                        errorMessage = `Thông tin đã tồn tại: ${serverMessage || 'Email hoặc username đã được sử dụng'}`;
                        break;
                    case 422:
                        errorMessage = `Dữ liệu không hợp lệ: ${serverMessage || 'Vui lòng kiểm tra format dữ liệu'}`;
                        break;
                    case 500:
                        errorMessage = `Lỗi server: ${serverMessage || 'Internal Server Error'}`;
                        break;
                    default:
                        errorMessage = `Lỗi ${status}: ${serverMessage || 'Unknown error'}`;
                }
            } else if (error.request) {
                errorMessage = `Không thể kết nối đến server khi ${action} thông tin!`;
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        } finally {
            setLocalLoading(false);
        }
    };

    // Handle refresh data - Fetch hotel owners specifically với phân trang
    const handleRefresh = async () => {
        try {
            const hotelOwnerFilters = {
                ...filters,
                page: filters.page || pagination.page || 1,
                limit: filters.limit || pagination.limit || 10,
                roleId: 2,
                role: 'hotel_owner'
            };
            
            console.log('Refreshing data with filters:', hotelOwnerFilters);
            await fetchCustomers(hotelOwnerFilters);
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Có lỗi xảy ra khi tải lại dữ liệu!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        }
    };

    // Local pagination và display
    const totalFilteredItems = filteredCustomers.length;
    const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const displayCustomers = filteredCustomers.slice(startIndex, endIndex);
    
    // Local pagination object
    const localPagination = {
        page: currentPage,
        limit: itemsPerPage,
        total: totalFilteredItems,
        totalPages: totalPages
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Page Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                                    <span className="text-2xl">🏨</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        Quản lý chủ khách sạn
                                    </h1>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Quản lý và theo dõi thông tin các chủ khách sạn trong hệ thống
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={handleCreateCustomer}
                                    disabled={loading || localLoading}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <span className="mr-2">➕</span>
                                    Thêm chủ KS
                                </button>
                                
                                <button 
                                    onClick={handleRefresh}
                                    disabled={loading || localLoading}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <span className="mr-2">🔄</span>
                                    {(loading || localLoading) ? 'Đang tải...' : 'Làm mới'}
                                </button>
                            </div>
                        </div>
                        
                        <nav className="flex items-center space-x-2 text-sm text-gray-500 mt-4">
                            <span>Dashboard</span>
                            <span>›</span>
                            <span>Quản lý</span>
                            <span>›</span>
                            <span className="text-gray-900 font-medium">Chủ khách sạn</span>
                        </nav>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <span className="text-red-400 text-xl">⚠️</span>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-sm font-medium text-red-800">
                                    Có lỗi xảy ra!
                                </h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <div className="mt-2">
                                    <button
                                        onClick={handleRefresh}
                                        className="text-sm text-red-700 hover:text-red-900 underline"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            </div>
                            <button 
                                onClick={clearError}
                                className="flex-shrink-0 ml-3 text-red-400 hover:text-red-600"
                            >
                                <span className="text-lg">×</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600">👥</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Tổng chủ khách sạn</p>
                                <p className="text-2xl font-bold text-gray-900">{originalCustomers.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                                    <span className="text-purple-600">🔍</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Bộ lọc và tìm kiếm
                                </h3>
                            </div>
                            
                            {/* Items per page selector */}
                            <div className="flex items-center space-x-3">
                                <label className="text-sm font-medium text-gray-700">
                                    📊 Hiển thị:
                                </label>
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => handlePageChange(1, parseInt(e.target.value))}
                                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                                >
                                    <option value={5}>5 mục/trang</option>
                                    <option value={10}>10 mục/trang</option>
                                    <option value={20}>20 mục/trang</option>
                                    <option value={50}>50 mục/trang</option>
                                    <option value={100}>100 mục/trang</option>
                                </select>
                                
                                <div className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    Hiển thị: <span className="font-medium text-gray-900">{totalFilteredItems}</span> / <span className="font-medium text-gray-900">{originalCustomers.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <CustomerFilters 
                            filters={{...filters, roleId: 2, role: 'hotel_owner'}}
                            onFilterChange={handleFilterChange}
                        />
                    </div>
                </div>

                {/* Loading Overlay */}
                {(loading || localLoading) && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                            <div className="flex items-center space-x-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-gray-900 font-medium">Đang xử lý...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table Section */}
                {/* Pagination Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-blue-600">📄</span>
                                <span className="text-sm font-medium text-blue-900">
                                    Trang <span className="font-bold">{currentPage}</span> / <span className="font-bold">{totalPages || 1}</span>
                                </span>
                            </div>
                            <div className="h-6 w-px bg-blue-300"></div>
                            <div className="flex items-center space-x-2">
                                <span className="text-blue-600">📊</span>
                                <span className="text-sm text-blue-800">
                                    Hiển thị <span className="font-medium">{startIndex + 1}</span> - 
                                    <span className="font-medium">{Math.min(endIndex, totalFilteredItems)}</span> 
                                    trong tổng <span className="font-bold">{totalFilteredItems}</span> chủ khách sạn
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="inline-flex items-center px-3 py-1 bg-white border border-blue-300 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                ← Trước
                            </button>
                            
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="inline-flex items-center px-3 py-1 bg-white border border-blue-300 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Tiếp →
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <CustomerTable
                        customers={displayCustomers}
                        loading={loading || localLoading}
                        pagination={localPagination}
                        onPageChange={handlePageChange}
                        onView={handleViewCustomer}
                        onEdit={handleEditCustomer}
                        onDelete={handleDeleteCustomer}
                        onToggleStatus={handleToggleStatus}
                    />
                </div>

                {/* Customer Modal */}
                {showModal && (
                    <CustomerModal
                        customer={selectedCustomer}
                        mode={modalMode}
                        onClose={handleCloseModal}
                        onSave={handleSaveCustomer}
                    />
                )}
            </div>
        </div>
    );
};

export default CustomerManagement;