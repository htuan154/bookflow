// src/context/UserContext.js

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import userService from '../api/user.service';

// Initial state
const initialState = {
    users: [],
    selectedUser: null,
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
        role: '',
        status: ''
    }
};

// Action types
const actionTypes = {
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_USERS: 'SET_USERS',
    SET_SELECTED_USER: 'SET_SELECTED_USER',
    SET_PAGINATION: 'SET_PAGINATION',
    SET_FILTERS: 'SET_FILTERS',
    UPDATE_USER_IN_LIST: 'UPDATE_USER_IN_LIST',
    REMOVE_USER_FROM_LIST: 'REMOVE_USER_FROM_LIST',
    CLEAR_ERROR: 'CLEAR_ERROR',
    RESET_STATE: 'RESET_STATE'
};

// Reducer
const userReducer = (state, action) => {
    switch (action.type) {
        case actionTypes.SET_LOADING:
            return {
                ...state,
                loading: action.payload
            };

        case actionTypes.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false
            };

        case actionTypes.SET_USERS:
            return {
                ...state,
                users: action.payload,
                loading: false,
                error: null
            };

        case actionTypes.SET_SELECTED_USER:
            return {
                ...state,
                selectedUser: action.payload
            };

        case actionTypes.SET_PAGINATION:
            return {
                ...state,
                pagination: {
                    ...state.pagination,
                    ...action.payload
                }
            };

        case actionTypes.SET_FILTERS:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.payload
                }
            };

        case actionTypes.UPDATE_USER_IN_LIST:
            return {
                ...state,
                users: state.users.map(user =>
                    user._id === action.payload._id ? action.payload : user
                ),
                selectedUser: state.selectedUser?._id === action.payload._id 
                    ? action.payload 
                    : state.selectedUser
            };

        case actionTypes.REMOVE_USER_FROM_LIST:
            return {
                ...state,
                users: state.users.filter(user => user._id !== action.payload),
                selectedUser: state.selectedUser?._id === action.payload 
                    ? null 
                    : state.selectedUser
            };

        case actionTypes.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        case actionTypes.RESET_STATE:
            return initialState;

        default:
            return state;
    }
};

// Create context
const UserContext = createContext();

