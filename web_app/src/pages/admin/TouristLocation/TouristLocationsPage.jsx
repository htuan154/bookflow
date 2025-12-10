// src/pages/admin/TouristLocationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Eye, Search, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import useTouristLocation from '../../../hooks/useTouristLocation';
import useFoodRecommendation from '../../../hooks/useFoodRecommendation';
import { ActionButtonsGroup } from '../../../components/common/ActionButton';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../../components/common/Toast';

const CITIES = [
  'Tất cả',
  'Hà Nội', 'Bắc Ninh', 'Quảng Ninh', 'Hải Phòng', 'Hưng Yên', 'Ninh Bình',
  'Cao Bằng', 'Tuyên Quang', 'Lào Cai', 'Thái Nguyên', 'Lạng Sơn', 'Phú Thọ',
  'Điện Biên', 'Lai Châu', 'Sơn La', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh',
  'Quảng Trị', 'Huế', 'Đà Nẵng', 'Quảng Ngãi', 'Khánh Hòa', 'Gia Lai',
  'Đắk Lắk', 'Lâm Đồng', 'Tây Ninh', 'Đồng Nai', 'Hồ Chí Minh', 'Vĩnh Long',
  'Đồng Tháp', 'An Giang', 'Cần Thơ', 'Cà Mau'
];

const PAGE_SIZES = [5, 10, 20, 50, 100];

const TouristLocationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { locations, loading, error, fetchAll, fetchByCityVn, createLocation, updateLocation, deleteLocation } = useTouristLocation();
  const { foods, fetchByLocation: fetchFoodsByLocation, createFood, updateFood, deleteFood } = useFoodRecommendation();

  const [selectedCity, setSelectedCity] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showFoodFormModal, setShowFoodFormModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingFood, setEditingFood] = useState(null);
  const [deleteConfirmLocation, setDeleteConfirmLocation] = useState(null);
  const [deleteConfirmFood, setDeleteConfirmFood] = useState(null);

  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    if (selectedCity === 'Tất cả') {
      fetchAll();
    } else {
      fetchByCityVn(selectedCity);
    }
  }, [selectedCity, fetchAll, fetchByCityVn]);

  // Handle state from navigation (for editing from detail pages)
  useEffect(() => {
    if (location.state?.editLocation) {
      setEditingLocation(location.state.editLocation);
      setShowLocationModal(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
    if (location.state?.addFood) {
      setEditingFood(null);
      setSelectedLocation(location.state.addFood);
      setShowFoodFormModal(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
    if (location.state?.editFood) {
      setEditingFood(location.state.editFood);
      setSelectedLocation({ locationId: location.state.editFood.locationId });
      setShowFoodFormModal(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Filter locations theo search term
  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredLocations.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLocations = filteredLocations.slice(startIndex, startIndex + pageSize);

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleViewLocation = (location) => {
    navigate(`/admin/tourist-locations/${location.locationId}`);
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setShowLocationModal(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setShowLocationModal(true);
  };

  const handleDeleteLocation = async (location) => {
    setDeleteConfirmLocation(location);
  };

  const confirmDeleteLocation = async () => {
    if (!deleteConfirmLocation) return;
    
    try {
      await deleteLocation(deleteConfirmLocation.locationId);
      showSuccess(`Đã xóa địa điểm "${deleteConfirmLocation.name}" thành công!`);
    } catch (error) {
      console.error('Delete error:', error);
      showError('Có lỗi xảy ra khi xóa địa điểm. Vui lòng thử lại.');
    } finally {
      setDeleteConfirmLocation(null);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      city: formData.get('city'),
      image_url: formData.get('imageUrl') || null,
      latitude: parseFloat(formData.get('latitude')) || null,
      longitude: parseFloat(formData.get('longitude')) || null,
    };

    if (editingLocation) {
      await updateLocation(editingLocation.locationId, data);
    } else {
      await createLocation(data);
    }
    setShowLocationModal(false);
  };

  const handleAddFood = () => {
    setEditingFood(null);
    setShowFoodFormModal(true);
  };

  const handleEditFood = (food) => {
    setEditingFood(food);
    setShowFoodFormModal(true);
  };

  const handleDeleteFood = async (food) => {
    setDeleteConfirmFood(food);
  };

  const confirmDeleteFood = async () => {
    if (!deleteConfirmFood) return;
    
    try {
      await deleteFood(deleteConfirmFood.foodId);
      await fetchFoodsByLocation(selectedLocation.locationId);
      showSuccess(`Đã xóa món ăn "${deleteConfirmFood.name}" thành công!`);
    } catch (error) {
      console.error('Delete error:', error);
      showError('Có lỗi xảy ra khi xóa món ăn. Vui lòng thử lại.');
    } finally {
      setDeleteConfirmFood(null);
    }
  };

  const handleSaveFood = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      location_id: selectedLocation.locationId,
      name: formData.get('name'),
      description: formData.get('description'),
      image_url: formData.get('imageUrl') || null,
      latitude: parseFloat(formData.get('latitude')) || null,
      longitude: parseFloat(formData.get('longitude')) || null,
    };

    if (editingFood) {
      await updateFood(editingFood.foodId, data);
    } else {
      await createFood(data);
    }
    setShowFoodFormModal(false);
    await fetchFoodsByLocation(selectedLocation.locationId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="text-orange-500" size={28} />
            Danh lam thắng cảnh
          </h1>
          <p className="text-gray-600 mt-2">Quản lý danh sách địa điểm du lịch và gợi ý món ăn</p>
        </div>
        <button
          onClick={handleAddLocation}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          Thêm địa điểm
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn thành phố
            </label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Page Size */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Hiển thị:</label>
          {PAGE_SIZES.map(size => (
            <button
              key={size}
              onClick={() => handlePageSizeChange(size)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                pageSize === size
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {size}
            </button>
          ))}
          <span className="text-sm text-gray-600">mục/trang</span>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-600">
        Hiển thị {startIndex + 1} - {Math.min(startIndex + pageSize, filteredLocations.length)} trong số {filteredLocations.length} địa điểm
      </div>

      {/* Loading/Error */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          Có lỗi xảy ra: {error.message}
        </div>
      )}

      {/* Locations Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedLocations.map(location => (
            <div
              key={location.locationId}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                {location.imageUrl ? (
                  <img
                    src={location.imageUrl}
                    alt={location.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50">
                    <MapPin className="text-orange-300" size={64} />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-medium text-gray-700 shadow-sm">
                  {location.city}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-lg text-gray-800 line-clamp-2">
                  {location.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {location.description}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <ActionButtonsGroup
                    onView={() => handleViewLocation(location)}
                    onEdit={() => handleEditLocation(location)}
                    onDelete={() => handleDeleteLocation(location)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && filteredLocations.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MapPin className="mx-auto text-gray-300" size={64} />
          <p className="text-gray-600 mt-4">Không tìm thấy địa điểm nào</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>

          {[...Array(totalPages)].map((_, idx) => {
            const page = idx + 1;
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="px-2">...</span>;
            }
            return null;
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Location Form Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingLocation ? 'Sửa địa điểm' : 'Thêm địa điểm mới'}
              </h2>
              <button onClick={() => setShowLocationModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveLocation} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên địa điểm *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingLocation?.name}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố *</label>
                <select
                  name="city"
                  defaultValue={editingLocation?.city}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {CITIES.filter(c => c !== 'Tất cả').map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  name="description"
                  defaultValue={editingLocation?.description}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL ảnh</label>
                <input
                  type="url"
                  name="imageUrl"
                  defaultValue={editingLocation?.imageUrl}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude (-90 đến 90)</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    min="-90"
                    max="90"
                    defaultValue={editingLocation?.latitude}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude (-180 đến 180)</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    min="-180"
                    max="180"
                    defaultValue={editingLocation?.longitude}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  {editingLocation ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Food Modal */}
      {showFoodModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Gợi ý món ăn - {selectedLocation.name}
                </h2>
                <p className="text-gray-600 mt-1">{selectedLocation.city}</p>
              </div>
              <button
                onClick={handleAddFood}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Plus size={18} />
                Thêm món ăn
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {foods.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Chưa có gợi ý món ăn cho địa điểm này</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {foods.map(food => (
                    <div
                      key={food.foodId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {food.imageUrl && (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                          }}
                        />
                      )}
                      <h3 className="font-bold text-lg text-gray-800 mb-2">
                        {food.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {food.description}
                      </p>
                      <div className="flex justify-end">
                        <ActionButtonsGroup
                          onView={() => {}}
                          onEdit={() => handleEditFood(food)}
                          onDelete={() => handleDeleteFood(food)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFoodModal(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Food Form Modal */}
      {showFoodFormModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingFood ? 'Sửa món ăn' : 'Thêm món ăn mới'}
              </h2>
              <button onClick={() => setShowFoodFormModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveFood} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên món ăn *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingFood?.name}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  name="description"
                  defaultValue={editingFood?.description}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL ảnh</label>
                <input
                  type="url"
                  name="imageUrl"
                  defaultValue={editingFood?.imageUrl}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude (-90 đến 90)</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    min="-90"
                    max="90"
                    defaultValue={editingFood?.latitude}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude (-180 đến 180)</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    min="-180"
                    max="180"
                    defaultValue={editingFood?.longitude}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  {editingFood ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFoodFormModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Location */}
      {deleteConfirmLocation && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa địa điểm "<strong>{deleteConfirmLocation.name}</strong>"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmLocation(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteLocation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Food */}
      {deleteConfirmFood && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa món ăn "<strong>{deleteConfirmFood.name}</strong>"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmFood(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteFood}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Xóa
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

export default TouristLocationsPage;
