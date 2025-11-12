// src/pages/hotel_owner/bookings/RoomAssignmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Building, CheckCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { useRoomAssignment } from '../../../hooks/useRoomAssignment';
import bookingService from '../../../api/booking.service';
import roomTypeService from '../../../api/roomType.service';
import ActionButton from '../../../components/common/ActionButton';
import * as roomAssignmentService from '../../../api/roomAssignment.service';

const RoomAssignmentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // States
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [bookingDetails, setBookingDetails] = useState([]);
  const [roomTypes, setRoomTypes] = useState({});
  const [availableRoomsMap, setAvailableRoomsMap] = useState({});
  const [selectedRooms, setSelectedRooms] = useState({});
  const [assignedRoomsMap, setAssignedRoomsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const { fetchAvailableRooms } = useRoomAssignment();

  // Đưa loadBookingData ra ngoài để các handler gọi lại được
  const loadBookingData = async () => {
    try {
      setLoading(true);

      // Nếu chưa có booking từ state, fetch lại
      let currentBooking = booking;
      if (!currentBooking) {
        const bookingResponse = await bookingService.getBookingById(bookingId);
        currentBooking = bookingResponse.data || bookingResponse;
        setBooking(currentBooking);
      }

      // Lấy booking details
      const detailsResponse = await fetch(`http://localhost:8080/api/v1/booking-details/booking/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const detailsData = await detailsResponse.json();
      const details = detailsData.data || detailsData;
      
      console.log('📦 Booking details:', details);
      setBookingDetails(details);

      // Load room types và available rooms cho từng detail
      const roomTypesData = {};
      const availableRoomsData = {};

      for (const detail of details) {
        // Kiểm tra room_type_id trước khi gọi API - hỗ trợ cả snake_case và camelCase
        const roomTypeId = detail.roomTypeId || detail.room_type_id;
        const detailId = detail.detailId || detail.detail_id;
        
        if (!roomTypeId) {
          console.warn('⚠️ Missing room_type_id for detail:', detail);
          continue;
        }

        // Lấy thông tin room type
        try {
          const roomTypeResponse = await fetch(`http://localhost:8080/api/v1/roomtypes/${roomTypeId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const roomTypeData = await roomTypeResponse.json();
          roomTypesData[roomTypeId] = roomTypeData.data || roomTypeData;
        } catch (err) {
          console.error(`❌ Error loading room type ${roomTypeId}:`, err);
        }
      }

      // Lấy available rooms cho từng detail (theo roomTypeId)
      try {
        for (const detail of details) {
          const roomTypeId = detail.roomTypeId || detail.room_type_id;
          const detailId = detail.detailId || detail.detail_id;
          const params = {
            roomTypeId,
            checkInDate: currentBooking.check_in_date || currentBooking.checkInDate,
            checkOutDate: currentBooking.check_out_date || currentBooking.checkOutDate,
            limit: 100
          };
          console.log('🚀 [DEBUG] Params gửi lên server lấy phòng trống:', params);
          const availableRooms = await fetchAvailableRooms(params);
          console.log('🚀 [DEBUG] Response phòng trống từ server:', availableRooms);
          let roomsData = availableRooms.data || availableRooms;
          if (!Array.isArray(roomsData)) {
            roomsData = [];
          }
          availableRoomsData[detailId] = roomsData;
        }
      } catch (err) {
        console.error('❌ Error loading available rooms:', err);
      }

  setRoomTypes(roomTypesData);
  setAvailableRoomsMap(availableRoomsData);

  // Lấy danh sách phòng đã xếp cho booking
  await loadAssignedRooms();

  // Reset lựa chọn phòng đã chọn
  setSelectedRooms({});

    } catch (error) {
      console.error('❌ Error loading booking data:', error);
      toast.error('Không thể tải thông tin booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]); // CHỈ phụ thuộc vào bookingId để tránh infinite loop

  // Load danh sách phòng đã xếp
  const loadAssignedRooms = async () => {
    try {
      const response = await roomAssignmentService.getRoomAssignmentsForBooking(bookingId);
      const assignmentsData = response.data || response || [];
      
      // Group theo booking_detail_id
      const groupedAssignments = {};
      assignmentsData.forEach(assignment => {
        const detailId = assignment.booking_detail_id || assignment.bookingDetailId;
        if (!groupedAssignments[detailId]) {
          groupedAssignments[detailId] = [];
        }
        groupedAssignments[detailId].push(assignment);
      });
      
      setAssignedRoomsMap(groupedAssignments);
    } catch (error) {
      console.error('❌ Error loading assigned rooms:', error);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return dateString;
    }
  };

  // Handle room selection
  const handleRoomSelect = (detailId, roomId, roomNumber, detail) => {
    setSelectedRooms(prev => {
      const detailRooms = prev[detailId] || [];
      const isSelected = detailRooms.some(r => r.roomId === roomId);

      if (isSelected) {
        // Bỏ chọn
        return {
          ...prev,
          [detailId]: detailRooms.filter(r => r.roomId !== roomId)
        };
      } else {
        // Kiểm tra không vượt quá quantity
        const assignedCount = (assignedRoomsMap[detailId] || []).length;
        const selectedCount = detailRooms.length;
        const maxQuantity = detail.quantity;
        
        if (assignedCount + selectedCount >= maxQuantity) {
          toast.warning(`Đã đủ ${maxQuantity} phòng cho loại phòng này`);
          return prev;
        }
        
        // Chọn thêm
        return {
          ...prev,
          [detailId]: [...detailRooms, { roomId, roomNumber }]
        };
      }
    });
  };

  // Check if room is selected
  const isRoomSelected = (detailId, roomId) => {
    const detailRooms = selectedRooms[detailId] || [];
    return detailRooms.some(r => r.roomId === roomId);
  };

  // Handle assign rooms (placeholder)
  const handleAssignRooms = async () => {
    try {
      setAssigning(true);
      
      // Tạo room assignments cho tất cả phòng đã chọn
      const assignmentPromises = [];
      
      for (const [detailId, rooms] of Object.entries(selectedRooms)) {
        for (const room of rooms) {
          assignmentPromises.push(
            roomAssignmentService.assignRoom({
              booking_detail_id: detailId,
              room_id: room.roomId,
              notes: 'Xếp thủ công'
            })
          );
        }
      }
      
      await Promise.all(assignmentPromises);
      
      toast.success('Xếp phòng thành công!');
      
  // Chỉ làm mới lại data bảng phòng trống khả dụng
  await loadBookingData();
  setSelectedRooms({});
      
    } catch (error) {
      console.error('❌ Error assigning rooms:', error);
      toast.error('Lỗi khi xếp phòng: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setAssigning(false);
    }
  };

  // Handle auto assign (placeholder)
  const handleAutoAssign = async (detailId, detail) => {
    try {
      setAssigning(true);
      
      const availableRooms = availableRoomsMap[detailId] || [];
      const assignedCount = (assignedRoomsMap[detailId] || []).length;
      const remainingQuantity = detail.quantity - assignedCount;
      
      if (remainingQuantity <= 0) {
        toast.info('Đã đủ phòng cho Booking này');
        return;
      }
      
      // Lấy từ trên xuống
      const roomsToAssign = availableRooms.slice(0, remainingQuantity);
      
      if (roomsToAssign.length === 0) {
        toast.warning('Không có phòng trống để xếp tự động');
        return;
      }
      
      const assignmentPromises = roomsToAssign.map(room => 
        roomAssignmentService.assignRoom({
          booking_detail_id: detailId,
          room_id: room.roomId || room.room_id,
          notes: 'Xếp tự động'
        })
      );
      
      await Promise.all(assignmentPromises);
      
      toast.success(`Đã xếp tự động ${roomsToAssign.length} phòng`);
      
  // Chỉ làm mới lại data bảng phòng trống khả dụng
  await loadBookingData();
      
    } catch (error) {
      console.error('❌ Error auto assigning:', error);
      toast.error('Lỗi khi xếp tự động: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setAssigning(false);
    }
  };

  // Handle unassign room
  const handleUnassignRoom = async (assignmentId) => {
    try {
      setAssigning(true);
      
      const response = await roomAssignmentService.unassignRoom(assignmentId);
      
      if (response.success || response.status === 'success') {
        toast.success('Đã hủy xếp phòng');
        await loadBookingData();
      } else {
        toast.error('Không thể hủy xếp phòng');
      }
      
    } catch (error) {
      console.error('❌ Error unassigning room:', error);
      toast.error('Lỗi khi hủy xếp phòng: ' + (error.message || 'Vui lòng thử lại'));
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Không tìm thấy thông tin booking</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Xếp phòng cho Booking</h1>
        </div>

        {/* Booking Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-500" size={20} />
            <div>
              <p className="text-xs text-gray-500">Check-in</p>
              <p className="font-semibold">{formatDate(booking.check_in_date || booking.checkInDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-red-500" size={20} />
            <div>
              <p className="text-xs text-gray-500">Check-out</p>
              <p className="font-semibold">{formatDate(booking.check_out_date || booking.checkOutDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="text-green-500" size={20} />
            <div>
              <p className="text-xs text-gray-500">Số khách</p>
              <p className="font-semibold">{booking.total_guests || booking.totalGuests} khách</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details List */}
      {bookingDetails.map((detail) => {
        const roomTypeId = detail.roomTypeId || detail.room_type_id;
        const detailId = detail.detailId || detail.detail_id;
        const roomType = roomTypes[roomTypeId];
  const availableRooms = Array.isArray(availableRoomsMap[detailId]) ? availableRoomsMap[detailId] : [];
        const assignedRooms = assignedRoomsMap[detailId] || [];
        const selectedCount = (selectedRooms[detailId] || []).length;
        const assignedCount = assignedRooms.length;
        const remainingQuantity = detail.quantity - assignedCount;

        return (
          <div key={detailId} className="bg-white rounded-lg shadow p-6">
            {/* Room Type Info */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Building className="text-blue-500" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {roomType?.name || 'Loading...'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Số lượng cần xếp: {detail.quantity} phòng
                  </p>
                  <p className="text-sm text-gray-600">
                    Số khách/phòng: {detail.guestsPerRoom || detail.guests_per_room || 1} khách
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Đã chọn</p>
                <p className="text-2xl font-bold text-blue-600">
                  {selectedCount}/{remainingQuantity}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Đã xếp: {assignedCount}/{detail.quantity}
                </p>
              </div>
            </div>

            {/* Room Type Description */}
            {roomType?.description && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{roomType.description}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-600">
                  <span>👥 Tối đa: {roomType.maxOccupancy || roomType.max_occupancy} người</span>
                  <span>🛏️ Loại giường: {roomType.bedType || roomType.bed_type || 'N/A'}</span>
                  {(roomType.areaSqm || roomType.area_sqm) && <span>📐 Diện tích: {roomType.areaSqm || roomType.area_sqm}m²</span>}
                </div>
              </div>
            )}

            {/* Bảng phòng đã xếp */}
            {assignedRooms.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Phòng đã xếp ({assignedRooms.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border rounded-lg">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số phòng</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedRooms.map((assignment, idx) => (
                        <tr key={assignment.assignment_id || assignment.assignmentId} className="bg-green-50">
                          <td className="px-4 py-2">{idx + 1}</td>
                          <td className="px-4 py-2 font-semibold">{assignment.room_number || assignment.roomNumber}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{assignment.notes || '-'}</td>
                          <td className="px-4 py-2">
                            <ActionButton 
                              type="delete" 
                              onClick={() => handleUnassignRoom(assignment.assignment_id || assignment.assignmentId)}
                              title="Hủy xếp phòng"
                              disabled={assigning}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Available Rooms Table */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">
                Phòng trống khả dụng ({availableRooms.length})
                {remainingQuantity > 0 && (
                  <span className="ml-2 text-sm text-orange-600">
                    (Còn cần xếp: {remainingQuantity} phòng)
                  </span>
                )}
              </h4>
              {availableRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không có phòng trống trong khoảng thời gian này
                </div>
              ) : (
                <div className="overflow-x-auto mb-6">
                  <table className="min-w-full border rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số phòng</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chọn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableRooms.map((room, idx) => {
                        const roomId = room.roomId || room.room_id;
                        const roomNumber = room.roomNumber || room.room_number;
                        const selected = isRoomSelected(detailId, roomId);
                        return (
                          <tr key={roomId} className={selected ? 'bg-blue-50' : ''}>
                            <td className="px-4 py-2">{idx + 1}</td>
                            <td className="px-4 py-2 font-semibold">{roomNumber}</td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => handleRoomSelect(detailId, roomId, roomNumber, detail)}
                                disabled={!selected && remainingQuantity <= 0}
                                className={`px-3 py-1 rounded-lg border-2 transition-all ${
                                  selected
                                    ? 'border-blue-500 bg-blue-100 text-blue-700'
                                    : remainingQuantity <= 0
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                }`}
                              >
                                {selected ? 'Đã chọn' : 'Chọn'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action buttons dưới bảng phòng */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => handleAutoAssign(detailId, detail)}
                  disabled={assigning || remainingQuantity <= 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="inline mr-2" size={18} />
                  Xếp tự động {remainingQuantity > 0 && `(${Math.min(remainingQuantity, availableRooms.length)})`}
                </button>
                <button
                  onClick={handleAssignRooms}
                  disabled={assigning || selectedCount === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {assigning ? 'Đang xếp...' : `Xác nhận xếp thủ công (${selectedCount})`}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoomAssignmentPage;
