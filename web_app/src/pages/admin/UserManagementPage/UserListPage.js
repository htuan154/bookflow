import React, { useEffect, useState } from 'react';
import { useUser } from '../../../context/UserContext';
import ActionButton from '../../../components/common/ActionButton';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../../components/common/Toast';

const UserListPage = () => {
    const {
        users,
        loading,
        error,
        pagination,
        fetchUsers,
        updateUser,
        deleteUser,
        updateUserStatus,
        clearError
    } = useUser();

    const [editingUser, setEditingUser] = useState(null);
    const [editingUserRole, setEditingUserRole] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        password: '',
        status: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState(''); // '' = all, 'user', 'admin', 'hotel_owner', 'staff'
    const [statusFilter, setStatusFilter] = useState(''); // '' = all, 'active', 'inactive'
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
    const [statusToggleUser, setStatusToggleUser] = useState(null);

    const { toast, showSuccess, showError, showWarning, hideToast } = useToast();

    // Helper functions
    const getUserName = (user) => {
        return user.full_name || user.username || 'Chưa cập nhật';
    };

    // Lấy đúng vai trò user (role_name = 'user' hoặc roleId = 3)
    const getUserRole = (user) => {
        if (typeof user.roleId === 'number') {
            if (user.roleId === 3) return 'user';
            if (user.roleId === 1) return 'admin';
            if (user.roleId === 2) return 'hotel_owner';
            if (user.roleId === 6) return 'staff';
            return 'unknown';
        }
        if (user.role === 'user' || user.role_name === 'user') return 'user';
        if (user.role === 'admin' || user.role_name === 'admin') return 'admin';
        if (user.role === 'hotel_owner' || user.role_name === 'hotel_owner') return 'hotel_owner';
        if (user.role === 'staff' || user.role_name === 'staff') return 'staff';
        return 'unknown';
    };

    // Hiển thị label vai trò là "User" nếu là user
    const getRoleDisplay = (user) => {
        const role = getUserRole(user);
        switch (role) {
            case 'admin': return 'Admin';
            case 'hotel_owner': return 'Hotel Owner';
            case 'staff': return 'Staff';
            case 'user': return 'User';
            default: return 'User';
        }
    };

    const getUserStatus = (user) => {
        // Check both isActive and is_active fields
        if (typeof user.isActive === 'boolean') {
            return user.isActive ? 'active' : 'inactive';
        }
        if (typeof user.is_active === 'boolean') {
            return user.is_active ? 'active' : 'inactive';
        }
        return user.status || 'active';
    };

    const getUserId = (user) => {
        return user._id || user.user_id || user.userId || user.id;
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-500';
            case 'hotel_owner': return 'bg-blue-500';
            case 'staff': return 'bg-purple-500';
            default: return 'bg-orange-500';
        }
    };

    // Stats calculations
    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter(user => getUserStatus(user) === 'active').length || 0;
    const inactiveUsers = users?.filter(user => getUserStatus(user) === 'inactive').length || 0;

    // Filter users: theo search, role, và status
    const allFilteredUsers = users?.filter(user => {
        const matchesSearch = getUserName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !roleFilter || getUserRole(user) === roleFilter;
        const matchesStatus = !statusFilter || getUserStatus(user) === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    }) || [];

    // Client-side pagination
    const totalFilteredUsers = allFilteredUsers.length;
    const totalPages = Math.ceil(totalFilteredUsers / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredUsers = allFilteredUsers.slice(startIndex, endIndex);

    // Initialize component
    useEffect(() => {
        const initializeComponent = async () => {
            try {
                setIsInitialized(false);
                // Hiển thị mặc định mỗi trang 5 người
                await fetchUsers({ page: 1, limit: 5 });
                setIsInitialized(true);
            } catch (err) {
                console.error('Error initializing UserListPage:', err);
                setIsInitialized(true);
            }
        };
        initializeComponent();
    }, [fetchUsers]);

    // Handle view user
    const handleView = (user) => {
        setViewingUser(user);
    };

    // Handle edit user - chỉ sử password và status
    const handleEdit = (user) => {
        const userId = getUserId(user);
        setEditingUser(userId);
        setEditingUserRole(getUserRole(user));
        setEditForm({
            password: '',
            status: getUserStatus(user)
        });
    };

    // Handle save edit
    const handleSaveEdit = async () => {
        try {
            // Build update payload based on role
            const updateData = {};
            // If password provided, include it for all roles
            if (editForm.password && editForm.password.trim() !== '') {
                updateData.password = editForm.password;
            }

            // If editing non-admin, allow status change
            const userObj = users.find(u => getUserId(u) === editingUser);
            const role = userObj ? getUserRole(userObj) : editingUserRole;
            if (role !== 'admin') {
                if (editForm.status) {
                    updateData.is_active = editForm.status === 'active';
                }
            }

            // Nothing to update
            if (Object.keys(updateData).length === 0) {
                setEditingUser(null);
                setEditForm({ password: '', status: '' });
                setEditingUserRole(null);
                return;
            }

            // Ensure we include required user fields (avoid sending null email)
            // Pull current values from userObj and include when not explicitly changing
            if (userObj) {
                // Map possible property names
                updateData.fullName = userObj.full_name || userObj.fullName || userObj.fullname || userObj.name || updateData.fullName;
                updateData.email = userObj.email || updateData.email;
                updateData.phoneNumber = userObj.phone_number || userObj.phoneNumber || userObj.phone || updateData.phoneNumber;
                updateData.address = userObj.address || updateData.address;
            }

            await updateUser(editingUser, updateData);
            setEditingUser(null);
            setEditForm({ password: '', status: '' });
            setEditingUserRole(null);
            await fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditForm({ password: '', status: '' });
        setEditingUserRole(null);
    };

    // Handle close view modal
    const handleCloseView = () => {
        setViewingUser(null);
    };

    // Handle toggle user status
    const handleToggleStatus = async (userId, currentStatus) => {
        const userObj = users.find(u => getUserId(u) === userId);
        const userName = getUserName(userObj);
        setStatusToggleUser({ userId, currentStatus, userName });
    };

    const confirmToggleStatus = async () => {
        if (!statusToggleUser) return;
        
        const { userId, currentStatus, userName } = statusToggleUser;
        const newStatus = currentStatus === 'active' ? false : true;
        const statusText = newStatus ? 'kích hoạt' : 'vô hiệu hóa';
        
        try {
            await updateUserStatus(userId, newStatus);
            await fetchUsers();
            showSuccess(`Đã ${statusText} người dùng "${userName}" thành công!`);
        } catch (error) {
            console.error('[handleToggleStatus] ERROR:', error);
            showError('Lỗi khi cập nhật trạng thái người dùng');
        } finally {
            setStatusToggleUser(null);
        }
    };

    // Handle delete user
    const handleDelete = async (userId, userName) => {
        // Prevent deleting admin accounts
        const userObj = users.find(u => getUserId(u) === userId);
        const role = userObj ? getUserRole(userObj) : null;
        if (role === 'admin') {
            showWarning('Không thể xóa tài khoản admin');
            return;
        }

        setDeleteConfirmUser({ userId, userName });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmUser) return;
        
        const { userId, userName } = deleteConfirmUser;
        try {
            await deleteUser(userId);
            await fetchUsers();
            showSuccess(`Đã xóa người dùng "${userName}" thành công!`);
        } catch (error) {
            console.error('Error deleting user:', error);
            showError('Lỗi khi xóa người dùng');
        } finally {
            setDeleteConfirmUser(null);
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
        clearError();
        try {
            await fetchUsers();
        } catch (error) {
            console.error('Error on retry:', error);
        }
    };

    // Handle refresh
    const handleRefresh = async () => {
        try {
            await fetchUsers({ page: 1, limit: 5 }); // Đảm bảo luôn lấy lại dữ liệu mới nhất, mỗi trang 5 người
        } catch (error) {
            console.error('Error refreshing:', error);
        }
    };

    // Show loading state
    if (!isInitialized || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <div className="text-lg text-gray-600">
                        {!isInitialized ? 'Đang khởi tạo...' : 'Đang tải danh sách người dùng...'}
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="text-center bg-white border border-red-200 rounded-xl p-8 max-w-md shadow-lg">
                    <div className="text-red-600 text-lg mb-4">⚠️ Có lỗi xảy ra</div>
                    <div className="text-red-500 mb-6">{error}</div>
                    <button 
                        onClick={handleRetry}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header with BookFlow branding */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="bg-orange-500 p-3 rounded-lg">
                            <span className="text-white text-xl font-bold">📚</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">BookFlow</h1>
                            <p className="text-gray-600">Quản lý người dùng</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        <span>🔄</span>
                        <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                                <p className="text-gray-600 text-sm">Tổng người dùng</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <span className="text-orange-600 text-xl">👥</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{activeUsers}</p>
                                <p className="text-gray-600 text-sm">Đặt phòng thành công</p>

                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <span className="text-green-600 text-xl">✅</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{inactiveUsers}</p>
                                <p className="text-gray-600 text-sm">Chờ xử lý</p>
                                <p className="text-yellow-500 text-xs font-medium mt-1">↗ 15% tháng này</p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <span className="text-yellow-600 text-xl">⏳</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Main Content Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {/* Search Header (bỏ dropdown lọc vai trò) */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Danh sách khách hàng</h2>
                            <p className="text-sm text-gray-600">
                                Tổng cộng: {totalUsers} người dùng ({totalFilteredUsers} đang hiển thị)
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tên hoặc email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>
                            <div className="w-full sm:w-48">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value);
                                        setCurrentPage(1); // Reset về trang 1
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Tất cả vai trò</option>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="hotel_owner">Hotel Owner</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>
                            <div className="w-full sm:w-48">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1); // Reset về trang 1
                                    }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="active">Hoạt động</option>
                                    <option value="inactive">Không hoạt động</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-x-auto">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">👥</div>
                                <p className="text-gray-500 text-lg mb-4">Không có người dùng nào</p>
                                <button 
                                    onClick={handleRefresh}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    Tải lại
                                </button>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            STT
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Tên
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Vai trò
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user, index) => {
                                        const userId = getUserId(user);
                                        const userName = getUserName(user);
                                        const userRole = getUserRole(user);
                                        const userStatus = getUserStatus(user);
                                        
                                        // Debug log
                                        console.log('Render user row:', { index, userId, userName, userRole, userStatus, user });

                                        return (
                                            <tr key={`${userId}-${index}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                    {pagination && pagination.page && pagination.limit 
                                                        ? (pagination.page - 1) * pagination.limit + index + 1
                                                        : index + 1
                                                    }
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getAvatarColor(userRole)}`}>
                                                            {getInitials(userName)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{userName}</div>
                                                            <div className="text-sm text-gray-500">ID: {userId?.slice(-8) || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                                                        {user.email || 'Chưa có email'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                                        userRole === 'admin' 
                                                            ? 'bg-red-100 text-red-800'
                                                            : userRole === 'hotel_owner'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : userRole === 'staff'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {getRoleDisplay(user)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingUser === userId ? (
                                                        <select
                                                            value={editForm.status}
                                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        >
                                                            <option value="">Chọn trạng thái</option>
                                                            <option value="active">Active</option>
                                                            <option value="inactive">Inactive</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                                            userStatus === 'active' 
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {userStatus === 'active' ? 'Active' : 'Inactive'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <ActionButton
                                                            type="view"
                                                            onClick={() => handleView(user)}
                                                            title="Xem"
                                                            disabled={loading}
                                                        />
                                                        <ActionButton
                                                            type="edit"
                                                            onClick={() => handleEdit(user)}
                                                            title="Sửa"
                                                            disabled={loading}
                                                        />
                                                        <button
                                                            onClick={() => handleToggleStatus(userId, userStatus)}
                                                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                                                userStatus === 'active'
                                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            }`}
                                                            title={userStatus === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                            disabled={loading}
                                                        >
                                                            {userStatus === 'active' ? '🔒 Khóa' : '🔓 Mở'}
                                                        </button>
                                                        {userRole !== 'admin' && (
                                                            <ActionButton
                                                                type="delete"
                                                                onClick={() => handleDelete(userId, userName)}
                                                                title="Xoá"
                                                                disabled={loading}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Client-side Pagination */}
                    {totalFilteredUsers > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span>
                                    Hiển thị {startIndex + 1}-{Math.min(endIndex, totalFilteredUsers)} trong tổng số {totalFilteredUsers} khách hàng
                                </span>
                                <span className="ml-4">Hiển thị:
                                    <select
                                        className="ml-2 px-2 py-1 border rounded"
                                        value={itemsPerPage}
                                        onChange={e => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {[5, 10, 20, 50, 100].map(size => (
                                            <option key={size} value={size}>{size} mục</option>
                                        ))}
                                    </select>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(1)}
                                >
                                    {'<<'}
                                </button>
                                <button
                                    className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                >
                                    Trước
                                </button>
                                {totalPages > 3 && currentPage > 2 && (
                                    <span className="px-2">...</span>
                                )}
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(pageNum => {
                                        if (totalPages <= 3) return true;
                                        if (currentPage === 1) return pageNum <= 3;
                                        if (currentPage === totalPages) return pageNum >= totalPages - 2;
                                        return Math.abs(pageNum - currentPage) <= 1;
                                    })
                                    .map(pageNum => (
                                        <button
                                            key={pageNum}
                                            className={`px-2 py-1 border rounded ${currentPage === pageNum ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                {totalPages > 3 && currentPage < totalPages - 1 && (
                                    <span className="px-2">...</span>
                                )}
                                <button
                                    className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    Tiếp
                                </button>
                                <button
                                    className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                >
                                    {'>>'}
                                </button>
                                <span className="ml-2">Đến trang:</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    value={currentPage}
                                    onChange={e => {
                                        let page = Number(e.target.value);
                                        if (page < 1) page = 1;
                                        if (page > totalPages) page = totalPages;
                                        setCurrentPage(page);
                                    }}
                                    className="w-16 px-2 py-1 border rounded ml-2"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* View User Modal */}
                {viewingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-900">Thông tin khách hàng</h2>
                                    <button
                                        onClick={handleCloseView}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(getUserRole(viewingUser))}`}>
                                        {getInitials(getUserName(viewingUser))}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{getUserName(viewingUser)}</h3>
                                        <p className="text-sm text-gray-500">ID: {getUserId(viewingUser)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                                        <p className="text-gray-900">{viewingUser.username || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <p className="text-gray-900">{viewingUser.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                                        <p className="text-gray-900">{viewingUser.fullName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                        <p className="text-gray-900">{viewingUser.phoneNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                        <p className="text-gray-900">{viewingUser.address || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                            getUserRole(viewingUser) === 'admin' 
                                                ? 'bg-red-100 text-red-800'
                                                : getUserRole(viewingUser) === 'hotel_owner'
                                                ? 'bg-blue-100 text-blue-800'
                                                : getUserRole(viewingUser) === 'staff'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {getRoleDisplay(viewingUser)}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                            getUserStatus(viewingUser) === 'active' 
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {getUserStatus(viewingUser) === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                                        <p className="text-gray-900">{viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={handleCloseView}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa khách hàng</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        value={editForm.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="Nhập mật khẩu mới (để trống nếu không đổi)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    {editingUserRole === 'admin' ? (
                                        <p className="text-sm text-gray-500">Chỉ thay đổi mật khẩu cho tài khoản Admin</p>
                                    ) : (
                                        <select
                                            value={editForm.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="active">Hoạt động</option>
                                            <option value="inactive">Không hoạt động</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={loading}
                                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Đang lưu...' : 'Lưu'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal for Delete */}
                {deleteConfirmUser && (
                    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận xóa</h3>
                            <p className="text-gray-600 mb-6">
                                Bạn có chắc chắn muốn xóa người dùng "<strong>{deleteConfirmUser.userName}</strong>"?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setDeleteConfirmUser(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal for Status Toggle */}
                {statusToggleUser && (
                    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận thay đổi trạng thái</h3>
                            <p className="text-gray-600 mb-6">
                                Bạn có chắc chắn muốn {statusToggleUser.currentStatus === 'active' ? 'vô hiệu hóa' : 'kích hoạt'} người dùng "<strong>{statusToggleUser.userName}</strong>"?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setStatusToggleUser(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={confirmToggleStatus}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={hideToast}
                        duration={toast.duration}
                    />
                )}
            </div>
        </div>
    );
};

export default UserListPage;