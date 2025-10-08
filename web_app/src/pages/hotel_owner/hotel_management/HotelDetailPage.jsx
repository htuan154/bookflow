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
  AlertCircle
} from 'lucide-react';

const HotelDetailPage = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get hotel data from location state or fetch from API
  const [hotelData, setHotelData] = useState(location.state?.hotel || null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(!hotelData);

  // Mock data for demonstration (replace with real API call)
  useEffect(() => {
    if (!hotelData && hotelId) {
      // TODO: Fetch hotel data from API
      setLoading(false);
    }
  }, [hotelId, hotelData]);

  const handleBack = () => {
    navigate('/hotel-owner/hotel');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin khách sạn...</p>
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
    { id: 'amenities', label: 'Tiện nghi', icon: Star, count: 7 },
    { id: 'images', label: 'Hình ảnh', icon: Camera, count: 12 },
    { id: 'rooms', label: 'Loại phòng', icon: Bed, count: 4 }
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
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{hotelData.phone || 'Chưa có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">10 tháng 7, 2025</p>
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
                        <button className="ml-2 text-blue-600 hover:text-blue-800">
                          Xem chi tiết
                        </button>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Người tạo ID</label>
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono text-sm">
                        {hotelData.user_id || 'Chưa có'}
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
                    <p className="text-lg font-semibold text-gray-900">1 sao</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Giờ nhận phòng</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">14:00:00</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Đánh giá trung bình</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">5.00/5</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Giờ trả phòng</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">12:00:00</p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Tổng số đánh giá</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">1 đánh giá</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'amenities' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Tiện nghi khách sạn
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mock amenities data */}
                {[
                  { name: 'WiFi miễn phí', icon: 'wifi' },
                  { name: 'Bãi đỗ xe', icon: 'parking' },
                  { name: 'Nhà hàng', icon: 'restaurant' },
                  { name: 'Phòng gym', icon: 'gym' },
                  { name: 'Bể bơi', icon: 'pool' },
                  { name: 'An ninh 24/7', icon: 'security' },
                  { name: 'Spa & Massage', icon: 'wifi' }
                ].map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-blue-600">
                      {amenitiesIcons[amenity.icon] || <Star size={16} />}
                    </div>
                    <span className="text-gray-700">{amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-blue-600" />
                Hình ảnh khách sạn (12 ảnh)
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Mock images */}
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bed className="h-5 w-5 mr-2 text-green-600" />
                Loại phòng (4 loại)
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="space-y-4">
                {/* Mock room types */}
                {[
                  { name: 'Phòng Standard', count: 10, price: '500,000 VND' },
                  { name: 'Phòng Deluxe', count: 8, price: '750,000 VND' },
                  { name: 'Phòng Suite', count: 5, price: '1,200,000 VND' },
                  { name: 'Phòng VIP', count: 3, price: '2,000,000 VND' }
                ].map((room, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bed className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{room.name}</h4>
                        <p className="text-sm text-gray-500">{room.count} phòng</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{room.price}</p>
                      <p className="text-sm text-gray-500">/ đêm</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetailPage;