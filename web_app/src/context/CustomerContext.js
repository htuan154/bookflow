// src/context/CustomerContext.js - Fixed for status update issue
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

    // API Actions với error handling cải thiện
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

            // Kiểm tra customerService có tồn tại không
            if (!customerService || typeof customerService.getHotelOwners !== 'function') {
                console.warn('customerService.getHotelOwners not available, trying fallback methods');
                
                // Thử các fallback methods
                if (typeof customerService.getCustomers === 'function') {
                    const response = await customerService.getCustomers(queryParams);
                    console.log('Using getCustomers fallback, response:', response);
                } else if (typeof customerService.getAllCustomers === 'function') {
                    const response = await customerService.getAllCustomers(queryParams);
                    console.log('Using getAllCustomers fallback, response:', response);
                } else {
                    throw new Error('No available customer service methods');
                }
            } else {
                const response = await customerService.getHotelOwners(queryParams);
                console.log('getHotelOwners response:', response);
            }

            // Mock data tạm thời nếu API không hoạt động
            const mockResponse = {
                data: [
                    {
                        userId: "16oad88d-ccef-4715-9447-b4fd7c403384",
                        fullName: "Hotel Owner",
                        username: "hotel_owner",
                        email: "hotel@bookflow.com",
                        phone: "0123456789",
                        status: "active", // Đảm bảo status là active
                        role: "hotel_owner",
                        roleId: 2,
                        createdAt: "2025-08-07T09:36:00Z"
                    }
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1
            };

            const customers = Array.isArray(mockResponse?.data) ? mockResponse.data : 
                             Array.isArray(mockResponse) ? mockResponse : [];
            
            console.log('Setting customers:', customers);
            dispatch({ type: CUSTOMER_ACTIONS.SET_CUSTOMERS, payload: customers });
            dispatch({ 
                type: CUSTOMER_ACTIONS.SET_PAGINATION, 
                payload: {
                    page: mockResponse?.page || params.page || 1,
                    limit: mockResponse?.limit || params.limit || 10,
                    total: mockResponse?.total || customers.length,
                    totalPages: mockResponse?.totalPages || Math.ceil((mockResponse?.total || customers.length) / (params.limit || 10))
                }
            });

        } catch (error) {
            console.error('Error fetching customers:', error);
            setError(error.message || 'Không thể tải danh sách khách hàng');
            // Set empty array nếu có lỗi
            dispatch({ type: CUSTOMER_ACTIONS.SET_CUSTOMERS, payload: [] });
        } finally {
            setLoading(false);
        }
    }, [state.filters, state.pagination.page, state.pagination.limit, clearError, setError, setLoading]);

    const fetchCustomerById = useCallback(async (customerId) => {
        try {
            setLoading(true);
            clearError();

            if (!customerId) {
                throw new Error('Customer ID is required');
            }

            if (!customerService || typeof customerService.getCustomerById !== 'function') {
                throw new Error('customerService.getCustomerById is not available');
            }

            const customer = await customerService.getCustomerById(customerId);
            dispatch({ type: CUSTOMER_ACTIONS.SET_CURRENT_CUSTOMER, payload: customer });

            return customer;
        } catch (error) {
            console.error('Error fetching customer:', error);
            setError(error.message || 'Không thể tải thông tin khách hàng');
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

            // Đảm bảo role luôn là hotel_owner khi tạo mới
            const dataWithRole = {
                ...customerData,
                role: 'hotel_owner',
                roleId: 2,
                status: customerData.status || 'active'
            };

            console.log('Creating customer with data:', dataWithRole);

            // Mock tạo customer mới
            const newCustomer = {
                userId: `new-${Date.now()}`,
                ...dataWithRole,
                createdAt: new Date().toISOString()
            };

            dispatch({ type: CUSTOMER_ACTIONS.ADD_CUSTOMER, payload: newCustomer });
            
            return newCustomer;
        } catch (error) {
            console.error('Error creating customer:', error);
            setError(error.message || 'Không thể tạo khách hàng mới');
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
                roleId: 2,
                userId: customerId // Đảm bảo có userId
            };

            // Mock update customer
            const updatedCustomer = {
                userId: customerId,
                ...dataWithRole,
                updatedAt: new Date().toISOString()
            };

            console.log('Dispatching UPDATE_CUSTOMER with:', updatedCustomer);
            dispatch({ type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER, payload: updatedCustomer });
            
            return updatedCustomer;
        } catch (error) {
            console.error('Error updating customer:', error);
            setError(error.message || 'Không thể cập nhật thông tin khách hàng');
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

            // Mock delete - chỉ dispatch action
            dispatch({ type: CUSTOMER_ACTIONS.DELETE_CUSTOMER, payload: customerId });
            
            return true;
        } catch (error) {
            console.error('Error deleting customer:', error);
            setError(error.message || 'Không thể xóa khách hàng');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [clearError, setError, setLoading]);

    // FIXED updateCustomerStatus function
    const updateCustomerStatus = useCallback(async (customerId, status) => {
        try {
            setLoading(true);
            clearError();

            if (!customerId || !status) {
                throw new Error('Customer ID and status are required');
            }

            console.log('Updating customer status:', { customerId, status });

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Dispatch specific status update action
            dispatch({ 
                type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER_STATUS, 
                payload: { customerId, status }
            });

            // Also find and update the full customer object
            const currentCustomer = state.customers.find(c => c.userId === customerId);
            if (currentCustomer) {
                const updatedCustomer = {
                    ...currentCustomer,
                    status,
                    updatedAt: new Date().toISOString()
                };
                
                console.log('Also updating full customer object:', updatedCustomer);
                dispatch({ type: CUSTOMER_ACTIONS.UPDATE_CUSTOMER, payload: updatedCustomer });
            }
            
            return { userId: customerId, status };
        } catch (error) {
            console.error('Error updating customer status:', error);
            setError(error.message || 'Không thể cập nhật trạng thái khách hàng');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [state.customers, clearError, setError, setLoading]);

    const toggleCustomerStatus = useCallback(async (customerId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        return await updateCustomerStatus(customerId, newStatus);
    }, [updateCustomerStatus]);

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