// src/pages/hotel_owner/pricing/SeasonalPricingDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Filter, X, Calendar, ArrowLeft, Layers } from 'lucide-react';
import { seasonPricingService } from '../../../api/seasonPricing.service';
import roomTypeService from '../../../api/roomType.service';
import useSeason from '../../../hooks/useSeason';
import useSeasonPricing from '../../../hooks/useSeasonPricing';
import ActionButton from '../../../components/common/ActionButton';

const SeasonalPricingDetailPage = () => {
  const { roomTypeId } = useParams();
  const navigate = useNavigate();

  // States
  const [roomType, setRoomType] = useState(null);
  const [seasonalPricings, setSeasonalPricings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filter states
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    season_id: '',
    name: '',
    start_date: '',
    end_date: '',
    price_modifier: 1.0
  });

  // Available seasons for selected year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableSeasons, setAvailableSeasons] = useState([]);

  // Bulk form states
  const [bulkFormData, setBulkFormData] = useState({
    year: new Date().getFullYear(),
    price_modifier: 1.0
  });

  // Selection states
  const [selectedPricings, setSelectedPricings] = useState([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditModifier, setBulkEditModifier] = useState(1.0);

  const { seasons, fetchSeasonsByYear } = useSeason();
  const { fetchAvailableSeasonsForRoomType } = useSeasonPricing();

  // Load room type and seasonal pricings on mount
  useEffect(() => {
    loadRoomType();
    loadSeasonalPricings();
  }, [roomTypeId]);

  // Load room type details
  const loadRoomType = async () => {
    try {
      setLoading(true);
      console.log('Loading room type with ID:', roomTypeId);
      const response = await roomTypeService.getById(roomTypeId);
      console.log('Room type response:', response);
      
      // API trả về {success: true, data: {...}} hoặc trực tiếp object
      let roomTypeData = null;
      if (response.data) {
        roomTypeData = response.data;
      } else if (response.success && response.data) {
        roomTypeData = response.data;
      } else {
        roomTypeData = response;
      }
      
      console.log('Parsed room type:', roomTypeData);
      
      if (!roomTypeData || !roomTypeData.roomTypeId) {
        alert('Không tìm thấy loại phòng');
        navigate('/hotel-owner/pricing/seasonal');
        return;
      }
      
      setRoomType(roomTypeData);
    } catch (error) {
      console.error('Error loading room type:', error);
      alert('Không thể tải thông tin loại phòng: ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Load seasonal pricings
  const loadSeasonalPricings = async () => {
    try {
      setLoading(true);
      console.log('Loading seasonal pricings for room type:', roomTypeId);
      const response = await seasonPricingService.getSeasonPricingByRoomType(roomTypeId);
      console.log('Seasonal pricings response:', response);
      
      // API trả về {status: "success", data: [...]}
      let pricings = [];
      if (response.data && Array.isArray(response.data)) {
        pricings = response.data;
      } else if (Array.isArray(response)) {
        pricings = response;
      }
      
      console.log('Parsed pricings:', pricings);
      setSeasonalPricings(pricings);
    } catch (error) {
      console.error('Error loading seasonal pricings:', error);
      setSeasonalPricings([]);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Filter and sort seasonal pricings
  const getFilteredPricings = () => {
    let filtered = [...seasonalPricings];

    // Lọc theo năm - FIX: Xử lý timezone đúng cách
    if (filterYear) {
      filtered = filtered.filter(pricing => {
        // Parse startDate và lấy năm thực tế (xử lý timezone)
        const pricingDate = new Date(pricing.startDate);
        const actualYear = pricingDate.getFullYear();
        return actualYear === parseInt(filterYear);
      });
    }

    // Lọc theo khoảng ngày - FIX: Normalize dates to avoid timezone issues
    if (filterStartDate) {
      const start = new Date(filterStartDate + 'T00:00:00');
      filtered = filtered.filter(pricing => {
        const pricingStartUTC = new Date(pricing.startDate);
        const pricingStart = new Date(pricingStartUTC.getFullYear(), pricingStartUTC.getMonth(), pricingStartUTC.getDate(), 0, 0, 0);
        return pricingStart >= start;
      });
    }
    
    if (filterEndDate) {
      const end = new Date(filterEndDate + 'T23:59:59');
      filtered = filtered.filter(pricing => {
        const pricingEndUTC = new Date(pricing.endDate);
        const pricingEnd = new Date(pricingEndUTC.getFullYear(), pricingEndUTC.getMonth(), pricingEndUTC.getDate(), 23, 59, 59);
        return pricingEnd <= end;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  // Paginate filtered pricings
  const getPaginatedPricings = () => {
    const filtered = getFilteredPricings();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredPricings().length / itemsPerPage);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle bulk form input change
  const handleBulkInputChange = (e) => {
    const { name, value } = e.target;
    setBulkFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open add modal
  const handleOpenAddModal = async () => {
    const currentYear = new Date().getFullYear();
    setSelectedYear(currentYear);
    await loadAvailableSeasons(currentYear);
    setFormData({
      season_id: '',
      name: '',
      start_date: '',
      end_date: '',
      price_modifier: 1.0
    });
    setShowAddModal(true);
  };

  // Load available seasons for selected year
  const loadAvailableSeasons = async (year) => {
    try {
      const seasons = await fetchAvailableSeasonsForRoomType(roomTypeId, year);
      setAvailableSeasons(seasons);
      
      // Auto select first season if available
      if (seasons && seasons.length > 0) {
        const firstSeason = seasons[0];
        setFormData(prev => ({
          ...prev,
          season_id: firstSeason.seasonId,
          name: firstSeason.name,
          start_date: formatDateForInput(firstSeason.startDate),
          end_date: formatDateForInput(firstSeason.endDate)
        }));
      }
    } catch (error) {
      console.error('Error loading available seasons:', error);
    }
  };

  // Handle year change in add modal
  const handleYearChange = async (e) => {
    const year = parseInt(e.target.value);
    setSelectedYear(year);
    await loadAvailableSeasons(year);
  };

  // Handle season selection
  const handleSeasonSelect = (e) => {
    const seasonId = parseInt(e.target.value);
    const selectedSeason = availableSeasons.find(s => s.seasonId === seasonId);
    
    if (selectedSeason) {
      setFormData({
        ...formData,
        season_id: seasonId,
        name: selectedSeason.name,
        start_date: formatDateForInput(selectedSeason.startDate),
        end_date: formatDateForInput(selectedSeason.endDate)
      });
    }
  };

  // Open bulk add modal
  const handleOpenBulkAddModal = async () => {
    setBulkFormData({
      year: new Date().getFullYear(),
      price_modifier: 1.0
    });
    await fetchSeasonsByYear(new Date().getFullYear());
    setShowBulkAddModal(true);
  };

  // Handle add seasonal pricing
  const handleAddSeasonalPricing = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await seasonPricingService.createSeasonPricing({
        room_type_id: roomTypeId,
        ...formData
      });
      alert('Thêm giá theo mùa thành công');
      setShowAddModal(false);
      loadSeasonalPricings();
    } catch (error) {
      console.error('Error adding seasonal pricing:', error);
      alert(error.response?.data?.message || 'Không thể thêm giá theo mùa');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk add seasonal pricing
  const handleBulkAddSeasonalPricing = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      // Gửi đúng format mà backend mong đợi: { room_type_id, year, price_modifier }
      const bulkData = {
        room_type_id: roomTypeId,
        year: parseInt(bulkFormData.year),
        price_modifier: parseFloat(bulkFormData.price_modifier)
      };
      
      console.log('Sending bulk create request:', bulkData);
      
      const response = await seasonPricingService.bulkCreateSeasonPricing(bulkData);
      console.log('Bulk create response:', response);
      
      // Response có cấu trúc: { status, message, data: { created: [...], skipped: number, message: "..." } }
      const result = response.data || response;
      const createdCount = result.created?.length || 0;
      const skippedCount = result.skipped || 0;
      
      alert(`Tạo thành công ${createdCount} giá, bỏ qua ${skippedCount} giá đã tồn tại`);
      setShowBulkAddModal(false);
      loadSeasonalPricings();
    } catch (error) {
      console.error('Error bulk adding seasonal pricing:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể tạo giá hàng loạt';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit pricing
  const handleOpenEditModal = (pricing) => {
    setEditingPricing(pricing);
    setFormData({
      season_id: pricing.seasonId || '',
      name: pricing.name,
      start_date: formatDateForInput(pricing.startDate),
      end_date: formatDateForInput(pricing.endDate),
      price_modifier: pricing.priceModifier
    });
    setShowEditModal(true);
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle update seasonal pricing
  const handleUpdateSeasonalPricing = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await seasonPricingService.updateSeasonPricing(editingPricing.pricingId, formData);
      alert('Cập nhật giá theo mùa thành công');
      setShowEditModal(false);
      setEditingPricing(null);
      loadSeasonalPricings();
    } catch (error) {
      console.error('Error updating seasonal pricing:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật giá theo mùa');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete pricing
  const handleDeletePricing = async (pricing) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa giá "${pricing.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await seasonPricingService.deleteSeasonPricing(pricing.pricingId);
      alert('Xóa giá theo mùa thành công');
      loadSeasonalPricings();
    } catch (error) {
      console.error('Error deleting seasonal pricing:', error);
      alert('Không thể xóa giá theo mùa');
    } finally {
      setLoading(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilterYear(new Date().getFullYear());
    setFilterStartDate('');
    setFilterEndDate('');
    setSortOrder('desc');
  };

  // Generate year options
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // Generate year options for bulk create (only current year and future)
  const getBulkYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = getPaginatedPricings().map(p => p.pricingId);
      setSelectedPricings(allIds);
    } else {
      setSelectedPricings([]);
    }
  };

  const handleSelectOne = (pricingId) => {
    setSelectedPricings(prev => {
      if (prev.includes(pricingId)) {
        return prev.filter(id => id !== pricingId);
      } else {
        return [...prev, pricingId];
      }
    });
  };

  const isAllSelected = () => {
    const paginatedIds = getPaginatedPricings().map(p => p.pricingId);
    return paginatedIds.length > 0 && paginatedIds.every(id => selectedPricings.includes(id));
  };

  const isSomeSelected = () => {
    const paginatedIds = getPaginatedPricings().map(p => p.pricingId);
    return paginatedIds.some(id => selectedPricings.includes(id)) && !isAllSelected();
  };

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selectedPricings.length === 0) {
      alert('Vui lòng chọn ít nhất một giá để xóa');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedPricings.length} giá đã chọn?`)) {
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        selectedPricings.map(id => seasonPricingService.deleteSeasonPricing(id))
      );
      alert(`Đã xóa thành công ${selectedPricings.length} giá`);
      setSelectedPricings([]);
      loadSeasonalPricings();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Không thể xóa một số giá');
    } finally {
      setLoading(false);
    }
  };

  // Open bulk edit modal
  const handleOpenBulkEditModal = () => {
    if (selectedPricings.length === 0) {
      alert('Vui lòng chọn ít nhất một giá để chỉnh sửa');
      return;
    }
    setBulkEditModifier(1.0);
    setShowBulkEditModal(true);
  };

  // Bulk edit selected
  const handleBulkEdit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await Promise.all(
        selectedPricings.map(id => {
          const pricing = seasonalPricings.find(p => p.pricingId === id);
          return seasonPricingService.updateSeasonPricing(id, {
            name: pricing.name,
            start_date: pricing.startDate,
            end_date: pricing.endDate,
            price_modifier: parseFloat(bulkEditModifier)
          });
        })
      );
      alert(`Đã cập nhật thành công ${selectedPricings.length} giá`);
      setShowBulkEditModal(false);
      setSelectedPricings([]);
      loadSeasonalPricings();
    } catch (error) {
      console.error('Error bulk editing:', error);
      alert('Không thể cập nhật một số giá');
    } finally {
      setLoading(false);
    }
  };

  if (!roomType) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Đang tải thông tin loại phòng...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering with roomType:', roomType);

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/hotel-owner/pricing/seasonal')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Quay lại danh sách</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Giá theo Mùa - {roomType.name}
        </h1>
        {/* Thông tin chi tiết loại phòng */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Mô tả</div>
              <div className="font-medium text-gray-900">{roomType.description || 'Không có mô tả'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Số người tối đa</div>
              <div className="font-medium text-gray-900">{roomType.maxOccupancy || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Giá gốc</div>
              <div className="font-medium text-blue-700">{formatCurrency(parseFloat(roomType.basePrice) || 0)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Số phòng</div>
              <div className="font-medium text-gray-900">{roomType.numberOfRooms || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Loại giường</div>
              <div className="font-medium text-gray-900">{roomType.bedType || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Diện tích</div>
              <div className="font-medium text-gray-900">{roomType.areaSqm ? `${parseFloat(roomType.areaSqm)} m²` : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Thêm Mùa
            </button>
            <button
              onClick={handleOpenBulkAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Layers size={20} />
              Thêm Mùa Hàng loạt
            </button>
          </div>
          {selectedPricings.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleOpenBulkEditModal}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <span>Chỉnh sửa ({selectedPricings.length})</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <span>Xóa ({selectedPricings.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              {getYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Mới nhất trước</option>
              <option value="asc">Cũ nhất trước</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : getPaginatedPricings().length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Chưa có giá theo mùa nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={isAllSelected()}
                        ref={input => {
                          if (input) {
                            input.indeterminate = isSomeSelected();
                          }
                        }}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên Mùa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày bắt đầu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày kết thúc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hệ số giá
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá áp dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedPricings().map((pricing) => (
                    <tr key={pricing.pricingId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPricings.includes(pricing.pricingId)}
                          onChange={() => handleSelectOne(pricing.pricingId)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pricing.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(pricing.startDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(pricing.endDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          parseFloat(pricing.priceModifier) > 1 
                            ? 'bg-red-100 text-red-800' 
                            : parseFloat(pricing.priceModifier) < 1 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          ×{parseFloat(pricing.priceModifier).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-blue-600">
                          {formatCurrency(parseFloat(roomType.basePrice) * parseFloat(pricing.priceModifier))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <ActionButton
                            type="edit"
                            onClick={() => handleOpenEditModal(pricing)}
                            title="Sửa"
                          />
                          <ActionButton
                            type="delete"
                            onClick={() => handleDeletePricing(pricing)}
                            title="Xóa"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getFilteredPricings().length)} / {getFilteredPricings().length} kết quả
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-4 py-2 border rounded-lg ${
                        currentPage === index + 1
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Thêm Giá theo Mùa</h2>
              
              <form onSubmit={handleAddSeasonalPricing}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Năm *
                    </label>
                    <select
                      value={selectedYear}
                      onChange={handleYearChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {getBulkYearOptions().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {availableSeasons.length === 0 ? (
                    <div className="text-center py-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Calendar size={40} className="mx-auto text-yellow-600 mb-2" />
                      <p className="text-yellow-800 font-medium mb-1">
                        Không còn mùa nào để thêm trong năm {selectedYear}
                      </p>
                      <p className="text-sm text-yellow-600">
                        Tất cả các mùa đã có giá rồi. Hãy chọn năm khác.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chọn Mùa *
                        </label>
                        <select
                          value={formData.season_id}
                          onChange={handleSeasonSelect}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Chọn mùa --</option>
                          {availableSeasons.map(season => (
                            <option key={season.seasonId} value={season.seasonId}>
                              {season.name} ({formatDate(season.startDate)} - {formatDate(season.endDate)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên Mùa *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày bắt đầu *
                          </label>
                          <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleInputChange}
                            required
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày kết thúc *
                          </label>
                          <input
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleInputChange}
                            required
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hệ số giá *
                        </label>
                        <input
                          type="number"
                          name="price_modifier"
                          value={formData.price_modifier}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0.1"
                          max="10"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="1.0 = 100%, 1.5 = 150%, 0.8 = 80%"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Giá áp dụng: {formatCurrency(parseFloat(roomType.basePrice) * parseFloat(formData.price_modifier))}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || availableSeasons.length === 0 || !formData.season_id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang thêm...' : 'Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Thêm Mùa Hàng loạt</h2>
              <p className="text-gray-600 mb-4">
                Tự động tạo giá cho tất cả các mùa trong năm được chọn (từ năm {new Date().getFullYear()} trở đi)
              </p>
              <form onSubmit={handleBulkAddSeasonalPricing}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Năm *
                    </label>
                    <select
                      name="year"
                      value={bulkFormData.year}
                      onChange={handleBulkInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {getBulkYearOptions().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hệ số giá *
                    </label>
                    <input
                      type="number"
                      name="price_modifier"
                      value={bulkFormData.price_modifier}
                      onChange={handleBulkInputChange}
                      step="0.01"
                      min="0.1"
                      max="10"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1.0 = 100%, 1.5 = 150%"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Giá áp dụng: {formatCurrency(parseFloat(roomType.basePrice) * parseFloat(bulkFormData.price_modifier))}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Lưu ý:</strong> Hệ thống sẽ tự động bỏ qua các mùa đã có giá cho loại phòng này.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowBulkAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang tạo...' : 'Tạo hàng loạt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPricing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Chỉnh sửa Giá theo Mùa</h2>
              <form onSubmit={handleUpdateSeasonalPricing}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên Mùa *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc *
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hệ số giá *
                    </label>
                    <input
                      type="number"
                      name="price_modifier"
                      value={formData.price_modifier}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0.1"
                      max="10"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Giá áp dụng: {formatCurrency(parseFloat(roomType.basePrice) * parseFloat(formData.price_modifier))}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPricing(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Chỉnh sửa Hàng loạt</h2>
              <p className="text-gray-600 mb-4">
                Áp dụng hệ số giá mới cho {selectedPricings.length} giá đã chọn
              </p>
              <form onSubmit={handleBulkEdit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hệ số giá mới *
                    </label>
                    <input
                      type="number"
                      value={bulkEditModifier}
                      onChange={(e) => setBulkEditModifier(e.target.value)}
                      step="0.01"
                      min="0.1"
                      max="10"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1.0 = 100%, 1.5 = 150%"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Giá áp dụng: {formatCurrency(parseFloat(roomType.basePrice) * parseFloat(bulkEditModifier))}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Hệ số giá mới sẽ được áp dụng cho tất cả {selectedPricings.length} giá đã chọn.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowBulkEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật tất cả'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonalPricingDetailPage;
