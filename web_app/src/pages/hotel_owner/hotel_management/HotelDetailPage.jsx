// src/pages/hotel_owner/hotel_management/HotelDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Star,
  Globe,
  Camera,
  Users,
  Bed,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Waves,
  Shield,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import useAmenity from '../../../hooks/useAmenity';
import useHotelAmenity from '../../../hooks/useHotelAmenity';
import { useRoomTypeContext } from '../../../context/RoomTypeContext';
import { useRoomContext } from '../../../context/RoomContext';
import { useRoomTypeImageContext } from '../../../context/RoomTypeImageContext';
import useAuth from '../../../hooks/useAuth';
import { hotelApiService } from '../../../api/hotel.service';

const currency = (v) => (v == null ? '—' : Number(v).toLocaleString('vi-VN') + ' đ');

const HotelDetailPage = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Hooks and contexts
  const { user, token } = useAuth();
  const {
    hotelData: allHotelsData,
    loading: hotelLoading,
    error: hotelError,
    fetchOwnerHotel
  } = useHotelOwner();
  const { amenities: masterAmenities, getAmenities } = useAmenity();
  const { getByHotel } = useHotelAmenity();
  const { getByHotel: fetchRoomTypes } = useRoomTypeContext();
  const { getByHotel: fetchRooms } = useRoomContext();
  const { imagesByType, getImages, loadingByType } = useRoomTypeImageContext();

  // Local states
  const [hotelData, setHotelData] = useState(location.state?.hotel || null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Fetch hotel data from API - UPDATED to use hotelApiService like ContractDetail
  const fetchHotelFromAPI = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏨 Fetching hotel detail from REAL API with ID:', id);
      
      // SỬ DỤNG hotelApiService THẬT - như ContractDetail pattern
      const hotelResponse = await hotelApiService.getHotelById(id);
      
      if (hotelResponse && hotelResponse.data) {
        setHotelData(hotelResponse.data);
        console.log('✅ Hotel loaded successfully from API:', hotelResponse.data);
        
        // Fetch related data after getting hotel
        await fetchHotelRelatedData(hotelResponse.data);
      } else {
        throw new Error('Không tìm thấy dữ liệu khách sạn');
      }
      
    } catch (error) {
      console.error('❌ API fetch failed:', error);
      const errorMessage = `Không thể tải thông tin khách sạn: ${error.message}`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // REMOVED - No longer need to depend on context data since we fetch directly from API

  // Fetch related data (images, amenities, rooms) - UPDATED to use hotelApiService
  const fetchHotelRelatedData = async (hotel) => {
    try {
      const hotelIdValue = hotel?.hotel_id || hotel?.id || hotel?.hotelId;
      
      if (!hotelIdValue) return;

      console.log('🔄 Fetching related data for hotel:', hotelIdValue);

      // Fetch images using hotelApiService - like ContractDetail pattern
      try {
        console.log('📷 Fetching images using hotelApiService...');
        const imageData = await hotelApiService.getHotelImages(hotelIdValue);
        console.log('📷 Image API response:', imageData);
        
        // hotelApiService.getHotelImages đã trả về array trực tiếp
        const imagesArray = Array.isArray(imageData) ? imageData : [];
        setImages(imagesArray);
        console.log('📷 Set images:', imagesArray.length, 'items');
      } catch (err) {
        console.warn('Failed to fetch images:', err);
        setImages([]);
      }

      // Fetch amenities using hotelApiService - like ContractDetail pattern
      try {
        console.log('🎯 Fetching amenities using hotelApiService...');
        const amenityData = await hotelApiService.getHotelAmenities(hotelIdValue);
        console.log('🎯 Amenities API response:', amenityData);
        
        // hotelApiService trả về array trực tiếp hoặc có .data
        const amenitiesArray = Array.isArray(amenityData) ? amenityData : (amenityData?.data || []);
        setAmenities(amenitiesArray);
        console.log('🎯 Set amenities:', amenitiesArray.length, 'items');
      } catch (err) {
        console.warn('Failed to fetch amenities:', err);
        setAmenities([]);
      }

      // Fetch room types using hotelApiService - like ContractDetail pattern
      try {
        console.log('🛏️ Fetching room types using hotelApiService...');
        const roomTypeData = await hotelApiService.getHotelRoomTypes(hotelIdValue);
        console.log('🛏️ Room types API response:', roomTypeData);
        
        const roomTypesArray = Array.isArray(roomTypeData) ? roomTypeData : (roomTypeData?.data || []);
        setRoomTypes(roomTypesArray);
        console.log('🛏️ Set room types:', roomTypesArray.length, 'items');
      } catch (err) {
        console.warn('Failed to fetch room types:', err);
        setRoomTypes([]);
      }

      // Fetch rooms using context (fallback) - hotelApiService doesn't have getAllRoomsByHotelId
      try {
        console.log('🏠 Fetching rooms using context...');
        const roomData = await fetchRooms(hotelIdValue);
        const roomsArray = Array.isArray(roomData) ? roomData : [];
        setRooms(roomsArray);
        console.log('🏠 Set rooms:', roomsArray.length, 'items');
      } catch (err) {
        console.warn('Failed to fetch rooms:', err);
        setRooms([]);
      }

      // Fetch master amenities for details
      try {
        await getAmenities();
      } catch (err) {
        console.warn('Failed to fetch master amenities:', err);
      }

    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  };

  useEffect(() => {
    console.log('🔥 HotelDetailPage useEffect');
    console.log('hotelId:', hotelId, typeof hotelId);
    console.log('hotel from location.state:', location.state?.hotel);
    
    // Nếu đã có hotel từ location.state, sử dụng luôn - như ContractDetail pattern
    if (location.state?.hotel) {
      console.log('✅ Using hotel from location.state');
      setHotelData(location.state.hotel);
      fetchHotelRelatedData(location.state.hotel);
      setLoading(false);
      return;
    }

    // Check if hotelId is valid before API call
    if (hotelId && hotelId !== 'undefined' && hotelId.trim() !== '') {
      console.log('✅ Valid hotelId, fetching from API:', hotelId);
      fetchHotelFromAPI(hotelId);
    } else {
      console.error('❌ Invalid hotelId:', hotelId);
      console.error('❌ URL params:', { hotelId });
      console.error('❌ Location:', location);
      setError(`ID khách sạn không hợp lệ: "${hotelId}"`);
      setLoading(false);
    }
  }, [hotelId, location.state?.hotel]);

  // Use amenities directly since API returns complete data with name and iconUrl
  const amenitiesDetails = React.useMemo(() => {
    if (!amenities) return [];
    
    console.log('🎯 Processing amenities for display:', amenities);
    // API trả về đầy đủ data rồi, không cần map với masterAmenities
    return amenities;
  }, [amenities]);

  // Count room type images - MOVED BEFORE EARLY RETURNS
  const roomTypeImagesCount = React.useMemo(() => {
    if (!roomTypes || !imagesByType) return 0;
    
    return roomTypes.reduce((total, roomType) => {
      const typeId = roomType.room_type_id || roomType.roomTypeId || roomType.id;
      const typeImages = imagesByType[typeId] || [];
      return total + typeImages.length;
    }, 0);
  }, [roomTypes, imagesByType]);

  // Helper function to get hotel ID safely
  const getHotelId = () => {
    return hotelData?.hotel_id || hotelData?.id || hotelData?.hotelId || hotelId;
  };

  const handleBack = () => {
    navigate('/hotel-owner/hotel');
  };

  if (loading || hotelLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin khách sạn...</p>
        </div>
      </div>
    );
  }

  if (error || hotelError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-4">{error || hotelError}</p>
          <div className="space-x-3">
            <button
              onClick={() => fetchHotelFromAPI(hotelId)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy khách sạn</h2>
          <p className="text-gray-600 mb-4">Khách sạn bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status) => {
    const statusConfig = {
      draft: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: Clock, 
        text: 'Nháp' 
      },
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: AlertCircle, 
        text: 'Chờ duyệt' 
      },
      approved: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        text: 'Đã duyệt' 
      },
      active: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: CheckCircle, 
        text: 'Đang hoạt động' 
      },
      inactive: { 
        color: 'bg-gray-100 text-gray-600', 
        icon: XCircle, 
        text: 'Ngừng hoạt động' 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle, 
        text: 'Bị từ chối' 
      }
    };
    return statusConfig[status] || statusConfig.draft;
  };

  const statusInfo = getStatusInfo(hotelData.status);
  const StatusIcon = statusInfo.icon;

  const amenitiesIcons = {
    wifi: <Wifi size={16} />,
    parking: <Car size={16} />,
    restaurant: <Utensils size={16} />,
    gym: <Dumbbell size={16} />,
    pool: <Waves size={16} />,
    security: <Shield size={16} />,
  };

  const tabs = [
    { id: 'details', label: 'Thông tin khách sạn', icon: Building2 },
    { id: 'amenities', label: 'Tiện nghi', icon: Star, count: amenitiesDetails.length },
    { id: 'images', label: 'Hình ảnh', icon: Camera, count: images.length },
    { id: 'rooms', label: 'Loại phòng', icon: Bed, count: roomTypes.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{hotelData.name}</h1>
                <p className="text-blue-100 mt-1">
                  Chi tiết thông tin khách sạn
                </p>
                <p className="text-sm text-blue-200 mt-1">
                  ID: {hotelData.hotel_id || hotelData.id || hotelData.hotelId}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span className="text-lg font-semibold">5.00/5</span>
              </div>
              <p className="text-sm text-blue-200">1 đánh giá • 1 sao</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                    Thông tin cơ bản
                  </h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusInfo.text}
                  </span>
                </div>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cột trái */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{hotelData.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{hotelData.address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{hotelData.phoneNumber || hotelData.phone || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                        {hotelData.created_at ? new Date(hotelData.created_at).toLocaleDateString('vi-VN') : 'Chưa có'}
                      </p>
                    </div>
                  </div>

                  {/* Cột phải */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <div className="bg-gray-50 px-3 py-2 rounded-md">
                        <span className="inline-flex items-center text-sm">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            hotelData.status === 'approved' ? 'bg-green-500' :
                            hotelData.status === 'pending' ? 'bg-yellow-500' :
                            hotelData.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          Hoạt động
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{hotelData.email || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{hotelData.city}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Khách sạn ID</label>
                      <p className="text-gray-900 bg-blue-50 px-3 py-2 rounded-md font-mono text-sm">
                        {hotelData.hotel_id || hotelData.id || hotelData.hotelId}
                        {/* <button className="ml-2 text-blue-600 hover:text-blue-800">
                          Xem chi tiết
                        </button> */}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Người tạo ID</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono text-sm">
                        {hotelData.user_id || hotelData.userId || user?.userId || 'Chưa có'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chi tiết khách sạn */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Chi tiết khách sạn
                </h3>
              </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Hạng sao</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{hotelData.star_rating || hotelData.rating || '1'} sao</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Giờ nhận phòng</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{hotelData.check_in_time || '14:00:00'}</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Đánh giá trung bình</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{hotelData.average_rating || '0.00'}/5</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Giờ trả phòng</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{hotelData.check_out_time || '12:00:00'}</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Tổng số đánh giá</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{hotelData.total_reviews || '0'} đánh giá</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amenities' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Tiện nghi khách sạn
                </h3>
                {hotelData.status === 'draft' && (
                  <button
                    onClick={() => navigate('/hotel-owner/hotel/amenities', { 
                      state: { 
                        hotel: hotelData,
                        lockHotel: true,
                        returnTo: `/hotel-owner/hotel/${getHotelId()}`
                      } 
                    })}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Thêm tiện nghi
                  </button>
                )}
              </div>
            </div>
            <div className="px-6 py-6">
              {amenitiesDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {amenitiesDetails.map((amenity, index) => {
                    console.log('🎯 Amenity item:', amenity); // Debug log
                    const iconUrl = amenity.iconUrl || amenity.icon_url || amenity.icon;
                    const amenityName = amenity.name;
                    
                    return (
                      <div key={amenity.amenityId || amenity.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 flex-shrink-0">
                          {iconUrl && iconUrl.startsWith('http') ? (
                            <img 
                              src={iconUrl} 
                              alt={amenityName}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                console.warn('Failed to load amenity icon:', iconUrl);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'inline-block';
                              }}
                            />
                          ) : null}
                          <Star 
                            size={16} 
                            className="text-blue-600"
                            style={{ display: iconUrl && iconUrl.startsWith('http') ? 'none' : 'inline-block' }}
                          />
                        </div>
                        <span className="text-gray-700">{amenityName}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có tiện nghi nào được thêm</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-blue-600" />
                  Hình ảnh khách sạn ({images.length} ảnh)
                </h3>
                {hotelData.status === 'draft' && (
                  <button
                    onClick={() => navigate('/hotel-owner/hotel/images', { 
                      state: { 
                        hotel: hotelData,
                        lockHotel: true,
                        returnTo: `/hotel-owner/hotel/${getHotelId()}`
                      } 
                    })}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Thêm hình ảnh
                  </button>
                )}
              </div>
              {/* Debug info
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                  <div><strong>🐛 Debug API Info:</strong></div>
                  <div>📷 Images: {images.length} items</div>
                  <div>🎯 Amenities: {amenities.length} items</div>
                  <div>🛏️ Room Types: {roomTypes.length} items</div>
                  <div>🏠 Rooms: {rooms.length} items</div>
                  {images.length > 0 && (
                    <div className="mt-1">
                      <strong>Sample Image:</strong> {JSON.stringify(images[0], null, 2).substring(0, 150)}...
                    </div>
                  )}
                  {amenities.length > 0 && (
                    <div className="mt-1">
                      <strong>Sample Amenity:</strong> {JSON.stringify(amenities[0], null, 2).substring(0, 200)}...
                    </div>
                  )}
                </div>
              )} */}
            </div>
            <div className="px-6 py-6">
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => {
                    const imageId = image.imageId || image.id || index;
                    const imageUrl = image.imageUrl || image.url || image.image_url;
                    console.log(`🖼️ Image ${index}:`, { imageId, imageUrl, image });
                    
                    return (
                      <div key={imageId} className="relative group">
                        <img
                          src={imageUrl}
                          alt={image.caption || `Hotel image ${index + 1}`}
                          className="aspect-square object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                          onError={(e) => {
                            console.error(`❌ Failed to load image: ${imageUrl}`);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={() => {
                            console.log(`✅ Successfully loaded image: ${imageUrl}`);
                          }}
                        />
                        <div className="aspect-square bg-gray-200 rounded-lg items-center justify-center hidden">
                          <Camera className="h-8 w-8 text-gray-400" />
                          <p className="text-xs text-gray-500 mt-2">Không thể tải ảnh</p>
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg"></div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có hình ảnh nào</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-6">
            {/* Header với nút thêm loại phòng */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Bed className="h-5 w-5 mr-2 text-green-600" />
                    Loại phòng ({roomTypes.length} loại)
                  </h3>
                  {hotelData.status === 'draft' && (
                    <button
                      onClick={() => navigate('/hotel-owner/rooms/types', { 
                        state: { 
                          hotel: hotelData,
                          lockHotel: true,
                          returnTo: `/hotel-owner/hotel/${getHotelId()}`
                        } 
                      })}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm loại phòng
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Danh sách loại phòng theo layout hình 2 */}
            {roomTypes.length > 0 ? (
              <div className="space-y-4">
                {roomTypes.map((roomType, index) => {
                  
                  // Count rooms of this type
                  const roomsOfType = rooms.filter(room => 
                    room.room_type_id === roomType.room_type_id || 
                    room.roomTypeId === roomType.room_type_id ||
                    room.room_type_id === roomType.roomTypeId ||
                    room.room_type_id === roomType.id ||
                    room.roomTypeId === roomType.id
                  );

                  // Get images for this room type - search by multiple possible ID fields
                  const roomTypeImages = imagesByType[roomType.id] || 
                                        imagesByType[roomType.room_type_id] || 
                                        imagesByType[roomType.roomTypeId] || [];
                  
                  // Find thumbnail image first, if not found use first available image
                  const thumbnailImage = roomTypeImages.find(img => img.isThumbnail === true || img.is_thumbnail === true) || 
                                        roomTypeImages[0];

                  return (
                    <div key={roomType.id || roomType.room_type_id || index} className="bg-white rounded-lg shadow-sm border border-gray-200">
                      {/* Room type card header với giá */}
                      <div className="bg-blue-50 px-6 py-4 rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Bed className="h-5 w-5 text-blue-600 mr-2" />
                            <h4 className="text-lg font-semibold text-gray-900">{roomType.name}</h4>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600">
                              {currency(roomType.basePrice || roomType.base_price)}
                            </div>
                            <div className="text-sm text-gray-600">/ đêm</div>
                          </div>
                        </div>
                      </div>

                      {/* Room type content */}
                      <div className="px-6 py-6">
                        <div className="flex gap-6">
                          {/* Thumbnail image */}
                          {thumbnailImage ? (
                            <div className="w-80 h-60 flex-shrink-0">
                              <img
                                src={thumbnailImage.imageUrl}
                                alt={roomType.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-80 h-60 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Camera className="h-12 w-12 text-gray-400" />
                            </div>
                          )}

                          {/* Room type info */}
                          <div className="flex-1 flex justify-between">
                            {/* Left column - Basic info */}
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-semibold text-gray-700 mb-2">Mô tả</h5>
                                <p className="text-gray-600">{roomType.description || `Phòng ${roomType.name}`}</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Sức chứa</span>
                                  <div className="font-semibold">{roomType.maxOccupancy || roomType.max_occupancy} người</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Diện tích</span>
                                  <div className="font-semibold">{roomType.areaSqm || roomType.area_sqm} m²</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Loại giường</span>
                                  <div className="font-semibold">{roomType.bedType || roomType.bed_type}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Số phòng</span>
                                  <div className="font-semibold">{roomsOfType.length} phòng</div>
                                </div>
                              </div>
                            </div>

                            {/* Right column - Additional info */}
                            <div className="text-right space-y-4">
                              <div>
                                <h5 className="font-semibold text-gray-700 mb-2">Thông tin bổ sung</h5>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">Ngày tạo:</span>
                                    <div>{roomType.createdAt ? new Date(roomType.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Mã khách sạn:</span>
                                    <div className="font-mono text-xs">{getHotelId()}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action button */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => {
                              // Ưu tiên roomTypeId vì đó là field đúng từ API
                              const roomTypeId = roomType.roomTypeId || roomType.id || roomType.room_type_id;
                              console.log(`🎯 Navigate to room type detail:`, {
                                roomTypeId,
                                roomType,
                                url: `/hotel-owner/rooms/types/${roomTypeId}/detail`
                              });
                              
                              if (!roomTypeId) {
                                console.error('❌ Cannot navigate: Room Type ID is undefined');
                                alert('Không thể xem chi tiết: Thiếu ID loại phòng');
                                return;
                              }
                              
                              navigate(`/hotel-owner/rooms/types/${roomTypeId}/detail`, {
                                state: {
                                  hotel: hotelData,
                                  hotelId: getHotelId(),
                                  roomType: roomType,
                                  lockHotel: true,
                                  returnTo: `/hotel-owner/hotel/${getHotelId()}`,
                                  hotelStatus: hotelData.status // Truyền thêm trạng thái khách sạn
                                }
                              });
                            }}
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            👁️ Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="text-center py-12">
                  <Bed className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có loại phòng nào</h3>
                  <p className="text-gray-500 mb-6">Thêm loại phòng đầu tiên để bắt đầu quản lý khách sạn của bạn</p>
                  {hotelData.status === 'draft' && (
                    <button
                      onClick={() => navigate('/hotel-owner/rooms/types', { 
                        state: { 
                          hotel: hotelData,
                          lockHotel: true,
                          returnTo: `/hotel-owner/hotel/${getHotelId()}`
                        } 
                      })}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm loại phòng đầu tiên
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetailPage;