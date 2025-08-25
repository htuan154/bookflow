// src/pages/hotel-owner/rooms/RoomStatusPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Hotel, DoorClosed, BrushCleaning, Wrench, Ban, Users } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useRoomContext } from '../../../context/RoomContext';

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

export default function RoomStatusPage() {
  // Lấy danh sách khách sạn của chủ
  const { hotelData, fetchOwnerHotel } = useHotelOwner();
  const hotels = Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []);
  const [hotel, setHotel] = useState(null);

  useEffect(() => { fetchOwnerHotel(); }, [fetchOwnerHotel]);
  useEffect(() => { if (hotels.length && !hotel) setHotel(hotels[0]); }, [hotels, hotel]);

  const hotelId = useMemo(() => hotel?.hotel_id || hotel?.hotelId || hotel?.id || '', [hotel]);

  // Lấy phòng theo KS từ RoomContext
  const { rooms, loading, getByHotel } = useRoomContext();
  useEffect(() => { if (hotelId) getByHotel(hotelId); }, [hotelId, getByHotel]);

  // Lọc theo trạng thái
  const [filter, setFilter] = useState('all');
  const filteredRooms = useMemo(() => {
    if (filter === 'all') return rooms;
    return rooms.filter(r => (r.status || '').toLowerCase() === filter);
  }, [rooms, filter]);

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo trạng thái</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Cards thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Tổng số phòng" value={stats.total} />
        <StatCard title="Sẵn sàng" value={stats.available} />
        <StatCard title="Đang ở" value={stats.occupied} />
        <StatCard title="Đang dọn" value={stats.cleaning} />
        <StatCard title="Bảo trì" value={stats.maintenance} />
        <StatCard title="Ngưng khai thác" value={stats.out_of_order} />
      </div>

      {/* Danh sách phòng */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Danh sách phòng ({filteredRooms.length})</h2>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">Đang tải dữ liệu…</div>
        ) : (
          <div className="divide-y">
            {filteredRooms.map((r) => {
              const id = r.room_id || r.id;
              const st = (r.status || '').toLowerCase();
              const Icon = STATUS_OPTIONS.find(s => s.value === st)?.icon || DoorClosed;
              return (
                <div key={id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                    <Icon size={18} className="text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Phòng {r.room_number}</div>
                    <div className="text-sm text-gray-500">Tầng {r.floor_number ?? '—'}</div>
                  </div>
                  <span className={`px-2 py-1 text-sm rounded ${badgeClass(st)}`}>
                    {STATUS_OPTIONS.find(s => s.value === st)?.label || r.status}
                  </span>
                </div>
              );
            })}
            {!filteredRooms.length && (
              <div className="p-6 text-gray-500">Không có phòng phù hợp.</div>
            )}
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
