// src/pages/hotel_owner/pricing/SeasonalPricingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelApiService } from '../../../api/hotel.service';
import roomTypeService from '../../../api/roomType.service';
import ActionButton from '../../../components/common/ActionButton';

const SeasonalPricingPage = () => {
  const navigate = useNavigate();

  // States for dropdowns
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load hotels on mount
  useEffect(() => {
    loadHotels();
  }, []);

  // Load room types when hotel is selected
  useEffect(() => {
    if (selectedHotelId) {
      loadRoomTypes(selectedHotelId);
    } else {
      setRoomTypes([]);
    }
  }, [selectedHotelId]);

  // Load hotels of the logged-in hotel owner
  const loadHotels = async () => {
    try {
      const response = await hotelApiService.getHotelsForOwner();
      console.log('Hotels response:', response);
      
      // API trả về {status: 'success', message: 'Success', data: [...]}
      let hotelsList = [];
      if (response.data && Array.isArray(response.data)) {
        hotelsList = response.data;
      } else if (Array.isArray(response)) {
        hotelsList = response;
      }
      
      console.log('Parsed hotels:', hotelsList);
      setHotels(hotelsList);
    } catch (error) {
      console.error('Error loading hotels:', error);
      alert('Không thể tải danh sách khách sạn');
    }
  };

  // Load room types for selected hotel
  const loadRoomTypes = async (hotelId) => {
    try {
      setLoading(true);
      console.log('Loading room types for hotel:', hotelId);
      const roomTypesList = await roomTypeService.getByHotel(hotelId);
      console.log('Room types response:', roomTypesList);
      
      // roomTypeService.getByHotel() trả về mảng trực tiếp do có toArray()
      const types = Array.isArray(roomTypesList) ? roomTypesList : [];
      console.log('Parsed room types:', types);
      setRoomTypes(types);
    } catch (error) {
      console.error('Error loading room types:', error);
      alert('Không thể tải danh sách loại phòng: ' + (error.message || ''));
      setRoomTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle room type selection (navigate to detail page)
  const handleViewRoomType = (roomType) => {
    navigate(`/hotel-owner/pricing/seasonal/${roomType.roomTypeId}`);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Giá theo Mùa</h1>
        <p className="text-gray-600">Quản lý giá phòng theo các mùa và dịp lễ</p>
      </div>

      {/* Hotel selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Chọn Khách sạn</h2>
        <select
          value={selectedHotelId}
          onChange={(e) => setSelectedHotelId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">-- Chọn khách sạn --</option>
          {hotels.map(hotel => (
            <option key={hotel.hotelId || hotel.hotel_id} value={hotel.hotelId || hotel.hotel_id}>
              {hotel.name} ({hotel.status || 'N/A'})
            </option>
          ))}
        </select>
      </div>

      {/* Room types list */}
      {selectedHotelId && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Danh sách Loại phòng</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : roomTypes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Không có loại phòng nào</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomTypes.map(roomType => (
                <div
                  key={roomType.roomTypeId}
                  className="border rounded-lg p-4 border-gray-200 hover:border-blue-300 transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{roomType.name}</h3>
                    <ActionButton
                      type="view"
                      onClick={() => handleViewRoomType(roomType)}
                      title="Xem chi tiết giá"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{roomType.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Giá gốc:</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(parseFloat(roomType.basePrice) || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SeasonalPricingPage;
