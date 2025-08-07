import React, { useState, useEffect } from 'react';
import { 
    Users2, Plus, Edit, Trash2, Eye, Search, Filter,
    User, Mail, Phone, MapPin, Calendar, CheckCircle, 
    XCircle, AlertCircle, MoreVertical
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { staffApiService } from '../../../api/staff.service';
import { USER_ROLES } from '../../../config/roles';

const StaffList = () => {
    const { hotelData, fetchOwnerHotel } = useHotelOwner();
    
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    // Load hotel data và staff khi component mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            await fetchOwnerHotel();
        } catch (error) {
            console.error('Error loading hotel data:', error);
        }
    };

    // Load staff khi có hotelData
    useEffect(() => {
        if (hotelData?.hotel_id) {
            loadStaff();
        }
    }, [hotelData]);

    const loadStaff = async () => {
        if (!hotelData?.hotel_id) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await staffApiService.getHotelStaff(hotelData.hotel_id);
            
            // Chỉ lấy nhân viên có roleId 4 hoặc 6
            const filteredStaff = (response.data || response || []).filter(
                staff => staff.roleId === USER_ROLES.HOTEL_MANAGEMENT || staff.roleId === USER_ROLES.HOTEL_STAFF
            );
            
            setStaff(filteredStaff);
        } catch (error) {
            console.error('Error loading staff:', error);
            setError('Không thể tải danh sách nhân viên');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý cập nhật trạng thái nhân viên
    const handleStatusChange = async (staffId, newStatus) => {
        try {
            await staffApiService.updateStaffStatus(staffId, newStatus);
            await loadStaff(); // Reload data
            alert('Cập nhật trạng thái thành công!');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Cập nhật trạng thái thất bại');
        }
    };

    // Xử lý xóa nhân viên
    const handleDeleteStaff = async (staffId) => {
        if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
            return;
        }

        try {
            await staffApiService.deleteStaff(staffId);
            await loadStaff(); // Reload data
            alert('Xóa nhân viên thành công!');
        } catch (error) {
            console.error('Error deleting staff:', error);
            alert('Xóa nhân viên thất bại');
        }
    };

    // Get role name
    const getRoleName = (roleId) => {
        switch (roleId) {
            case USER_ROLES.HOTEL_MANAGEMENT:
                return 'Quản lý';
            case USER_ROLES.HOTEL_STAFF:
                return 'Nhân viên';
            default:
                return 'Không xác định';
        }
    };

    // Get role color
    const getRoleColor = (roleId) => {
        switch (roleId) {
            case USER_ROLES.HOTEL_MANAGEMENT:
                return 'bg-purple-100 text-purple-800';
            case USER_ROLES.HOTEL_STAFF:
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Filter staff based on search and filters
    const filteredStaff = staff.filter(member => {
        const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            member.phone?.includes(searchTerm);
        
        const matchesRole = roleFilter === 'all' || member.roleId.toString() === roleFilter;
        const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
    });

    if (!hotelData) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                    <Users2 size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chưa có khách sạn
                    </h3>
                    <p className="text-gray-600">
                        Bạn cần tạo thông tin khách sạn trước khi quản lý nhân viên
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
                        <Users2 size={24} className="text-blue-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-900">Danh sách nhân viên</h1>
                    </div>
                    
                    <button 
                        onClick={() => window.location.href = '/hotel-owner/staff/add'}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={16} className="mr-2 inline" />
                        Thêm nhân viên
                    </button>
                </div>

                {/* Hotel info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{hotelData.name}</h3>
                    <p className="text-gray-600">{hotelData.address}, {hotelData.city}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên, email, số điện thoại..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Role filter */}
                    <div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả chức vụ</option>
                            <option value={USER_ROLES.HOTEL_MANAGEMENT}>Quản lý</option>
                            <option value={USER_ROLES.HOTEL_STAFF}>Nhân viên</option>
                        </select>
                    </div>

                    {/* Status filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Tạm dừng</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users2 size={24} className="text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Tổng nhân viên</h3>
                            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Đang hoạt động</h3>
                            <p className="text-2xl font-bold text-gray-900">
                                {staff.filter(s => s.status === 'active').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <User size={24} className="text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-sm font-medium text-gray-500">Quản lý</h3>
                            <p className="text-2xl font-bold text-gray-900">
                                {staff.filter(s => s.roleId === USER_ROLES.HOTEL_MANAGEMENT).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Đang tải danh sách nhân viên...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                        <p className="text-red-600">{error}</p>
                        <button 
                            onClick={loadStaff}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users2 size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Chưa có nhân viên nào
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                                ? 'Không tìm thấy nhân viên phù hợp với bộ lọc'
                                : 'Thêm nhân viên đầu tiên cho khách sạn của bạn'
                            }
                        </p>
                        <button 
                            onClick={() => window.location.href = '/hotel-owner/staff/add'}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={16} className="mr-2 inline" />
                            Thêm nhân viên
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nhân viên
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Chức vụ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Liên hệ
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tham gia
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStaff.map((member) => (
                                    <tr key={member.id || member._id} className="hover:bg-gray-50">
                                        {/* Staff Info */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <User size={16} className="text-white" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {member.name || member.full_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {member.id || member._id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.roleId)}`}>
                                                {getRoleName(member.roleId)}
                                            </span>
                                        </td>

                                        {/* Contact */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div className="flex items-center">
                                                    <Mail size={14} className="mr-1 text-gray-400" />
                                                    {member.email}
                                                </div>
                                                {member.phone && (
                                                    <div className="flex items-center mt-1">
                                                        <Phone size={14} className="mr-1 text-gray-400" />
                                                        {member.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={member.status || 'active'}
                                                onChange={(e) => handleStatusChange(member.id || member._id, e.target.value)}
                                                className={`text-sm rounded-full px-3 py-1 font-medium border-0 ${
                                                    member.status === 'active' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                <option value="active">Hoạt động</option>
                                                <option value="inactive">Tạm dừng</option>
                                            </select>
                                        </td>

                                        {/* Join Date */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar size={14} className="mr-1 text-gray-400" />
                                                {member.created_at ? new Date(member.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStaff(member);
                                                        setShowDetails(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                
                                                <button
                                                    onClick={() => window.location.href = `/hotel-owner/staff/edit/${member.id || member._id}`}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleDeleteStaff(member.id || member._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Staff Details Modal */}
            {showDetails && selectedStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Chi tiết nhân viên</h3>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                                <p className="text-gray-900">{selectedStaff.name || selectedStaff.full_name}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">Email</label>
                                <p className="text-gray-900">{selectedStaff.email}</p>
                            </div>
                            
                            {selectedStaff.phone && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                                    <p className="text-gray-900">{selectedStaff.phone}</p>
                                </div>
                            )}
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">Chức vụ</label>
                                <p className="text-gray-900">{getRoleName(selectedStaff.roleId)}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                                <p className={selectedStaff.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                                    {selectedStaff.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                                </p>
                            </div>
                            
                            {selectedStaff.created_at && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Ngày tham gia</label>
                                    <p className="text-gray-900">
                                        {new Date(selectedStaff.created_at).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetails(false);
                                    window.location.href = `/hotel-owner/staff/edit/${selectedStaff.id || selectedStaff._id}`;
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Chỉnh sửa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffList;