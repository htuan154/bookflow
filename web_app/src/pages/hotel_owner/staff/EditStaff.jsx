import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Users2, User, Mail, Phone, MapPin, Key, Calendar, 
    Save, ArrowLeft, Eye, EyeOff, Briefcase, AlertCircle
} from 'lucide-react';
import { staffApiService } from '../../../api/staff.service';
import userService from '../../../api/user.service';

const EditStaff = () => {
    const { staffId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [staffData, setStaffData] = useState(null);
    const [formData, setFormData] = useState({
        // User data
        full_name: '',
        email: '',
        phone: '',
        address: '',
        // Staff data
        position: '',
        start_date: '',
        end_date: '',
        contact: '',
        status: 'active',
        // Password (optional)
        password: '',
        confirmPassword: ''
    });
    
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadStaffData();
    }, [staffId]);

    const loadStaffData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Loading staff data for ID:', staffId);

            // Load staff info
            const staffResponse = await staffApiService.getStaffById(staffId);
            console.log('Staff response:', staffResponse);
            
            // Handle nested response: {status, message, data: {staff, user}}
            const responseData = staffResponse.data || staffResponse;
            console.log('Response data:', responseData);
            
            // Check if response has nested staff object
            const staff = responseData.staff || responseData;
            console.log('Staff data:', staff);
            setStaffData(staff);

            // Get user data from response or fetch separately
            let userData = null;
            if (responseData.user) {
                console.log('User data from response:', responseData.user);
                userData = responseData.user;
            } else {
                // Load user info separately
                const userId = staff.userId || staff.user_id;
                console.log('User ID to fetch:', userId);
                
                if (userId) {
                    try {
                        const userResponse = await userService.getUserById(userId);
                        console.log('User response:', userResponse);
                        
                        userData = userResponse.data || userResponse;
                        console.log('User data:', userData);
                    } catch (userError) {
                        console.error('Error loading user data:', userError);
                    }
                } else {
                    console.warn('No user ID found in staff data');
                }
            }

            // Populate form
            const startDateValue = staff.startDate || staff.start_date;
            const formattedStartDate = startDateValue ? new Date(startDateValue).toISOString().split('T')[0] : '';
            
            const endDateValue = staff.endDate || staff.end_date;
            const formattedEndDate = endDateValue ? new Date(endDateValue).toISOString().split('T')[0] : '';
            
            const isHotelOwner = (staff.jobPosition || staff.position) === 'Hotel_owner';
            const populatedData = {
                full_name: userData?.fullName || userData?.full_name || '',
                email: userData?.email || '',
                phone: userData?.phoneNumber || userData?.phone_number || userData?.phone || '',
                address: userData?.address || '',
                position: isHotelOwner ? 'Hotel_owner' : 'Staff',
                start_date: formattedStartDate,
                end_date: formattedEndDate,
                contact: staff.contact || '',
                status: staff.status || 'active',
                password: '',
                confirmPassword: ''
            };
            
            console.log('Form data to populate:', populatedData);
            setFormData(populatedData);

        } catch (error) {
            console.error('Error loading staff data:', error);
            setError('Không thể tải thông tin nhân viên: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            
            // Auto-fill end_date when status is terminated
            if (field === 'status' && value === 'terminated') {
                newData.end_date = new Date().toISOString().split('T')[0];
            }
            
            return newData;
        });
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Vui lòng nhập họ tên';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s+/g, ''))) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        if (!formData.position.trim()) {
            newErrors.position = 'Vui lòng nhập vị trí công việc';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Vui lòng chọn ngày bắt đầu';
        }

        // Validate password if provided
        if (formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);

            // Update staff information
            const staffUpdateData = {
                job_position: formData.position,
                start_date: formData.start_date,
                contact: formData.contact,
                status: formData.status
            };
            // Add end_date if status is terminated
            if (formData.status === 'terminated' && formData.end_date) {
                staffUpdateData.end_date = formData.end_date;
            }
            await staffApiService.updateStaff(staffId, staffUpdateData);

            // Update user information
            if (staffData.userId || staffData.user_id) {
                // Always fetch current user info to preserve username
                let currentUser = null;
                try {
                    const userResp = await userService.getUserById(staffData.userId || staffData.user_id);
                    currentUser = userResp.data || userResp;
                } catch (e) {
                    // fallback: do not set username
                }
                const userUpdateData = {
                    fullName: formData.full_name,
                    email: formData.email,
                    phoneNumber: formData.phone,
                    address: formData.address
                };
                // Preserve username if backend requires it
                if (currentUser && currentUser.username) {
                    userUpdateData.username = currentUser.username;
                }
                // Add password if provided
                if (formData.password) {
                    userUpdateData.password = formData.password;
                }
                await userService.updateUser(staffData.userId || staffData.user_id, userUpdateData);
            }

            alert('Cập nhật thông tin nhân viên thành công!');
            navigate('/hotel-owner/staff/list');
        } catch (error) {
            console.error('Error updating staff:', error);
            alert('Cập nhật thông tin thất bại: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
        let password = '';
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({
            ...prev,
            password,
            confirmPassword: password
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/hotel-owner/staff/list')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/hotel-owner/staff/list')}
                            className="mr-4 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <Users2 size={24} className="text-blue-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa nhân viên</h1>
                    </div>
                </div>

                {staffData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <span className="font-semibold">Staff ID:</span> {staffData.staffId || staffData.staff_id || staffData.id}
                        </p>
                        <p className="text-sm text-blue-900 mt-1">
                            <span className="font-semibold">User ID:</span> {staffData.userId || staffData.user_id}
                        </p>
                    </div>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <User size={20} className="mr-2 text-blue-600" />
                        Thông tin cá nhân
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Họ và tên *
                            </label>
                            <input
                                type="text"
                                value={formData.full_name}
                                onChange={(e) => handleInputChange('full_name', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nhập họ và tên đầy đủ"
                            />
                            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Nhập email"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Số điện thoại *
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                    errors.phone ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0901234567"
                            />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Địa chỉ
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                placeholder="Nhập địa chỉ thường trú"
                            />
                        </div>
                    </div>
                </div>

                {/* Job Information */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Briefcase size={20} className="mr-2 text-green-600" />
                        Thông tin công việc
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Position */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vị trí công việc *
                            </label>
                            <input
                                type="text"
                                value={formData.position === 'Hotel_owner' ? 'Hotel_owner' : 'Staff'}
                                readOnly
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.position === 'Hotel_owner' ? 'Vị trí công việc cố định là Hotel_owner' : 'Vị trí công việc cố định là Staff'}
                            </p>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ngày bắt đầu làm việc *
                            </label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => handleInputChange('start_date', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                    errors.start_date ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                        </div>

                        {/* Contact */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Liên hệ
                            </label>
                            <input
                                type="text"
                                value={formData.contact}
                                onChange={(e) => handleInputChange('contact', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                placeholder="Email hoặc số điện thoại liên hệ"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái *
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                disabled={(staffData?.jobPosition || staffData?.position || '').toLowerCase() === 'hotel_owner'}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                    (staffData?.jobPosition || staffData?.position || '').toLowerCase() === 'hotel_owner' ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                            >
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Tạm dừng</option>
                                <option value="suspended">Đình chỉ</option>
                                <option value="terminated">Đã nghỉ việc</option>
                            </select>
                            {(staffData?.jobPosition || staffData?.position || '').toLowerCase() === 'hotel_owner' && (
                                <p className="text-xs text-gray-500 mt-1">Không thể thay đổi trạng thái của Hotel Owner</p>
                            )}
                        </div>
                        
                        {/* End Date - Show when status is terminated */}
                        {formData.status === 'terminated' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ngày kết thúc *
                                </label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                                <p className="text-xs text-gray-500 mt-1">Ngày kết thúc được điền tự động</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Password Change (Optional) */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                        <Key size={20} className="mr-2 text-orange-600" />
                        Đổi mật khẩu (tùy chọn)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">Chỉ điền nếu muốn thay đổi mật khẩu</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                        errors.password ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="text-blue-600 text-sm mt-1 hover:underline"
                            >
                                Tạo mật khẩu tự động
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Xác nhận mật khẩu mới
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/hotel-owner/staff/list')}
                        className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                Lưu thay đổi
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditStaff;