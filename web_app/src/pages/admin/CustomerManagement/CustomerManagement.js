// src/pages/admin/CustomerManagement.js - Updated with improved error handling
import React, { useState, useEffect } from 'react';
import { useCustomer } from '../../../context/CustomerContext';

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

    // Load customers on mount
    useEffect(() => {
        const hotelOwnerFilters = {
            ...filters,
            roleId: 2,
            role: 'hotel_owner'
        };
        
        if (filters.roleId !== 2 || filters.role !== 'hotel_owner') {
            setFilters(hotelOwnerFilters);
        }
        
        fetchCustomers(hotelOwnerFilters);
    }, [fetchCustomers, filters.search, filters.status, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder, pagination.page]);

    // Handle filter changes
    const handleFilterChange = (newFilters) => {
        const hotelOwnerFilters = {
            ...newFilters,
            roleId: 2,
            role: 'hotel_owner'
        };
        setFilters(hotelOwnerFilters);
    };

    // Handle pagination
    const handlePageChange = (page, limit) => {
        fetchCustomers({ 
            page, 
            limit: limit || pagination.limit,
            roleId: 2
        });
    };

    // Handle create customer
    const handleCreateCustomer = () => {
        try {
            if (!createCustomer) {
                console.error('createCustomer function is not available');
                alert('❌ Chức năng tạo mới chưa được cài đặt!');
                return;
            }
            
            setSelectedCustomer(null);
            setModalMode('create');
            setShowModal(true);
        } catch (error) {
            console.error('Error in handleCreateCustomer:', error);
            alert('❌ Có lỗi xảy ra khi mở form tạo mới!');
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
                alert('✅ Xóa chủ khách sạn thành công!');
                handleRefresh();
            } catch (error) {
                console.error('Delete customer error:', error);
                const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa chủ khách sạn!';
                alert(`❌ ${errorMessage}`);
            } finally {
                setLocalLoading(false);
            }
        }
    };

    // Handle status toggle - Fixed version with optimistic update
    const handleToggleStatus = async (customerId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'mở khóa' : 'khóa';
        
        if (window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản chủ khách sạn này?`)) {
            try {
                setLocalLoading(true);
                console.log('Toggling status:', { customerId, currentStatus, newStatus });
                
                // Optimistic update - cập nhật UI ngay lập tức
                const updatedCustomers = customers.map(customer => 
                    customer.userId === customerId 
                        ? { ...customer, status: newStatus }
                        : customer
                );
                
                // Gọi API để cập nhật trạng thái
                if (updateCustomerStatus && typeof updateCustomerStatus === 'function') {
                    await updateCustomerStatus(customerId, newStatus);
                } else if (updateCustomer && typeof updateCustomer === 'function') {
                    // Fallback sử dụng updateCustomer nếu updateCustomerStatus không có
                    const customerToUpdate = customers.find(c => c.userId === customerId);
                    await updateCustomer(customerId, { 
                        ...customerToUpdate, 
                        status: newStatus 
                    });
                } else {
                    throw new Error('Không tìm thấy function để cập nhật trạng thái');
                }
                
                alert(`✅ ${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công!`);
                
                // Force refresh để đảm bảo sync với server
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
                
                alert(`❌ ${errorMessage}`);
                
                // Force refresh để revert và sync với server
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

    // Handle save customer
    const handleSaveCustomer = async (customerData) => {
        try {
            setLocalLoading(true);
            
            if (modalMode === 'create') {
                if (!createCustomer) {
                    throw new Error('createCustomer function is not available');
                }
                
                const newCustomerData = {
                    ...customerData,
                    roleId: 2,
                    role: 'hotel_owner',
                    status: 'active'
                };
                
                await createCustomer(newCustomerData);
                alert('✅ Tạo tài khoản chủ khách sạn thành công!');
            } else {
                await updateCustomer(selectedCustomer.userId, customerData);
                alert('✅ Cập nhật thông tin chủ khách sạn thành công!');
            }
            
            handleCloseModal();
            await handleRefresh();
        } catch (error) {
            const action = modalMode === 'create' ? 'tạo' : 'cập nhật';
            console.error(`Error ${action} customer:`, error);
            
            let errorMessage = `Có lỗi xảy ra khi ${action} thông tin!`;
            
            if (error.response) {
                const serverMessage = error.response.data?.message;
                errorMessage = `Lỗi ${error.response.status}: ${serverMessage || errorMessage}`;
            } else if (error.request) {
                errorMessage = `Không thể kết nối đến server khi ${action} thông tin!`;
            } else {
                errorMessage = error.message || errorMessage;
            }
            
            alert(`❌ ${errorMessage}`);
        } finally {
            setLocalLoading(false);
        }
    };

    // Handle refresh data
    const handleRefresh = async () => {
        try {
            const hotelOwnerFilters = {
                ...filters,
                roleId: 2,
                role: 'hotel_owner'
            };
            
            await fetchCustomers(hotelOwnerFilters);
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    // Filter customers to show only hotel owners
    const displayCustomers = customers.filter(customer => {
        return customer.roleId === 2 || 
               customer.role === 'hotel_owner' ||
               (customer.role_id === 2) ||
               (customer.username === 'hotel_owner');
    });

    // Calculate statistics
    const activeCount = displayCustomers.filter(c => c.status === 'active').length;
    const inactiveCount = displayCustomers.filter(c => c.status === 'inactive').length;

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-blue-600">👥</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Tổng chủ KS</p>
                                <p className="text-2xl font-bold text-gray-900">{displayCustomers.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-green-600">✅</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Hoạt động</p>
                                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                    <span className="text-red-600">🔒</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Bị khóa</p>
                                <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-600">📄</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Trang</p>
                                <p className="text-2xl font-bold text-gray-900">{pagination.page}/{pagination.totalPages}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                                <span className="text-purple-600">🔍</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Bộ lọc và tìm kiếm
                            </h3>
                        </div>
                    </div>
                    <div className="p-6">
                        <CustomerFilters 
                            filters={{...filters, roleId: 2}}
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <CustomerTable
                        customers={displayCustomers}
                        loading={loading || localLoading}
                        pagination={{
                            ...pagination,
                            total: displayCustomers.length
                        }}
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