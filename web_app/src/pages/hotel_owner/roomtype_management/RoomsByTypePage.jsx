import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Plus, Save, X, Pencil, Trash2, DoorClosed } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useRoomTypeList } from '../../../hooks/useRoomType';
import { useRoomsOfType, useRoomEditor } from '../../../hooks/useRoom';
import { useRoomContext } from '../../../context/RoomContext';

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
  // ====== Chọn KS / Loại phòng ======
  const { hotelData, fetchOwnerHotel } = useHotelOwner();
  const hotels = Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []);
  const [hotel, setHotel] = useState(null);

  // Chỉ gọi fetchOwnerHotel 1 lần khi mount
  useEffect(() => { 
    fetchOwnerHotel(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chỉ setHotel khi hotelData thay đổi, KHÔNG setRT trong useEffect này
  useEffect(() => { 
    if (hotels.length && !hotel) setHotel(hotels[0]); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels]);

  const hotelId = useMemo(
    () => hotel?.hotel_id || hotel?.hotelId || hotel?.id || '',
    [hotel]
  );

  // Chỉ setRT khi roomTypes thay đổi, KHÔNG setRT về null khi hotel thay đổi
  const { list: roomTypes } = useRoomTypeList({ hotelId, auto: !!hotelId });
  const [rt, setRT] = useState(null);
  useEffect(() => { 
    if (roomTypes.length && !rt) setRT(roomTypes[0]); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomTypes]);

  const roomTypeId = useMemo(() => rt?.room_type_id || rt?.id || '', [rt]);

  // ====== Rooms ======
  const { list: rooms, refresh } = useRoomsOfType(roomTypeId, { auto: !!roomTypeId });
  const { pending, createRoom, updateRoom, deleteRoom } = useRoomEditor({ roomTypeId, hotelId });

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
      alert('Room Type ID không hợp lệ');
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
      cancelForm();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    }
    // Không cần finally nếu dùng useRoomEditor, vì hook đã tự reset pending
  };

  const remove = async (id, label) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phòng ${label || ''}?`)) return;
    await deleteRoom(id);
    await refresh();
  };

  const { error: roomError } = useRoomContext();

  return (
    <div className="space-y-6">
      {/* Header + chọn KS/Loại phòng */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Shield className="text-blue-600 mr-3" size={24} />
          <h1 className="text-2xl font-bold">Phòng theo loại phòng</h1>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn:</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={String(hotelId)}
              onChange={(e) => {
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
              className="w-full border rounded-lg px-3 py-2"
              value={String(roomTypeId || '')}
              onChange={(e) => {
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
          <h2 className="text-lg font-semibold">
            {editingId ? `Đang sửa phòng #${editingId}` : `Phòng của: ${rt?.name || '—'}`}
          </h2>
          <button
            onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} className="inline mr-1" /> Thêm phòng
          </button>
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

        {/* Danh sách phòng */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map((r) => {
            const id = getRoomId(r);
            const rn = getRoomNumber(r);
            const fl = getFloorNumber(r);
            return (
              <div key={id ?? Math.random()} className="border rounded-lg p-3 flex items-center gap-3">
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
                  onClick={() => remove(id, rn)}
                  title="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {!rooms.length && (
            <div className="text-sm text-gray-500">Chưa có phòng nào cho loại phòng này.</div>
          )}
        </div>
      </div>

      {roomError && (
        <div className="text-red-600 font-semibold mb-4">
          Không thể kết nối tới server hoặc lấy dữ liệu phòng. Vui lòng kiểm tra lại kết nối hoặc liên hệ admin.
        </div>
      )}
    </div>
  );
}
  
