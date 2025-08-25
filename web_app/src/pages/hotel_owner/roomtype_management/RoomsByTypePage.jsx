import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Plus, Save, X, Pencil, Trash2, DoorClosed } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useRoomTypeList } from '../../../hooks/useRoomType';
import { useRoomsOfType, useRoomEditor } from '../../../hooks/useRoom';

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

  useEffect(() => { fetchOwnerHotel(); }, [fetchOwnerHotel]);
  useEffect(() => { if (hotels.length && !hotel) setHotel(hotels[0]); }, [hotels, hotel]);

  const hotelId = useMemo(
    () => hotel?.hotel_id || hotel?.hotelId || hotel?.id || '',
    [hotel]
  );

  const { list: roomTypes } = useRoomTypeList({ hotelId, auto: !!hotelId });
  const [rt, setRT] = useState(null);
  useEffect(() => { if (roomTypes.length && !rt) setRT(roomTypes[0]); }, [roomTypes, rt]);

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
    setEditingId(rid);               // quan trọng: phải set id để nút chuyển thành "Lưu"
    setShowForm(true);
    setForm({
      room_type_id: roomTypeId,
      room_number: getRoomNumber(r),
      floor_number: getFloorNumber(r),
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

    // Gửi cả snake_case & camelCase để backend nhận được dù dùng key nào
    const payload = {
      room_type_id: roomTypeId,
      // số phòng
      room_number: form.room_number,
      roomNumber: form.room_number,
      room_no: form.room_number,
      number: form.room_number,
      // tầng
      floor_number: form.floor_number ?? null,
      floorNumber: form.floor_number ?? null,
      floor: form.floor_number ?? null,
      level: form.floor_number ?? null,
      // trạng thái
      status: form.status,
    };

    if (editingId) {
      await updateRoom(editingId, payload);
    } else {
      await createRoom(payload);
    }

    await refresh();
    cancelForm();
  };

  const remove = async (id, label) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phòng ${label || ''}?`)) return;
    await deleteRoom(id);
    await refresh();
  };

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
                setRT(null);
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
                cancelForm();
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
                onChange={(e) =>
                  setForm({
                    ...form,
                    floor_number: Number.isNaN(e.target.valueAsNumber)
                      ? ''
                      : e.target.valueAsNumber,
                  })
                }
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
    </div>
  );
}
