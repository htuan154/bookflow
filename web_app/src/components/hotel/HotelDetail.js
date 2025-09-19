// src/components/Hotel/HotelDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hotelApiService } from '../../api/hotel.service';

const HotelDetail = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hotelData, setHotelData] = useState({
    hotel: null,
    amenities: [],
    images: [],
    roomTypes: []
  });
  
  // Room type modal states
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);
  const [roomTypeDetails, setRoomTypeDetails] = useState({
    thumbnail: null,
    images: [],
    rooms: []
  });
  const [loadingRoomTypeDetails, setLoadingRoomTypeDetails] = useState(false);
  const [roomTypeThumbnails, setRoomTypeThumbnails] = useState({});

  useEffect(() => {
    if (hotelId) {
      fetchHotelData(hotelId);
    }
  }, [hotelId]);

  const fetchHotelData = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching hotel data for ID:', id);
      
      // Debug auth status
      const token = localStorage.getItem('token');
      console.log('🔍 Auth token exists:', !!token);
      
      // Gọi API thật để lấy complete hotel data
      const completeData = await hotelApiService.getCompleteHotelData(id);
      
      setHotelData(completeData);
      console.log('✅ Hotel data loaded successfully:', completeData);
      
      // Fetch thumbnails for room types
      if (completeData.roomTypes && completeData.roomTypes.length > 0) {
        await fetchRoomTypeThumbnails(completeData.roomTypes);
      }
      
    } catch (err) {
      console.error('❌ Error fetching hotel data:', err);
      setError(`Không thể tải thông tin khách sạn: ${err.message}`);
      
      // Fallback với mock data để demo
      console.log('🔄 Loading mock data as fallback...');
      const mockHotel = {
        hotel_id: id,
        hotel_name: `Khách sạn Demo ${id.substring(0, 8)}`,
        description: 'Khách sạn sang trọng với đầy đủ tiện nghi hiện đại, phục vụ tốt nhất cho khách hàng.',
        address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '028-1234-5678',
        email: 'contact@hotel.com',
        rating: 4.5,
        total_rooms: 100,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const mockAmenities = [
        { amenity_id: '1', amenity_name: 'Wi-Fi miễn phí', icon: '📶' },
        { amenity_id: '2', amenity_name: 'Bể bơi', icon: '🏊‍♂️' },
        { amenity_id: '3', amenity_name: 'Phòng gym', icon: '💪' },
        { amenity_id: '4', amenity_name: 'Spa', icon: '💆‍♀️' },
        { amenity_id: '5', amenity_name: 'Nhà hàng', icon: '🍽️' }
      ];

      const mockImages = [
        { image_id: '1', image_url: 'https://via.placeholder.com/800x600/4f46e5/ffffff?text=Hotel+Lobby', description: 'Sảnh chính' },
        { image_id: '2', image_url: 'https://via.placeholder.com/800x600/059669/ffffff?text=Hotel+Room', description: 'Phòng nghỉ' },
        { image_id: '3', image_url: 'https://via.placeholder.com/800x600/dc2626/ffffff?text=Restaurant', description: 'Nhà hàng' },
        { image_id: '4', image_url: 'https://via.placeholder.com/800x600/7c3aed/ffffff?text=Swimming+Pool', description: 'Bể bơi' }
      ];

      const mockRoomTypes = [
        { 
          room_type_id: '1', 
          room_type_name: 'Phòng Standard', 
          description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi',
          price_per_night: 1500000,
          max_occupancy: 2,
          room_size: 25,
          amenities: ['Wi-Fi', 'TV', 'Điều hòa']
        },
        { 
          room_type_id: '2', 
          room_type_name: 'Phòng Deluxe', 
          description: 'Phòng cao cấp với view đẹp',
          price_per_night: 2500000,
          max_occupancy: 3,
          room_size: 35,
          amenities: ['Wi-Fi', 'TV', 'Điều hòa', 'Mini bar', 'Balcony']
        }
      ];

      setHotelData({
        hotel: mockHotel,
        amenities: mockAmenities,
        images: mockImages,
        roomTypes: mockRoomTypes
      });
      
      console.log('✅ Mock data loaded successfully');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch thumbnails for room types
  const fetchRoomTypeThumbnails = async (roomTypes) => {
    if (!roomTypes || roomTypes.length === 0) return;
    
    const thumbnails = {};
    
    for (const roomType of roomTypes) {
      try {
        const thumbnail = await hotelApiService.getRoomTypeThumbnail(roomType.roomTypeId);
        console.log('🔍 [HOTEL DETAIL] Thumbnail for', roomType.roomTypeId, ':', thumbnail);
        if (thumbnail) {
          thumbnails[roomType.roomTypeId] = thumbnail;
        }
      } catch (err) {
        console.error(`❌ Error fetching thumbnail for room type ${roomType.roomTypeId}:`, err);
      }
    }
    
    console.log('🔍 [HOTEL DETAIL] All thumbnails:', thumbnails);
    setRoomTypeThumbnails(thumbnails);
  };

  // Fetch detailed room type information
  const fetchRoomTypeDetails = async (roomTypeId) => {
    setLoadingRoomTypeDetails(true);
    try {
      const [imagesResponse, roomsResponse] = await Promise.all([
        hotelApiService.getRoomTypeImages(roomTypeId),
        hotelApiService.getRoomsByRoomType(roomTypeId)
      ]);

      console.log('🔍 [HOTEL DETAIL] Modal details for', roomTypeId, ':', {
        images: imagesResponse,
        rooms: roomsResponse,
        thumbnail: roomTypeThumbnails[roomTypeId]
      });

      setRoomTypeDetails({
        thumbnail: roomTypeThumbnails[roomTypeId] || null,
        images: imagesResponse || [],
        rooms: roomsResponse || []
      });
    } catch (err) {
      console.error('❌ Error fetching room type details:', err);
      setRoomTypeDetails({
        thumbnail: null,
        images: [],
        rooms: []
      });
    } finally {
      setLoadingRoomTypeDetails(false);
    }
  };

  // Handle room type click
  const handleRoomTypeClick = async (roomType) => {
    setSelectedRoomType(roomType);
    setShowRoomTypeModal(true);
    await fetchRoomTypeDetails(roomType.roomTypeId);
  };

  // Close room type modal
  const closeRoomTypeModal = () => {
    setShowRoomTypeModal(false);
    setSelectedRoomType(null);
    setRoomTypeDetails({
      thumbnail: null,
      images: [],
      rooms: []
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <h3 className="text-lg font-semibold text-gray-900">Đang tải thông tin khách sạn...</h3>
          <p className="text-sm text-gray-500">Hotel ID: {hotelId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => fetchHotelData(hotelId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { hotel, amenities, images, roomTypes } = hotelData;

  // Debug: Log the actual data structure
  console.log('🔍 [HOTEL DETAIL] Data structure:', {
    hotel: hotel,
    amenitiesCount: amenities?.length,
    imagesCount: images?.length,
    roomTypesCount: roomTypes?.length,
    sampleImage: images?.[0]
  });

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Không tìm thấy thông tin khách sạn</h3>
          <p className="text-gray-600">Hotel ID: {hotelId}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold">{hotel.name}</h1>
                <p className="text-orange-100 mt-1">Chi tiết thông tin khách sạn</p>
                <p className="text-orange-200 text-sm">ID: {hotel.hotelId}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(hotel.averageRating || 0) ? 'text-yellow-400' : 'text-orange-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 font-semibold">{hotel.averageRating || 0}/5</span>
              </div>
              <p className="text-orange-100 text-sm mt-1">
                {hotel.totalReviews || 0} đánh giá • {hotel.starRating || 'N/A'} sao
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-0">
            {[
              { key: 'info', label: 'Thông tin khách sạn', icon: '🏨', count: null },
              { key: 'amenities', label: 'Tiện nghi', icon: '🛎️', count: amenities.length },
              { key: 'images', label: 'Hình ảnh', icon: '📸', count: images.length },
              { key: 'rooms', label: 'Loại phòng', icon: '🛏️', count: roomTypes.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-6 border-b-3 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.key 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'info' && (
          <div className="space-y-8">
            {/* Basic Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-3">ℹ️</span>
                  Thông tin cơ bản
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Tên khách sạn</label>
                      <p className="text-lg font-medium text-gray-900 mt-1">{hotel.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Địa chỉ</label>
                      <p className="text-gray-900 mt-1">{hotel.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Số điện thoại</label>
                      <p className="text-gray-900 mt-1">{hotel.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Email</label>
                      <p className="text-gray-900 mt-1">{hotel.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Thành phố</label>
                      <p className="text-gray-900 mt-1">{hotel.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Ngày tạo</label>
                      <p className="text-gray-900 mt-1">{formatDate(hotel.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 flex items-center">
                  <span className="mr-3">🏨</span>
                  Chi tiết khách sạn
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Hạng sao</label>
                      <p className="text-gray-900 mt-1 flex items-center">
                        <span className="text-yellow-500 mr-2">⭐</span>
                        {hotel.starRating || 'Chưa xếp hạng'} sao
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Trạng thái</label>
                      <p className="text-gray-900 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          hotel.status === 'active' ? 'bg-green-100 text-green-800' : 
                          hotel.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {hotel.status === 'active' ? 'Hoạt động' : 
                           hotel.status === 'inactive' ? 'Không hoạt động' : 
                           hotel.status || 'Không rõ'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Giờ nhận phòng</label>
                      <p className="text-gray-900 mt-1">{hotel.checkInTime || 'Chưa có thông tin'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Giờ trả phòng</label>
                      <p className="text-gray-900 mt-1">{hotel.checkOutTime || 'Chưa có thông tin'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Đánh giá trung bình</label>
                      <p className="text-gray-900 mt-1 flex items-center">
                        <span className="text-yellow-500 mr-2">⭐</span>
                        {hotel.averageRating || 0}/5
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Tổng số đánh giá</label>
                      <p className="text-gray-900 mt-1">{hotel.totalReviews || 0} đánh giá</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <span className="mr-3">📝</span>
                  Mô tả
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-900 leading-relaxed">{hotel.description}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amenities' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
                <h3 className="text-lg font-bold text-green-900 flex items-center">
                  <span className="mr-3">🛎️</span>
                  Tiện nghi khách sạn ({amenities.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {amenities.map((amenity) => (
                    <div key={amenity.amenityId || amenity.amenity_id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                        {amenity.iconUrl ? (
                          <img
                            src={amenity.iconUrl || amenity.icon}
                            alt={amenity.name || amenity.amenity_name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              console.log('❌ Amenity icon failed to load:', amenity.iconUrl);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span className="text-2xl" style={{ display: amenity.iconUrl ? 'none' : 'block' }}>
                          🛎️
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{amenity.name || amenity.amenity_name}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{amenity.description || 'Không có mô tả'}</p>
                        {/* <p className="text-xs text-gray-400 mt-1 truncate">ID: {amenity.amenityId || amenity.amenity_id}</p> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 flex items-center">
                  <span className="mr-3">📸</span>
                  Hình ảnh khách sạn ({images.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {images.map((image) => (
                    <div key={image.imageId || image.image_id || image.id} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={image.imageUrl || image.image_url || image.url}
                          alt={image.caption || image.description || 'Hotel image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('❌ Image failed to load:', image.imageUrl || image.image_url || image.url);
                            e.target.src = 'https://via.placeholder.com/400x300/e5e7eb/9ca3af?text=Image+Not+Available';
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully:', image.imageUrl || image.image_url || image.url);
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-gray-900">{image.caption || image.description || 'Không có mô tả'}</p>
                        {/* <p className="text-sm text-gray-500 mt-1">ID: {image.imageId || image.image_id || image.id}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate">URL: {image.imageUrl || image.image_url || image.url}</p> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-6">
            {roomTypes && roomTypes.length > 0 ? (
              roomTypes.map((roomType) => (
                <div key={roomType.roomTypeId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => handleRoomTypeClick(roomType)}>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-blue-900 flex items-center">
                        <span className="mr-3">🛏️</span>
                        {roomType.name}
                      </h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(roomType.basePrice)}</p>
                        <p className="text-sm text-blue-600">/ đêm</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Thumbnail section */}
                      <div className="lg:col-span-1">
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          {roomTypeThumbnails[roomType.roomTypeId] ? (
                            <img 
                              src={roomTypeThumbnails[roomType.roomTypeId].imageUrl || roomTypeThumbnails[roomType.roomTypeId]} 
                              alt={roomTypeThumbnails[roomType.roomTypeId].caption || `${roomType.name} thumbnail`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center text-gray-400 ${roomTypeThumbnails[roomType.roomTypeId] ? 'hidden' : 'flex'}`}>
                            <div className="text-center">
                              <div className="text-4xl mb-2">📷</div>
                              <p className="text-sm">Chưa có hình ảnh</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            👁️ Xem chi tiết
                          </button>
                        </div>
                      </div>
                      
                      {/* Information sections */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-semibold text-gray-600">Mô tả</label>
                            <p className="text-gray-900 mt-1">{roomType.description || 'Chưa có mô tả'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-600">Sức chứa</label>
                              <p className="text-gray-900 mt-1">{roomType.maxOccupancy} người</p>
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-600">Diện tích</label>
                              <p className="text-gray-900 mt-1">{roomType.areaSqm} m²</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-gray-600">Loại giường</label>
                              <p className="text-gray-900 mt-1">{roomType.bedType || 'Chưa có thông tin'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-semibold text-gray-600">Số phòng</label>
                              <p className="text-gray-900 mt-1">{roomType.numberOfRooms} phòng</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-600 mb-3 block">Thông tin bổ sung</label>
                          <div className="space-y-2">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">Ngày tạo:</span>
                              <span className="text-gray-900">
                                {roomType.createdAt ? new Date(roomType.createdAt).toLocaleDateString('vi-VN') : 'Chưa có thông tin'}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">Mã khách sạn:</span>
                              <span className="text-gray-900">{roomType.hotelId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🛏️</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Chưa có thông tin loại phòng</h3>
                <p className="text-gray-500">Khách sạn này chưa có dữ liệu về các loại phòng.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Room Type Detail Modal */}
      {showRoomTypeModal && selectedRoomType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-blue-900 flex items-center">
                  <span className="mr-3">🛏️</span>
                  {selectedRoomType.name}
                </h2>
                <p className="text-blue-600 mt-1">{formatCurrency(selectedRoomType.basePrice)} / đêm</p>
              </div>
              <button 
                onClick={closeRoomTypeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingRoomTypeDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin chi tiết...</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-8">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Mô tả</label>
                          <p className="text-gray-900 mt-1">{selectedRoomType.description || 'Chưa có mô tả'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Sức chứa</label>
                            <p className="text-gray-900 mt-1">{selectedRoomType.maxOccupancy} người</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Diện tích</label>
                            <p className="text-gray-900 mt-1">{selectedRoomType.areaSqm} m²</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Loại giường</label>
                            <p className="text-gray-900 mt-1">{selectedRoomType.bedType || 'Chưa có thông tin'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Tổng số phòng</label>
                            <p className="text-gray-900 mt-1">{selectedRoomType.numberOfRooms} phòng</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thống kê phòng</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{roomTypeDetails.rooms.length}</div>
                          <div className="text-sm text-gray-600">Phòng có sẵn</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Images Gallery */}
                  {roomTypeDetails.images.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Hình ảnh ({roomTypeDetails.images.length})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {roomTypeDetails.images.map((image, index) => (
                          <div key={image.imageId || index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group">
                            <img 
                              src={image.imageUrl || image} 
                              alt={image.caption || `${selectedRoomType.name} - ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="w-full h-full hidden items-center justify-center text-gray-400">
                              <div className="text-center">
                                <div className="text-2xl mb-1">📷</div>
                                <p className="text-xs">Lỗi tải ảnh</p>
                              </div>
                            </div>
                            {image.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {image.caption}
                              </div>
                            )}
                            {image.isThumbnail && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                Thumbnail
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rooms List */}
                  {roomTypeDetails.rooms.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Danh sách phòng ({roomTypeDetails.rooms.length})</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roomTypeDetails.rooms.map((room) => (
                          <div key={room.roomId} className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{room.roomNumber}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                room.status === 'available' ? 'bg-green-100 text-green-800' :
                                room.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                room.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {room.status === 'available' ? 'Có sẵn' :
                                 room.status === 'occupied' ? 'Đã đặt' :
                                 room.status === 'maintenance' ? 'Bảo trì' : room.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Tầng: {room.floor}</div>
                              {room.view && <div>View: {room.view}</div>}
                              {room.createdAt && (
                                <div>Ngày tạo: {new Date(room.createdAt).toLocaleDateString('vi-VN')}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty States */}
                  {roomTypeDetails.images.length === 0 && roomTypeDetails.rooms.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-3">📋</div>
                      <h3 className="text-lg font-medium text-gray-600 mb-2">Chưa có thông tin chi tiết</h3>
                      <p className="text-gray-500">Loại phòng này chưa có hình ảnh hoặc danh sách phòng.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelDetail;