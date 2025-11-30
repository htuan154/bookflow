import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
    Users2, Plus, Edit, Trash2, Eye, Search, Filter,
    User, Mail, Phone, MapPin, Calendar, CheckCircle, 
    XCircle, AlertCircle, MoreVertical, ChevronDown, Briefcase
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useStaff } from '../../../context/StaffContext';
import Toast from '../../../components/common/Toast';
import { useToast } from '../../../hooks/useToast';

const StaffList = () => {
    const { hotelData, fetchOwnerHotel } = useHotelOwner();
    const navigate = useNavigate();
    const { toast, showSuccess, showError, hideToast } = useToast();
    
    // Use StaffContext instead of local state
    const {
        staff,
        loading,
        error,
        selectedHotel,
        setSelectedHotel,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        page,
        setPage,
        pageSize,
        setPageSize,
        updateStaffStatus,
        deleteStaff
    } = useStaff();
    
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

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
    }, [hotelData, selectedHotel, setSelectedHotel]);

    const handleStatusChange = async (staffId, newStatus) => {
        const result = await updateStaffStatus(staffId, newStatus);
        if (result.success) {
            showSuccess('Cập nhật trạng thái thành công!');
        } else {
            showError('Cập nhật trạng thái thất bại: ' + result.error);
        }
    };

    const handleDeleteStaff = async (staffId) => {
        if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
            return;
        }

        const result = await deleteStaff(staffId);
        if (result.success) {
            showSuccess('Xóa nhân viên thành công!');
        } else {
            showError('Xóa nhân viên thất bại: ' + result.error);
        }
    };

    // Filter staff based on search term and status only
    const filteredStaff = staff.filter(member => {
        const position = member.jobPosition || member.position || '';
        const status = member.status || 'active';
        const staffId = member.staffId || member.staff_id || member.id || '';
        const matchesSearch = position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staffId.toString().toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Sync context state with URL params on mount
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        const urlStatus = searchParams.get('status');
        const urlPage = searchParams.get('page');
        const urlPageSize = searchParams.get('pageSize');
        
        if (urlSearch && urlSearch !== searchTerm) setSearchTerm(urlSearch);
        if (urlStatus && urlStatus !== statusFilter) setStatusFilter(urlStatus);
        if (urlPage && Number(urlPage) !== page) setPage(Number(urlPage));
        if (urlPageSize && Number(urlPageSize) !== pageSize) setPageSize(Number(urlPageSize));
    }, []);
    
    // Sync state to URL when changed
    useEffect(() => {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (page && page !== 1) params.page = page;
        if (pageSize && pageSize !== 10) params.pageSize = pageSize;
        setSearchParams(params, { replace: true });
    }, [searchTerm, statusFilter, page, pageSize, setSearchParams]);
    
    const totalPages = Math.ceil(filteredStaff.length / pageSize) || 1;

    // Paginated staff
    const paginatedStaff = filteredStaff.slice((page - 1) * pageSize, page * pageSize);

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
                        onClick={() => navigate(`/hotel-owner/staff/add?${searchParams.toString()}`, { state: { selectedHotel } })}
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
                            <option value="suspended">Đình chỉ</option>
                            <option value="terminated">Đã nghỉ việc</option>
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
                                if (selectedHotel) {
                                    const hotelId = selectedHotel.hotelId || selectedHotel.hotel_id || selectedHotel.id || selectedHotel._id;
                                    setSelectedHotel(selectedHotel); // Trigger reload via context
                                } else {
                                    showError('Không tìm thấy Hotel ID');
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
                            onClick={() => navigate(`/hotel-owner/staff/add?${searchParams.toString()}`, { state: { selectedHotel } })}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={16} className="mr-2 inline" />
                            Thêm nhân viên
                        </button>
                    </div>
                ) : (
                    <>
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
                                {paginatedStaff.map((member) => {
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

                                            {/* Status (read-only badge) */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    member.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    member.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                                    member.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                                                    member.status === 'terminated' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {member.status === 'active' ? 'Hoạt động' :
                                                     member.status === 'inactive' ? 'Tạm dừng' :
                                                     member.status === 'suspended' ? 'Đình chỉ' :
                                                     member.status === 'terminated' ? 'Đã nghỉ việc' :
                                                     'Không xác định'}
                                                </span>
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
                                                        onClick={() => navigate(`/hotel-owner/staff/${staffId}?${searchParams.toString()}`)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => navigate(`/hotel-owner/staff/edit/${staffId}?${searchParams.toString()}`)}
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
                    {/* Pagination controls */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-700">Số dòng/trang:</span>
                            <select
                                value={pageSize}
                                onChange={e => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                &lt;
                            </button>
                            <span className="text-sm">Trang {page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-2 py-1 border rounded disabled:opacity-50"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                    </>
                )}
            </div>

            {/* Staff Details Modal */}
            {showDetails && selectedStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                    <User size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">Chi tiết nhân viên</h3>
                                    <p className="text-sm text-gray-500">ID: {selectedStaff.staffId || selectedStaff.staff_id || selectedStaff.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Status Badge */}
                            <div className="flex items-center justify-center">
                                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                    selectedStaff.status === 'active' ? 'bg-green-100 text-green-800' :
                                    selectedStaff.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                    selectedStaff.status === 'suspended' ? 'bg-orange-100 text-orange-800' :
                                    selectedStaff.status === 'terminated' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {selectedStaff.status === 'active' ? '🟢 Hoạt động' :
                                     selectedStaff.status === 'inactive' ? '🟡 Tạm dừng' :
                                     selectedStaff.status === 'suspended' ? '🟠 Đình chỉ' :
                                     selectedStaff.status === 'terminated' ? '🔴 Đã nghỉ việc' :
                                     'Không xác định'}
                                </span>
                            </div>

                            {/* Job Information */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                                    <Briefcase size={16} className="mr-2" />
                                    Thông tin công việc
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-blue-700">Vị trí</label>
                                        <p className="text-sm text-gray-900 mt-1">{selectedStaff.jobPosition || selectedStaff.position || 'Không xác định'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-blue-700">Ngày bắt đầu</label>
                                        <p className="text-sm text-gray-900 mt-1 flex items-center">
                                            <Calendar size={14} className="mr-1 text-gray-400" />
                                            {(selectedStaff.start_date || selectedStaff.startDate) ? 
                                                new Date(selectedStaff.start_date || selectedStaff.startDate).toLocaleDateString('vi-VN') : 
                                                'N/A'
                                            }
                                        </p>
                                    </div>
                                    {(selectedStaff.end_date || selectedStaff.endDate) && (
                                        <div>
                                            <label className="text-xs font-medium text-blue-700">Ngày kết thúc</label>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {new Date(selectedStaff.end_date || selectedStaff.endDate).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            {selectedStaff.contact && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <Phone size={16} className="mr-2" />
                                        Thông tin liên hệ
                                    </h4>
                                    <p className="text-sm text-gray-900">{selectedStaff.contact}</p>
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <label className="text-xs font-medium text-gray-500">User ID</label>
                                    <p className="text-gray-900 mt-1 font-mono text-xs">{selectedStaff.userId || selectedStaff.user_id}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <label className="text-xs font-medium text-gray-500">Ngày tạo</label>
                                    <p className="text-gray-900 mt-1">
                                        {selectedStaff.createdAt ? 
                                            new Date(selectedStaff.createdAt).toLocaleDateString('vi-VN') : 
                                            'N/A'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => {
                                    setShowDetails(false);
                                    navigate(`/hotel-owner/staff/edit/${selectedStaff.staffId || selectedStaff.staff_id || selectedStaff.id}?${searchParams.toString()}`);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                            >
                                <Edit size={16} className="mr-2" />
                                Chỉnh sửa
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
    );
};

export default StaffList;