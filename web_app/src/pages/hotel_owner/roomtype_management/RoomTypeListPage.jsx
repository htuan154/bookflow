// src/pages/hotel_owner/roomtype_management/RoomTypeListPage.jsx
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Shield, Plus, Save, X, Pencil, Trash2, Users, Tag, Layers, Ruler, Hash } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { RoomTypeContext, RoomTypeProvider } from '../../../context/RoomTypeContext';
import { useRoomTypeList, useRoomTypeEditor } from '../../../hooks/useRoomType';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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

    const payload = {
      hotelId: hotelId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      maxOccupancy: parseInt(form.max_occupancy) || 2,
      basePrice: parseFloat(form.base_price) || 0,
      numberOfRooms: parseInt(form.number_of_rooms) || 1,
      bedType: form.bed_type.trim() || null,
      areaSqm: form.area_sqm ? parseFloat(form.area_sqm) : null
    };

    // XÓA hoặc COMMENT các dòng debug sau:
    // console.log('=== SUBMIT DEBUG ===');
    // console.log('Hotel ID:', hotelId);
    // console.log('Form data:', form);
    // console.log('Payload (camelCase):', payload);

    // Validate dữ liệu
    if (!payload.name) {
      alert('Vui lòng nhập tên loại phòng');
      return;
    }
    if (payload.basePrice < 0) {
      alert('Giá phải lớn hơn hoặc bằng 0');
      return;
    }
    if (payload.maxOccupancy < 1) {
      alert('Sức chứa phải ít nhất 1 người');
      return;
    }
    if (payload.numberOfRooms < 1) {
      alert('Số phòng phải ít nhất 1');
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(payload.hotelId)) {
      console.error('Invalid Hotel ID format:', payload.hotelId);
      alert('Hotel ID không hợp lệ');
      return;
    }

    try {
      let result;
      if (editingId) {
        // console.log('Updating room type with ID:', editingId);
        result = await updateType(editingId, payload);
      } else {
        // console.log('Creating new room type');
        result = await createType(payload);
      }
      // console.log('Operation result:', result);
      setOpenForm(false); 
      setEditingId(null); 
      setForm(blank);
    } catch (error) {
      // console.error('Error submitting room type:', error);
      // console.error('Error details:', {
      //   message: error.message,
      //   response: error.response?.data,
      //   status: error.response?.status
      // });
      
      // Parse lỗi validation từ backend
      let errorMessage = 'Có lỗi xảy ra';
      if (error.response?.data) {
        if (Array.isArray(error.response.data)) {
          errorMessage = error.response.data.join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      alert(errorMessage);
    }
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
              <input 
                type="number" 
                className="w-full border rounded-lg px-3 py-2" 
                value={form.base_price}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setForm({...form, base_price: isNaN(value) ? 0 : value});
                }} 
                min="0" 
                step="1000" 
                required 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Sức chứa</label>
              <input 
                type="number" 
                className="w-full border rounded-lg px-3 py-2" 
                value={form.max_occupancy}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setForm({...form, max_occupancy: isNaN(value) ? 2 : value});
                }} 
                min="1" 
                required 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Số phòng</label>
              <input 
                type="number" 
                className="w-full border rounded-lg px-3 py-2" 
                value={form.number_of_rooms}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setForm({...form, number_of_rooms: isNaN(value) ? 1 : value});
                }} 
                min="1" 
                required 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Loại giường</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={form.bed_type}
                onChange={(e) => setForm({...form, bed_type: e.target.value})}
              >
                <option value="">-- Chọn loại giường --</option>
                <option value="single">Giường đơn</option>
                <option value="double">Giường đôi</option>
                <option value="queen">Giường Queen</option>
                <option value="king">Giường King</option>
                <option value="twin">Hai giường đơn</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Diện tích (m²)</label>
              <input 
                type="number" 
                className="w-full border rounded-lg px-3 py-2" 
                value={form.area_sqm}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setForm({...form, area_sqm: isNaN(value) ? '' : value});
                }} 
                step="0.1" 
                min="0" 
                placeholder="VD: 25.5"
              />
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
                  <button
                    onClick={() => navigate(`/hotel-owner/rooms/images`)}
                    className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    Thêm hình ảnh
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
