// src/components/customer/CustomerModal.js
import React, { useState, useEffect } from 'react';

const CustomerModal = ({ customer, mode, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        password: '', // Thêm password cho chế độ create
        phone: '',
        address: '',
        cre: 'active'
    });

    const [isEditing, setIsEditing] = useState(mode === 'edit' || mode === 'create');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (mode === 'create') {
            // Reset form khi tạo mới
            setFormData({
                fullName: '',
                email: '',
                username: '',
                password: '',
                phone: '',
                address: '',
                status: 'active'
            });
            setIsEditing(true);
        } else if (customer) {
            // Load dữ liệu khi view/edit
            setFormData({
                fullName: customer.fullName || '',
                email: customer.email || '',
                username: customer.username || '',
                password: '', // Không hiển thị password cũ
                phone: customer.phoneNumber || '',
                address: customer.address || '',
                status: customer.status || 'active'
            });
            setIsEditing(mode === 'edit');
        }
        console.log('Customer data:', customer);
        console.log('Mode:', mode);
        console.log('Phone from customer:', customer?.phone);
        console.log('Address from customer:', customer?.address);
    }, [customer, mode]);

    useEffect(() => {
    console.log('FormData updated:', formData);
}, [formData]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error khi user nhập lại
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ và tên';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Vui lòng nhập tên đăng nhập';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }

        // Validate password chỉ khi tạo mới
        if (mode === 'create') {
            if (!formData.password.trim()) {
                newErrors.password = 'Vui lòng nhập mật khẩu';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            }
        }

        if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) {
            return;
        }
        
        // Chuẩn bị dữ liệu để gửi
        const saveData = { ...formData };
        
        // Chỉ xóa password khi edit (không phải create)
        if (mode !== 'create') {
            delete saveData.password;
        }
        
        // Chuyển đổi trường phone thành phoneNumber để khớp với backend
        if (saveData.phone) {
            saveData.phoneNumber = saveData.phone;
            delete saveData.phone;
        }
        
        // Đảm bảo các trường bắt buộc có giá trị
        if (!saveData.phoneNumber && formData.phone) {
            saveData.phoneNumber = formData.phone;
        }
        if (!saveData.address && formData.address) {
            saveData.address = formData.address;
        }
        
        // Debug: log dữ liệu gửi về server
        console.log('CustomerModal - Data gửi về server:', saveData);
        console.log('CustomerModal - FormData hiện tại:', formData);
        
        onSave(saveData);
    };

    const handleToggleEdit = () => {
        if (mode === 'create') return; // Không cho toggle trong chế độ create
        setIsEditing(!isEditing);
        setErrors({}); // Clear errors khi toggle
    };

    // Xử lý khi mode là create nhưng không có customer
    const displayCustomer = mode === 'create' ? {
        userId: 'NEW',
        fullName: 'Chủ khách sạn mới',
        status: 'active'
    } : customer;

    if (!displayCustomer) return null;

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa có';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status info
    const getStatusInfo = (status) => {
        switch (status) {
            case 'active':
                return {
                    text: 'Hoạt động',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    icon: '✅'
                };
            case 'inactive':
                return {
                    text: 'Tạm khóa',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    icon: '🔒'
                };
            default:
                return {
                    text: 'Không xác định',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    icon: '❓'
                };
        }
    };

    const statusInfo = getStatusInfo(formData.status);

    // Get modal title based on mode
    const getModalTitle = () => {
        switch (mode) {
            case 'create':
                return 'Thêm chủ khách sạn mới';
            case 'edit':
                return 'Chỉnh sửa thông tin';
            default:
                return 'Thông tin chủ khách sạn';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] overflow-hidden mx-auto flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 sm:px-8 py-4 sm:py-6 text-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {/* Avatar */}
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                                {mode === 'create' ? '➕' : (displayCustomer.fullName?.charAt(0)?.toUpperCase() || 'H')}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {getModalTitle()}
                                </h2>
                                <p className="text-orange-100 text-sm">
                                    {mode === 'create' ? 'Tạo tài khoản mới' : `ID: ${displayCustomer.userId}`}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {/* Status Badge */}
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                                <span className="mr-1">{statusInfo.icon}</span>
                                {statusInfo.text}
                            </div>
                            
                            {/* Edit Button - chỉ hiện khi không phải create */}
                            {!isEditing && mode !== 'create' && (
                                <button
                                    onClick={handleToggleEdit}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    ✏️ Chỉnh sửa
                                </button>
                            )}
                            
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="text-white hover:text-red-200 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Personal Info */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                        👤
                                    </span>
                                    Thông tin cá nhân
                                </h3>
                                
                                <div className="space-y-4">
                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={formData.fullName}
                                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                                        errors.fullName ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Nhập họ và tên"
                                                />
                                                {errors.fullName && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg">
                                                <span className="text-gray-900 font-medium">
                                                    {displayCustomer.fullName || 'Chưa có thông tin'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Nhập email"
                                                />
                                                {errors.email && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg flex items-center">
                                                <span className="text-blue-600 mr-2">📧</span>
                                                <span className="text-gray-900">
                                                    {displayCustomer.email || 'Chưa có email'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Username */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tên đăng nhập <span className="text-red-500">*</span>
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                                        errors.username ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Nhập tên đăng nhập"
                                                    disabled={mode === 'edit'} // Không cho sửa username khi edit
                                                />
                                                {errors.username && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                                                )}
                                                {mode === 'edit' && (
                                                    <p className="text-gray-500 text-xs mt-1">Không thể thay đổi tên đăng nhập</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg flex items-center">
                                                <span className="text-gray-600 mr-2">@</span>
                                                <span className="text-gray-900 font-mono">
                                                    {displayCustomer.username || 'Chưa có username'}
                                                </span>
                                                <span className="ml-auto text-xs text-gray-500">Không thể thay đổi</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Password - chỉ hiện khi create */}
                                    {mode === 'create' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mật khẩu <span className="text-red-500">*</span>
                                            </label>
                                            <div>
                                                <input
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                                        errors.password ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                                                />
                                                {errors.password && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số điện thoại
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                                        errors.phone ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Nhập số điện thoại"
                                                />
                                                {errors.phone && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg flex items-center">
                                                <span className="text-green-600 mr-2">📱</span>
                                                <span className="text-gray-900">
                                                    {displayCustomer.phoneNumber || 'Chưa có số điện thoại'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - System Info */}
                        <div className="space-y-6">
                            {/* Role Info */}
                            <div className="bg-purple-50 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                        🏨
                                    </span>
                                    Vai trò & Quyền hạn
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Vai trò</span>
        
                                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                                            value={formData.roleId == 2}>
                                                🏨 Chủ khách sạn
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Quyền truy cập</span>
                                            <span className="text-sm text-gray-900 font-medium">
                                                Quản lý khách sạn & đơn đặt
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Control */}
                                    {isEditing && (
                                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Trạng thái tài khoản
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => handleInputChange('status', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                <option value="active">✅ Hoạt động</option>
                                                <option value="inactive">🔒 Không hoạt động</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* System Info - chỉ hiện khi không phải create */}
                            {mode !== 'create' && (
                                <div className="bg-green-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                                            📊
                                        </span>
                                        Thông tin hệ thống
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-gray-600">Ngày tạo tài khoản</span>
                                            <span className="text-sm text-gray-900 font-medium">
                                                {formatDate(displayCustomer.createdAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-gray-600">Cập nhật lần cuối</span>
                                            <span className="text-sm text-gray-900 font-medium">
                                                {formatDate(displayCustomer.updatedAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-gray-600">Số khách sạn</span>
                                            <span className="text-sm text-gray-900 font-medium">
                                                {displayCustomer.hotelCount || 0}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-gray-600">Tổng đơn đặt</span>
                                            <span className="text-sm text-gray-900 font-medium">
                                                {displayCustomer.totalBookings || 0}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-gray-600">Doanh thu</span>
                                            <span className="text-sm text-green-600 font-medium">
                                                {displayCustomer.totalRevenue ? `${displayCustomer.totalRevenue.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hướng dẫn khi create */}
                            {mode === 'create' && (
                                <div className="bg-blue-50 rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                            💡
                                        </span>
                                        Hướng dẫn
                                    </h3>
                                    
                                    <div className="space-y-3 text-sm text-gray-700">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600">•</span>
                                            <span>Các trường có dấu (*) là bắt buộc</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600">•</span>
                                            <span>Tên đăng nhập phải duy nhất trong hệ thống</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600">•</span>
                                            <span>Mật khẩu tối thiểu 6 ký tự</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600">•</span>
                                            <span>Tài khoản sẽ được tạo với vai trò "Chủ khách sạn"</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address Section */}
                    {(displayCustomer.address || isEditing) && (
                        <div className="mt-8 bg-orange-50 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                    📍
                                </span>
                                Địa chỉ
                            </h3>
                            
                            {isEditing ? (
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    rows="3"
                                    placeholder="Nhập địa chỉ"
                                />
                            ) : (
                                <div className="px-4 py-3 bg-white border border-orange-200 rounded-lg">
                                    <span className="text-gray-900">
                                        {displayCustomer.address || 'Chưa có địa chỉ'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 sm:px-8 py-4 flex items-center justify-between border-t border-gray-200 flex-shrink-0">
                    <div className="text-sm text-gray-500">
                        {mode === 'create' ? 'Điền thông tin để tạo tài khoản mới' : 
                         isEditing ? 'Thực hiện thay đổi thông tin' : 'Xem thông tin chi tiết'}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={mode === 'create' ? onClose : () => setIsEditing(false)}
                                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {mode === 'create' ? 'Hủy' : 'Hủy chỉnh sửa'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                                >
                                    💾 {mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Đóng
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerModal;