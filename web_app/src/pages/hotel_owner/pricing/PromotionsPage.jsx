// src/pages/hotel_owner/pricing/PromotionsPage.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Building2, BadgePercent, Users, Gift, TrendingUp, Edit2, Trash2, Eye, CheckCircle, Settings } from 'lucide-react';
import axiosClient from '../../../config/axiosClient';
import PromotionService from '../../../api/promotions.service';
import CreatePromotionModal from '../../../components/promotions/CreatePromotionModal';
import PromotionDetailModal from '../../../components/promotions/PromotionDetailModal';
import EditPromotionDetailModal from '../../../components/promotions/EditPromotionDetailModal';
import EditPromotionModal from '../../../components/promotions/EditPromotionModal';
import DeleteConfirmationDialog from '../../../components/common/DeleteConfirmationDialog';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../../components/common/Toast';

const PromotionsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [promotions, setPromotions] = useState([]);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateDetailModal, setShowCreateDetailModal] = useState(false);
  const [showEditDetailModal, setShowEditDetailModal] = useState(false);
  const [showEditPromotionModal, setShowEditPromotionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPromotionForDetails, setSelectedPromotionForDetails] = useState(null);
  const [selectedPromotionForEdit, setSelectedPromotionForEdit] = useState(null);
  const [selectedPromotionForDelete, setSelectedPromotionForDelete] = useState(null);
  const [promotionDetails, setPromotionDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Load promotions by hotel ID
  const loadPromotionsByHotel = async (hotelId) => {
    if (!hotelId) {
      setPromotions([]);
      return;
    }
    
    try {
      setLoadingPromotions(true);
      console.log('Loading promotions for hotel:', hotelId);
      const response = await PromotionService.getPromotionsByHotelId(hotelId);
      const promotionsData = response?.data ?? response ?? [];
      console.log('Promotions loaded:', promotionsData);
      setPromotions(promotionsData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách khuyến mãi:', error);
      setPromotions([]);
    } finally {
      setLoadingPromotions(false);
    }
  };

  // Load danh sách khách sạn của hotel owner
  useEffect(() => {
    const loadMyHotels = async () => {
      try {
        setLoadingHotels(true);
        const res = await axiosClient.get('/hotels/my-hotels');
        const allHotels = res?.data?.data ?? res?.data ?? [];
        
        // Chỉ lấy những khách sạn có trạng thái approved hoặc active
        const approvedHotels = allHotels.filter(hotel => 
          hotel.status === 'approved' || hotel.status === 'active'
        );
        console.log('Hotels loaded:', approvedHotels);
        
        setHotels(approvedHotels);
        
        // Tự động chọn hotel đầu tiên nếu có
        if (approvedHotels.length > 0) {
          const firstHotel = approvedHotels[0];
          setSelectedHotel(firstHotel);
          // Load promotions for the first hotel
          if (firstHotel.hotelId) {
            loadPromotionsByHotel(firstHotel.hotelId);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách khách sạn:', error);
      } finally {
        setLoadingHotels(false);
      }
    };

    loadMyHotels();
  }, []);

  // Reset to first page when hotel changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedHotel]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ duyệt' },
      approved: { color: 'bg-blue-100 text-blue-800', text: 'Đã duyệt' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Bị từ chối' },
      active: { color: 'bg-green-100 text-green-800', text: 'Đang hoạt động' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Không hoạt động' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getDiscountText = (promotion) => {
    // Promotion là percentage theo DB schema
    return `${promotion.discountValue}%`;
  };

  const getPromotionTypeText = (type) => {
    const typeConfig = {
      general: 'Chung',
      room_specific: 'Theo phòng'
    };
    return typeConfig[type] || 'Chung';
  };

  const getUsagePercentage = (used, limit) => {
    return Math.round((used / limit) * 100);
  };

  // Filter promotions based on status and type
  const getFilteredPromotions = () => {
    return promotions.filter(promotion => {
      const statusMatch = statusFilter === 'all' || promotion.status === statusFilter;
      const typeMatch = typeFilter === 'all' || promotion.promotionType === typeFilter;
      return statusMatch && typeMatch;
    });
  };

  // Get paginated promotions
  const getPaginatedPromotions = () => {
    const filtered = getFilteredPromotions();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // Calculate pagination info
  const totalFilteredItems = getFilteredPromotions().length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  // Reset to first page when filters change
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    } else if (filterType === 'type') {
      setTypeFilter(value);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle view promotion details
  const handleViewDetails = async (promotion) => {
    try {
      setLoadingDetails(true);
      setSelectedPromotionForDetails(promotion);
      setShowDetailsModal(true);
      
      console.log('Fetching details for promotion:', promotion.promotionId);
      const response = await PromotionService.getPromotionDetails(promotion.promotionId);
      console.log('Raw response:', response);
      console.log('Response type:', typeof response);
      
      // Service đã trả về response.data, nên response sẽ có cấu trúc {status, message, data}
      let detailsData = [];
      
      if (response?.data && Array.isArray(response.data)) {
        // Trường hợp response = {status, message, data: [...]}
        detailsData = response.data;
      } else if (Array.isArray(response)) {
        // Trường hợp response = [...]
        detailsData = response;
      }
      
      console.log('Processed details data:', detailsData);
      setPromotionDetails(detailsData);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết khuyến mãi:', error);
      setPromotionDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle edit promotion
  const handleEditPromotion = (promotion) => {
    console.log('🔍 Editing promotion:', promotion);
    console.log('🔍 promotionType:', promotion.promotionType);
    console.log('🔍 promotion_type:', promotion.promotion_type);
    
    // Tất cả các loại khuyến mãi đều có thể edit
    setSelectedPromotionForEdit(promotion);
    setShowEditPromotionModal(true);
  };

  // Handle edit promotion success
  const handleEditPromotionSuccess = (updatedData) => {
    console.log('Promotion updated:', updatedData);
    // Reload promotions for the current hotel
    if (selectedHotel) {
      loadPromotionsByHotel(selectedHotel.hotelId);
      // Keep current page after edit
    }
  };

  // Handle delete promotion request
  const handleDeletePromotion = (promotion) => {
    console.log('Preparing to delete promotion:', promotion);
    setSelectedPromotionForDelete(promotion);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedPromotionForDelete) return;

    setIsDeleting(true);
    try {
      console.log('🗑️ Starting delete process for promotion:', selectedPromotionForDelete.promotionId);
      
      const result = await PromotionService.deletePromotionWithDetails(selectedPromotionForDelete.promotionId);
      
      console.log('✅ Delete result:', result);
      
      showSuccess('Xóa thành công!', 
        result.deletedDetailsCount > 0 
          ? `Đã xóa khuyến mãi và ${result.deletedDetailsCount} chi tiết liên quan.`
          : 'Đã xóa khuyến mãi thành công.'
      );

      // Reload promotions list
      if (selectedHotel) {
        await loadPromotionsByHotel(selectedHotel.hotelId);
        
        // Check if current page is empty after deletion and go to previous page
        const newTotalItems = promotions.length - 1; // After deletion
        const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      }

      // Close modal
      setShowDeleteModal(false);
      setSelectedPromotionForDelete(null);
      
    } catch (error) {
      console.error('❌ Error deleting promotion:', error);
      const errorMessage = error.message || error.details?.message || 'Có lỗi xảy ra khi xóa khuyến mãi';
      showError('Xóa thất bại!', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle close delete modal
  const handleCloseDeleteModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setShowDeleteModal(false);
    setSelectedPromotionForDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Khuyến Mãi</h1>
          <p className="text-gray-600">Tạo và quản lý các chương trình khuyến mãi</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={!selectedHotel}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            selectedHotel 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus size={20} className="mr-2" />
          Tạo khuyến mãi mới
        </button>
      </div>

      {/* Hotel Selection Combobox */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <label htmlFor="hotel-select" className="block text-sm font-medium text-gray-700 mb-2">
              Chọn khách sạn
            </label>
            {loadingHotels ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-500">Đang tải danh sách khách sạn...</span>
              </div>
            ) : hotels.length === 0 ? (
              <div className="text-sm text-red-600">
                Không tìm thấy khách sạn nào. Vui lòng tạo khách sạn trước khi quản lý khuyến mãi.
              </div>
            ) : (
              <select
                id="hotel-select"
                value={selectedHotel?.hotelId || ''}
                onChange={(e) => {
                  const hotelId = e.target.value;
                  const hotel = hotels.find(h => h.hotelId === hotelId);
                  setSelectedHotel(hotel);
                  if (hotel) {
                    loadPromotionsByHotel(hotel.hotelId);
                  }
                  setPromotions([]); // Clear promotions khi chọn hotel mới
                  // Reset filters khi chọn hotel mới
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Chọn khách sạn --</option>
                {hotels.map((hotel) => (
                  <option key={hotel.hotelId} value={hotel.hotelId}>
                    {hotel.name} - {hotel.address || 'Chưa có địa chỉ'}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedHotel && (
            <div className="text-sm text-gray-600">
              <div className="font-medium">{selectedHotel.name}</div>
              <div className="text-xs text-gray-500">
                {selectedHotel.address || 'Chưa có địa chỉ'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Tổng khuyến mãi */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BadgePercent className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Tổng khuyến mãi</p>
              <p className="text-xl font-bold text-gray-900">{promotions.length}</p>
            </div>
          </div>
        </div>

        {/* Đang hoạt động */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Đang hoạt động</p>
              <p className="text-xl font-bold text-green-600">{promotions.filter(p => p.status === 'active').length}</p>
            </div>
          </div>
        </div>

        {/* Chờ duyệt */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Chờ duyệt</p>
              <p className="text-xl font-bold text-yellow-600">{promotions.filter(p => p.status === 'pending').length}</p>
            </div>
          </div>
        </div>

        {/* Đã duyệt */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Đã duyệt</p>
              <p className="text-xl font-bold text-blue-600">{promotions.filter(p => p.status === 'approved').length}</p>
            </div>
          </div>
        </div>

        {/* Tạm dừng */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Gift className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Tạm dừng</p>
              <p className="text-xl font-bold text-gray-600">{promotions.filter(p => p.status === 'inactive').length}</p>
            </div>
          </div>
        </div>

        {/* Lượt sử dụng */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-600">Lượt sử dụng</p>
              <p className="text-xl font-bold text-purple-600">{promotions.reduce((sum, p) => sum + (p.usedCount || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      {selectedHotel && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Bộ lọc khuyến mãi</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Bị từ chối</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Loại khuyến mãi
              </label>
              <select
                id="type-filter"
                value={typeFilter}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả loại</option>
                <option value="general">Tổng quát</option>
                <option value="room_specific">Theo phòng cụ thể</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Xóa bộ lọc
              </button>
            </div>

            {/* Filter Results Count */}
            <div className="flex items-end">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Hiển thị: <span className="font-medium text-gray-900">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalFilteredItems)} - {Math.min(currentPage * itemsPerPage, totalFilteredItems)} / {totalFilteredItems}
                  </span> khuyến mãi
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600">Hiển thị:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-xs text-gray-600">mục/trang</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách khuyến mãi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên khuyến mãi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian & Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingPromotions ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500">Đang tải danh sách khuyến mãi...</span>
                    </div>
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {selectedHotel ? 'Không có khuyến mãi nào cho khách sạn này' : 'Vui lòng chọn khách sạn để xem khuyến mãi'}
                    </div>
                  </td>
                </tr>
              ) : totalFilteredItems === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      Không có khuyến mãi nào phù hợp với bộ lọc đã chọn
                    </div>
                  </td>
                </tr>
              ) : (
                getPaginatedPromotions().map((promotion) => (
                  <tr key={promotion.promotionId || promotion.promotion_id || promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">
                        {promotion.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {getDiscountText(promotion)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Tối thiểu: {formatCurrency(promotion.minBookingPrice || 0)}
                      </div>
                      {promotion.maxDiscountAmount && (
                        <div className="text-xs text-gray-500">
                          Tối đa: {formatCurrency(promotion.maxDiscountAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(promotion.validFrom)} - {formatDate(promotion.validUntil)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getPromotionTypeText(promotion.promotionType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {promotion.usedCount}/{promotion.usageLimit}
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${getUsagePercentage(promotion.usedCount, promotion.usageLimit)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(promotion.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {promotion.promotionType === 'room_specific' && (
                          <button 
                            onClick={() => handleViewDetails(promotion)}
                            className="text-green-600 hover:text-green-900"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditPromotion(promotion)}
                          disabled={false}
                          className="text-blue-600 hover:text-blue-900"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeletePromotion(promotion)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, totalFilteredItems)} - {Math.min(currentPage * itemsPerPage, totalFilteredItems)} trong tổng {totalFilteredItems} khuyến mãi
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                >
                  ← Trước
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md transition-colors ${
                          currentPage === pageNum
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Promotion Modal */}
      <CreatePromotionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedHotel={selectedHotel}
      />

      {/* Promotion Details Modal */}
      {showDetailsModal && selectedPromotionForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết khuyến mãi</h3>
                <p className="text-gray-600">{selectedPromotionForDetails.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPromotionForDetails(null);
                  setPromotionDetails([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Promotion Basic Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mã khuyến mãi</p>
                  <p className="font-mono bg-white px-2 py-1 rounded text-sm">{selectedPromotionForDetails.code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loại khuyến mãi</p>
                  <p className="font-medium">{getPromotionTypeText(selectedPromotionForDetails.promotionType)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Thời gian hiệu lực</p>
                  <p className="text-sm">{formatDate(selectedPromotionForDetails.validFrom)} - {formatDate(selectedPromotionForDetails.validUntil)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <div className="mt-1">{getStatusBadge(selectedPromotionForDetails.status)}</div>
                </div>
              </div>
            </div>

            {/* Room-specific Details */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Chi tiết giảm giá theo phòng</h4>
              
              {loadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-500">Đang tải chi tiết...</span>
                </div>
              ) : !Array.isArray(promotionDetails) || promotionDetails.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    Không có chi tiết khuyến mãi nào
                  </div>
                  {selectedPromotionForDetails?.promotionType === 'room_specific' && (
                    <button
                      onClick={() => setShowCreateDetailModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Tạo chi tiết khuyến mãi
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID Loại phòng
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Loại giảm giá
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giá trị giảm
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày tạo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(promotionDetails) && promotionDetails.map((detail) => (
                          <tr key={detail.detailId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {detail.roomTypeId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                detail.discountType === 'percentage' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {detail.discountType === 'percentage' ? 'Phần trăm' : 'Số tiền cố định'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {detail.discountType === 'percentage' 
                                ? `${detail.discountValue}%` 
                                : formatCurrency(detail.discountValue)
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(detail.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Buttons for details management */}
                  {selectedPromotionForDetails?.promotionType === 'room_specific' && (
                    <div className="mt-6 flex justify-center space-x-4">
                      <button
                        onClick={() => setShowCreateDetailModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Thêm chi tiết khuyến mãi
                      </button>
                      
                      {promotionDetails.length > 0 && (
                        <button
                          onClick={() => setShowEditDetailModal(true)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Chỉnh sửa chi tiết
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPromotionForDetails(null);
                  setPromotionDetails([]);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Promotion Modal */}
      {showAddModal && (
        <CreatePromotionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          selectedHotel={selectedHotel}
          onSuccess={() => {
            console.log('onSuccess callback called, selectedHotel:', selectedHotel);
            setShowAddModal(false);
            if (selectedHotel?.hotelId) {
              console.log('Reloading promotions for hotel:', selectedHotel.hotelId);
              loadPromotionsByHotel(selectedHotel.hotelId);
              // Reset to first page when new promotion is created
              setCurrentPage(1);
            } else {
              console.error('No selectedHotel.hotelId found!');
            }
          }}
        />
      )}

      {/* Create Promotion Detail Modal */}
      {showCreateDetailModal && selectedPromotionForDetails && (
        <PromotionDetailModal
          isOpen={showCreateDetailModal}
          onClose={() => setShowCreateDetailModal(false)}
          selectedHotel={selectedHotel}
          promotion={selectedPromotionForDetails}
          existingDetails={promotionDetails || []}
          onSuccess={() => {
            console.log('Success callback - reloading details');
            setShowCreateDetailModal(false);
            // Reload promotion details
            handleViewDetails(selectedPromotionForDetails);
          }}
        />
      )}

      {/* Edit Promotion Detail Modal */}
      {showEditDetailModal && selectedPromotionForDetails && (
        <EditPromotionDetailModal
          isOpen={showEditDetailModal}
          onClose={() => setShowEditDetailModal(false)}
          selectedHotel={selectedHotel}
          promotion={selectedPromotionForDetails}
          promotionDetails={promotionDetails || []}
          onSuccess={() => {
            console.log('Edit success callback - reloading details');
            setShowEditDetailModal(false);
            // Reload promotion details
            handleViewDetails(selectedPromotionForDetails);
          }}
        />
      )}

      {/* Edit Promotion Modal */}
      {showEditPromotionModal && selectedPromotionForEdit && (
        <EditPromotionModal
          isOpen={showEditPromotionModal}
          onClose={() => setShowEditPromotionModal(false)}
          promotion={selectedPromotionForEdit}
          onSuccess={handleEditPromotionSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Xóa khuyến mãi"
        message="Bạn có chắc chắn muốn xóa khuyến mãi này không?"
        itemName={selectedPromotionForDelete ? `${selectedPromotionForDelete.name} (${selectedPromotionForDelete.code})` : ''}
        isDeleting={isDeleting}
        warnings={[
          'Tất cả chi tiết khuyến mãi (promotion_details) sẽ bị xóa vĩnh viễn',
          'Các booking đã sử dụng khuyến mãi này sẽ không bị ảnh hưởng',
          'Dữ liệu thống kê về khuyến mãi này sẽ bị mất'
        ]}
      />

      {/* Toast Container */}
      
    </div>
  );
};

export default PromotionsPage;