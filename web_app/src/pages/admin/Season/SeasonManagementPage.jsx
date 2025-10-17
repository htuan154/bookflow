// src/pages/admin/Season/SeasonManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Filter, X, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import ActionButton from '../../../components/common/ActionButton';
import useSeason from '../../../hooks/useSeason';
import { toast } from 'react-toastify';

const SeasonManagementPage = () => {
  const { seasons, loading, fetchAllSeasons, deleteSeason, createSeason, updateSeason } = useSeason();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exactSeasons, setExactSeasons] = useState([]);
  const [overlapSeasons, setOverlapSeasons] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  
  // Pagination state
  const [currentPageExact, setCurrentPageExact] = useState(1);
  const [currentPageOverlap, setCurrentPageOverlap] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    filterSeasons();
  }, [seasons, selectedYear, startDate, endDate, sortOrder]);

  const loadSeasons = async () => {
    await fetchAllSeasons();
  };

  // Get tomorrow and day after tomorrow as default dates
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getDayAfterTomorrowDate = () => {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  };

  // Kiểm tra xem season có phải là mùa "hệ thống" không được edit
  // Dựa trên logic tạo tự động: 01/01, 30/04, 01/05, Mùa hè (31/05-05/09), Thứ 7
  const isSystemSeason = (season) => {
    const startDate = new Date(season.startDate);
    const endDate = new Date(season.endDate);
    
    const month = startDate.getMonth() + 1; // 1-12
    const day = startDate.getDate();
    const dayOfWeek = startDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Kiểm tra các ngày lễ cố định (1 ngày)
    const isSingleDayHoliday = 
      (month === 1 && day === 1) ||   // Tết Dương lịch
      (month === 4 && day === 30) ||  // Ngày Chiến thắng
      (month === 5 && day === 1);     // Ngày Quốc tế lao động
    
    // Kiểm tra Mùa hè (31/05 → 05/09)
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();
    const isSummer = 
      (startMonth === 5 && startDay === 31) && 
      (endMonth === 9 && endDay === 5);
    
    // Kiểm tra Thứ 7 (Saturday, 1 ngày)
    const isSaturday = 
      dayOfWeek === 6 && 
      startDate.toDateString() === endDate.toDateString(); // Đảm bảo là 1 ngày
    
    return isSingleDayHoliday || isSummer || isSaturday;
  };

  const handleOpenModal = () => {
    setIsEditMode(false);
    setEditingSeasonId(null);
    setFormData({
      name: '',
      start_date: getTomorrowDate(),
      end_date: getDayAfterTomorrowDate(),
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (season) => {
    setIsEditMode(true);
    setEditingSeasonId(season.seasonId);
    
    // Format date từ ISO string sang YYYY-MM-DD (local timezone)
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      // Sử dụng local date thay vì UTC để tránh lỗi timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setFormData({
      name: season.name,
      start_date: formatDateForInput(season.startDate),
      end_date: formatDateForInput(season.endDate),
      description: season.description || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingSeasonId(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      description: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Nếu chỉnh start_date mà lớn hơn end_date thì tự động set end_date = start_date
      if (name === 'start_date' && prev.end_date && value > prev.end_date) {
        return {
          ...prev,
          start_date: value,
          end_date: value
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên mùa');
      return false;
    }
    if (!formData.start_date) {
      toast.error('Vui lòng chọn ngày bắt đầu');
      return false;
    }
    if (!formData.end_date) {
      toast.error('Vui lòng chọn ngày kết thúc');
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDateObj = new Date(formData.start_date);
    const endDateObj = new Date(formData.end_date);

    if (startDateObj <= today) {
      toast.error('Ngày bắt đầu phải từ ngày mai trở đi');
      return false;
    }

    // Cho phép end_date bằng start_date (season 1 ngày)
    if (endDateObj < startDateObj) {
      toast.error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Extract year from start_date
      const year = new Date(formData.start_date).getFullYear();
      
      const payload = {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        year: year,
        description: formData.description.trim()
      };

      if (isEditMode) {
        // Cập nhật season
        await updateSeason(editingSeasonId, payload);
        toast.success('Cập nhật mùa thành công!');
      } else {
        // Tạo season mới
        await createSeason(payload);
        toast.success('Tạo mùa mới thành công!');
      }
      
      handleCloseModal();
      await loadSeasons();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} season:`, error);
      toast.error(error.response?.data?.message || `Có lỗi xảy ra khi ${isEditMode ? 'cập nhật' : 'tạo'} mùa`);
    }
  };

  const filterSeasons = () => {
    let filtered = [...seasons];
    
    // Lọc theo năm - FIX: Dùng năm thực tế từ startDate thay vì field year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(s => {
        // Parse startDate và lấy năm thực tế (xử lý timezone)
        const seasonDate = new Date(s.startDate);
        const actualYear = seasonDate.getFullYear();
        return actualYear === parseInt(selectedYear);
      });
    }

    // Sắp xếp theo ngày bắt đầu
    filtered.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Nếu có chọn khoảng ngày
    if (startDate && endDate) {
      // Normalize dates to avoid timezone issues
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      
      const exact = [];
      const overlap = [];
      
      filtered.forEach(season => {
        // Normalize season dates - convert UTC to local
        const seasonStartUTC = new Date(season.startDate);
        const seasonEndUTC = new Date(season.endDate);
        
        // Create local date from UTC (strip timezone)
        const seasonStart = new Date(seasonStartUTC.getFullYear(), seasonStartUTC.getMonth(), seasonStartUTC.getDate(), 0, 0, 0);
        const seasonEnd = new Date(seasonEndUTC.getFullYear(), seasonEndUTC.getMonth(), seasonEndUTC.getDate(), 23, 59, 59);
        
        // Season nằm trọn trong khoảng (start <= seasonStart && seasonEnd <= end)
        if (seasonStart >= start && seasonEnd <= end) {
          exact.push(season);
        }
        // Season có phần giao với khoảng nhưng không nằm trọn
        else if (
          (seasonStart < start && seasonEnd >= start) || // Bắt đầu trước, kết thúc trong/sau khoảng
          (seasonStart <= end && seasonEnd > end) ||     // Bắt đầu trong/trước khoảng, kết thúc sau
          (seasonStart < start && seasonEnd > end)       // Bao trùm toàn bộ khoảng
        ) {
          overlap.push(season);
        }
      });
      
      setExactSeasons(exact);
      setOverlapSeasons(overlap);
    } else {
      // Nếu không có khoảng ngày, hiển thị tất cả
      setExactSeasons(filtered);
      setOverlapSeasons([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (error) {
      return dateString;
    }
  };

  const handleDelete = async (seasonId, seasonName) => {
    if (window.confirm(`Bạn có chắc muốn xóa mùa "${seasonName}"?`)) {
      try {
        await deleteSeason(seasonId);
      } catch (error) {
        console.error('Error deleting season:', error);
      }
    }
  };

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 5; i <= currentYear + 10; i++) {
    yearOptions.push(i);
  }

  // Pagination helpers
  const paginate = (items, currentPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  const handlePageChange = (setPage, newPage, totalPages) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Render pagination controls
  const renderPagination = (currentPage, setCurrentPage, totalItems, label) => {
    const totalPages = getTotalPages(totalItems);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t">
        <div className="text-sm text-gray-700">
          Hiển thị <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> đến{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems.length)}</strong> trong tổng số{' '}
          <strong>{totalItems.length}</strong> {label}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(setCurrentPage, currentPage - 1, totalPages)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm text-gray-700">
            Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => handlePageChange(setCurrentPage, currentPage + 1, totalPages)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  // Render bảng season
  const renderSeasonTable = (seasonList, title, emptyMessage, currentPage, setCurrentPage) => {
    const paginatedList = paginate(seasonList, currentPage);
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="bg-gray-100 px-6 py-3 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {seasonList.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto text-gray-400 mb-2" size={36} />
            <p className="text-gray-500 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên Mùa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày Bắt Đầu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày Kết Thúc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Năm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành Động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedList.map((season) => (
                    <tr key={season.seasonId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-blue-500" />
                          <span className="font-medium text-gray-900">{season.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(season.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(season.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          {season.year}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isSystemSeason(season) ? (
                          <span className="text-xs text-gray-500 italic">Mùa hệ thống</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ActionButton
                              type="edit"
                              onClick={() => handleOpenEditModal(season)}
                              title="Chỉnh sửa"
                            />
                            <ActionButton
                              type="delete"
                              onClick={() => handleDelete(season.seasonId, season.name)}
                              title="Xóa"
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(currentPage, setCurrentPage, seasonList, 'mùa')}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Tăng Giá Theo Mùa</h1>
          <p className="text-gray-600 mt-1">Quản lý các mùa và thời gian tăng giá đặc biệt</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={handleOpenModal}
        >
          <Plus size={20} />
          Tạo Mùa Mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Year Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả các năm</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Mới nhất trước</option>
              <option value="asc">Cũ nhất trước</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ngày bắt đầu"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ngày kết thúc"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={18} className="text-blue-500" />
            <span>Tổng: <strong>{seasons.length}</strong> mùa</span>
          </div>
        </div>
        
        {/* Clear Filter Button */}
        {(startDate || endDate) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Xóa bộ lọc ngày
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Seasons nằm trọn trong khoảng */}
          {renderSeasonTable(
            exactSeasons,
            startDate && endDate 
              ? `Các mùa nằm trọn trong khoảng ${formatDate(startDate)} - ${formatDate(endDate)}` 
              : 'Tất cả các mùa',
            'Không có mùa nào nằm trọn trong khoảng này',
            currentPageExact,
            setCurrentPageExact
          )}

          {/* Seasons giao với khoảng nhưng không nằm trọn */}
          {startDate && endDate && overlapSeasons.length > 0 && renderSeasonTable(
            overlapSeasons,
            `Các mùa có giao với khoảng ${formatDate(startDate)} - ${formatDate(endDate)}`,
            'Không có mùa nào',
            currentPageOverlap,
            setCurrentPageOverlap
          )}
        </>
      )}

      {/* Create Season Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isEditMode ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  {isEditMode ? <Edit className="text-yellow-600" size={24} /> : <Calendar className="text-blue-600" size={24} />}
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditMode ? 'Chỉnh Sửa Mùa' : 'Tạo Mùa Mới'}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Tên mùa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Mùa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VD: Hè 2025, Tết Nguyên Đán 2025..."
                  required
                />
              </div>

              {/* Ngày bắt đầu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày Bắt Đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  min={getTomorrowDate()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ngày bắt đầu phải từ ngày mai ({formatDate(getTomorrowDate())}) trở đi
                </p>
              </div>

              {/* Ngày kết thúc */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày Kết Thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  min={formData.start_date || getTomorrowDate()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu (có thể tạo season 1 ngày)
                </p>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô Tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Nhập mô tả cho mùa này..."
                />
              </div>

              {/* Year Info (Display only) */}
              {formData.start_date && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Năm:</strong> {new Date(formData.start_date).getFullYear()} 
                    <span className="ml-2 text-xs text-blue-600">(Tự động lấy từ ngày bắt đầu)</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                    isEditMode 
                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isEditMode ? <Edit size={18} /> : <Plus size={18} />}
                  {isEditMode ? 'Cập Nhật' : 'Tạo Mùa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonManagementPage;
