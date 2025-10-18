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
    const [searchTerm, setSearchTerm] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

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

    // Filter users: chỉ lấy user có role là "user"
    const filteredUsers = users?.filter(user => {
        const matchesSearch = getUserName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const isUser = getUserRole(user) === 'user';
        return matchesSearch && isUser;
    }) || [];

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

    // Handle edit user
    const handleEdit = (user) => {
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
            await fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditForm({ name: '', email: '', role: '', status: '' });
    };

    // Handle delete user
    const handleDelete = async (userId, userName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}"?`)) {
            try {
                await deleteUser(userId);
                await fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
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
                                Tổng cộng: {totalUsers} người dùng ({filteredUsers.length} đang hiển thị)
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm khách hàng..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>
                            {/* Bỏ dropdown lọc vai trò */}
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
                                                            {editingUser === userId ? (
                                                                <input
                                                                    type="text"
                                                                    value={editForm.name}
                                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                                    className="font-medium text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                                    placeholder="Nhập tên"
                                                                />
                                                            ) : (
                                                                <div className="font-medium text-gray-900">{userName}</div>
                                                            )}
                                                            <div className="text-sm text-gray-500">ID: {userId?.slice(-8) || 'N/A'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingUser === userId ? (
                                                        <input
                                                            type="email"
                                                            value={editForm.email}
                                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                                            className="w-full text-gray-900 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="Nhập email"
                                                        />
                                                    ) : (
                                                        <div className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                                                            {user.email || 'Chưa có email'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {editingUser === userId ? (
                                                        <select
                                                            value={editForm.role}
                                                            onChange={(e) => handleInputChange('role', e.target.value)}
                                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                        >
                                                            <option value="">Chọn vai trò</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="hotel_owner">Hotel Owner</option>
                                                            <option value="customer">Customer</option>
                                                            <option value="staff">Staff</option>
                                                        </select>
                                                    ) : (
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
                                                    )}
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
                                                    {editingUser === userId ? (
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={handleSaveEdit}
                                                                disabled={loading}
                                                                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                {loading ? 'Đang lưu...' : 'Sửa'}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                disabled={loading}
                                                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                Xóa
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
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination && (
                        <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span>
                                    Hiển thị {
                                        pagination && pagination.page && pagination.limit && pagination.total
                                            ? ((pagination.page - 1) * pagination.limit + 1)
                                            : 0
                                    }
                                    -{
                                        pagination && pagination.page && pagination.limit && pagination.total
                                            ? ((pagination.page - 1) * pagination.limit + filteredUsers.length)
                                            : 0
                                    }
                                     trong tổng số {pagination && pagination.total ? pagination.total : 0} khách hàng
                                </span>
                                <span className="ml-4">Hiển thị:
                                    <select
                                        className="ml-2 px-2 py-1 border rounded"
                                        value={pagination.limit}
                                        onChange={e => fetchUsers({ page: 1, limit: Number(e.target.value) })}
                                    >
                                        {[5, 10, 20, 50, 100].map(size => (
                                            <option key={size} value={size}>{size} mục</option>
                                        ))}
                                    </select>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                                    disabled={pagination.page === 1}
                                    onClick={() => fetchUsers({ page: 1, limit: pagination.limit })}
                                >
                                    {'<<'}
                                </button>
                                <button
                                    className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                                    disabled={pagination.page === 1}
                                    onClick={() => fetchUsers({ page: pagination.page - 1, limit: pagination.limit })}
                                >
                                    Trước
                                </button>
                                {/* Hiển thị các nút trang với dấu ... nếu nhiều trang */}
                                {pagination.totalPages > 3 && pagination.page > 2 && (
                                    <span className="px-2">...</span>
                                )}
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                    .filter(pageNum => {
                                        // Chỉ hiện trang hiện tại, trước và sau nó
                                        if (pagination.totalPages <= 3) return true;
                                        if (pagination.page === 1) return pageNum <= 3;
                                        if (pagination.page === pagination.totalPages) return pageNum >= pagination.totalPages - 2;
                                        return Math.abs(pageNum - pagination.page) <= 1;
                                    })
                                    .map(pageNum => (
                                        <button
                                            key={pageNum}
                                            className={`px-2 py-1 border rounded ${pagination.page === pageNum ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                                            onClick={() => fetchUsers({ page: pageNum, limit: pagination.limit })}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                {pagination.totalPages > 3 && pagination.page < pagination.totalPages - 1 && (
                                    <span className="px-2">...</span>
                                )}
                                <button
                                    className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => fetchUsers({ page: pagination.page + 1, limit: pagination.limit })}
                                >
                                    Tiếp
                                </button>
                                <button
                                    className="px-2 py-1 border rounded bg-gray-100 hover:bg-gray-200"
                                    disabled={pagination.page === pagination.totalPages}
                                    onClick={() => fetchUsers({ page: pagination.totalPages, limit: pagination.limit })}
                                >
                                    {'>>'}
                                </button>
                                <span className="ml-2">Đến trang:</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={pagination.totalPages}
                                    value={pagination.page}
                                    onChange={e => {
                                        let page = Number(e.target.value);
                                        if (page < 1) page = 1;
                                        if (page > pagination.totalPages) page = pagination.totalPages;
                                        fetchUsers({ page, limit: pagination.limit });
                                    }}
                                    className="w-16 px-2 py-1 border rounded ml-2"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserListPage;