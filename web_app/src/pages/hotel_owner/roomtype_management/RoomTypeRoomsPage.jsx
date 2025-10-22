// src/pages/hotel_owner/roomtype_management/RoomTypeRoomsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorClosed, BrushCleaning, Wrench, Ban, Users } from 'lucide-react';
import roomService from '../../../api/room.service';
import roomTypeService from '../../../api/roomType.service';
import ActionButton from '../../../components/common/ActionButton';

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

export default function RoomTypeRoomsPage() {
  const { roomTypeId } = useParams();
  const navigate = useNavigate();
  
  const [roomType, setRoomType] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch room type info
        const roomTypeResponse = await roomTypeService.getById(roomTypeId);
        const roomTypeData = roomTypeResponse?.data || roomTypeResponse;
        setRoomType(roomTypeData);
        
        // Fetch rooms by room type
        const roomsResponse = await roomService.getByRoomType(roomTypeId);
        const roomsData = roomsResponse?.data?.data || roomsResponse?.data || [];
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        
        // Calculate stats
        const count = (status) => roomsData.filter(r => (r.status || '').toLowerCase() === status).length;
        setRoomStats({
          available: count('available'),
          occupied: count('occupied'),
          maintenance: count('maintenance'),
          out_of_order: count('out_of_order'),
          cleaning: count('cleaning'),
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (roomTypeId) {
      fetchData();
    }
  }, [roomTypeId]);

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
      const roomsResponse = await roomService.getByRoomType(roomTypeId);
      const roomsData = roomsResponse?.data?.data || roomsResponse?.data || [];
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      
      // Update stats
      const count = (status) => roomsData.filter(r => (r.status || '').toLowerCase() === status).length;
      setRoomStats({
        available: count('available'),
        occupied: count('occupied'),
        maintenance: count('maintenance'),
        out_of_order: count('out_of_order'),
        cleaning: count('cleaning'),
      });
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating room:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Phòng thuộc loại: {roomType?.name}</h1>
              <p className="text-gray-600">{roomType?.description}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard title="Sẵn sàng" value={roomStats.available} />
          <StatCard title="Đang ở" value={roomStats.occupied} />
          <StatCard title="Đang dọn" value={roomStats.cleaning} />
          <StatCard title="Bảo trì" value={roomStats.maintenance} />
          <StatCard title="Ngưng khai thác" value={roomStats.out_of_order} />
        </div>

        {/* Rooms List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Danh sách phòng ({rooms.length})</h2>
          </div>

          <div className="divide-y">
            {rooms.map((room) => (
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
            {!rooms.length && (
              <div className="p-6 text-gray-500">Không có phòng nào.</div>
            )}
          </div>
        </div>

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