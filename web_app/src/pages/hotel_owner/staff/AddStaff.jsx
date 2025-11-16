import React, { useState, useEffect } from 'react';
import { 
    Users2, User, Mail, Phone, MapPin, Key, Calendar, 
    Save, ArrowLeft, Eye, EyeOff, Briefcase, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import useAuth  from '../../../hooks/useAuth';
import { staffApiService } from '../../../api/staff.service';
import { USER_ROLES } from '../../../config/roles';
import { API_ENDPOINTS } from '../../../config/apiEndpoints';

const AddStaff = () => {
    const navigate = useNavigate();
    const { hotelData, fetchOwnerHotel } = useHotelOwner();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null); // Add hotel selection
    
    const [formData, setFormData] = useState({
        // User data
        email: '',
        password: '',
        full_name: '',
        phone: '',
        address: '',
        confirmPassword: '',
        // Staff data  
        position: 'Staff',
        start_date: new Date().toISOString().split('T')[0]
    });
    
    const [errors, setErrors] = useState({});

    const location = typeof window !== 'undefined' ? require('react-router-dom').useLocation() : {};
    useEffect(() => {
        fetchOwnerHotel();
    }, []);

    // Set default hotel when hotelData is available
    useEffect(() => {
        // Ưu tiên lấy selectedHotel từ location.state nếu có
        if (location && location.state && location.state.selectedHotel) {
            setSelectedHotel(location.state.selectedHotel);
        } else if (hotelData && Array.isArray(hotelData) && hotelData.length > 0) {
            // Nếu không có thì lấy hotel đầu tiên
            if (!selectedHotel) {
                const firstHotel = hotelData[0];
                setSelectedHotel(firstHotel);
            }
        }
    }, [hotelData, location]);

    // Enhanced user ID detection with better fallbacks
    const getCurrentUserId = () => {
        // Try multiple possible user ID fields
        const possibleIds = [
            user?.id,
            user?.user_id, 
            user?.userId,
            selectedHotel?.owner_id,
            selectedHotel?.user_id,
            selectedHotel?.created_by,
            selectedHotel?.ownerId
        ];
        
        // Return the first valid UUID we find
        for (const id of possibleIds) {
            if (id && isValidUUID(id)) {
                return id;
            }
        }
        
        return null;
    };

    // Enhanced hotel ID detection
    const getHotelId = () => {
        const possibleIds = [
            selectedHotel?.hotel_id,
            selectedHotel?.id,
            selectedHotel?.hotelId
        ];
        
        for (const id of possibleIds) {
            if (id && isValidUUID(id)) {
                return id;
            }
        }
        
        return null;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate hotel selection
        if (!selectedHotel) {
            newErrors.hotel = 'Vui lòng chọn khách sạn';
        }

        // Validate user fields
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

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }

        // Validate staff fields
        if (!formData.position.trim()) {
            newErrors.position = 'Vui lòng nhập vị trí công việc';
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Vui lòng chọn ngày bắt đầu';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // UUID validation helper
    const isValidUUID = (str) => {
        if (!str) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const hotelId = getHotelId();
        const currentUserId = getCurrentUserId();
        
        // Enhanced validation with user-friendly messages
        if (!hotelId) {
            alert('Không tìm thấy thông tin khách sạn. Vui lòng chọn khách sạn.');
            return;
        }

        if (!currentUserId) {
            alert('Không tìm thấy thông tin người dùng hiện tại. Vui lòng đăng nhập lại.');
            return;
        }

        if (!isValidUUID(currentUserId)) {
            alert('ID người dùng không hợp lệ. Vui lòng đăng nhập lại.');
            return;
        }

        if (!isValidUUID(hotelId)) {
            alert('ID khách sạn không hợp lệ. Vui lòng liên hệ hỗ trợ.');
            return;
        }

        try {
            setLoading(true);
            
            const staffData = {
                // User data (matching users table)
                username: formData.email,
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
                phone_number: formData.phone,
                address: formData.address || '', // Provide empty string for optional field
                role_id: USER_ROLES.HOTEL_STAFF || 6,

                // Staff data with correct field names
                hotel_id: hotelId,
                job_position: formData.position,
                start_date: formData.start_date,
                contact: formData.phone,
                hired_by: currentUserId
            };
            
            // Try multiple API methods with better error handling
            let success = false;
            let lastError = null;
            
            // Method 1: Try createStaff
            try {
                await staffApiService.createStaff(hotelId, staffData);
                success = true;
            } catch (error) {
                lastError = error;
                
                // Method 2: Try addStaff as fallback
                if (error.response?.status === 404 || error.response?.status === 405) {
                    try {
                        await staffApiService.addStaff(hotelId, staffData);
                        success = true;
                    } catch (fallbackError) {
                        lastError = fallbackError;
                    }
                }
            }
            
            if (!success) {
                throw lastError;
            }
            
            alert(`Thêm nhân viên thành công!\n\nNhân viên ${formData.full_name} đã được thêm vào khách sạn ${selectedHotel.name}.`);
            navigate('/hotel-owner/staff/list');
        } catch (error) {
            // Enhanced error messages
            let errorMessage = 'Thêm nhân viên thất bại';
            
            if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || 'Dữ liệu gửi lên không hợp lệ';
            } else if (error.response?.status === 401) {
                errorMessage = 'Bạn không có quyền thực hiện thao tác này';
            } else if (error.response?.status === 403) {
                errorMessage = 'Truy cập bị từ chối';
            } else if (error.response?.status === 404) {
                errorMessage = 'Không tìm thấy API endpoint';
            } else if (error.response?.status === 500) {
                errorMessage = 'Lỗi máy chủ nội bộ';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert('Lỗi: ' + errorMessage);
        } finally {
            setLoading(false);
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

    if (!hotelData || !Array.isArray(hotelData) || hotelData.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                    <Users2 size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chưa có khách sạn
                    </h3>
                    <p className="text-gray-600">
                        Bạn cần tạo thông tin khách sạn trước khi thêm nhân viên
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
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
                        <h1 className="text-2xl font-bold text-gray-900">Thêm nhân viên mới</h1>
                    </div>
                </div>

                {/* Hotel Selection */}
                {hotelData.length > 1 && !selectedHotel && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn khách sạn: *
                        </label>
                        <div className="relative">
                            <select
                                value={selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id || ''}
                                onChange={(e) => {
                                    const hotel = hotelData.find(h => 
                                        (h.hotelId || h.hotel_id || h.id || h._id) === e.target.value
                                    );
                                    setSelectedHotel(hotel);
                                    // Clear hotel validation error if one was selected
                                    if (errors.hotel && hotel) {
                                        setErrors(prev => ({ ...prev, hotel: '' }));
                                    }
                                }}
                                className={`w-full md:w-auto px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 ${
                                    errors.hotel ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">-- Chọn khách sạn --</option>
                                {hotelData.map((hotel) => {
                                    const hotelId = hotel.hotelId || hotel.hotel_id || hotel.id || hotel._id;
                                    return (
                                        <option key={hotelId} value={hotelId}>
                                            {hotel.name} - {hotel.address}
                                        </option>
                                    );
                                })}
                            </select>
                            <ChevronDown size={16} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.hotel && <p className="text-red-500 text-sm mt-1">{errors.hotel}</p>}
                    </div>
                )}

                {/* Selected Hotel info */}
                {selectedHotel && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-1">{selectedHotel.name}</h3>
                        <p className="text-gray-600 text-sm">{selectedHotel.address}, {selectedHotel.city}</p>
                    </div>
                )}

                {/* Single hotel info (when only one hotel) */}
                {hotelData.length === 1 && selectedHotel && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{selectedHotel.name}</h3>
                                <p className="text-gray-600 text-sm">{selectedHotel.address}, {selectedHotel.city}</p>
                            </div>
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                Khách sạn duy nhất
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow">
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Thông tin tài khoản */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <User size={20} className="mr-2 text-blue-600" />
                            Thông tin tài khoản
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
                                    Email đăng nhập *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập email để đăng nhập"
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
                                    Địa chỉ thường trú
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

                    {/* Thông tin công việc */}
                    <div>
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
                                    value="Staff"
                                    readOnly
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Vị trí công việc cố định là Staff</p>
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
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Key size={20} className="mr-2 text-orange-600" />
                            Mật khẩu đăng nhập
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mật khẩu *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                            errors.password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
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
                                    Xác nhận mật khẩu *
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập lại mật khẩu để xác nhận"
                                />
                                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                            </div>
                        </div>
                    </div>



                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate('/hotel-owner/staff/list')}
                            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Đang thêm...
                                </>
                            ) : (
                                <>
                                    <Save size={16} className="mr-2" />
                                    Thêm nhân viên
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStaff;