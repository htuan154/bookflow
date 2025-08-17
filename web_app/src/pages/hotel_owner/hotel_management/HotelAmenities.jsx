import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Shield, Save, X, CheckCircle, ChevronDown,
  Wifi, Car, Utensils, Dumbbell, Waves, Coffee, Tv, Wind, Phone, Bath
} from 'lucide-react';

import useAuth from '../../../hooks/useAuth';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import useAmenity from '../../../hooks/useAmenity';
import useHotelAmenity from '../../../hooks/useHotelAmenity';

/* ================== DEBUG ================== */
const DEBUG = false;
const dlog = (...args) => { if (DEBUG) console.log(...args); };

/* ================= Icons ================= */
const amenityIcons = {
  wifi: <Wifi size={20} className="text-blue-500" />,
  parking: <Car size={20} className="text-green-500" />,
  restaurant: <Utensils size={20} className="text-orange-500" />,
  gym: <Dumbbell size={20} className="text-red-500" />,
  pool: <Waves size={20} className="text-cyan-500" />,
  coffee: <Coffee size={20} className="text-yellow-600" />,
  tv: <Tv size={20} className="text-purple-500" />,
  ac: <Wind size={20} className="text-blue-400" />,
  phone: <Phone size={20} className="text-green-600" />,
  bath: <Bath size={20} className="text-blue-300" />,
  default: <Shield size={20} className="text-gray-400" />
};

/* ================= Helpers ================= */
const hotelIdOf = (h) => h?.hotel_id ?? h?.id ?? h?.hotelId ?? h?._id ?? '';

/** Lấy id từ master amenity list (GET /amenities) */
const getAmenityId = (a) => a?.id ?? a?.amenity_id ?? a?.amenityId ?? a?._id ?? null;

/** Lấy id từ dòng trả về của API /hotels/:id/amenities (mọi dạng có thể gặp) */
const pickAmenityId = (row) => {
  if (!row) return null;
  if (typeof row === 'string') return row;

  const cands = [
    row.amenityId, row.amenity_id, row.amenity_uuid,
    row?.amenity, row?.amenity?.id, row?.amenity?.amenity_id,
    row?.Amenity?.id, row?.Amenity?.amenity_id,
    row?.pivot?.amenity_id, row?.pivot?.amenityId,
  ];
  const id = cands.find(Boolean);
  return typeof id === 'string' ? id : null;
};

