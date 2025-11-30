import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Users2, User, Mail, Phone, MapPin, Calendar, CheckCircle, 
    XCircle, AlertCircle, ArrowLeft, Edit, Briefcase, Shield
} from 'lucide-react';
import { staffApiService } from '../../../api/staff.service';
import userService from '../../../api/user.service';

const StaffDetail = () => {
    const { staffId } = useParams();
    const navigate = useNavigate();
    
    const [staffData, setStaffData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStaffDetail();
    }, [staffId]);

    const loadStaffDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Loading staff detail for ID:', staffId);

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

            // Check if user data is already in response
            if (responseData.user) {
                console.log('User data from response:', responseData.user);
                setUserData(responseData.user);
            } else {
                // Load user info separately using userId from staff
                const userId = staff.userId || staff.user_id;
                console.log('User ID to fetch:', userId);
                
                if (userId) {
                    try {
                        const userResponse = await userService.getUserById(userId);
                        console.log('User response:', userResponse);
                        
                        const user = userResponse.data || userResponse;
                        console.log('User data:', user);
                        setUserData(user);
                    } catch (userError) {
                        console.error('Error loading user data:', userError);
                        // Continue even if user data fails
                    }
                } else {
                    console.warn('No user ID found in staff data');
                }
            }
        } catch (error) {
            console.error('Error loading staff detail:', error);
            setError('Không thể tải thông tin nhân viên: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-orange-100 text-orange-800';
            case 'terminated': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return '🟢 Hoạt động';
            case 'inactive': return '🟡 Tạm dừng';
            case 'suspended': return '🟠 Đình chỉ';
            case 'terminated': return '🔴 Đã nghỉ việc';
            default: return 'Không xác định';
        }
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

    if (!staffData) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <Users2 size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy nhân viên</h3>
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
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <User size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Chi tiết nhân viên</h1>
                            <p className="text-sm text-gray-500">ID: {staffData.staffId || staffData.staff_id || staffData.id}</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => navigate(`/hotel-owner/staff/edit/${staffId}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Edit size={16} className="mr-2" />
                        Chỉnh sửa
                    </button>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-center">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(staffData.status)}`}>
                        {getStatusText(staffData.status)}
                    </span>
                </div>
            </div>

            {/* User Information */}
            {userData && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <User size={20} className="mr-2 text-blue-600" />
                        Thông tin cá nhân
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                            <p className="text-base text-gray-900 mt-1">{userData.fullName || userData.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-base text-gray-900 mt-1 flex items-center">
                                <Mail size={16} className="mr-2 text-gray-400" />
                                {userData.email || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                            <p className="text-base text-gray-900 mt-1 flex items-center">
                                <Phone size={16} className="mr-2 text-gray-400" />
                                {userData.phoneNumber || userData.phone_number || userData.phone || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                            <p className="text-base text-gray-900 mt-1 flex items-center">
                                <MapPin size={16} className="mr-2 text-gray-400" />
                                {userData.address || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Vai trò</label>
                            <p className="text-base text-gray-900 mt-1 flex items-center">
                                <Shield size={16} className="mr-2 text-gray-400" />
                                {userData.role_name || userData.roleName || userData.role || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Tên đăng nhập</label>
                            <p className="text-base text-gray-900 mt-1 font-mono">{userData.username || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Job Information */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Briefcase size={20} className="mr-2 text-green-600" />
                    Thông tin công việc
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Vị trí công việc</label>
                        <p className="text-base text-gray-900 mt-1">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {staffData.jobPosition || staffData.position || 'Không xác định'}
                            </span>
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Ngày bắt đầu làm việc</label>
                        <p className="text-base text-gray-900 mt-1 flex items-center">
                            <Calendar size={16} className="mr-2 text-gray-400" />
                            {staffData.startDate || staffData.start_date ? 
                                new Date(staffData.startDate || staffData.start_date).toLocaleDateString('vi-VN') : 
                                'N/A'
                            }
                        </p>
                    </div>
                    {(staffData.endDate || staffData.end_date) && (
                        <div>
                            <label className="text-sm font-medium text-gray-500">Ngày kết thúc</label>
                            <p className="text-base text-gray-900 mt-1 flex items-center">
                                <Calendar size={16} className="mr-2 text-gray-400" />
                                {new Date(staffData.endDate || staffData.end_date).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-gray-500">Liên hệ</label>
                        <p className="text-base text-gray-900 mt-1 flex items-center">
                            <Phone size={16} className="mr-2 text-gray-400" />
                            {staffData.contact || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hệ thống</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Staff ID</label>
                        <p className="text-base text-gray-900 mt-1 font-mono text-sm">
                            {staffData.staffId || staffData.staff_id || staffData.id}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">User ID</label>
                        <p className="text-base text-gray-900 mt-1 font-mono text-sm">
                            {staffData.userId || staffData.user_id}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Hotel ID</label>
                        <p className="text-base text-gray-900 mt-1 font-mono text-sm">
                            {staffData.hotelId || staffData.hotel_id}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                        <p className="text-base text-gray-900 mt-1">
                            {staffData.createdAt ? 
                                new Date(staffData.createdAt).toLocaleString('vi-VN') : 
                                'N/A'
                            }
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-500">Được tuyển bởi</label>
                        <p className="text-base text-gray-900 mt-1 font-mono text-sm">
                            {staffData.hiredBy || staffData.hired_by || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
                <button
                    onClick={() => navigate('/hotel-owner/staff/list')}
                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Quay lại
                </button>
                <button
                    onClick={() => navigate(`/hotel-owner/staff/edit/${staffId}`)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Edit size={16} className="mr-2" />
                    Chỉnh sửa
                </button>
            </div>
        </div>
    );
};

export default StaffDetail;