// Provider component
export const UserProvider = ({ children }) => {
    const [state, dispatch] = useReducer(userReducer, initialState);

    // Basic actions
    const setLoading = useCallback((loading) => {
        dispatch({ type: actionTypes.SET_LOADING, payload: loading });
    }, []);

    const setError = useCallback((error) => {
        dispatch({ type: actionTypes.SET_ERROR, payload: error });
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: actionTypes.CLEAR_ERROR });
    }, []);

    const setFilters = useCallback((filters) => {
        dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
    }, []);

    const setPagination = useCallback((pagination) => {
        dispatch({ type: actionTypes.SET_PAGINATION, payload: pagination });
    }, []);

    // Fetch all users - Fixed dependency issues
    const fetchUsers = useCallback(async (params = {}) => {
        try {
            console.log('Fetching users with params:', params);
            
            dispatch({ type: actionTypes.SET_LOADING, payload: true });
            dispatch({ type: actionTypes.CLEAR_ERROR });

            // Build query params - use current state values
            const queryParams = {
                page: params.page || state.pagination.page,
                limit: params.limit || state.pagination.limit,
                search: params.search || state.filters.search,
                role: 'user', // luôn chỉ lấy user
                // Xóa status nếu không cần lọc trạng thái
                ...params
            };

            // Remove empty params
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
                    delete queryParams[key];
                }
            });

            console.log('Final query params:', queryParams);

            const response = await userService.getAllUsers(queryParams);
            console.log('API response:', response);
            
            // Handle different response structures
            let users = [];
            let pagination = {};
            
            if (response && response.data) {
                if (response.data.users) {
                    // Response has nested structure: { data: { users: [], pagination: {} } }
                    users = response.data.users;
                    pagination = response.data.pagination || {};
                } else if (Array.isArray(response.data)) {
                    // Response data is directly an array
                    users = response.data;
                    pagination = {
                        page: 1,
                        limit: users.length,
                        total: users.length,
                        totalPages: 1
                    };
                } else {
                    // Response data is an object with users property
                    users = response.data.users || [];
                    pagination = response.data.pagination || {};
                }
            } else if (Array.isArray(response)) {
                // Response is directly an array
                users = response;
                pagination = {
                    page: 1,
                    limit: users.length,
                    total: users.length,
                    totalPages: 1
                };
            } else {
                // Fallback
                users = [];
                pagination = {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0
                };
            }

            console.log('Processed users:', users);
            console.log('Processed pagination:', pagination);
            
            dispatch({ type: actionTypes.SET_USERS, payload: users });
            dispatch({ type: actionTypes.SET_PAGINATION, payload: pagination });
            
            return { users, pagination };
        } catch (error) {
            console.error('fetchUsers error:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Lỗi khi tải danh sách người dùng';
            dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
            throw error;
        }
    }, [state.pagination.page, state.pagination.limit, state.filters.search, state.filters.role, state.filters.status]); // Include all dependencies

    // Fetch user by ID
    const fetchUserById = useCallback(async (userId) => {
        try {
            console.log('Fetching user by ID:', userId);
            
            dispatch({ type: actionTypes.SET_LOADING, payload: true });
            dispatch({ type: actionTypes.CLEAR_ERROR });

            const response = await userService.getUserById(userId);
            console.log('fetchUserById response:', response);
            
            const user = response?.data || response;
            dispatch({ type: actionTypes.SET_SELECTED_USER, payload: user });
            
            return user;
        } catch (error) {
            console.error('fetchUserById error:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Lỗi khi tải thông tin người dùng';
            dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
            throw error;
        }
    }, []);

    // Update user
    const updateUser = useCallback(async (userId, userData) => {
        try {
            console.log('Updating user:', userId, userData);
            
            dispatch({ type: actionTypes.SET_LOADING, payload: true });
            dispatch({ type: actionTypes.CLEAR_ERROR });

            const response = await userService.updateUser(userId, userData);
            console.log('updateUser response:', response);
            
            const updatedUser = response?.data || response;
            dispatch({ type: actionTypes.UPDATE_USER_IN_LIST, payload: updatedUser });
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
            
            return updatedUser;
        } catch (error) {
            console.error('updateUser error:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Lỗi khi cập nhật người dùng';
            dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
            throw error;
        }
    }, []);

    // Delete user
    const deleteUser = useCallback(async (userId) => {
        try {
            console.log('Deleting user:', userId);
            
            dispatch({ type: actionTypes.SET_LOADING, payload: true });
            dispatch({ type: actionTypes.CLEAR_ERROR });

            await userService.deleteUser(userId);
            dispatch({ type: actionTypes.REMOVE_USER_FROM_LIST, payload: userId });
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
            
            return true;
        } catch (error) {
            console.error('deleteUser error:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Lỗi khi xóa người dùng';
            dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
            throw error;
        }
    }, []);

    // Update user status
    const updateUserStatus = useCallback(async (userId, status) => {
        try {
            console.log('Updating user status:', userId, status);
            
            dispatch({ type: actionTypes.SET_LOADING, payload: true });
            dispatch({ type: actionTypes.CLEAR_ERROR });

            const response = await userService.updateUserStatus(userId, status);
            console.log('updateUserStatus response:', response);
            
            const updatedUser = response?.data || response;
            dispatch({ type: actionTypes.UPDATE_USER_IN_LIST, payload: updatedUser });
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
            
            return updatedUser;
        } catch (error) {
            console.error('updateUserStatus error:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Lỗi khi cập nhật trạng thái người dùng';
            dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
            throw error;
        }
    }, []);

    // Update user role
    const updateUserRole = useCallback(async (userId, role) => {
        try {
            console.log('Updating user role:', userId, role);
            
            dispatch({ type: actionTypes.SET_LOADING, payload: true });
            dispatch({ type: actionTypes.CLEAR_ERROR });

            const response = await userService.updateUserRole(userId, role);
            console.log('updateUserRole response:', response);
            
            const updatedUser = response?.data || response;
            dispatch({ type: actionTypes.UPDATE_USER_IN_LIST, payload: updatedUser });
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
            
            return updatedUser;
        } catch (error) {
            console.error('updateUserRole error:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Lỗi khi cập nhật vai trò người dùng';
            dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
            throw error;
        }
    }, []);

    // Reset state
    const resetState = useCallback(() => {
        dispatch({ type: actionTypes.RESET_STATE });
    }, []);

    // Context value
    const value = {
        // State
        ...state,
        
        // Actions
        setLoading,
        setError,
        clearError,
        setFilters,
        setPagination,
        fetchUsers,
        fetchUserById,
        updateUser,
        deleteUser,
        updateUserStatus,
        updateUserRole,
        resetState
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to use UserContext
export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export default UserContext;