// src/pages/hotel-owner/rooms/RoomManagementPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Hotel, DoorClosed, BrushCleaning, Wrench, Ban, Users } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useRoomContext } from '../../../context/RoomContext';
import roomTypeService from '../../../api/roomType.service';
import roomService from '../../../api/room.service';
import ActionButton, { ActionButtonsGroup } from '../../../components/common/ActionButton';
import { useRoomManagementState } from './RoomManagementWrapper';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'available', label: 'Sẵn sàng', icon: DoorClosed },
  { value: 'occupied', label: 'Đang ở', icon: Users },
  { value: 'cleaning', label: 'Đang dọn', icon: BrushCleaning },
  { value: 'maintenance', label: 'Bảo trì', icon: Wrench },
  { value: 'out_of_order', label: 'Ngưng khai thác', icon: Ban },
];

const badgeClass = (s) => {
  switch (s) {
    case 'available': return 'bg-emerald-50 text-emerald-700';
    case 'occupied': return 'bg-indigo-50 text-indigo-700';
    case 'cleaning': return 'bg-amber-50 text-amber-700';
    case 'maintenance': return 'bg-orange-50 text-orange-700';
    case 'out_of_order': return 'bg-rose-50 text-rose-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

function RoomTypeCard({ roomType, onView }) {
  return (
    <div className="room-type-card p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">{roomType.name}</h3>
        <p className="text-sm text-gray-500">{roomType.description}</p>
      </div>
      <ActionButton type="view" onClick={() => onView(roomType)} title="Xem" disabled={false} />
    </div>
  );
}

export default function RoomManagementPage() {
  const navigate = useNavigate();
  
  // Get shared state from wrapper to preserve state across navigation
  const sharedState = useRoomManagementState();
  
  // Lấy danh sách khách sạn của chủ
  const { hotelData, fetchOwnerHotel } = useHotelOwner();
  const hotels = Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []);
  
  // Use shared state if available, otherwise use local state
  const [localHotel, setLocalHotel] = useState(null);
  const hotel = sharedState?.selectedHotel || localHotel;
  const setHotel = sharedState?.setSelectedHotel || setLocalHotel;

  useEffect(() => { fetchOwnerHotel(); }, [fetchOwnerHotel]);
  useEffect(() => { 
    if (hotels.length && !hotel) {
      setHotel(hotels[0]); 
    }
  }, [hotels, hotel, setHotel]);

  const hotelId = useMemo(() => hotel?.hotel_id || hotel?.hotelId || hotel?.id || '', [hotel]);

  // Lấy phòng theo KS từ RoomContext
  const { rooms, loading, getByHotel } = useRoomContext();
  useEffect(() => { if (hotelId) getByHotel(hotelId); }, [hotelId, getByHotel]);

  // (status filter removed — simplified view shows all rooms)

  // Thống kê
  const stats = useMemo(() => {
    const total = rooms.length;
    const count = (s) => rooms.filter(r => (r.status || '').toLowerCase() === s).length;
    return {
      total,
      available: count('available'),
      occupied: count('occupied'),
      cleaning: count('cleaning'),
      maintenance: count('maintenance'),
      out_of_order: count('out_of_order'),
    };
  }, [rooms]);

  // Lấy danh sách loại phòng theo khách sạn - use shared state if available
  const [localRoomTypes, setLocalRoomTypes] = useState([]);
  const roomTypes = sharedState?.roomTypes || localRoomTypes;
  const setRoomTypes = sharedState?.setRoomTypes || setLocalRoomTypes;
  
  useEffect(() => {
    if (hotelId) {
      // Always fetch when hotelId changes to get correct room types for the selected hotel
      roomTypeService.getByHotel(hotelId).then(setRoomTypes).catch(console.error);
    }
  }, [hotelId, setRoomTypes]);

  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [roomsByType, setRoomsByType] = useState([]);
  const [roomStats, setRoomStats] = useState({
    available: 0,
    occupied: 0,
    maintenance: 0,
    out_of_order: 0,
    cleaning: 0,
  });

  // Room edit modal state
  const [editingRoom, setEditingRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    floorNumber: '',
    status: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Ensure API call is made when a room type is selected
  useEffect(() => {
    if (selectedRoomType && selectedRoomType.roomTypeId) {
      console.log('Calling API with roomTypeId:', selectedRoomType.roomTypeId);
      roomService.getByRoomType(selectedRoomType.roomTypeId)
        .then((response) => {
          console.log('API response:', response);
          // Handle the response format {success: true, data: [...]}
          const rooms = response?.data?.data || response?.data || [];
          console.log('Rooms extracted from response:', rooms);
          setRoomsByType(Array.isArray(rooms) ? rooms : []);
          const count = (status) => rooms.filter(r => (r.status || '').toLowerCase() === status).length;
          setRoomStats({
            available: count('available'),
            occupied: count('occupied'),
            maintenance: count('maintenance'),
            out_of_order: count('out_of_order'),
            cleaning: count('cleaning'),
          });
        })
        .catch((error) => {
          console.error('Error fetching rooms by type:', error);
          setRoomsByType([]); // Reset to empty array on error
        });
    } else {
      console.log('No room type selected or missing roomTypeId');
      setRoomsByType([]); // Reset if no room type is selected
    }
  }, [selectedRoomType]);

  // Handle room edit
  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber || '',
      floorNumber: room.floorNumber || '',
      status: room.status || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.roomNumber?.trim()) {
      errors.roomNumber = 'Số phòng không được để trống';
    }
    
    if (!formData.floorNumber || formData.floorNumber <= 0) {
      errors.floorNumber = 'Tầng phải là số dương (không được là 0 hoặc số âm)';
    }
    
    if (!formData.status) {
      errors.status = 'Vui lòng chọn trạng thái';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle room update
  const handleRoomUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Update room information
      await roomService.update(editingRoom.roomId, {
        roomNumber: formData.roomNumber,
        floorNumber: parseInt(formData.floorNumber),
        status: formData.status
      });
      
      // Refresh rooms data
      if (selectedRoomType && selectedRoomType.roomTypeId) {
        const response = await roomService.getByRoomType(selectedRoomType.roomTypeId);
        const rooms = response?.data?.data || response?.data || [];
        setRoomsByType(Array.isArray(rooms) ? rooms : []);
        
        // Update stats
        const count = (status) => rooms.filter(r => (r.status || '').toLowerCase() === status).length;
        setRoomStats({
          available: count('available'),
          occupied: count('occupied'),
          maintenance: count('maintenance'),
          out_of_order: count('out_of_order'),
          cleaning: count('cleaning'),
        });
      }
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating room:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else {
        console.error('Error message:', error.message);
      }
    }
  };

  // Get available status transitions based on current status
  const getAvailableStatuses = (currentStatus) => {
    const statusTransitions = {
      available: ['occupied', 'maintenance', 'cleaning'],
      occupied: ['cleaning', 'maintenance'],
      cleaning: ['available', 'maintenance'],
      maintenance: ['cleaning', 'out_of_order'],
      out_of_order: ['cleaning']
    };
    return statusTransitions[currentStatus] || [];
  };

  const handleViewRoomType = (roomType) => {
    console.log('Viewing room type:', roomType);
    // Navigate to the room type rooms page using React Router
    const roomTypeId = roomType.roomTypeId || roomType.room_type_id || roomType.id;
    navigate(`/hotel-owner/rooms/types/${roomTypeId}/rooms`);
  };

  return (
    <div className="space-y-6">
      {/* Header + chọn khách sạn */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <Activity className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold">Tình trạng phòng</h1>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn</label>
            <div className="relative">
              <Hotel className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <select
                className="w-full border rounded-lg pl-9 pr-3 py-2"
                value={hotelId}
                onChange={(e) => {
                  const h = hotels.find(x => (x.hotel_id || x.hotelId || x.id)?.toString() === e.target.value);
                  setHotel(h || null);
                }}
              >
                {hotels.map(h => {
                  const id = h.hotel_id || h.hotelId || h.id;
                  return <option key={id} value={id}>{h.name} - {h.address}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Status filter removed */}
        </div>
      </div>

      {/* Title for hotel-wide statistics */}
      <h2 className="text-lg font-semibold">Thống kê toàn khách sạn</h2>

      {/* Cards thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Tổng số phòng" value={stats.total} />
        <StatCard title="Sẵn sàng" value={stats.available} />
        <StatCard title="Đang ở" value={stats.occupied} />
        <StatCard title="Đang dọn" value={stats.cleaning} />
        <StatCard title="Bảo trì" value={stats.maintenance} />
        <StatCard title="Ngưng khai thác" value={stats.out_of_order} />
      </div>

      {/* Danh sách loại phòng */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Danh sách loại phòng ({roomTypes.length})</h2>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">Đang tải dữ liệu…</div>
        ) : (
          <div className="divide-y">
            {roomTypes.map((roomType) => (
              <RoomTypeCard
                key={roomType.roomTypeId || roomType.room_type_id || roomType.id}
                roomType={roomType}
                onView={handleViewRoomType}
              />
            ))}
            {!roomTypes.length && (
              <div className="p-6 text-gray-500">Không có loại phòng phù hợp.</div>
            )}
          </div>
        )}
      </div>

      {/* Form hiển thị phòng theo loại phòng */}
      {selectedRoomType && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold">Phòng thuộc loại: {selectedRoomType.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
            <StatCard title="Sẵn sàng" value={roomStats.available} />
            <StatCard title="Đang ở" value={roomStats.occupied} />
            <StatCard title="Đang dọn" value={roomStats.cleaning} />
            <StatCard title="Bảo trì" value={roomStats.maintenance} />
            <StatCard title="Ngưng khai thác" value={roomStats.out_of_order} />
          </div>

          <div className="mt-6 divide-y">
            {roomsByType.map((room) => (
              <div key={room.roomId || room.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium">Phòng {room.roomNumber}</div>
                  <div className="text-sm text-gray-500">Tầng {room.floorNumber ?? '—'}</div>
                </div>
                <span className={`px-2 py-1 text-sm rounded ${badgeClass(room.status)}`}>
                  {STATUS_OPTIONS.find(s => s.value === room.status)?.label || room.status}
                </span>
                <ActionButton 
                  type="edit" 
                  onClick={() => handleEditRoom(room)} 
                  title="Chỉnh sửa phòng" 
                />
              </div>
            ))}
            {!roomsByType.length && (
              <div className="p-6 text-gray-500">Không có phòng phù hợp.</div>
            )}
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && editingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Chỉnh sửa phòng</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số phòng</label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 ${formErrors.roomNumber ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nhập số phòng"
                />
                {formErrors.roomNumber && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.roomNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tầng</label>
                <input
                  type="number"
                  min="1"
                  value={formData.floorNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, floorNumber: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 ${formErrors.floorNumber ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nhập số tầng (phải > 0)"
                />
                {formErrors.floorNumber && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.floorNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái hiện tại</label>
                <span className={`px-3 py-2 text-sm rounded ${badgeClass(editingRoom.status)} inline-block`}>
                  {STATUS_OPTIONS.find(s => s.value === editingRoom.status)?.label || editingRoom.status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chuyển sang trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 ${formErrors.status ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">-- Chọn trạng thái --</option>
                  <option value={editingRoom.status}>
                    {STATUS_OPTIONS.find(s => s.value === editingRoom.status)?.label || editingRoom.status} (Hiện tại)
                  </option>
                  {getAvailableStatuses(editingRoom.status).map(status => (
                    <option key={status} value={status}>
                      {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
                    </option>
                  ))}
                </select>
                {formErrors.status && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.status}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Có thể chuyển sang: {getAvailableStatuses(editingRoom.status).map(s => 
                    STATUS_OPTIONS.find(opt => opt.value === s)?.label || s
                  ).join(', ') || 'Không có'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleRoomUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
