// src/pages/hotel_owner/roomtype_management/RoomTypeListPage.jsx
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Shield, Plus, Save, X, Pencil, Trash2, Users, Tag, Layers, Ruler, Hash } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { RoomTypeContext, RoomTypeProvider } from '../../../context/RoomTypeContext';
import { useRoomTypeList, useRoomTypeEditor } from '../../../hooks/useRoomType';

const currency = (v) => (v == null ? '—' : Number(v).toLocaleString('vi-VN') + ' đ');

/** Tự bọc Provider nếu trang được render ngoài Provider */
export default function RoomTypeListPage() {
  const ctx = useContext(RoomTypeContext);
  return ctx ? <Inner /> : (
    <RoomTypeProvider>
      <Inner />
    </RoomTypeProvider>
  );
}

function Inner() {
  const { hotelData, fetchOwnerHotel } = useHotelOwner();
  const hotels = Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []);
  const [hotel, setHotel] = useState(null);

  useEffect(() => { fetchOwnerHotel(); }, [fetchOwnerHotel]);

  const hotelId = useMemo(() => hotel?.hotel_id || hotel?.hotelId || hotel?.id || '', [hotel]);

  const { list: roomTypes } = useRoomTypeList({ hotelId, auto: !!hotelId });
  const { pending, createType, updateType, deleteType } = useRoomTypeEditor();

  const blank = {
    name: '', description: '', max_occupancy: 2, base_price: 0,
    number_of_rooms: 1, bed_type: '', area_sqm: '',
  };
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);

  const openAdd = () => { setOpenForm(true); setForm(blank); setEditingId(null); };
  const openEdit = (t) => {
    setOpenForm(true);
    setEditingId(t.room_type_id || t.id);
    setForm({
      name: t.name || '',
      description: t.description || '',
      max_occupancy: t.max_occupancy ?? 2,
      base_price: t.base_price ?? 0,
      number_of_rooms: t.number_of_rooms ?? 1,
      bed_type: t.bed_type || '',
      area_sqm: t.area_sqm ?? '',
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!hotelId) return;
    const payload = { ...form, hotel_id: hotelId }; // BE snake_case
    if (editingId) await updateType(editingId, payload);
    else await createType(payload);
    setOpenForm(false); setEditingId(null); setForm(blank);
    // Provider đã tự refetch → không cần refresh thêm
  };

  const remove = async (id) => {
    if (!window.confirm('Xóa loại phòng này?')) return;
    await deleteType(id);
    // Provider đã tự refetch
  };

  return (
    <div className="space-y-6">
      {/* Header + chọn khách sạn */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Shield className="text-blue-600 mr-3" size={24} />
          <h1 className="text-2xl font-bold">Quản lý loại phòng</h1>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn:</label>
          <select
            className="w-full md:w-[520px] border rounded-lg px-3 py-2"
            value={hotelId}
            onChange={(e) => {
              const value = e.target.value;
              const h = hotels.find(x => (x.hotel_id || x.hotelId || x.id) === value) || null;
              setHotel(h);
              setOpenForm(false); setEditingId(null);
            }}
          >
            <option value="">— Vui lòng chọn khách sạn —</option>
            {hotels.map(h => {
              const id = h.hotel_id || h.hotelId || h.id;
              return <option key={id} value={id}>{h.name} - {h.address}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Danh sách + Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {hotelId ? `Loại phòng (${roomTypes.length})` : 'Loại phòng'}
          </h2>
          <button
            onClick={openAdd}
            disabled={!hotelId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus size={16} className="inline mr-1" /> Thêm loại phòng
          </button>
        </div>

        {!hotelId && (
          <div className="text-sm text-gray-500">Vui lòng chọn khách sạn để xem/thiết lập loại phòng.</div>
        )}

        {hotelId && openForm && (
          <form onSubmit={submit} className="mb-5 grid grid-cols-1 md:grid-cols-6 gap-3 bg-gray-50 p-4 rounded-lg">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Tên loại phòng</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.name}
                     onChange={(e)=>setForm({...form, name: e.target.value})} required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500">Giá cơ bản</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.base_price}
                     onChange={(e)=>setForm({...form, base_price: e.target.valueAsNumber})} min="0" step="0.01" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Sức chứa</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.max_occupancy}
                     onChange={(e)=>setForm({...form, max_occupancy: e.target.valueAsNumber})} min="1" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Số phòng</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.number_of_rooms}
                     onChange={(e)=>setForm({...form, number_of_rooms: e.target.valueAsNumber})} min="1" required />
            </div>
            <div>
              <label className="text-xs text-gray-500">Loại giường</label>
              <input className="w-full border rounded-lg px-3 py-2" value={form.bed_type}
                     onChange={(e)=>setForm({...form, bed_type: e.target.value})} placeholder="Queen / King / Twin" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Diện tích (m²)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" value={form.area_sqm}
                     onChange={(e)=>setForm({...form, area_sqm: e.target.valueAsNumber})} step="0.01" min="0" />
            </div>
            <div className="md:col-span-6">
              <label className="text-xs text-gray-500">Mô tả</label>
              <textarea className="w-full border rounded-lg px-3 py-2" rows={2} value={form.description}
                        onChange={(e)=>setForm({...form, description: e.target.value})}/>
            </div>
            <div className="md:col-span-6 flex gap-2">
              <button disabled={pending} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60">
                <Save size={16} className="inline mr-1" /> {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button type="button" onClick={()=>{setOpenForm(false); setEditingId(null); setForm(blank);}}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                <X size={16} className="inline mr-1" /> Hủy
              </button>
            </div>
          </form>
        )}

        {hotelId && (
          <div className="grid gap-3">
            {roomTypes.map(t => {
              const id = t.room_type_id || t.id;
              return (
                <div key={id} className="border rounded-lg p-4 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-gray-500">
                      <Users size={14} className="inline mr-1" /> {t.max_occupancy ?? t.maxOccupancy} khách •
                      <Tag size={14} className="inline mx-1" /> {currency(t.base_price ?? t.basePrice)} •
                      <Layers size={14} className="inline mx-1" /> {t.number_of_rooms ?? t.numberOfRooms} phòng •
                      <Hash size={14} className="inline mx-1" /> Giường: {(t.bed_type ?? t.bedType) || '—'} •
                      <Ruler size={14} className="inline mx-1" /> {(t.area_sqm ?? t.areaSqm) || '—'} m²
                    </div>
                  </div>
                  <button
                    className="px-2 py-1 text-sm rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="px-2 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={() => remove(id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            {!roomTypes.length && <div className="text-sm text-gray-500">Chưa có loại phòng nào.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
