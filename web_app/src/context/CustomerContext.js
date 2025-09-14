// src/context/CustomerContext.js - Updated to load real data
import React, { createContext, useContext, useReducer, useCallback } from 'react';
// Import customerService - đảm bảo đường dẫn đúng
import customerService from '../api/customer.service';

// Initial state
const initialState = {
    customers: [],
    currentCustomer: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    },
    filters: {
        search: '',
        status: 'all',
        role: 'hotel_owner', // Luôn mặc định là hotel_owner
        roleId: 2 // Thêm roleId mặc định
    }
};

// Action types
const CUSTOMER_ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_CUSTOMERS: 'SET_CUSTOMERS',
    SET_CURRENT_CUSTOMER: 'SET_CURRENT_CUSTOMER',
    ADD_CUSTOMER: 'ADD_CUSTOMER',
    UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
    UPDATE_CUSTOMER_STATUS: 'UPDATE_CUSTOMER_STATUS', // Thêm action riêng cho status
    DELETE_CUSTOMER: 'DELETE_CUSTOMER',
    SET_PAGINATION: 'SET_PAGINATION',
    SET_FILTERS: 'SET_FILTERS',
    CLEAR_ERROR: 'CLEAR_ERROR',
    RESET_STATE: 'RESET_STATE'
};

// Reducer - Fixed UPDATE_CUSTOMER case
const customerReducer = (state, action) => {
    switch (action.type) {
        case CUSTOMER_ACTIONS.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };

        case CUSTOMER_ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };

        case CUSTOMER_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        case CUSTOMER_ACTIONS.SET_CUSTOMERS:
            console.log('👥 SET_CUSTOMERS reducer:', { 
                oldCustomers: state.customers.length, 
                newCustomers: (action.payload || []).length,
                payload: action.payload 
            });
            return {
                ...state,
                customers: action.payload || [],
                loading: false,
                error: null
            };

        case CUSTOMER_ACTIONS.SET_CURRENT_CUSTOMER:
            return {
                ...state,
                currentCustomer: action.payload,
                loading: false,
                error: null
            };

        case CUSTOMER_ACTIONS.ADD_CUSTOMER:
            return {
                ...state,
                customers: [action.payload, ...state.customers],
                loading: false,
                error: null
            };

        case CUSTOMER_ACTIONS.UPDATE_CUSTOMER:
            console.log('UPDATE_CUSTOMER reducer:', { 
                payload: action.payload, 
                currentCustomers: state.customers.length 
            });
            
            return {
                ...state,
                customers: state.customers.map(customer => {
                    if (customer.userId === action.payload.userId) {
                        console.log('Updating customer:', customer.userId, 'new data:', action.payload);
                        return { ...customer, ...action.payload };
                    }
                    return customer;
                }),
                currentCustomer: state.currentCustomer?.userId === action.payload.userId 
                    ? { ...state.currentCustomer, ...action.payload }
                    : state.currentCustomer,
                loading: false,
                error: null
            };

        case CUSTOMER_ACTIONS.UPDATE_CUSTOMER_STATUS:
            console.log('UPDATE_CUSTOMER_STATUS reducer:', action.payload);
            
            return {
                ...state,
                customers: state.customers.map(customer => 
                    customer.userId === action.payload.customerId 
                        ? { ...customer, status: action.payload.status }
                        : customer
                ),
                currentCustomer: state.currentCustomer?.userId === action.payload.customerId
                    ? { ...state.currentCustomer, status: action.payload.status }
                    : state.currentCustomer,
                loading: false,
                error: null
            };

        case CUSTOMER_ACTIONS.DELETE_CUSTOMER:
            return {
                ...state,
                customers: state.customers.filter(customer => customer.userId !== action.payload),
                currentCustomer: state.currentCustomer?.userId === action.payload 
                    ? null 
                    : state.currentCustomer,
                loading: false,
                error: null
            };

        case CUSTOMER_ACTIONS.SET_PAGINATION:
            console.log('📊 SET_PAGINATION reducer:', { 
                oldPagination: state.pagination, 
                newPagination: action.payload 
            });
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    ...action.payload
                }
            };

        case CUSTOMER_ACTIONS.SET_FILTERS:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.payload,
                    role: 'hotel_owner', // Luôn đảm bảo role là hotel_owner
                    roleId: 2 // Luôn đảm bảo roleId là 2
                }
            };

        case CUSTOMER_ACTIONS.RESET_STATE:
            return initialState;

        default:
            return state;
    }
};

// Create context
const CustomerContext = createContext(null);

// Provider component
export const CustomerProvider = ({ children }) => {
    const [state, dispatch] = useReducer(customerReducer, initialState);

    // Helper actions
    const setLoading = useCallback((loading) => {
        dispatch({ type: CUSTOMER_ACTIONS.SET_LOADING, payload: loading });
    }, []);

    const setError = useCallback((error) => {
        const errorMessage = typeof error === 'string' ? error : error?.message || 'Đã xảy ra lỗi';
        dispatch({ type: CUSTOMER_ACTIONS.SET_ERROR, payload: errorMessage });
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: CUSTOMER_ACTIONS.CLEAR_ERROR });
    }, []);

    const setFilters = useCallback((filters) => {
        // Đảm bảo role luôn là hotel_owner và roleId luôn là 2
        const updatedFilters = {
            ...filters,
            role: 'hotel_owner',
            roleId: 2
        };
        dispatch({ type: CUSTOMER_ACTIONS.SET_FILTERS, payload: updatedFilters });
    }, []);

    // API Actions - Updated to use real API calls
    const fetchCustomers = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            clearError();

            // Đảm bảo luôn lọc theo role hotel_owner
            const queryParams = {
                ...state.filters,
                ...params,
                role: 'hotel_owner', // Luôn ép role là hotel_owner
                roleId: 2, // Luôn ép roleId là 2
                page: params.page || state.pagination.page,
                limit: params.limit || state.pagination.limit
            };

            console.log('Fetching customers with params:', queryParams);

            // Gọi API thật để lấy hotel owners
            let response;
            
            try {
                // Thử các method API khả dụng theo thứ tự ưu tiên
                if (customerService.getHotelOwners) {
                    console.log('📞 Using getHotelOwners API with queryParams:', queryParams);
                    response = await customerService.getHotelOwners(queryParams);
                    console.log('📥 getHotelOwners raw response:', response);
                } else if (customerService.getCustomersByRole) {
                    console.log('📞 Using getCustomersByRole API');
                    response = await customerService.getCustomersByRole('hotel_owner', queryParams);
                    console.log('📥 getCustomersByRole raw response:', response);
                } else if (customerService.getCustomersWithHotels) {
                    console.log('📞 Using getCustomersWithHotels API');
                    response = await customerService.getCustomersWithHotels(queryParams);
                    console.log('📥 getCustomersWithHotels raw response:', response);
                } else if (customerService.getCustomers) {
                    console.log('📞 Using general getCustomers API with role filter');
                    response = await customerService.getCustomers({
                        ...queryParams,
                        role: 'hotel_owner'
                    });
                    console.log('📥 getCustomers raw response:', response);
                } else {
                    throw new Error('No suitable API method available in customerService');
                }
            } catch (apiError) {
                console.error('All API methods failed:', apiError);
                throw new Error(`API call failed: ${apiError.message}`);
            }

            // Xử lý response data - Fixed để xử lý đúng format từ backend
            let customers = [];
            let paginationData = {};

            console.log('🔍 Processing API response:', response);

            if (response) {
                // Format từ backend: { success: true, data: [...], pagination: {...} }
                if (response.success && Array.isArray(response.data)) {
                    customers = response.data;
                    
                    // Xử lý pagination từ response.pagination hoặc fallback
                    if (response.pagination) {
                        paginationData = {
                            page: response.pagination.page || queryParams.page || 1,
                            limit: response.pagination.limit || queryParams.limit || 10,
                            total: response.pagination.total || customers.length,
                            totalPages: response.pagination.totalPages || Math.ceil((response.pagination.total || customers.length) / (queryParams.limit || 10))
                        };
                    } else {
                        // Fallback nếu không có pagination object
                        paginationData = {
                            page: queryParams.page || 1,
                            limit: queryParams.limit || 10,
                            total: customers.length,
                            totalPages: Math.ceil(customers.length / (queryParams.limit || 10))
                        };
                    }
                } else if (Array.isArray(response.data)) {
                    customers = response.data;
                    paginationData = {
                        page: response.page || queryParams.page || 1,
                        limit: response.limit || queryParams.limit || 10,
                        total: response.total || customers.length,
                        totalPages: response.totalPages || Math.ceil((response.total || customers.length) / (queryParams.limit || 10))
                    };
                } else if (Array.isArray(response)) {
                    customers = response;
                    paginationData = {
                        page: queryParams.page || 1,
                        limit: queryParams.limit || 10,
                        total: customers.length,
                        totalPages: Math.ceil(customers.length / (queryParams.limit || 10))
                    };
                } else {
                    console.warn('⚠️ Unexpected response format:', response);
                    // Thử extract data anyway
                    customers = response.data || response.items || [];
                    paginationData = {
                        page: queryParams.page || 1,
                        limit: queryParams.limit || 10,
                        total: Array.isArray(customers) ? customers.length : 0, 
                        totalPages: Math.ceil((Array.isArray(customers) ? customers.length : 0) / (queryParams.limit || 10))
                    };
                }

                // Đảm bảo customers là array và có role hotel_owner
                customers = customers.filter(customer => 
                    customer && (
                        customer.role === 'hotel_owner' || 
                        customer.roleId === 2 ||
                        customer.role_id === 2 ||
                        (customer.roles && customer.roles.includes('hotel_owner'))
                    )
                );
            } else {
                console.warn('No response data received');
                customers = [];
                paginationData = {
                    page: queryParams.page || 1,
                    limit: queryParams.limit || 10,
                    total: 0,
                    totalPages: 0
                };
            }

            console.log('✅ Processed customers:', customers.length, 'items');
            console.log('✅ Pagination data:', paginationData);

            // Đảm bảo customers luôn là array
            const validCustomers = Array.isArray(customers) ? customers : [];
            
            dispatch({ type: CUSTOMER_ACTIONS.SET_CUSTOMERS, payload: validCustomers });
            dispatch({ type: CUSTOMER_ACTIONS.SET_PAGINATION, payload: paginationData });

        } catch (error) {
            console.error('Error fetching customers:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể tải danh sách khách hàng';
            setError(errorMessage);
            // Set empty array nếu có lỗi
            dispatch({ type: CUSTOMER_ACTIONS.SET_CUSTOMERS, payload: [] });
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    const fetchCustomerById = useCallback(async (customerId) => {
        try {
            setLoading(true);
            clearError();

            if (!customerId) {
                throw new Error('Customer ID is required');
            }

            console.log('Fetching customer by id:', customerId);

            // Gọi API thật
            const customer = await customerService.getCustomerById(customerId);
            
            console.log('Fetched customer:', customer);
            dispatch({ type: CUSTOMER_ACTIONS.SET_CURRENT_CUSTOMER, payload: customer });

            return customer;
        } catch (error) {
            console.error('Error fetching customer:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể tải thông tin khách hàng';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    const createCustomer = useCallback(async (customerData) => {
        try {
            setLoading(true);
            clearError();

            if (!customerData) {
                throw new Error('Customer data is required');
            }

            // Chuẩn bị dữ liệu theo format backend mong đợi (chỉ những field cần thiết)
            const dataWithRole = {
                username: customerData.username,
                email: customerData.email,
                password: customerData.password,
                fullName: customerData.fullName,
                roleId: 2, // Hotel owner role
                phoneNumber: customerData.phoneNumber,
                address: customerData.address
            };

            console.log('Creating customer with data:', dataWithRole);

            // Gọi API thật
            let newCustomer;
            try {
                if (customerService.createHotelOwner) {
                    // Ưu tiên sử dụng createHotelOwner nếu có
                    newCustomer = await customerService.createHotelOwner(dataWithRole);
                } else if (customerService.createCustomer) {
                    // Fallback sử dụng createCustomer
                    newCustomer = await customerService.createCustomer(dataWithRole);
                } else {
                    throw new Error('No create customer API method available');
                }
            } catch (apiError) {
                console.error('Create customer API error:', apiError);
                throw new Error(apiError?.response?.data?.message || apiError.message || 'Không thể tạo khách hàng mới');
            }

            console.log('Created customer:', newCustomer);
            dispatch({ type: CUSTOMER_ACTIONS.ADD_CUSTOMER, payload: newCustomer });
            
            return newCustomer;
        } catch (error) {
            console.error('Error creating customer:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể tạo khách hàng mới';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    const updateCustomer = useCallback(async (customerId, customerData) => {
        try {
            setLoading(true);
            clearError();

            if (!customerId || !customerData) {
                throw new Error('Customer ID and data are required');
            }

            console.log('Updating customer:', customerId, 'with data:', customerData);

            // Đảm bảo role luôn là hotel_owner khi update
            const dataWithRole = {
                ...customerData,
                role: 'hotel_owner',
                roleId: 2
            };

            // Gọi API thật
            const updatedCustomer = await customerService.updateCustomer(customerId, dataWithRole);

            console.log('Updated customer:', updatedCustomer);
            
            // Dispatch với dữ liệu đã update từ API
            const customerToUpdate = {
                userId: customerId,
                ...updatedCustomer
            };

            dispatch({ type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER, payload: customerToUpdate });
            
            return updatedCustomer;
        } catch (error) {
            console.error('Error updating customer:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể cập nhật thông tin khách hàng';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    const deleteCustomer = useCallback(async (customerId) => {
        try {
            setLoading(true);
            clearError();

            if (!customerId) {
                throw new Error('Customer ID is required');
            }

            console.log('Deleting customer:', customerId);

            // Gọi API thật
            await customerService.deleteCustomer(customerId);
            
            console.log('Customer deleted successfully');
            dispatch({ type: CUSTOMER_ACTIONS.DELETE_CUSTOMER, payload: customerId });
            
            return true;
        } catch (error) {
            console.error('Error deleting customer:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể xóa khách hàng';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    // Updated updateCustomerStatus function to use real API
    const updateCustomerStatus = useCallback(async (customerId, status) => {
        try {
            setLoading(true);
            clearError();

            if (!customerId || !status) {
                throw new Error('Customer ID and status are required');
            }

            console.log('Updating customer status:', { customerId, status });

            // Gọi API thật
            let updatedCustomer;
            try {
                if (customerService.updateCustomerStatusV2) {
                    // Ưu tiên sử dụng API chuyên dụng cho status
                    updatedCustomer = await customerService.updateCustomerStatusV2(customerId, status);
                } else {
                    // Fallback sử dụng updateCustomerStatus thông thường
                    updatedCustomer = await customerService.updateCustomerStatus(customerId, status);
                }
            } catch (apiError) {
                console.warn('Dedicated status update failed, trying general update:', apiError);
                // Fallback cuối cùng: sử dụng updateCustomer với chỉ status
                updatedCustomer = await customerService.updateCustomer(customerId, { status });
            }

            console.log('Status updated:', updatedCustomer);

            // Dispatch specific status update action
            dispatch({ 
                type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER_STATUS, 
                payload: { customerId, status }
            });

            // Also update the full customer object if we have complete data
            if (updatedCustomer && typeof updatedCustomer === 'object') {
                const customerToUpdate = {
                    userId: customerId,
                    ...updatedCustomer,
                    status // Đảm bảo status được set đúng
                };
                
                console.log('Also updating full customer object:', customerToUpdate);
                dispatch({ type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER, payload: customerToUpdate });
            }
            
            return { userId: customerId, status };
        } catch (error) {
            console.error('Error updating customer status:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể cập nhật trạng thái khách hàng';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    const toggleCustomerStatus = useCallback(async (customerId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        return await updateCustomerStatus(customerId, newStatus);
    }, [updateCustomerStatus]);

    // Thêm function để suspend/activate hotel owner
    const suspendHotelOwner = useCallback(async (ownerId) => {
        try {
            setLoading(true);
            clearError();

            console.log('Suspending hotel owner:', ownerId);
            
            const result = await customerService.suspendHotelOwner(ownerId);
            
            // Update status trong state
            dispatch({ 
                type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER_STATUS, 
                payload: { customerId: ownerId, status: 'inactive' }
            });

            return result;
        } catch (error) {
            console.error('Error suspending hotel owner:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể tạm ngưng hotel owner';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    const activateHotelOwner = useCallback(async (ownerId) => {
        try {
            setLoading(true);
            clearError();

            console.log('Activating hotel owner:', ownerId);
            
            const result = await customerService.activateHotelOwner(ownerId);
            
            // Update status trong state
            dispatch({ 
                type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER_STATUS, 
                payload: { customerId: ownerId, status: 'active' }
            });

            return result;
        } catch (error) {
            console.error('Error activating hotel owner:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể kích hoạt hotel owner';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    // Thêm function search customers
    const searchCustomers = useCallback(async (searchTerm, additionalFilters = {}) => {
        try {
            setLoading(true);
            clearError();

            const filters = {
                ...state.filters,
                ...additionalFilters,
                role: 'hotel_owner',
                roleId: 2
            };

            console.log('Searching customers with term:', searchTerm, 'filters:', filters);
            
            const results = await customerService.searchCustomers(searchTerm, filters);
            
            console.log('Search results:', results);
            
            // Process results similar to fetchCustomers
            let customers = [];
            if (Array.isArray(results.data)) {
                customers = results.data;
            } else if (Array.isArray(results)) {
                customers = results;
            }

            dispatch({ type: CUSTOMER_ACTIONS.SET_CUSTOMERS, payload: customers });
            
            return customers;
        } catch (error) {
            console.error('Error searching customers:', error);
            const errorMessage = error?.response?.data?.message || error.message || 'Không thể tìm kiếm khách hàng';
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [state.filters, clearError, setError, setLoading]);

    const resetState = useCallback(() => {
        dispatch({ type: CUSTOMER_ACTIONS.RESET_STATE });
    }, []);

    // Context value
    const contextValue = {
        // State
        customers: state.customers,
        currentCustomer: state.currentCustomer,
        loading: state.loading,
        error: state.error,
        pagination: state.pagination,
        filters: state.filters,

        // Actions
        setLoading,
        setError,
        clearError,
        setFilters,
        fetchCustomers,
        fetchCustomerById,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        updateCustomerStatus,
        toggleCustomerStatus,
        suspendHotelOwner,
        activateHotelOwner,
        searchCustomers,
        resetState
    };

    return (
        <CustomerContext.Provider value={contextValue}>
            {children}
        </CustomerContext.Provider>
    );
};

// Custom hook to use context với error checking
export const useCustomer = () => {
    const context = useContext(CustomerContext);
    
    if (context === undefined) {
        throw new Error('useCustomer must be used within a CustomerProvider');
    }
    
    if (context === null) {
        throw new Error('CustomerContext value is null. Make sure CustomerProvider is properly set up.');
    }
    
    return context;
};

// Export context for advanced usage
export { CustomerContext };
export default CustomerContext;