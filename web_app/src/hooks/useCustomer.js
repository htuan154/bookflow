// src/api/hooks/useCustomer.js
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';

const useCustomer = () => {
    const { apiCall } = useApi();
    const { user } = useAuth();
    
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    
    // Lấy danh sách khách hàng với filter và pagination (chỉ hotel_owner)
    const getCustomers = useCallback(async (filters = {}, page = 1, limit = 10) => {
        try {
            setLoading(true);
            setError(null);
            
            // Luôn ép role là hotel_owner
            const params = {
                page,
                limit,
                role: 'hotel_owner', // Luôn cố định là chủ khách sạn
                ...filters,
                role: 'hotel_owner' // Override lại để đảm bảo
            };
            
            // Loại bỏ các tham số rỗng
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === 'all') {
                    delete params[key];
                }
            });
            
            // Đảm bảo role luôn là hotel_owner
            params.role = 'hotel_owner';
            
            const response = await apiCall('/api/admin/customers', 'GET', null, { params });
            
            if (response.success) {
                // Filter thêm một lần nữa ở client để đảm bảo
                const hotelOwners = (response.data.customers || []).filter(customer => 
                    customer.role === 'hotel_owner'
                );
                
                setCustomers(hotelOwners);
                setPagination({
                    page: response.data.page || 1,
                    limit: response.data.limit || 10,
                    total: hotelOwners.length, // Sử dụng số lượng sau khi filter
                    totalPages: Math.ceil(hotelOwners.length / (response.data.limit || 10))
                });
            } else {
                throw new Error(response.message || 'Lỗi khi lấy danh sách chủ khách sạn');
            }
        } catch (err) {
            console.error('Error fetching hotel owners:', err);
            setError(err.message || 'Lỗi khi lấy danh sách chủ khách sạn');
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [apiCall]);
    
    // Lấy thông tin chi tiết khách hàng (chỉ hotel_owner)
    const getCustomerById = useCallback(async (customerId) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiCall(`/api/admin/customers/${customerId}`, 'GET');
            
            if (response.success) {
                // Kiểm tra xem có phải là hotel_owner không
                if (response.data.role !== 'hotel_owner') {
                    throw new Error('Tài khoản này không phải là chủ khách sạn');
                }
                return response.data;
            } else {
                throw new Error(response.message || 'Lỗi khi lấy thông tin chủ khách sạn');
            }
        } catch (err) {
            console.error('Error fetching hotel owner:', err);
            setError(err.message || 'Lỗi khi lấy thông tin chủ khách sạn');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);
    
    // Thêm khách hàng mới (luôn là hotel_owner)
    const createCustomer = useCallback(async (customerData) => {
        try {
            setLoading(true);
            setError(null);
            
            const payload = {
                ...customerData,
                role: 'hotel_owner', // Luôn đảm bảo role là chủ khách sạn
                createdBy: user?.userId
            };
            
            const response = await apiCall('/api/admin/customers', 'POST', payload);
            
            if (response.success) {
                // Refresh danh sách sau khi thêm
                await getCustomers();
                return response.data;
            } else {
                throw new Error(response.message || 'Lỗi khi tạo tài khoản chủ khách sạn');
            }
        } catch (err) {
            console.error('Error creating hotel owner:', err);
            setError(err.message || 'Lỗi khi tạo tài khoản chủ khách sạn');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall, user, getCustomers]);
    
    // Cập nhật thông tin khách hàng (chỉ hotel_owner)
    const updateCustomer = useCallback(async (customerId, customerData) => {
        try {
            setLoading(true);
            setError(null);
            
            const payload = {
                ...customerData,
                role: 'hotel_owner', // Luôn đảm bảo role là chủ khách sạn
                updatedBy: user?.userId,
                updatedAt: new Date().toISOString()
            };
            
            const response = await apiCall(`/api/admin/customers/${customerId}`, 'PUT', payload);
            
            if (response.success) {
                // Cập nhật customer trong state
                setCustomers(prev => prev.map(customer => 
                    customer.userId === customerId 
                        ? { ...customer, ...response.data, role: 'hotel_owner' }
                        : customer
                ));
                return response.data;
            } else {
                throw new Error(response.message || 'Lỗi khi cập nhật thông tin chủ khách sạn');
            }
        } catch (err) {
            console.error('Error updating hotel owner:', err);
            setError(err.message || 'Lỗi khi cập nhật thông tin chủ khách sạn');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall, user]);
    
    // Xóa khách hàng (chỉ hotel_owner)
    const deleteCustomer = useCallback(async (customerId) => {
        try {
            setLoading(true);
            setError(null);
            
            // Kiểm tra trước khi xóa
            const customerToDelete = customers.find(c => c.userId === customerId);
            if (customerToDelete && customerToDelete.role !== 'hotel_owner') {
                throw new Error('Chỉ có thể xóa tài khoản chủ khách sạn');
            }
            
            const response = await apiCall(`/api/admin/customers/${customerId}`, 'DELETE');
            
            if (response.success) {
                // Xóa customer khỏi state
                setCustomers(prev => prev.filter(customer => customer.userId !== customerId));
                
                // Cập nhật pagination
                setPagination(prev => ({
                    ...prev,
                    total: prev.total - 1,
                    totalPages: Math.ceil((prev.total - 1) / prev.limit)
                }));
                
                return true;
            } else {
                throw new Error(response.message || 'Lỗi khi xóa tài khoản chủ khách sạn');
            }
        } catch (err) {
            console.error('Error deleting hotel owner:', err);
            setError(err.message || 'Lỗi khi xóa tài khoản chủ khách sạn');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall, customers]);
    
    // Thay đổi trạng thái khách hàng (active/inactive) - chỉ hotel_owner
    const toggleCustomerStatus = useCallback(async (customerId, currentStatus) => {
        try {
            setLoading(true);
            setError(null);
            
            // Kiểm tra trước khi thay đổi status
            const customerToUpdate = customers.find(c => c.userId === customerId);
            if (customerToUpdate && customerToUpdate.role !== 'hotel_owner') {
                throw new Error('Chỉ có thể thay đổi trạng thái tài khoản chủ khách sạn');
            }
            
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const payload = {
                status: newStatus,
                updatedBy: user?.userId,
                updatedAt: new Date().toISOString()
            };
            
            const response = await apiCall(`/api/admin/customers/${customerId}/status`, 'PATCH', payload);
            
            if (response.success) {
                // Cập nhật status trong state
                setCustomers(prev => prev.map(customer => 
                    customer.userId === customerId 
                        ? { ...customer, status: newStatus }
                        : customer
                ));
                return newStatus;
            } else {
                throw new Error(response.message || 'Lỗi khi thay đổi trạng thái tài khoản chủ khách sạn');
            }
        } catch (err) {
            console.error('Error toggling hotel owner status:', err);
            setError(err.message || 'Lỗi khi thay đổi trạng thái tài khoản chủ khách sạn');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall, user, customers]);
    
    // Lấy thống kê khách hàng (chỉ hotel_owner)
    const getCustomerStats = useCallback(async () => {
        try {
            const response = await apiCall('/api/admin/customers/stats?role=hotel_owner', 'GET');
            
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.message || 'Lỗi khi lấy thống kê chủ khách sạn');
            }
        } catch (err) {
            console.error('Error fetching hotel owner stats:', err);
            throw err;
        }
    }, [apiCall]);
    
    // Export danh sách khách hàng (chỉ hotel_owner)
    const exportCustomers = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                role: 'hotel_owner', // Luôn export chỉ hotel_owner
                export: true,
                ...filters,
                role: 'hotel_owner' // Override để đảm bảo
            };
            
            const response = await apiCall('/api/admin/customers/export', 'GET', null, { 
                params,
                responseType: 'blob'
            });
            
            // Tạo file download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `hotel_owners_${new Date().getTime()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return true;
        } catch (err) {
            console.error('Error exporting hotel owners:', err);
            setError(err.message || 'Lỗi khi xuất danh sách chủ khách sạn');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);
    
    // Reset error
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    
    // Refresh danh sách
    const refreshCustomers = useCallback(() => {
        return getCustomers();
    }, [getCustomers]);
    
    return {
        // State
        customers,
        loading,
        error,
        pagination,
        
        // Actions - Đổi tên để rõ ràng hơn
        getHotelOwners: getCustomers, // Alias rõ ràng hơn
        getCustomers,
        getCustomerById,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        toggleCustomerStatus,
        getCustomerStats,
        exportCustomers,
        refreshCustomers,
        clearError
    };
};

export default useCustomer;