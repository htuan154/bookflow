// src/pages/admin/TouristLocation/TouristLocationDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Edit, ArrowLeft, Image as ImageIcon, Plus, X } from 'lucide-react';
import useTouristLocation from '../../../hooks/useTouristLocation';
import useFoodRecommendation from '../../../hooks/useFoodRecommendation';
import { ActionButtonsGroup } from '../../../components/common/ActionButton';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../../components/common/Toast';

const TouristLocationDetailPage = () => {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { locations, fetchAll, deleteLocation, updateLocation } = useTouristLocation();
  const { foods, fetchByLocation, createFood, deleteFood } = useFoodRecommendation();
  
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [deleteConfirmLocation, setDeleteConfirmLocation] = useState(null);
  const [deleteConfirmFood, setDeleteConfirmFood] = useState(null);

  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchAll();
      } catch (error) {
        console.error('Error loading location:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchAll]);

  useEffect(() => {
    if (locations.length > 0 && locationId) {
      const found = locations.find(loc => loc.locationId === locationId);
      setLocation(found);
      
      if (found) {
        fetchByLocation(locationId);
      }
    }
  }, [locations, locationId, fetchByLocation]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy địa điểm</h2>
          <button
            onClick={() => navigate('/admin/tourist-locations')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const handleViewLocation = () => {
    // Already on detail page, scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditLocation = () => {
    setShowEditModal(true);
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

    await updateLocation(location.locationId, data);
    setShowEditModal(false);
    // Reload data
    await fetchAll();
  };

  const handleDeleteLocation = async () => {
    setDeleteConfirmLocation(location);
  };

  const confirmDeleteLocation = async () => {
    if (!deleteConfirmLocation) return;
    
    try {
      await deleteLocation(deleteConfirmLocation.locationId);
      showSuccess(`Đã xóa địa điểm "${deleteConfirmLocation.name}" thành công!`);
      navigate('/admin/tourist-locations');
    } catch (error) {
      console.error('Delete error:', error);
      showError('Có lỗi xảy ra khi xóa địa điểm. Vui lòng thử lại.');
    } finally {
      setDeleteConfirmLocation(null);
    }
  };

  const handleAddFood = () => {
    setShowAddFoodModal(true);
  };

  const handleSaveFood = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      location_id: location.locationId,
      name: formData.get('name'),
      description: formData.get('description'),
      image_url: formData.get('imageUrl') || null,
      latitude: parseFloat(formData.get('latitude')) || null,
      longitude: parseFloat(formData.get('longitude')) || null,
    };
    await createFood(data);
    setShowAddFoodModal(false);
    await fetchByLocation(location.locationId);
  };

  const handleViewFood = (food) => {
    navigate(`/admin/food-recommendations/${food.foodId}`);
  };

  const handleEditFood = (food) => {
    navigate(`/admin/tourist-locations`, { state: { editFood: food } });
  };

  const handleDeleteFood = async (food) => {
    setDeleteConfirmFood(food);
  };

  const confirmDeleteFood = async () => {
    if (!deleteConfirmFood) return;
    
    try {
      await deleteFood(deleteConfirmFood.foodId);
      await fetchByLocation(locationId);
      showSuccess(`Đã xóa món ăn "${deleteConfirmFood.name}" thành công!`);
    } catch (error) {
      console.error('Delete error:', error);
      showError('Có lỗi xảy ra khi xóa món ăn. Vui lòng thử lại.');
    } finally {
      setDeleteConfirmFood(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/tourist-locations')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4" />
          <span>Chỉnh sửa</span>
        </button>
      </div>

      {/* Location Info Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {/* Image */}
        <div className="w-full h-96 bg-gray-200 flex items-center justify-center overflow-hidden">
          {location.imageUrl ? (
            <img
              src={location.imageUrl}
              alt={location.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-full h-full flex flex-col items-center justify-center ${location.imageUrl ? 'hidden' : 'flex'}`}
          >
            <ImageIcon className="w-20 h-20 text-gray-400 mb-2" />
            <span className="text-gray-400">Chưa có hình ảnh</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{location.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">Thành phố:</span>
              </div>
              <p className="text-gray-900 ml-7">{location.city}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Navigation className="w-5 h-5" />
                <span className="font-semibold">Tọa độ:</span>
              </div>
              <p className="text-gray-900 ml-7">
                Vĩ độ: {location.latitude}, Kinh độ: {location.longitude}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">Mô tả:</h3>
            <p className="text-gray-600 leading-relaxed">{location.description}</p>
          </div>

          <div className="text-sm text-gray-500">
            <p>ID: {location.locationId}</p>
          </div>
        </div>
         {/* Google Maps Button */}
      <div className="mt-6 mb-8 text-center">
        <a
          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <MapPin className="w-5 h-5" />
          <span>Xem trên Google Maps</span>
        </a>
      </div>
      </div>

      {/* Food Recommendations Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gợi ý món ăn</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{foods.length} món ăn</span>
            <button
              onClick={handleAddFood}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm món ăn</span>
            </button>
          </div>
        </div>

        {foods.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Chưa có gợi ý món ăn nào cho địa điểm này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {foods.map((food) => (
              <div
                key={food.foodId}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Food Image */}
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {food.imageUrl ? (
                    <img
                      src={food.imageUrl}
                      alt={food.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full flex flex-col items-center justify-center ${food.imageUrl ? 'hidden' : 'flex'}`}
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-400 text-sm">Chưa có hình ảnh</span>
                  </div>
                </div>

                {/* Food Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                    {food.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {food.description}
                  </p>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    <p>Vĩ độ: {food.latitude}</p>
                    <p>Kinh độ: {food.longitude}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleViewFood(food)}
                        title="Xem"
                        className="mx-1 p-1 rounded hover:bg-gray-100 focus:outline-none transition-colors text-green-600"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteFood(food)}
                        title="Xoá"
                        className="mx-1 p-1 rounded hover:bg-gray-100 focus:outline-none transition-colors text-red-600"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Food Modal */}
      {showAddFoodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Thêm món ăn mới</h2>
                <button
                  onClick={() => setShowAddFoodModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveFood} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên món ăn *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    name="description"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL hình ảnh</label>
                  <input
                    type="url"
                    name="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (-90 đến 90))</label>
                    <input
                      type="number"
                      name="latitude"
                      step="any"
                      min="-90"
                      max="90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (-180 đến 180)</label>
                    <input
                      type="number"
                      name="longitude"
                      step="any"
                      min="-180"
                      max="180"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 font-medium"
                  >
                    Thêm món ăn
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFoodModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa địa điểm</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveLocation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên địa điểm *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={location.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thành phố *
                  </label>
                  <select
                    name="city"
                    defaultValue={location.city}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn thành phố</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Bắc Ninh">Bắc Ninh</option>
                    <option value="Quảng Ninh">Quảng Ninh</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Hưng Yên">Hưng Yên</option>
                    <option value="Ninh Bình">Ninh Bình</option>
                    <option value="Cao Bằng">Cao Bằng</option>
                    <option value="Tuyên Quang">Tuyên Quang</option>
                    <option value="Lào Cai">Lào Cai</option>
                    <option value="Thái Nguyên">Thái Nguyên</option>
                    <option value="Lạng Sơn">Lạng Sơn</option>
                    <option value="Phú Thọ">Phú Thọ</option>
                    <option value="Điện Biên">Điện Biên</option>
                    <option value="Lai Châu">Lai Châu</option>
                    <option value="Sơn La">Sơn La</option>
                    <option value="Thanh Hóa">Thanh Hóa</option>
                    <option value="Nghệ An">Nghệ An</option>
                    <option value="Hà Tĩnh">Hà Tĩnh</option>
                    <option value="Quảng Trị">Quảng Trị</option>
                    <option value="Huế">Huế</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Quảng Ngãi">Quảng Ngãi</option>
                    <option value="Khánh Hòa">Khánh Hòa</option>
                    <option value="Gia Lai">Gia Lai</option>
                    <option value="Đắk Lắk">Đắk Lắk</option>
                    <option value="Lâm Đồng">Lâm Đồng</option>
                    <option value="Tây Ninh">Tây Ninh</option>
                    <option value="Đồng Nai">Đồng Nai</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Vĩnh Long">Vĩnh Long</option>
                    <option value="Đồng Tháp">Đồng Tháp</option>
                    <option value="An Giang">An Giang</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Cà Mau">Cà Mau</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả *
                  </label>
                  <textarea
                    name="description"
                    defaultValue={location.description}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL hình ảnh
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    defaultValue={location.imageUrl}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vĩ độ (Latitude)
                    </label>
                    <input
                      type="number"
                      name="latitude"
                      defaultValue={location.latitude}
                      step="any"
                      min="-90"
                      max="90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kinh độ (Longitude)
                    </label>
                    <input
                      type="number"
                      name="longitude"
                      defaultValue={location.longitude}
                      step="any"
                      min="-180"
                      max="180"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
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

export default TouristLocationDetailPage;
