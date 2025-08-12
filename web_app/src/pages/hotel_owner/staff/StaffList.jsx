import React, { useState, useEffect } from 'react';
import { 
    Users2, Plus, Edit, Trash2, Eye, Search, Filter,
    User, Mail, Phone, MapPin, Calendar, CheckCircle, 
    XCircle, AlertCircle, MoreVertical, ChevronDown
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { staffApiService } from '../../../api/staff.service';

const StaffList = () => {
    const { hotelData, fetchOwnerHotel } = useHotelOwner();
    
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null); // Add hotel selection

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log('Loading hotel data...');
            await fetchOwnerHotel();
            console.log('Hotel data loaded, hotelData:', hotelData);
        } catch (error) {
            console.error('Error loading hotel data:', error);
        }
    };

    // Set default hotel and load staff when hotelData is available
    useEffect(() => {
        console.log('useEffect - Hotel data changed:', hotelData);
        
        if (hotelData && Array.isArray(hotelData) && hotelData.length > 0) {
            // If no hotel is selected, select the first one by default
            if (!selectedHotel) {
                const firstHotel = hotelData[0];
                setSelectedHotel(firstHotel);
                console.log('Selected default hotel:', firstHotel);
            }
        }
    }, [hotelData]);

    // Load staff when selectedHotel changes
    useEffect(() => {
        if (selectedHotel) {
            const hotelId = selectedHotel.hotelId || selectedHotel.hotel_id || selectedHotel.id || selectedHotel._id;
            console.log('Loading staff for selected hotel:', hotelId);
            loadStaff(hotelId);
        }
    }, [selectedHotel]);

    const loadStaff = async (hotelId) => {
        console.log('loadStaff called with:', hotelId);
        
        if (!hotelId) {
            console.warn('No hotel ID provided');
            setError('Không tìm thấy ID khách sạn');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            console.log('API call - Loading staff for hotel:', hotelId);
            const response = await staffApiService.getHotelStaff(hotelId);
            
            console.log('API Response:', response);
            
            // Handle different response formats
            let staffList = [];
            
            if (response && response.data) {
                // Format: { status: "success", data: [...] }
                staffList = Array.isArray(response.data) ? response.data : [];
            } else if (Array.isArray(response)) {
                // Format: [...]  
                staffList = response;
            } else {
                console.warn('Unexpected response format:', response);
                staffList = [];
            }
            
            console.log('Processed staff list:', staffList);
            setStaff(staffList);
            
        } catch (error) {
            console.error('Error loading staff:', error);
            setError('Không thể tải danh sách nhân viên: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (staffId, newStatus) => {
        try {
            await staffApiService.updateStaffStatus(staffId, newStatus);
            const hotelId = selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id;
            await loadStaff(hotelId); // Reload data
            alert('Cập nhật trạng thái thành công!');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Cập nhật trạng thái thất bại: ' + error.message);
        }
    };

    const handleDeleteStaff = async (staffId) => {
        if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
            return;
        }

        try {
            await staffApiService.deleteStaff(staffId);
            const hotelId = selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id;
            await loadStaff(hotelId); // Reload data
            alert('Xóa nhân viên thành công!');
        } catch (error) {
            console.error('Error deleting staff:', error);
            alert('Xóa nhân viên thất bại: ' + error.message);
        }
    };

    // Filter staff based on search term and status only
    const filteredStaff = staff.filter(member => {
        // Get staff info - using actual API response fields
        const position = member.jobPosition || member.position || '';
        const status = member.status || 'active';
        const staffId = member.staffId || member.staff_id || member.id || '';
        
        // Search filter - search by position and staff ID
        const matchesSearch = position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            staffId.toString().toLowerCase().includes(searchTerm.toLowerCase());
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (!hotelData || !Array.isArray(hotelData) || hotelData.length === 0) {
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

                {/* Hotel Selection */}
                {hotelData.length > 1 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn khách sạn:
                        </label>
                        <div className="relative">
                            <select
                                value={selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id || ''}
                                onChange={(e) => {
                                    const hotel = hotelData.find(h => 
                                        (h.hotelId || h.hotel_id || h.id || h._id) === e.target.value
                                    );
                                    setSelectedHotel(hotel);
                                }}
                                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8"
                            >
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
                    </div>
                )}

                {/* Selected Hotel info */}
                {selectedHotel && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{selectedHotel.name}</h3>
                        <p className="text-gray-600">{selectedHotel.address}, {selectedHotel.city}</p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo vị trí công việc, ID nhân viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            onClick={() => {
                                const hotelId = selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id;
                                if (hotelId) {
                                    loadStaff(hotelId);
                                } else {
                                    alert('Không tìm thấy Hotel ID');
                                }
                            }}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users2 size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {staff.length === 0 ? 'Chưa có nhân viên nào' : 'Không tìm thấy nhân viên'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm || statusFilter !== 'all' 
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
                                        Vị trí công việc
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày bắt đầu
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStaff.map((member) => {
                                    const staffId = member.staffId || member.staff_id || member.id;
                                    const position = member.jobPosition || member.position || 'Không xác định';
                                    const userId = member.userId || member.user_id;
                                    
                                    return (
                                        <tr key={staffId} className="hover:bg-gray-50">
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
                                                            Nhân viên #{staffId}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            User ID: {userId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Position */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {position}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={member.status || 'active'}
                                                    onChange={(e) => handleStatusChange(staffId, e.target.value)}
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

                                            {/* Start Date */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Calendar size={14} className="mr-1 text-gray-400" />
                                                    {member.start_date || member.startDate ? 
                                                        new Date(member.start_date || member.startDate).toLocaleDateString('vi-VN') : 
                                                        'N/A'
                                                    }
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
                                                        onClick={() => window.location.href = `/hotel-owner/staff/edit/${staffId}`}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleDeleteStaff(staffId)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
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
                                <label className="text-sm font-medium text-gray-500">Staff ID</label>
                                <p className="text-gray-900">
                                    {selectedStaff.staffId || selectedStaff.staff_id || selectedStaff.id}
                                </p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">User ID</label>
                                <p className="text-gray-900">{selectedStaff.userId || selectedStaff.user_id}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">Vị trí công việc</label>
                                <p className="text-gray-900">{selectedStaff.jobPosition || selectedStaff.position || 'Không xác định'}</p>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                                <p className={selectedStaff.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                                    {selectedStaff.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                                </p>
                            </div>
                            
                            {(selectedStaff.start_date || selectedStaff.startDate) && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Ngày bắt đầu</label>
                                    <p className="text-gray-900">
                                        {new Date(selectedStaff.start_date || selectedStaff.startDate).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            )}

                            {selectedStaff.contact && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Liên hệ</label>
                                    <p className="text-gray-900">{selectedStaff.contact}</p>
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
                                    window.location.href = `/hotel-owner/staff/edit/${selectedStaff.staffId || selectedStaff.staff_id || selectedStaff.id}`;
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