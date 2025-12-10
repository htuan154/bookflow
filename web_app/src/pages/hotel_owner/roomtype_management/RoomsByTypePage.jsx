import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Plus, Save, X, Pencil, Trash2, DoorClosed, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useRoomTypeList } from '../../../hooks/useRoomType';
import { useRoomsOfType, useRoomEditor } from '../../../hooks/useRoom';
import { useRoomContext } from '../../../context/RoomContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../../../components/common/Toast';
import { useToast } from '../../../hooks/useToast';

// DeleteConfirmModal Component
const DeleteConfirmModal = ({ title, message, onConfirm, onCancel, isLoading = false }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Đang xóa...
              </>
            ) : (
              'Xác nhận xóa'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Helpers: đọc id/số phòng/tầng an toàn dù API đặt tên khác nhau */
const getRoomId = (r) => r?.room_id ?? r?.roomId ?? r?.roomID ?? r?.id ?? r?._id ?? null;
const getRoomNumber = (r) =>
  r?.room_number ?? r?.roomNumber ?? r?.room_no ?? r?.number ?? '';
const getFloorNumber = (r) =>
  r?.floor_number ?? r?.floorNumber ?? r?.floor ?? r?.level ?? '';

const STATUSES = [
  { value: 'available', label: 'Sẵn sàng' },
  { value: 'occupied', label: 'Đang ở' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'out_of_order', label: 'Ngưng khai thác' },
  { value: 'cleaning', label: 'Đang dọn' },
];

export default function RoomsByTypePage() {
  // ====== Navigation state ======
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const stateFromNav = location.state || {};
  const { hotel: hotelFromNav, roomType: roomTypeFromNav, lockHotel = false, lockRoomType = false, returnTo } = stateFromNav;

  // ====== Chọn KS / Loại phòng ======
  const { hotelData, fetchOwnerHotel } = useHotelOwner();
  const hotels = Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []);
  const [hotel, setHotel] = useState(hotelFromNav || null);

  // Chỉ gọi fetchOwnerHotel 1 lần khi mount
  useEffect(() => { 
    fetchOwnerHotel(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chỉ setHotel khi hotelData thay đổi, KHÔNG setRT trong useEffect này
  useEffect(() => { 
    if (hotels.length && !hotel && !hotelFromNav) setHotel(hotels[0]); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels]);

  const hotelId = useMemo(
    () => hotel?.hotel_id || hotel?.hotelId || hotel?.id || '',
    [hotel]
  );

  // Chỉ setRT khi roomTypes thay đổi, KHÔNG setRT về null khi hotel thay đổi
  const { list: roomTypes } = useRoomTypeList({ hotelId, auto: !!hotelId });
  const [rt, setRT] = useState(roomTypeFromNav || null);
  useEffect(() => { 
    if (roomTypes.length && !rt && !roomTypeFromNav) setRT(roomTypes[0]); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomTypes]);

  const roomTypeId = useMemo(() => rt?.room_type_id || rt?.id || '', [rt]);

  // ====== Rooms ======
  const { list: rooms, refresh } = useRoomsOfType(roomTypeId, { auto: !!roomTypeId });
  const { pending, createRoom, updateRoom, deleteRoom, deleteRoomsBulk } = useRoomEditor({ roomTypeId, hotelId });
  const { createBulk } = useRoomContext();

  // ====== Form Add/Edit inline ======
  const makeBlank = () => ({
    room_type_id: roomTypeId,
    room_number: '',
    floor_number: '',
    status: 'available',
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(makeBlank());
  const [editingId, setEditingId] = useState(null);

  // Bulk add rooms modal state
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkMode, setBulkMode] = useState('quantity'); // 'quantity' or 'range'
  const [bulkFormData, setBulkFormData] = useState({
    prefix: '',
    quantity: 1,
    floorNumber: 1,
    startNumber: 1,
    endNumber: 10
  });
  const [bulkFormErrors, setBulkFormErrors] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);

  // Floor filter state
  const [floorFilter, setFloorFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [roomsPerPage, setRoomsPerPage] = useState(12);
  const [pageJumpInput, setPageJumpInput] = useState('');

  // Bulk delete state
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showBulkDeleteButton, setShowBulkDeleteButton] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, room: null, isBulk: false });

  // Cập nhật form khi đổi roomType
  useEffect(() => {
    setEditingId(null);
    setForm(makeBlank());
    setShowForm(false);
  }, [roomTypeId]); // eslint-disable-line

  const openAdd = () => {
    setEditingId(null);
    setForm(makeBlank());
    setShowForm(true);
  };

  const openEdit = (r) => {
    const rid = getRoomId(r);
    setEditingId(rid);
    setShowForm(true);
    
    // Sửa lỗi: đảm bảo floor_number là số hợp lệ, không phải NaN
    const floorNum = getFloorNumber(r);
    const validFloor = (floorNum === null || floorNum === undefined || floorNum === '') 
      ? '' 
      : (isNaN(Number(floorNum)) ? '' : Number(floorNum));
      
    setForm({
      room_type_id: roomTypeId,
      room_number: getRoomNumber(r),
      floor_number: validFloor,
      status: r?.status || 'available',
    });
  };

  const cancelForm = () => {
    setEditingId(null);
    setForm(makeBlank());
    setShowForm(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;

    // Validate UUID cho roomTypeId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomTypeId)) {
      showError('Room Type ID không hợp lệ');
      return;
    }

    // Sửa lỗi: Gửi camelCase để khớp với backend
    const floorNumber = form.floor_number === '' ? null : 
      (isNaN(Number(form.floor_number)) ? null : Number(form.floor_number));

    const payload = {
      roomTypeId: roomTypeId,
      roomNumber: form.room_number,
      floorNumber: floorNumber,
      status: form.status,
    };

    try {
      // Nếu dùng useRoomEditor, pending đã được quản lý tự động
      if (editingId) {
        await updateRoom(editingId, payload);
      } else {
        await createRoom(payload);
      }

      await refresh();
      showSuccess(editingId ? 'Cập nhật phòng thành công' : 'Thêm phòng thành công');
      cancelForm();
    } catch (error) {
      showError('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    }
    // Không cần finally nếu dùng useRoomEditor, vì hook đã tự reset pending
  };

  const openDeleteConfirm = (room) => {
    setDeleteConfirm({ show: true, room, isBulk: false });
  };

  const openBulkDeleteConfirm = () => {
    setDeleteConfirm({ show: true, room: null, isBulk: true });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, room: null, isBulk: false });
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk) {
        // Bulk delete - use single API call
        setBulkDeleting(true);
        await deleteRoomsBulk(selectedRooms);
        showSuccess(`Đã xóa thành công ${selectedRooms.length} phòng!`);
        setSelectedRooms([]);
      } else {
        // Single delete
        const id = getRoomId(deleteConfirm.room);
        await deleteRoom(id);
        showSuccess('Xóa phòng thành công');
      }
      await refresh();
      cancelDelete();
    } catch (error) {
      showError('Có lỗi khi xóa phòng: ' + (error.message || 'Lỗi không xác định'));
      cancelDelete();
    } finally {
      setBulkDeleting(false);
    }
  };

  // Toggle room selection
  const toggleRoomSelection = (roomId) => {
    setSelectedRooms(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  // Toggle all rooms on current page
  const toggleAllRooms = () => {
    const currentPageRoomIds = paginatedRooms.map(r => getRoomId(r));
    const allSelected = currentPageRoomIds.every(id => selectedRooms.includes(id));
    
    if (allSelected) {
      setSelectedRooms(prev => prev.filter(id => !currentPageRoomIds.includes(id)));
    } else {
      setSelectedRooms(prev => [...new Set([...prev, ...currentPageRoomIds])]);
    }
  };

  const { error: roomError } = useRoomContext();

  // Calculate max rooms that can be added
  const maxRoomsCanAdd = useMemo(() => {
    if (!rt?.numberOfRooms) return 0;
    return rt.numberOfRooms - rooms.length;
  }, [rt, rooms]);

  // Get unique floor numbers from rooms
  const availableFloors = useMemo(() => {
    const floors = rooms.map(r => getFloorNumber(r)).filter(f => f !== '' && f !== null && f !== undefined);
    return ['all', ...Array.from(new Set(floors)).sort((a, b) => Number(a) - Number(b))];
  }, [rooms]);

  // Filter rooms by floor
  const filteredRooms = useMemo(() => {
    if (floorFilter === 'all') return rooms;
    return rooms.filter(r => String(getFloorNumber(r)) === String(floorFilter));
  }, [rooms, floorFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);
  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * roomsPerPage;
    const endIndex = startIndex + roomsPerPage;
    return filteredRooms.slice(startIndex, endIndex);
  }, [filteredRooms, currentPage, roomsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [floorFilter, roomTypeId]);

  // Auto adjust page when rooms are deleted and current page becomes empty
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Update bulk delete button visibility
  useEffect(() => {
    setShowBulkDeleteButton(selectedRooms.length > 0);
  }, [selectedRooms]);

  // Open bulk add modal
  const handleOpenBulkAdd = () => {
    setBulkMode('quantity');
    setBulkFormData({
      prefix: '',
      quantity: 1,
      floorNumber: 1,
      startNumber: 1,
      endNumber: 10
    });
    setBulkFormErrors({});
    setShowBulkAddModal(true);
  };

  // Handle jump to page
  const handlePageJump = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageJumpInput);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setPageJumpInput('');
    } else {
      showError(`Vui lòng nhập số trang từ 1 đến ${totalPages}`);
    }
  };

  // Validate bulk form
  const validateBulkForm = () => {
    const errors = {};
    
    if (!bulkFormData.prefix?.trim()) {
      errors.prefix = 'Tiền tố không được để trống';
    }
    
    if (bulkMode === 'quantity') {
      if (!bulkFormData.quantity || bulkFormData.quantity <= 0) {
        errors.quantity = 'Số lượng phải lớn hơn 0';
      } else if (bulkFormData.quantity > maxRoomsCanAdd) {
        errors.quantity = `Chỉ có thể thêm tối đa ${maxRoomsCanAdd} phòng (đã có ${rooms.length}/${rt?.numberOfRooms || 0})`;
      }
    } else {
      // Range mode
      if (!bulkFormData.startNumber || bulkFormData.startNumber <= 0) {
        errors.startNumber = 'Số bé nhất phải lớn hơn 0';
      }
      if (!bulkFormData.endNumber || bulkFormData.endNumber <= 0) {
        errors.endNumber = 'Số lớn nhất phải lớn hơn 0';
      }
      if (bulkFormData.startNumber >= bulkFormData.endNumber) {
        errors.endNumber = 'Số lớn nhất phải lớn hơn số bé nhất';
      }
      const rangeCount = bulkFormData.endNumber - bulkFormData.startNumber + 1;
      if (rangeCount > maxRoomsCanAdd) {
        errors.endNumber = `Chỉ có thể thêm tối đa ${maxRoomsCanAdd} phòng (đã có ${rooms.length}/${rt?.numberOfRooms || 0})`;
      }
    }
    
    if (!bulkFormData.floorNumber || bulkFormData.floorNumber <= 0) {
      errors.floorNumber = 'Tầng phải là số dương';
    }
    
    setBulkFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle bulk add rooms
  const handleBulkAddRooms = async () => {
    if (!validateBulkForm()) {
      return;
    }

    setBulkLoading(true);
    try {
      const { prefix, quantity, floorNumber, startNumber, endNumber } = bulkFormData;
      
      const roomsToCreate = [];
      
      if (bulkMode === 'quantity') {
        // Mode 1: Generate by quantity with auto suffix 01, 02, 03...
        for (let i = 1; i <= quantity; i++) {
          const suffix = i.toString().padStart(2, '0');
          roomsToCreate.push({
            roomTypeId: roomTypeId,
            roomNumber: `${prefix}${suffix}`,
            floorNumber: parseInt(floorNumber),
            status: 'available'
          });
        }
      } else {
        // Mode 2: Generate by range [startNumber, endNumber]
        for (let i = startNumber; i <= endNumber; i++) {
          const suffix = i.toString().padStart(2, '0');
          roomsToCreate.push({
            roomTypeId: roomTypeId,
            roomNumber: `${prefix}${suffix}`,
            floorNumber: parseInt(floorNumber),
            status: 'available'
          });
        }
      }
      
      // Call bulk create API
      await createBulk(roomsToCreate);
      await refresh();
      
      setShowBulkAddModal(false);
      showSuccess(`Đã thêm thành công ${roomsToCreate.length} phòng!`);
    } catch (error) {
      console.error('Error bulk adding rooms:', error);
      showError('Có lỗi khi thêm phòng hàng loạt: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBack = () => {
    console.log('🔄 RoomsByTypePage - handleBack:', { 
      returnTo, 
      hotelFromNav: hotelFromNav?.name,
      hotel: hotel?.name,
      stateFromNav,
      originalReturnTo: stateFromNav.originalReturnTo,
      originalState: stateFromNav.originalState
    });

    if (returnTo) {
      // If we have original state from detail page, restore it
      if (stateFromNav.originalState) {
        navigate(returnTo, {
          state: stateFromNav.originalState
        });
      } else {
        // Sử dụng hotel hiện tại (có thể được update) thay vì hotelFromNav
        const currentHotel = hotel || hotelFromNav;
        
        navigate(returnTo, { 
          state: { 
            hotel: currentHotel,
            hotelId: currentHotel?.hotel_id || currentHotel?.hotelId || currentHotel?.id,
            roomType: roomTypeFromNav,
            lockHotel: lockHotel 
          } 
        });
      }
    } else {
      navigate('/hotel-owner/rooms/types');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + chọn KS/Loại phòng */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {returnTo && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg mr-3 transition-colors"
                title="Quay lại trang chi tiết loại phòng"
              >
                <ArrowLeft className="text-gray-600" size={20} />
              </button>
            )}
            <Shield className="text-blue-600 mr-3" size={24} />
            <h1 className="text-2xl font-bold">Phòng theo loại phòng</h1>
          </div>
          {returnTo && (
            <button
              onClick={handleBack}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Quay lại {roomTypeFromNav?.name || 'trang chi tiết'}
            </button>
          )}
        </div>

        {/* Hiển thị thông báo khi được điều hướng từ trang khác */}
        {(lockHotel || lockRoomType) && (
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm text-blue-700">
              <strong>Đang quản lý phòng cho:</strong> {hotelFromNav?.name} - {roomTypeFromNav?.name}
              {lockHotel && lockRoomType && (
                <span className="block mt-1">
                  Không thể thay đổi khách sạn và loại phòng. {returnTo && "Click 'Quay lại' để trở về trang chi tiết."}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn:</label>
            <select
              className={`w-full border rounded-lg px-3 py-2 ${lockHotel ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={String(hotelId)}
              disabled={lockHotel}
              onChange={(e) => {
                if (lockHotel) return;
                const h = hotels.find(
                  x => String(x.hotel_id || x.hotelId || x.id) === String(e.target.value)
                );
                setHotel(h || null);
                // Không gọi setRT ở đây để tránh vòng lặp
                cancelForm();
              }}
            >
              {hotels.map(h => {
                const id = h.hotel_id || h.hotelId || h.id;
                return (
                  <option key={id} value={String(id)}>
                    {h.name} - {h.address}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn loại phòng:</label>
            <select
              className={`w-full border rounded-lg px-3 py-2 ${lockRoomType ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={String(roomTypeId || '')}
              disabled={lockRoomType}
              onChange={(e) => {
                if (lockRoomType) return;
                const t = roomTypes.find(
                  x => String(x.room_type_id || x.id) === String(e.target.value)
                );
                setRT(t || null);
                // Không gọi cancelForm ở đây nếu không cần thiết
              }}
            >
              {roomTypes.map(t => {
                const id = t.room_type_id || t.id;
                return (
                  <option key={id} value={String(id)}>
                    {t.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Khối quản lý phòng */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {editingId ? `Đang sửa phòng #${editingId}` : `Phòng của: ${rt?.name || '—'}`}
            </h2>
            {rt?.numberOfRooms && (
              <p className="text-sm text-gray-500 mt-1">
                Đã có {rooms.length}/{rt.numberOfRooms} phòng
                {maxRoomsCanAdd > 0 && ` • Có thể thêm tối đa ${maxRoomsCanAdd} phòng nữa`}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={openAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} /> Thêm phòng
            </button>
            {maxRoomsCanAdd > 0 && (
              <button
                onClick={handleOpenBulkAdd}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus size={16} /> Thêm hàng loạt
              </button>
            )}
          </div>
        </div>

        {/* Form inline — chỉ hiện khi thêm/sửa */}
        {showForm && (
          <form
            onSubmit={submit}
            className="mb-5 grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-lg"
          >
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Số phòng</label>
              <input
                className="w-full border rounded-lg px-3 py-2"
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                placeholder="VD: 501"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Tầng</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={form.floor_number}
                onChange={(e) => {
                  // Sửa lỗi NaN: kiểm tra giá trị hợp lệ trước khi set
                  const value = e.target.value;
                  if (value === '') {
                    setForm({ ...form, floor_number: '' });
                  } else {
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setForm({ ...form, floor_number: numValue });
                    }
                  }
                }}
                placeholder="VD: 5"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Trạng thái</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                disabled={pending}
                className={`text-white px-3 py-2 rounded-lg ${
                  editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-60`}
                title={editingId ? 'Lưu' : 'Thêm mới'}
              >
                <Save size={16} className="inline mr-1" />
                {editingId ? 'Lưu' : 'Thêm mới'}
              </button>

              <button
                type="button"
                onClick={cancelForm}
                className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600"
              >
                <X size={16} className="inline mr-1" /> Hủy
              </button>
            </div>
          </form>
        )}

        {/* Floor Filter and Bulk Actions */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {availableFloors.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo tầng:</label>
                <select
                  className="w-60 border rounded-lg px-3 py-2"
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                >
                  <option value="all">Tất cả tầng</option>
                  {availableFloors.filter(f => f !== 'all').map((floor) => (
                    <option key={floor} value={floor}>
                      Tầng {floor}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số phòng/trang:</label>
              <select
                className="w-32 border rounded-lg px-3 py-2"
                value={roomsPerPage}
                onChange={(e) => {
                  setRoomsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={99999}>Tất cả</option>
              </select>
            </div>
          </div>
          
          {showBulkDeleteButton && (
            <button
              onClick={openBulkDeleteConfirm}
              disabled={bulkDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              {bulkDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Đang xóa...
                </>
              ) : (
                `Xóa ${selectedRooms.length} phòng đã chọn`
              )}
            </button>
          )}
        </div>

        <div className="mb-3 text-sm text-gray-500">
          Hiển thị {filteredRooms.length}/{rooms.length} phòng
          {selectedRooms.length > 0 && ` • Đã chọn ${selectedRooms.length} phòng`}
        </div>

        {/* Select All Checkbox */}
        {paginatedRooms.length > 0 && (
          <div className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="selectAll"
              checked={paginatedRooms.length > 0 && paginatedRooms.every(r => selectedRooms.includes(getRoomId(r)))}
              onChange={toggleAllRooms}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 cursor-pointer">
              Chọn tất cả trang này
            </label>
          </div>
        )}

        {/* Danh sách phòng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {paginatedRooms.map((r) => {
            const id = getRoomId(r);
            const rn = getRoomNumber(r);
            const fl = getFloorNumber(r);
            const isSelected = selectedRooms.includes(id);
            return (
              <div 
                key={id ?? Math.random()} 
                className={`border rounded-lg p-3 flex items-center gap-3 transition-colors ${
                  isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleRoomSelection(id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <DoorClosed className="text-blue-500" size={20} />
                <div className="flex-1">
                  <div className="font-medium">Phòng {rn || '—'}</div>
                  <div className="text-xs text-gray-500">
                    Tầng {fl || '—'} • {r.status || '—'}
                  </div>
                </div>
                <button
                  className="px-2 py-1 text-sm rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  onClick={() => openEdit(r)}
                  title="Sửa"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="px-2 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
                  onClick={() => openDeleteConfirm(r)}
                  title="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {!filteredRooms.length && rooms.length > 0 && (
            <div className="text-sm text-gray-500">Không có phòng nào ở tầng này.</div>
          )}
          {!rooms.length && (
            <div className="text-sm text-gray-500">Chưa có phòng nào cho loại phòng này.</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages}
              </div>
              {totalPages > 5 && (
                <form onSubmit={handlePageJump} className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageJumpInput}
                    onChange={(e) => setPageJumpInput(e.target.value)}
                    placeholder="Đến trang..."
                    className="w-24 px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Đi
                  </button>
                </form>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Trước
              </button>
              
              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Sau <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {roomError && (
        <div className="text-red-600 font-semibold mb-4">
          Không thể kết nối tới server hoặc lấy dữ liệu phòng. Vui lòng kiểm tra lại kết nối hoặc liên hệ admin.
        </div>
      )}

      {/* Bulk Add Rooms Modal */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Thêm phòng hàng loạt</h3>
            
            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn chế độ thêm phòng:
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkMode('quantity')}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      bulkMode === 'quantity'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={bulkLoading}
                  >
                    Theo số lượng
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode('range')}
                    className={`flex-1 px-4 py-2 rounded-lg border ${
                      bulkMode === 'range'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    disabled={bulkLoading}
                  >
                    Theo khoảng số
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {bulkMode === 'quantity' 
                    ? 'Nhập số lượng, hệ thống tự tạo từ 01, 02, 03...' 
                    : 'Chọn số phòng từ số bé nhất đến số lớn nhất'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền tố số phòng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bulkFormData.prefix}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, prefix: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 ${bulkFormErrors.prefix ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ví dụ: VD-5"
                  disabled={bulkLoading}
                />
                {bulkFormErrors.prefix && (
                  <p className="text-red-500 text-sm mt-1">{bulkFormErrors.prefix}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Ví dụ: Nhập "VD-5" → tạo VD-501, VD-502...
                </p>
              </div>

              {bulkMode === 'quantity' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng phòng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxRoomsCanAdd}
                    value={bulkFormData.quantity}
                    onChange={(e) => setBulkFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className={`w-full border rounded-lg px-3 py-2 ${bulkFormErrors.quantity ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Nhập số lượng"
                    disabled={bulkLoading}
                  />
                  {bulkFormErrors.quantity && (
                    <p className="text-red-500 text-sm mt-1">{bulkFormErrors.quantity}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Tối đa: {maxRoomsCanAdd} phòng (đã có {rooms.length}/{rt?.numberOfRooms || 0})
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số bé nhất <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bulkFormData.startNumber}
                      onChange={(e) => setBulkFormData(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 0 }))}
                      className={`w-full border rounded-lg px-3 py-2 ${bulkFormErrors.startNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="VD: 31"
                      disabled={bulkLoading}
                    />
                    {bulkFormErrors.startNumber && (
                      <p className="text-red-500 text-xs mt-1">{bulkFormErrors.startNumber}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số lớn nhất <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bulkFormData.endNumber}
                      onChange={(e) => setBulkFormData(prev => ({ ...prev, endNumber: parseInt(e.target.value) || 0 }))}
                      className={`w-full border rounded-lg px-3 py-2 ${bulkFormErrors.endNumber ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="VD: 40"
                      disabled={bulkLoading}
                    />
                    {bulkFormErrors.endNumber && (
                      <p className="text-red-500 text-xs mt-1">{bulkFormErrors.endNumber}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">
                      Tạo {bulkFormData.endNumber >= bulkFormData.startNumber ? bulkFormData.endNumber - bulkFormData.startNumber + 1 : 0} phòng • 
                      Tối đa: {maxRoomsCanAdd} phòng (đã có {rooms.length}/{rt?.numberOfRooms || 0})
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tầng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={bulkFormData.floorNumber}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, floorNumber: parseInt(e.target.value) || 0 }))}
                  className={`w-full border rounded-lg px-3 py-2 ${bulkFormErrors.floorNumber ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Nhập số tầng"
                  disabled={bulkLoading}
                />
                {bulkFormErrors.floorNumber && (
                  <p className="text-red-500 text-sm mt-1">{bulkFormErrors.floorNumber}</p>
                )}
              </div>

              {/* Preview */}
              {bulkFormData.prefix && (
                bulkMode === 'quantity' ? (
                  bulkFormData.quantity > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Xem trước số phòng:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: Math.min(bulkFormData.quantity, 5) }, (_, i) => {
                          const suffix = (i + 1).toString().padStart(2, '0');
                          return (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {bulkFormData.prefix}{suffix}
                            </span>
                          );
                        })}
                        {bulkFormData.quantity > 5 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            ... và {bulkFormData.quantity - 5} phòng nữa
                          </span>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  bulkFormData.endNumber >= bulkFormData.startNumber && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Xem trước số phòng:</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: Math.min(bulkFormData.endNumber - bulkFormData.startNumber + 1, 5) }, (_, i) => {
                          const num = bulkFormData.startNumber + i;
                          const suffix = num.toString().padStart(2, '0');
                          return (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {bulkFormData.prefix}{suffix}
                            </span>
                          );
                        })}
                        {(bulkFormData.endNumber - bulkFormData.startNumber + 1) > 5 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                            ... và {bulkFormData.endNumber - bulkFormData.startNumber + 1 - 5} phòng nữa
                          </span>
                        )}
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={bulkLoading}
              >
                Hủy
              </button>
              <button
                onClick={handleBulkAddRooms}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Thêm {bulkMode === 'quantity' ? bulkFormData.quantity : (bulkFormData.endNumber >= bulkFormData.startNumber ? bulkFormData.endNumber - bulkFormData.startNumber + 1 : 0)} phòng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <DeleteConfirmModal
          title={deleteConfirm.isBulk ? `Xóa ${selectedRooms.length} phòng` : 'Xóa phòng'}
          message={
            deleteConfirm.isBulk
              ? `Bạn có chắc muốn xóa ${selectedRooms.length} phòng đã chọn? Hành động này không thể hoàn tác.`
              : `Bạn có chắc muốn xóa phòng ${getRoomNumber(deleteConfirm.room) || ''}? Hành động này không thể hoàn tác.`
          }
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          isLoading={bulkDeleting}
        />
      )}

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
}
  
