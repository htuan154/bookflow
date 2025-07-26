// src/pages/admin/UserManagementPage/UserListPage.js

import React, { useEffect, useState } from 'react';
import { useUser } from '../../../context/UserContext';

const UserListPage = () => {
    const {
        users,
        loading,
        error,
        pagination,
        fetchUsers,
        updateUser,
        deleteUser,
        clearError
    } = useUser();

    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        role: '',
        status: ''
    });

    // Component state for tracking initialization
    const [isInitialized, setIsInitialized] = useState(false);

    // Helper functions to map database fields to display values
    const getUserName = (user) => {
        return user.full_name || user.username || 'Chưa cập nhật';
    };

   const getUserRole = (user) => {
    if (typeof user.roleId === 'number') {
        switch (user.roleId) {
            case 1: return 'admin';
            case 2: return 'hotel_owner';
            case 3: return 'customer';
            case 6: return 'staff';
            default: return 'customer';
        }
    }
    return user.role || 'customer';
    };



    const getRoleDisplay = (user) => {
    const role = getUserRole(user);
    switch (role) {
        case 'admin':
            return 'Admin';
        case 'hotel_owner':
            return 'Hotel Owner';
        case 'customer':
            return 'Customer';
        case 'staff':
            return 'Staff'; // thêm dòng này
        default:
            return 'Customer';
        }
    };



    const getUserStatus = (user) => {
        if (typeof user.is_active === 'boolean') {
            return user.is_active ? 'active' : 'inactive';
        }
        return user.status || 'active'; // fallback to string status if exists
    };

    const getStatusDisplay = (user) => {
        const status = getUserStatus(user);
        return status === 'active' ? 'Active' : 'Inactive';
    };

    // Get user ID (handle both _id and user_id)
    const getUserId = (user) => {
        return user._id || user.user_id || user.id;
    };

    // Computed values
    const isLoading = loading;
    const hasError = !!error;
    const hasUsers = users && users.length > 0;
    const userCount = users ? users.length : 0;
    const totalUsers = pagination ? pagination.total : 0;

    // Fetch users when component mounts
    useEffect(() => {
        console.log('UserListPage mounted, initializing...');
        
        const initializeComponent = async () => {
            try {
                setIsInitialized(false);
                console.log('Fetching users...');
                await fetchUsers();
                console.log('Users fetched successfully');
                setIsInitialized(true);
            } catch (err) {
                console.error('Error initializing UserListPage:', err);
                setIsInitialized(true);
            }
        };

        initializeComponent();
    }, [fetchUsers]);

    // Handle edit user
    const handleEdit = (user) => {
        console.log('Editing user:', user);
        const userId = getUserId(user);
        setEditingUser(userId);
        setEditForm({
            name: getUserName(user),
            email: user.email || '',
            role: getUserRole(user),
            status: getUserStatus(user)
        });
    };

    // Handle save edit
    const handleSaveEdit = async () => {
        try {
            console.log('Saving user edit:', editingUser, editForm);
            
            // Map form data back to database fields
            const updateData = {
                full_name: editForm.name,
                email: editForm.email,
                role_id: 
                    editForm.role === 'admin' ? 1 :
                    editForm.role === 'hotel_owner' ? 2 :
                    editForm.role === 'staff' ? 6 : 3,

                is_active: editForm.status === 'active'
            };
            
            await updateUser(editingUser, updateData);
            setEditingUser(null);
            setEditForm({ name: '', email: '', role: '', status: '' });
            
            // Refresh the list after update
            console.log('Refreshing user list after update...');
            await fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            // Error is already handled in context, just log it here
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        console.log('Cancelling edit');
        setEditingUser(null);
        setEditForm({ name: '', email: '', role: '', status: '' });
    };

    // Handle delete user
    const handleDelete = async (userId, userName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}"?`)) {
            try {
                console.log('Deleting user:', userId);
                await deleteUser(userId);
                
                // Refresh the list after delete
                console.log('Refreshing user list after delete...');
                await fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                // Error is already handled in context, just log it here
            }
        }
    };

    // Handle form input change
    const handleInputChange = (field, value) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle retry
    const handleRetry = async () => {
        console.log('Retrying to fetch users...');
        clearError();
        try {
            await fetchUsers();
        } catch (error) {
            console.error('Error on retry:', error);
        }
    };

    // Handle refresh
    const handleRefresh = async () => {
        console.log('Refreshing user list...');
        try {
            await fetchUsers();
        } catch (error) {
            console.error('Error refreshing:', error);
        }
    };

    // Debug logging
    console.log('UserListPage render state:', {
        users,
        loading,
        error,
        pagination,
        hasUsers,
        userCount,
        totalUsers,
        isInitialized
    });

    // Show loading state
    if (!isInitialized || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-600">
                        {!isInitialized ? 'Đang khởi tạo...' : 'Đang tải danh sách người dùng...'}
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (hasError) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
                    <div className="text-red-600 text-lg mb-4">
                        ⚠️ Có lỗi xảy ra
                    </div>
                    <div className="text-red-500 mb-6">
                        {error}
                    </div>
                    <button 
                        onClick={handleRetry}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Quản lý người dùng
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Tổng cộng: {totalUsers} người dùng ({userCount} đang hiển thị)
                            </p>
                        </div>
                        <button 
                            onClick={handleRefresh}
                            disabled={loading}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!hasUsers ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">👥</div>
                            <p className="text-gray-500 text-lg mb-4">
                                Không có người dùng nào
                            </p>
                            <button 
                                onClick={handleRefresh}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Tải lại
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Users Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Tên
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Vai trò
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Trạng thái
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {users.map((user, index) => {
                                            const userId = getUserId(user);
                                            const userName = getUserName(user);
                                            const userRole = getUserRole(user);
                                            const userStatus = getUserStatus(user);
                                            
                                            return (
                                                <tr key={userId || index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {pagination && pagination.page && pagination.limit 
                                                            ? (pagination.page - 1) * pagination.limit + index + 1
                                                            : index + 1
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {editingUser === userId ? (
                                                            <input
                                                                type="text"
                                                                value={editForm.name}
                                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Nhập tên"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-900">
                                                                {userName}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {editingUser === userId ? (
                                                            <input
                                                                type="email"
                                                                value={editForm.email}
                                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Nhập email"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-900">
                                                                {user.email || 'Chưa có email'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {editingUser === userId ? (
                                                            <select
                                                                value={editForm.role}
                                                                onChange={(e) => handleInputChange('role', e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="">Chọn vai trò</option>
                                                                <option value="admin">Admin</option>
                                                                <option value="hotel_owner">Hotel Owner</option>
                                                                <option value="customer">Customer</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                userRole === 'admin' 
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : userRole === 'hotel_owner'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {getRoleDisplay(user)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {editingUser === userId ? (
                                                            <select
                                                                value={editForm.status}
                                                                onChange={(e) => handleInputChange('status', e.target.value)}
                                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            >
                                                                <option value="">Chọn trạng thái</option>
                                                                <option value="active">Active</option>
                                                                <option value="inactive">Inactive</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                userStatus === 'active' 
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {getStatusDisplay(user)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {editingUser === userId ? (
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={handleSaveEdit}
                                                                    disabled={loading}
                                                                    className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    {loading ? 'Đang lưu...' : 'Lưu'}
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    disabled={loading}
                                                                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    Hủy
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleEdit(user)}
                                                                    disabled={loading}
                                                                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    Sửa
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(userId, userName)}
                                                                    disabled={loading}
                                                                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Info */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="mt-6 flex justify-between items-center border-t border-gray-200 pt-4">
                                    <div className="text-sm text-gray-700">
                                        Trang {pagination.page} / {pagination.totalPages}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        Hiển thị {userCount} / {totalUsers} người dùng
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListPage;