// import React, { useEffect, useMemo, useState } from 'react';
// import {
//   Building2, Shield, ChevronDown, ChevronUp, Plus, X, Save, Pencil, Trash2,
//   Bed, Users, Tag, Ruler, Hash, Layers, CheckCircle, AlertCircle, DoorClosed
// } from 'lucide-react';

// import useAuth from '../../../hooks/useAuth';
// import { useHotelOwner } from '../../../hooks/useHotelOwner';

// // Hooks đã tạo sẵn ở bước trước
// import useRoomType, { useRoomTypeList, useRoomTypeEditor } from '../../../hooks/useRoomType';
// import useRoom, { useRoomsOfType, useRoomEditor } from '../../../hooks/useRoom';

// const ROOM_STATUSES = [
//   { value: 'available',    label: 'Sẵn sàng' },
//   { value: 'occupied',     label: 'Đang ở' },
//   { value: 'maintenance',  label: 'Bảo trì' },
//   { value: 'out_of_order', label: 'Ngưng khai thác' },
//   { value: 'cleaning',     label: 'Đang dọn' },
// ];

// const currency = (v) => (v == null ? '—' : Number(v).toLocaleString('vi-VN') + ' đ');

// export default function RoomTypeManagement() {
//   const { user } = useAuth();
//   const { hotelData, loading, fetchOwnerHotel } = useHotelOwner();

//   // ---- chọn KS --------------------------------------------------------------
//   const hotels = Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []);
//   const [selectedHotel, setSelectedHotel] = useState(null);

//   useEffect(() => {
//     fetchOwnerHotel();
//   }, [fetchOwnerHotel]);

//   useEffect(() => {
//     if (hotels.length && !selectedHotel) setSelectedHotel(hotels[0]);
//   }, [hotels, selectedHotel]);

//   const selectedHotelId = useMemo(() => {
//     return selectedHotel?.hotel_id || selectedHotel?.hotelId || selectedHotel?.id || null;
//   }, [selectedHotel]);

//   // ---- loại phòng (list + CRUD) --------------------------------------------
//   const { list: roomTypes, loading: rtLoading, setParams: setRTParams, refresh: refreshRT } =
//     useRoomTypeList({ hotelId: selectedHotelId, auto: !!selectedHotelId });

//   const { pending: rtPending, createType, updateType, deleteType } = useRoomTypeEditor();

//   const blankType = {
//     name: '',
//     description: '',
//     max_occupancy: 2,
//     base_price: 0,
//     number_of_rooms: 1,
//     bed_type: '',
//     area_sqm: '',
//   };

//   const [typeForm, setTypeForm] = useState(blankType);
//   const [editingTypeId, setEditingTypeId] = useState(null); // null: thêm mới
//   const [openTypeForm, setOpenTypeForm] = useState(false);
//   const [expandTypeIds, setExpandTypeIds] = useState(() => new Set()); // mở panel Rooms

//   const onOpenAddType = () => {
//     setTypeForm(blankType);
//     setEditingTypeId(null);
//     setOpenTypeForm(true);
//   };

//   const onOpenEditType = (type) => {
//     setTypeForm({
//       name: type.name || '',
//       description: type.description || '',
//       max_occupancy: type.max_occupancy ?? 2,
//       base_price: type.base_price ?? 0,
//       number_of_rooms: type.number_of_rooms ?? 1,
//       bed_type: type.bed_type || '',
//       area_sqm: type.area_sqm ?? '',
//     });
//     setEditingTypeId(type.room_type_id || type.id);
//     setOpenTypeForm(true);
//   };

//   const onSubmitType = async (e) => {
//     e.preventDefault();
//     if (!selectedHotelId) return;

//     const payload = { ...typeForm, hotel_id: selectedHotelId };
//     if (editingTypeId) {
//       await updateType(editingTypeId, payload);
//     } else {
//       await createType(payload);
//     }
//     setOpenTypeForm(false);
//     setEditingTypeId(null);
//     setTypeForm(blankType);
//     await refreshRT();
//   };

//   const onDeleteType = async (id) => {
//     if (!window.confirm('Xóa loại phòng này?')) return;
//     await deleteType(id);
//     await refreshRT();
//   };

//   const toggleExpand = (id) => {
//     setExpandTypeIds(prev => {
//       const next = new Set(prev);
//       next.has(id) ? next.delete(id) : next.add(id);
//       return next;
//     });
//   };

//   // ---- rooms (theo từng roomType) ------------------------------------------
//   const RoomListOfType = ({ type }) => {
//     const roomTypeId = type.room_type_id || type.id;
//     const { list: rooms, refresh } = useRoomsOfType(roomTypeId, { auto: expandTypeIds.has(roomTypeId) });
//     const { pending, createRoom, updateRoom, setStatus, deleteRoom } =
//       useRoomEditor({ roomTypeId, hotelId: selectedHotelId });

//     const blankRoom = { room_type_id: roomTypeId, room_number: '', floor_number: '', status: 'available' };
//     const [roomForm, setRoomForm] = useState(blankRoom);
//     const [editingRoomId, setEditingRoomId] = useState(null); // null: add

//     const openAddRoom = () => {
//       setEditingRoomId(null);
//       setRoomForm(blankRoom);
//     };

//     const openEditRoom = (room) => {
//       setEditingRoomId(room.room_id || room.id);
//       setRoomForm({
//         room_type_id: roomTypeId,
//         room_number: room.room_number || '',
//         floor_number: room.floor_number ?? '',
//         status: room.status || 'available',
//       });
//     };

//     const submitRoom = async (e) => {
//       e.preventDefault();
//       if (editingRoomId) {
//         await updateRoom(editingRoomId, roomForm);
//       } else {
//         await createRoom(roomForm);
//       }
//       setEditingRoomId(null);
//       setRoomForm(blankRoom);
//       await refresh();
//     };

//     const removeRoom = async (id) => {
//       if (!window.confirm('Xóa phòng này?')) return;
//       await deleteRoom(id);
//       await refresh();
//     };

//     return (
//       <div className="bg-gray-50 p-4 rounded-lg mt-3">
//         {/* form add / edit room */}
//         <form onSubmit={submitRoom} className="grid grid-cols-1 md:grid-cols-5 gap-3">
//           <div className="md:col-span-2">
//             <label className="text-xs text-gray-500">Số phòng</label>
//             <input
//               className="w-full border rounded-lg px-3 py-2"
//               value={roomForm.room_number}
//               onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
//               placeholder="VD: 501"
//               required
//             />
//           </div>
//           <div>
//             <label className="text-xs text-gray-500">Tầng</label>
//             <input
//               type="number"
//               className="w-full border rounded-lg px-3 py-2"
//               value={roomForm.floor_number}
//               onChange={(e) => setRoomForm({ ...roomForm, floor_number: e.target.valueAsNumber })}
//               placeholder="VD: 5"
//             />
//           </div>
//           <div>
//             <label className="text-xs text-gray-500">Trạng thái</label>
//             <select
//               className="w-full border rounded-lg px-3 py-2"
//               value={roomForm.status}
//               onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
//             >
//               {ROOM_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
//             </select>
//           </div>
//           <div className="flex items-end gap-2">
//             <button
//               type="submit"
//               className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
//             >
//               <Save size={16} className="inline mr-1" />
//               {editingRoomId ? 'Cập nhật' : 'Thêm phòng'}
//             </button>
//             {editingRoomId && (
//               <button
//                 type="button"
//                 onClick={() => { setEditingRoomId(null); setRoomForm(blankRoom); }}
//                 className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600"
//               >
//                 <X size={16} className="inline mr-1" />
//                 Hủy
//               </button>
//             )}
//           </div>
//         </form>

//         {/* list rooms */}
//         <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
//           {rooms.map((r) => {
//             const id = r.room_id || r.id;
//             return (
//               <div key={id} className="border rounded-lg p-3 flex items-center gap-3">
//                 <DoorClosed className="text-blue-500" size={20} />
//                 <div className="flex-1">
//                   <div className="font-medium">Phòng {r.room_number}</div>
//                   <div className="text-xs text-gray-500">Tầng {r.floor_number ?? '—'} • {ROOM_STATUSES.find(s => s.value === r.status)?.label || r.status}</div>
//                 </div>
//                 <button
//                   className="px-2 py-1 text-sm rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
//                   onClick={() => openEditRoom(r)}
//                 >
//                   <Pencil size={14} />
//                 </button>
//                 <button
//                   className="px-2 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
//                   onClick={() => removeRoom(id)}
//                 >
//                   <Trash2 size={14} />
//                 </button>
//               </div>
//             );
//           })}
//           {!rooms.length && (
//             <div className="col-span-full text-gray-500 text-sm">Chưa có phòng nào cho loại phòng này.</div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   // ---- UI tổng --------------------------------------------------------------
//   if (loading && !hotels.length) {
//     return (
//       <div className="bg-white rounded-lg p-6 text-center">
//         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
//         <p className="text-gray-600">Đang tải khách sạn...</p>
//       </div>
//     );
//   }

//   if (!hotels.length) {
//     return (
//       <div className="bg-white rounded-lg shadow p-6">
//         <div className="text-center py-12">
//           <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có khách sạn</h3>
//           <p className="text-gray-600">Tạo khách sạn trước khi quản lý phòng.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header + chọn KS */}
//       <div className="bg-white rounded-lg shadow p-6">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center">
//             <Shield size={24} className="text-blue-600 mr-3" />
//             <h1 className="text-2xl font-bold text-gray-900">Quản lý phòng</h1>
//           </div>
//         </div>

//         <div className="mt-4">
//           <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn:</label>
//           <select
//             className="w-full md:w-[520px] border rounded-lg px-3 py-2"
//             value={selectedHotelId || ''}
//             onChange={(e) => {
//               const h = hotels.find(
//                 hh => (hh.hotel_id || hh.hotelId || hh.id) === e.target.value
//               );
//               setSelectedHotel(h);
//               setExpandTypeIds(new Set());
//             }}
//           >
//             {hotels.map(h => {
//               const id = h.hotel_id || h.hotelId || h.id;
//               return (
//                 <option key={id} value={id}>
//                   {h.name} - {h.address}
//                 </option>
//               );
//             })}
//           </select>
//         </div>
//       </div>

//       {/* Loại phòng hiện có */}
//       <div className="bg-white rounded-lg shadow p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-xl font-semibold">Loại phòng ({roomTypes.length})</h2>
//           <button onClick={onOpenAddType} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
//             <Plus size={16} className="inline mr-1" /> Thêm loại phòng
//           </button>
//         </div>

//         {/* form add/edit loại phòng */}
//         {openTypeForm && (
//           <form onSubmit={onSubmitType} className="mb-5 grid grid-cols-1 md:grid-cols-6 gap-3 bg-gray-50 p-4 rounded-lg">
//             <div className="md:col-span-2">
//               <label className="text-xs text-gray-500">Tên loại phòng</label>
//               <input
//                 className="w-full border rounded-lg px-3 py-2"
//                 value={typeForm.name}
//                 onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
//                 required
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="text-xs text-gray-500">Giá cơ bản</label>
//               <input
//                 type="number"
//                 className="w-full border rounded-lg px-3 py-2"
//                 value={typeForm.base_price}
//                 onChange={(e) => setTypeForm({ ...typeForm, base_price: e.target.valueAsNumber })}
//                 step="0.01"
//                 min="0"
//                 required
//               />
//             </div>
//             <div>
//               <label className="text-xs text-gray-500">Sức chứa tối đa</label>
//               <input
//                 type="number"
//                 className="w-full border rounded-lg px-3 py-2"
//                 value={typeForm.max_occupancy}
//                 onChange={(e) => setTypeForm({ ...typeForm, max_occupancy: e.target.valueAsNumber })}
//                 min="1"
//                 required
//               />
//             </div>
//             <div>
//               <label className="text-xs text-gray-500">Số lượng phòng</label>
//               <input
//                 type="number"
//                 className="w-full border rounded-lg px-3 py-2"
//                 value={typeForm.number_of_rooms}
//                 onChange={(e) => setTypeForm({ ...typeForm, number_of_rooms: e.target.valueAsNumber })}
//                 min="1"
//                 required
//               />
//             </div>
//             <div>
//               <label className="text-xs text-gray-500">Loại giường</label>
//               <input
//                 className="w-full border rounded-lg px-3 py-2"
//                 value={typeForm.bed_type}
//                 onChange={(e) => setTypeForm({ ...typeForm, bed_type: e.target.value })}
//                 placeholder="Queen / King / Twin..."
//               />
//             </div>
//             <div>
//               <label className="text-xs text-gray-500">Diện tích (m²)</label>
//               <input
//                 type="number"
//                 className="w-full border rounded-lg px-3 py-2"
//                 value={typeForm.area_sqm}
//                 onChange={(e) => setTypeForm({ ...typeForm, area_sqm: e.target.valueAsNumber })}
//                 step="0.01"
//                 min="0"
//               />
//             </div>
//             <div className="md:col-span-6">
//               <label className="text-xs text-gray-500">Mô tả</label>
//               <textarea
//                 className="w-full border rounded-lg px-3 py-2"
//                 rows={2}
//                 value={typeForm.description}
//                 onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
//               />
//             </div>
//             <div className="md:col-span-6 flex gap-2">
//               <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
//                 <Save size={16} className="inline mr-1" />
//                 {editingTypeId ? 'Cập nhật' : 'Thêm mới'}
//               </button>
//               <button
//                 type="button"
//                 onClick={() => { setOpenTypeForm(false); setEditingTypeId(null); setTypeForm(blankType); }}
//                 className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
//               >
//                 <X size={16} className="inline mr-1" /> Hủy
//               </button>
//             </div>
//           </form>
//         )}

//         {/* list loại phòng */}
//         <div className="grid grid-cols-1 gap-3">
//           {roomTypes.map((t) => {
//             const id = t.room_type_id || t.id;
//             const open = expandTypeIds.has(id);
//             return (
//               <div key={id} className="border rounded-lg p-4">
//                 <div className="flex items-center gap-3">
//                   <Bed className="text-blue-500" size={20} />
//                   <div className="flex-1">
//                     <div className="font-semibold">{t.name}</div>
//                     <div className="text-xs text-gray-500">
//                       <Users size={14} className="inline mr-1" /> {t.max_occupancy} khách •
//                       <Tag size={14} className="inline mx-1" /> {currency(t.base_price)} •
//                       <Layers size={14} className="inline mx-1" /> {t.number_of_rooms} phòng •
//                       <Hash size={14} className="inline mx-1" /> Giường: {t.bed_type || '—'} •
//                       <Ruler size={14} className="inline mx-1" /> {t.area_sqm || '—'} m²
//                     </div>
//                   </div>

//                   <button
//                     className="px-2 py-1 text-sm rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
//                     onClick={() => onOpenEditType(t)}
//                   >
//                     <Pencil size={14} />
//                   </button>
//                   <button
//                     className="px-2 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
//                     onClick={() => onDeleteType(id)}
//                   >
//                     <Trash2 size={14} />
//                   </button>
//                   <button
//                     className="ml-2 px-2 py-1 text-sm rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
//                     onClick={() => toggleExpand(id)}
//                   >
//                     {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Rooms
//                   </button>
//                 </div>

//                 {open && <RoomListOfType type={t} />}
//               </div>
//             );
//           })}
//           {!roomTypes.length && (
//             <div className="text-gray-500 text-sm">Chưa có loại phòng nào.</div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
