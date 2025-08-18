import React, { useEffect, useMemo, useState } from 'react';
import { Shield, Plus, Save, X, Pencil, Trash2, DoorClosed } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useRoomTypeList } from '../../../hooks/useRoomType';
import { useRoomsOfType, useRoomEditor } from '../../../hooks/useRoom';

const STATUSES = [
  { value: 'available', label: 'Sẵn sàng' },
  { value: 'occupied', label: 'Đang ở' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'out_of_order', label: 'Ngưng khai thác' },
  { value: 'cleaning', label: 'Đang dọn' },
];

export default function RoomsByTypePage() {
  const { hotelData, loading, fetchOwnerHotel } = useHotelOwner();
  const hotels = Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []);
  const [hotel, setHotel] = useState(null);

  useEffect(() => { fetchOwnerHotel(); }, [fetchOwnerHotel]);
  useEffect(() => { if (hotels.length && !hotel) setHotel(hotels[0]); }, [hotels, hotel]);

  const hotelId = useMemo(() => hotel?.hotel_id || hotel?.hotelId || hotel?.id || '', [hotel]);

  const { list: roomTypes } = useRoomTypeList({ hotelId, auto: !!hotelId });
  const [rt, setRT] = useState(null);
  useEffect(() => { if (roomTypes.length && !rt) setRT(roomTypes[0]); }, [roomTypes, rt]);

  const roomTypeId = useMemo(() => rt?.room_type_id || rt?.id || '', [rt]);
  const { list: rooms, refresh } = useRoomsOfType(roomTypeId, { auto: !!roomTypeId });
  const { pending, createRoom, updateRoom, deleteRoom } = useRoomEditor({ roomTypeId, hotelId });

  const blank = { room_type_id: roomTypeId, room_number: '', floor_number: '', status: 'available' };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { setForm(prev => ({ ...prev, room_type_id: roomTypeId })); }, [roomTypeId]);

  const openAdd = () => { setEditingId(null); setForm({ ...blank, room_type_id: roomTypeId }); };
  const openEdit = (r) => {
    setEditingId(r.room_id || r.id);
    setForm({
      room_type_id: roomTypeId,
      room_number: r.room_number || '',
      floor_number: r.floor_number ?? '',
      status: r.status || 'available',
    });
  };
  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await updateRoom(editingId, form);
    else await createRoom(form);
    setEditingId(null);
    setForm({ ...blank, room_type_id: roomTypeId });
    await refresh();
  };
  const remove = async (id) => {
    if (!window.confirm('Xóa phòng này?')) return;
    await deleteRoom(id);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Shield className="text-blue-600 mr-3" size={24} />
          <h1 className="text-2xl font-bold">Phòng theo loại phòng</h1>
        </div>

        {/* chọn KS + loại phòng */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn:</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={hotelId}
              onChange={(e) => {
                const h = hotels.find(x => (x.hotel_id || x.hotelId || x.id) === e.target.value);
                setHotel(h);
                setRT(null);
              }}
            >
              {hotels.map(h => {
                const id = h.hotel_id || h.hotelId || h.id;
                return <option key={id} value={id}>{h.name} - {h.address}</option>;
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn loại phòng:</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={roomTypeId}
              onChange={(e) => {
                const t = roomTypes.find(x => (x.room_type_id || x.id) === e.target.value);
                setRT(t || null);
              }}
            >
              {roomTypes.map(t => {
                const id = t.room_type_id || t.id;
                return <option key={id} value={id}>{t.name}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Phòng của: {rt?.name || '—'}</h2>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={16} className="inline mr-1" /> Thêm phòng
          </button>
        </div>

        {/* form add/edit room */}
        <form onSubmit={submit} className="mb-5 grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-lg">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500">Số phòng</label>
            <input className="w-full border rounded-lg px-3 py-2" value={form.room_number}
                   onChange={(e)=>setForm({...form, room_number: e.target.value})} placeholder="VD: 501" required />
          </div>
          <div>
            <label className="text-xs text-gray-500">Tầng</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.floor_number}
                   onChange={(e)=>setForm({...form, floor_number: e.target.valueAsNumber})} placeholder="VD: 5" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Trạng thái</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.status}
                    onChange={(e)=>setForm({...form, status: e.target.value})}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700">
              <Save size={16} className="inline mr-1" /> {editingId ? 'Cập nhật' : 'Thêm'}
            </button>
            {editingId && (
              <button type="button" className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600"
                      onClick={()=>{setEditingId(null); setForm({ room_type_id: roomTypeId, room_number:'', floor_number:'', status:'available' });}}>
                <X size={16} className="inline mr-1" /> Hủy
              </button>
            )}
          </div>
        </form>

        {/* list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map(r => {
            const id = r.room_id || r.id;
            return (
              <div key={id} className="border rounded-lg p-3 flex items-center gap-3">
                <DoorClosed className="text-blue-500" size={20} />
                <div className="flex-1">
                  <div className="font-medium">Phòng {r.room_number}</div>
                  <div className="text-xs text-gray-500">Tầng {r.floor_number ?? '—'} • {r.status}</div>
                </div>
                <button className="px-2 py-1 text-sm rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        onClick={()=>openEdit(r)}><Pencil size={14}/></button>
                <button className="px-2 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
                        onClick={()=>remove(id)}><Trash2 size={14}/></button>
              </div>
            );
          })}
          {!rooms.length && <div className="text-sm text-gray-500">Chưa có phòng nào cho loại phòng này.</div>}
        </div>
      </div>
    </div>
  );
}