export default function HotelAmenities() {
  useAuth();

  // Data hooks
  const { hotelData, fetchOwnerHotel } = useHotelOwner();
  const { amenities, getAmenities } = useAmenity();
  const { getByHotel, addAmenity, removeAmenity } = useHotelAmenity();

  // UI state
  const [selectedHotelId, setSelectedHotelId] = useState(''); // chỉ lưu ID cho ổn định
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadingAmenities, setLoadingAmenities] = useState(false);

  // ids tiện ích hiện tại + snapshot khi vào edit
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [originalAmenities, setOriginalAmenities] = useState([]);

  // chống race khi đổi KS nhanh
  const requestIdRef = useRef(0);

  /* ---------- init ---------- */
  useEffect(() => {
    fetchOwnerHotel();
    getAmenities({ page: 1, limit: 200, sortBy: 'created_at', sortOrder: 'desc' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- chuẩn hoá danh sách KS ---------- */
  const hotels = useMemo(() => {
    if (Array.isArray(hotelData?.data)) return hotelData.data;
    if (Array.isArray(hotelData)) return hotelData;
    return hotelData ? [hotelData] : [];
  }, [hotelData]);

  const selectedHotel = useMemo(
    () => hotels.find(h => hotelIdOf(h) === selectedHotelId) || null,
    [hotels, selectedHotelId]
  );

  /* ---------- lấy tiện ích theo KS (ổn định theo ID) ---------- */
  useEffect(() => {
    if (!selectedHotelId) return;

    const myReq = ++requestIdRef.current;
    setLoadingAmenities(true);

    (async () => {
      const res = await getByHotel(selectedHotelId);
      dlog('[Amenity] getByHotel RAW =>', res);

      const arr = (() => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data?.amenities)) return res.data.amenities;
        if (Array.isArray(res?.data?.items)) return res.data.items;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.items)) return res.items;
        return [];
      })();

      dlog('[Amenity] normalized len =', arr.length);
      if (arr.length) dlog('[Amenity] sample row =', arr[0]);

      const ids = arr.map(pickAmenityId).filter(Boolean);
      dlog('[Amenity] amenity ids =>', ids);

      // chỉ update nếu là request mới nhất
      if (myReq === requestIdRef.current) {
        setSelectedAmenities(ids);
        setOriginalAmenities(ids);
        setLoadingAmenities(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotelId]); // KHÔNG để getByHotel vào deps để tránh tái chạy vô hạn

  /* ---------- filter list khi chỉnh sửa ---------- */
  const filteredAmenities = useMemo(() => {
    const list = Array.isArray(amenities) ? amenities : (Array.isArray(amenities?.data) ? amenities.data : []);
    const s = (searchTerm || '').toLowerCase();
    return list.filter(a =>
      (a.name || '').toLowerCase().includes(s) ||
      (a.description || '').toLowerCase().includes(s)
    );
  }, [amenities, searchTerm]);

  const toggleAmenity = (amenityId) => {
    if (!amenityId) return;
    setSelectedAmenities(prev =>
      prev.includes(amenityId) ? prev.filter(id => id !== amenityId) : [...prev, amenityId]
    );
  };

  /* ---------- lưu thay đổi ---------- */
  const handleSave = async () => {
    if (!selectedHotelId) return alert('Vui lòng chọn khách sạn');
    try {
      setSaveLoading(true);

      const toAdd = selectedAmenities.filter(id => !originalAmenities.includes(id));
      const toRemove = originalAmenities.filter(id => !selectedAmenities.includes(id));
      dlog('[Amenity] +add:', toAdd, ' -remove:', toRemove);

      for (const id of toAdd) await addAmenity(selectedHotelId, id);
      for (const id of toRemove) await removeAmenity(selectedHotelId, id);

      // refetch để đồng bộ (giữ UI ổn định; không clear tạm thời)
      const res = await getByHotel(selectedHotelId);
      const arr = Array.isArray(res) ? res
        : Array.isArray(res?.data?.amenities) ? res.data.amenities
        : Array.isArray(res?.data?.items) ? res.data.items
        : Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.items) ? res.items
        : [];
      const ids = arr.map(pickAmenityId).filter(Boolean);

      setSelectedAmenities(ids);
      setOriginalAmenities(ids);
      setIsEditing(false);
      alert('Cập nhật tiện nghi thành công!');
    } catch (e) {
      console.error(e);
      alert('Cập nhật thất bại: ' + (e?.message || 'Lỗi không xác định'));
    } finally {
      setSaveLoading(false);
    }
  };

  /* ---------- render danh sách tiện ích hiện tại ---------- */
  const selectedAmenitiesDetails = useMemo(() => {
    if (!selectedAmenities?.length) return [];
    const master = Array.isArray(amenities) ? amenities : (Array.isArray(amenities?.data) ? amenities.data : []);
    const fromMaster = selectedAmenities
      .map(id => master.find(m => getAmenityId(m) === id))
      .filter(Boolean);
    if (fromMaster.length) return fromMaster;

    // fallback nhỏ nếu master chưa load xong
    return selectedAmenities.map((id) => ({ id, key: 'default', name: `Amenity ${String(id).slice(0,6)}` }));
  }, [selectedAmenities, amenities]);

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield size={24} className="text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Tiện nghi khách sạn</h1>
          </div>
        </div>

        {/* Chọn khách sạn */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn:</label>
          <div className="relative">
            <select
              value={selectedHotelId}
              onChange={(e) => {
                const id = e.target.value;
                dlog('[Amenity] select hotel ->', id);
                setSelectedHotelId(id);
                setIsEditing(false); // đóng editing khi đổi KS
              }}
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8"
            >
              <option value="">— Vui lòng chọn khách sạn —</option>
              {hotels.map((h) => {
                const id = hotelIdOf(h);
                return (
                  <option key={id} value={id}>
                    {h.name} - {h.address}
                  </option>
                );
              })}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Thông tin KS */}
        {selectedHotel && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-1">{selectedHotel.name}</h3>
            <p className="text-gray-600">
              {selectedHotel.address}{selectedHotel.city ? `, ${selectedHotel.city}` : ''}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          {!isEditing ? (
            <button
              onClick={() => { setOriginalAmenities([...selectedAmenities]); setIsEditing(true); }}
              disabled={!selectedHotelId}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedHotelId
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              Chỉnh sửa tiện nghi
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => { setSelectedAmenities(originalAmenities); setIsEditing(false); }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X size={16} className="mr-2 inline" />
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading || !selectedHotelId}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saveLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2 inline" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tiện nghi hiện tại */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tiện nghi hiện tại {selectedHotelId ? `(${selectedAmenitiesDetails.length})` : ''}
        </h2>

        {!selectedHotelId ? (
          <div className="text-center py-8 text-gray-500">Vui lòng chọn khách sạn để xem tiện nghi</div>
        ) : loadingAmenities ? (
          <div className="text-center py-8 text-gray-500">Đang tải tiện nghi…</div>
        ) : selectedAmenitiesDetails.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedAmenitiesDetails.map((amenity, idx) => {
              const id = getAmenityId(amenity) ?? `${amenity.name || 'a'}-${idx}`;
              return (
                <div key={id} className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  {(amenityIcons[amenity.key] || amenityIcons.default)}
                  <div className="ml-3">
                    <div className="font-medium text-green-900">{amenity.name}</div>
                    {amenity.description && <div className="text-sm text-green-700">{amenity.description}</div>}
                  </div>
                  <CheckCircle size={16} className="ml-auto text-green-600" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Chưa có tiện nghi nào</h3>
            <p className="text-gray-600">
              Thêm tiện nghi để khách hàng biết về dịch vụ của {selectedHotel?.name}
            </p>
          </div>
        )}
      </div>

      {/* Khối chỉnh sửa */}
      {isEditing && selectedHotelId && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Chọn tiện nghi cho {selectedHotel?.name}
            </h2>
            <input
              type="text"
              placeholder="Tìm tiện nghi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAmenities.map((amenity, idx) => {
              const aid = getAmenityId(amenity);
              const isSelected = aid ? selectedAmenities.includes(aid) : false;
              return (
                <div
                  key={aid ?? (amenity.name || 'amenity') + '-' + idx}
                  onClick={() => aid && toggleAmenity(aid)}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {(amenityIcons[amenity.key] || amenityIcons.default)}
                  <div className="ml-3 flex-1">
                    <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {amenity.name}
                    </div>
                    {amenity.description && (
                      <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                        {amenity.description}
                      </div>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <CheckCircle size={14} className="text-white" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              Đã chọn: <strong>{selectedAmenities.length}</strong> tiện ích cho {selectedHotel?.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
