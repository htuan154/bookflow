// src/hooks/useUser.js

import { useContext, useCallback } from 'react';
import UserContext from '../context/UserContext';

/**
 * Custom hook để sử dụng UserContext với các utility functions
 * @returns {Object} User context state và actions
 */
export const useUser = () => {
    const context = useContext(UserContext);
    
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }

    const {
        // State
        users,
        selectedUser,
        loading,
        error,
        pagination,
        filters,
        
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
        resetState
    } = context;

    // Utility functions
    const isLoading = loading;
    const hasError = !!error;
    const hasUsers = users.length > 0;
    const userCount = users.length;
    const totalUsers = pagination.total;

    /**
     * Tìm user theo ID trong danh sách hiện tại
     * @param {string} userId - ID của user
     * @returns {Object|null} User object hoặc null nếu không tìm thấy
     */
    const findUserById = useCallback((userId) => {
        return users.find(user => user._id === userId) || null;
    }, [users]);

    /**
     * Kiểm tra xem user có tồn tại trong danh sách không
     * @param {string} userId - ID của user
     * @returns {boolean} True nếu user tồn tại
     */
    const userExists = useCallback((userId) => {
        return users.some(user => user._id === userId);
    }, [users]);

    /**
     * Refresh danh sách users với params hiện tại
     */
    const refreshUsers = useCallback(async () => {
        await fetchUsers();
    }, [fetchUsers]);

    /**
     * Cập nhật user và refresh danh sách nếu cần
     * @param {string} userId - ID của user
     * @param {Object} userData - Dữ liệu cập nhật
     * @param {boolean} shouldRefresh - Có refresh danh sách không
     */
    const updateUserAndRefresh = useCallback(async (userId, userData, shouldRefresh = false) => {
        try {
            const updatedUser = await updateUser(userId, userData);
            if (shouldRefresh) {
                await refreshUsers();
            }
            return updatedUser;
        } catch (error) {
            throw error;
        }
    }, [updateUser, refreshUsers]);

    /**
     * Xóa user và refresh danh sách
     * @param {string} userId - ID của user
     */
    const deleteUserAndRefresh = useCallback(async (userId) => {
        try {
            await deleteUser(userId);
            await refreshUsers();
        } catch (error) {
            throw error;
        }
    }, [deleteUser, refreshUsers]);

    return {
        // State
        users,
        selectedUser,
        loading,
        error,
        pagination,
        filters,
        
        // Computed state
        isLoading,
        hasError,
        hasUsers,
        userCount,
        totalUsers,
        
        // Original actions
        setLoading,
        setError,
        clearError,
        setFilters,
        setPagination,
        fetchUsers,
        fetchUserById,
        updateUser,
        deleteUser,
        resetState,
        
        // Utility functions
        findUserById,
        userExists,
        refreshUsers,
        updateUserAndRefresh,
        deleteUserAndRefresh
    };
};

export default useUser;