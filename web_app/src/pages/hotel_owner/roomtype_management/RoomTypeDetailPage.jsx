// src/pages/hotel_owner/roomtype_management/RoomTypeDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, Ruler, Bed, Hash, X, Camera } from 'lucide-react';
import { useRoomTypeContext } from '../../../context/RoomTypeContext';
import { useRoomTypeImageContext } from '../../../context/RoomTypeImageContext';
import { useRoomContext } from '../../../context/RoomContext';
import useAuth from '../../../hooks/useAuth';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const currency = (v) => (v == null ? '—' : Number(v).toLocaleString('vi-VN') + ' đ');

const RoomTypeDetailPage = () => {
  const { roomTypeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Auth hook for API calls
  const { token } = useAuth();
  
  // States
  const [roomType, setRoomType] = useState(null);
  const [images, setImages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Contexts
  const { getById: getRoomType } = useRoomTypeContext();
  const { imagesByType, getImages: fetchImages } = useRoomTypeImageContext();
  const { getByRoomType: fetchRooms } = useRoomContext();

  // Get hotel info from navigation state or URL
  const hotelFromState = location.state?.hotel;
  const hotelId = location.state?.hotelId || hotelFromState?.hotel_id || hotelFromState?.hotelId || hotelFromState?.id;
  const hotelStatus = location.state?.hotelStatus || hotelFromState?.status;
  
  // Debug log để kiểm tra hotelStatus
  console.log('🏨 RoomTypeDetailPage - Hotel Status:', {
    hotelStatus,
    fromLocationState: location.state?.hotelStatus,
    fromHotelState: hotelFromState?.status,
    hotel: hotelFromState?.name,
    showButtons: hotelStatus === 'draft'
  });

  // Fetch room type images - giống HotelDetail
  const fetchRoomTypeImages = async (roomTypeId) => {
    try {
      console.log('🖼️ Fetching images for room type:', roomTypeId);
      console.log('🔑 Token available:', !!token);
      
      if (!token) {
        console.warn('⚠️ No authentication token available');
        return [];
      }
      
      // Gọi API lấy hình ảnh theo roomTypeId với authentication
      const response = await fetch(`${API_BASE_URL}/room-types/${roomTypeId}/images`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🌐 Images API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Unauthorized - Token may be invalid or expired');
        } else if (response.status === 404) {
          console.warn('📷 No images found for room type:', roomTypeId);
        } else {
          console.error('❌ API Error:', response.status, response.statusText);
        }
        return [];
      }
      
      const data = await response.json();
      const imageList = Array.isArray(data) ? data : (data?.data || data?.items || []);
      
      console.log('✅ Room type images received:', imageList.length, 'images');
      return imageList;
    } catch (error) {
      console.error('💥 Error fetching room type images:', error);
      return [];
    }
  };

  // Fetch rooms by room type - giống HotelDetail  
  const fetchRoomsByRoomType = async (roomTypeId) => {
    try {
      console.log('🏠 Fetching rooms for room type:', roomTypeId);
      console.log('🔑 Token available:', !!token);
      
      if (!token) {
        console.warn('⚠️ No authentication token available');
        return [];
      }
      
      // Gọi API lấy phòng theo roomTypeId với authentication
      const response = await fetch(`${API_BASE_URL}/rooms/room-type/${roomTypeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🌐 Rooms API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ Unauthorized - Token may be invalid or expired');
        } else if (response.status === 404) {
          console.warn('🏠 No rooms found for room type:', roomTypeId);
        } else {
          console.error('❌ API Error:', response.status, response.statusText);
        }
        return [];
      }
      
      const data = await response.json();
      const roomList = Array.isArray(data) ? data : (data?.data || data?.items || []);
      
      console.log('✅ Rooms received:', roomList.length, 'rooms');
      return roomList;
    } catch (error) {
      console.error('💥 Error fetching rooms:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchRoomTypeDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔥 RoomTypeDetailPage - Fetching details for:', { roomTypeId, hotelId, tokenAvailable: !!token });
        
        // Get room type details
        const roomTypeData = await getRoomType(roomTypeId);
        console.log('📋 Room type data:', roomTypeData);
        if (!roomTypeData) {
          setError('Không tìm thấy loại phòng');
          return;
        }
        setRoomType(roomTypeData);

        // Only fetch API data if token is available
        if (token) {
          // Fetch images and rooms in parallel - giống HotelDetail
          const [roomTypeImages, roomTypeRooms] = await Promise.all([
            fetchRoomTypeImages(roomTypeId),
            fetchRoomsByRoomType(roomTypeId)
          ]);

          setImages(roomTypeImages);
          setRooms(roomTypeRooms);
        } else {
          console.warn('⚠️ Skipping API calls - no token available');
          setImages([]);
          setRooms([]);
        }

      } catch (err) {
        console.error('💥 Error fetching room type details:', err);
        setError('Có lỗi xảy ra khi tải thông tin loại phòng');
      } finally {
        setLoading(false);
      }
    };

    if (roomTypeId) {
      fetchRoomTypeDetail();
    }
  }, [roomTypeId, token]); // Add token to dependencies

  const handleBack = () => {
    console.log('🔄 RoomTypeDetailPage - handleBack:', { 
      returnTo: location.state?.returnTo, 
      hotel: hotelFromState?.name,
      hotelId: hotelFromState?.hotel_id || hotelFromState?.hotelId || hotelFromState?.id,
      hotelStatus: hotelStatus
    });

    if (location.state?.returnTo) {
      // Nếu returnTo là hotel detail page, truyền hotel state để tránh 404
      if (location.state.returnTo.includes('/hotel-owner/hotel/')) {
        console.log('🏨 Navigating back to hotel detail page');
        navigate(location.state.returnTo, { 
          state: { 
            hotel: hotelFromState
          } 
        });
      } else {
        // Cho các trường hợp khác (room types list, etc.)
        console.log('📋 Navigating back to specific return path');
        navigate(location.state.returnTo, { 
          state: { 
            hotel: hotelFromState,
            lockHotel: location.state?.lockHotel 
          } 
        });
      }
    } else {
      // Nếu có hotel data, quay về hotel detail thay vì room types list
      if (hotelFromState && (hotelFromState.hotel_id || hotelFromState.hotelId || hotelFromState.id)) {
        const hotelId = hotelFromState.hotel_id || hotelFromState.hotelId || hotelFromState.id;
        console.log('� Default navigation to hotel detail page');
        navigate(`/hotel-owner/hotel/${hotelId}`, { 
          state: { 
            hotel: hotelFromState
          } 
        });
      } else {
        // Fallback: quay về room types list
        console.log('🏠 Fallback navigation to room types');
        navigate('/hotel-owner/rooms/types', { 
          state: { 
            hotel: hotelFromState,
            lockHotel: location.state?.lockHotel 
          } 
        });
      }
    }
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const getRoomStatusInfo = (status) => {
    switch (status) {
      case 'available':
        return { text: 'Có sẵn', className: 'bg-green-100 text-green-800' };
      case 'occupied':
        return { text: 'Đã thuê', className: 'bg-red-100 text-red-800' };
      case 'maintenance':
        return { text: 'Bảo trì', className: 'bg-yellow-100 text-yellow-800' };
      case 'cleaning':
        return { text: 'Dọn dẹp', className: 'bg-blue-100 text-blue-800' };
      default:
        return { text: status || 'Không xác định', className: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin loại phòng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!roomType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy thông tin loại phòng</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal-style header like HotelDetail */}
      <div className="bg-blue-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
              >
                <ArrowLeft size={20} className="text-blue-600" />
              </button>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">{roomType.name}</h1>
              </div>
            </div>
            <button
              onClick={handleBack}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          <div className="text-right mt-2">
            <div className="text-xl font-bold text-blue-600">{currency(roomType.basePrice || roomType.base_price)}</div>
            <div className="text-sm text-gray-600">/ đêm</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Basic Information - giống HotelDetail modal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thông tin cơ bản</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mô tả</label>
                    <p className="text-gray-900 mt-1">{roomType.description || `Phòng ${roomType.name}`}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Sức chứa</label>
                      <p className="text-gray-900 mt-1">{roomType.maxOccupancy || roomType.max_occupancy} người</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Diện tích</label>
                      <p className="text-gray-900 mt-1">{roomType.areaSqm || roomType.area_sqm} m²</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Loại giường</label>
                      <p className="text-gray-900 mt-1">{roomType.bedType || roomType.bed_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tổng số phòng</label>
                      <p className="text-gray-900 mt-1">{rooms.length} phòng</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Thống kê phòng</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{rooms.filter(r => r.status === 'available').length}</div>
                    <div className="text-sm text-gray-600">Phòng có sẵn</div>
                  </div>
                </div>
                
                {/* Thông tin bổ sung */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span className="text-gray-900">
                      {roomType.createdAt ? new Date(roomType.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Mã khách sạn:</span>
                    <span className="text-gray-900">{hotelId}</span>
                  </div>
                  {roomType.updatedAt && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Cập nhật:</span>
                      <span className="text-gray-900">{new Date(roomType.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Images Gallery - Always show section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-800">Hình ảnh ({images.length})</h3>
                <button
                  onClick={() => navigate('/hotel-owner/rooms/images', { 
                    state: { 
                      hotel: hotelFromState,
                      roomType: roomType,
                      roomTypeId: roomTypeId,
                      lockHotel: true,
                      lockRoomType: true,
                      returnTo: location.pathname,
                      // Truyền thêm original state để preserve navigation chain
                      originalReturnTo: location.state?.returnTo,
                      originalState: location.state
                    } 
                  })}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Thêm hình ảnh
                </button>
              </div>
              
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={image.id || index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group">
                      <img 
                        src={image.imageUrl} 
                        alt={`${roomType.name} - ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => openImageModal(image)}
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
                      {index === 0 && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Thumbnail
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Camera className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Chưa có hình ảnh nào</h3>
                  <p className="text-gray-500 mb-4">Thêm hình ảnh để hiển thị loại phòng này một cách trực quan hơn.</p>
                  <button
                    onClick={() => navigate('/hotel-owner/rooms/images', { 
                      state: { 
                        hotel: hotelFromState,
                        roomType: roomType,
                        roomTypeId: roomTypeId,
                        lockHotel: true,
                        lockRoomType: true,
                        returnTo: location.pathname,
                        // Truyền thêm original state để preserve navigation chain
                        originalReturnTo: location.state?.returnTo,
                        originalState: location.state
                      } 
                    })}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Thêm hình ảnh đầu tiên
                  </button>
                </div>
              )}
            </div>

            {/* Rooms List - Always show section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-800">Danh sách phòng ({rooms.length})</h3>
                <button
                  onClick={() => navigate('/hotel-owner/rooms/list', { 
                    state: { 
                      hotel: hotelFromState,
                      roomType: roomType,
                      roomTypeId: roomTypeId,
                      lockHotel: true,
                      lockRoomType: true,
                      returnTo: location.pathname,
                      // Truyền thêm original state để preserve navigation chain
                      originalReturnTo: location.state?.returnTo,
                      originalState: location.state
                    } 
                  })}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Bed className="h-4 w-4 mr-2" />
                  Thêm phòng
                </button>
              </div>
              
              {rooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => {
                    const statusInfo = getRoomStatusInfo(room.status);
                    return (
                      <div key={room.id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{room.roomNumber}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Tầng: {room.floor}</div>
                          {room.createdAt && (
                            <div>Ngày tạo: {new Date(room.createdAt).toLocaleDateString('vi-VN')}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Bed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Chưa có phòng nào</h3>
                  <p className="text-gray-500 mb-4">Loại phòng này chưa có phòng nào được tạo.</p>
                  <button
                    onClick={() => navigate('/hotel-owner/rooms/list', { 
                      state: { 
                        hotel: hotelFromState,
                        roomType: roomType,
                        roomTypeId: roomTypeId,
                        lockHotel: true,
                        lockRoomType: true,
                        returnTo: location.pathname
                      } 
                    })}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Bed className="h-4 w-4 mr-2" />
                    Thêm phòng đầu tiên
                  </button>
                </div>
              )}
            </div>




          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage.imageUrl}
              alt={roomType.name}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomTypeDetailPage;