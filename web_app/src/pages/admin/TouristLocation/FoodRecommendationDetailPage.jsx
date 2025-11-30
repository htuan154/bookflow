// src/pages/admin/TouristLocation/FoodRecommendationDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Edit, ArrowLeft, Image as ImageIcon, ExternalLink, X } from 'lucide-react';
import useFoodRecommendation from '../../../hooks/useFoodRecommendation';
import useTouristLocation from '../../../hooks/useTouristLocation';

const FoodRecommendationDetailPage = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const { foods, fetchByLocation, updateFood } = useFoodRecommendation();
  const { locations, fetchAll: fetchAllLocations } = useTouristLocation();
  
  const [food, setFood] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchAllLocations();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchAllLocations]);

  useEffect(() => {
    // Try to find food in current foods list first
    const foundFood = foods.find(f => f.foodId === foodId);
    
    if (foundFood) {
      setFood(foundFood);
      // Find associated location
      const foundLocation = locations.find(loc => loc.locationId === foundFood.locationId);
      setLocation(foundLocation);
    } else if (locations.length > 0) {
      // If not found, we need to search through all locations
      // This is a fallback - normally we'd come here from a location detail page
      let foundInLocation = null;
      let parentLocation = null;
      
      for (const loc of locations) {
        // We would need to fetch foods for each location to find it
        // For now, just show not found
        break;
      }
    }
  }, [foods, locations, foodId]);

  const handleSaveFood = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      location_id: food.locationId,
      name: formData.get('name'),
      description: formData.get('description'),
      image_url: formData.get('imageUrl') || null,
      latitude: parseFloat(formData.get('latitude')) || null,
      longitude: parseFloat(formData.get('longitude')) || null,
    };

    await updateFood(food.foodId, data);
    setShowEditModal(false);
    // Reload data
    await fetchAllLocations();
    if (food.locationId) {
      await fetchByLocation(food.locationId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy món ăn</h2>
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (location) {
              navigate(`/admin/tourist-locations/${location.locationId}`);
            } else {
              navigate('/admin/tourist-locations');
            }
          }}
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

      {/* Food Detail Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Image */}
        <div className="w-full h-96 bg-gray-200 flex items-center justify-center overflow-hidden">
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
            <ImageIcon className="w-20 h-20 text-gray-400 mb-2" />
            <span className="text-gray-400">Chưa có hình ảnh</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{food.name}</h1>
          
          {/* Location Link */}
          {location && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Địa điểm du lịch:</p>
                  <p className="font-semibold text-gray-900">{location.name}</p>
                  <p className="text-sm text-gray-600">{location.city}</p>
                </div>
                <button
                  onClick={() => navigate(`/admin/tourist-locations/${location.locationId}`)}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <span className="text-sm">Xem địa điểm</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Mô tả:</h3>
            <p className="text-gray-600 leading-relaxed">{food.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Navigation className="w-5 h-5" />
                <span className="font-semibold">Vĩ độ:</span>
              </div>
              <p className="text-gray-900 ml-7">{food.latitude}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Navigation className="w-5 h-5" />
                <span className="font-semibold">Kinh độ:</span>
              </div>
              <p className="text-gray-900 ml-7">{food.longitude}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p className="mb-1">ID món ăn: {food.foodId}</p>
              <p>ID địa điểm: {food.locationId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Link (Optional - could integrate Google Maps) */}
      <div className="mt-6 text-center">
        <a
          href={`https://www.google.com/maps?q=${food.latitude},${food.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <MapPin className="w-5 h-5" />
          <span>Xem trên Google Maps</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Edit Food Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa món ăn</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveFood} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên món ăn *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={food.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả *
                  </label>
                  <textarea
                    name="description"
                    defaultValue={food.description}
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
                    defaultValue={food.imageUrl}
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
                      defaultValue={food.latitude}
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
                      defaultValue={food.longitude}
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
    </div>
  );
};

export default FoodRecommendationDetailPage;
