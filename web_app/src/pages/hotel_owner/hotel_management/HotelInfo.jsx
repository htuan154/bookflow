// src/pages/hotel_owner/HotelInfo.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import CreateHotelModal from '../../../components/hotel/CreateHotelModal';
import {
  Building2, MapPin, Phone, Mail, Star, Globe,
  Edit, Save, X, Camera, Trash2, Clock,
  Wifi, Car, Utensils, Dumbbell, Waves, Shield
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { hotelApiService } from '../../../api/hotel.service';
import { API_ENDPOINTS } from '../../../config/apiEndpoints';
import axiosClient from '../../../config/axiosClient';
import useAmenity from '../../../hooks/useAmenity';
import useHotelAmenity from '../../../hooks/useHotelAmenity';
import { useNavigate } from 'react-router-dom';
import useRoomType from '../../../hooks/useRoomType';
import useRoom from '../../../hooks/useRoom';
import { useRoomTypeContext } from '../../../context/RoomTypeContext';
import { useRoomContext } from '../../../context/RoomContext';
import { useRoomTypeImageContext } from '../../../context/RoomTypeImageContext';


// helper: lấy id khách sạn/amenity an toàn
const getId = (obj) => obj?.hotel_id ?? obj?.id ?? obj?.hotelId ?? obj?._id ?? null;
const getAmenityId = (a) =>
  (typeof a === 'object'
    ? a.amenity_id ?? null
    : a ?? null);

const HotelInfo = () => {
  const location = useLocation();
  const {
    hotelData,
    loading,
    error,
    fetchOwnerHotel,
    updateOwnerHotel,
    uploadHotelImages,
    deleteHotelImage,
    clearError,
    createOwnerHotel,
  } = useHotelOwner();
  const { amenities: masterAmenities, getAmenities } = useAmenity();
  const { getByHotel } = useHotelAmenity();
  const { getByHotel: fetchRoomTypes } = useRoomTypeContext();
  const { getByHotel: fetchRooms } = useRoomContext();
  const { rooms, fetchRooms: fetchRoomList, roomStatuses, roomImages, getRoomImages, getRoomStatuses } = useRoom();
  const { roomTypes } = useRoomType();
  const { imagesByType, getImages, loadingByType } = useRoomTypeImageContext();

  // Đếm tổng số hình ảnh của tất cả loại phòng (không dùng hook trong vòng lặp)
  const roomTypeImagesCount = useMemo(() => {
    if (!roomTypes || !imagesByType) return 0;
    let total = 0;
    for (const rt of roomTypes) {
      const id = rt.room_type_id || rt.id;
      const arr = imagesByType[id] || [];
      total += Array.isArray(arr) ? arr.length : 0;
    }
    return total;
  }, [roomTypes, imagesByType]);
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [images, setImages] = useState([]);
  const [justUpdated, setJustUpdated] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [amenities, setAmenities] = useState([]);
  const [showDraftLimitModal, setShowDraftLimitModal] = useState(false);
  const [contractStatus, setContractStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'
  const [note, setNote] = useState('');
  const draftHotels = useMemo(() => hotels.filter(h => h.status === 'draft'), [hotels]);

  // gọi 1 lần khi mount (guard StrictMode)
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    fetchOwnerHotel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chuẩn hóa hotelData => hotels (mảng)
  useEffect(() => {
    const list = Array.isArray(hotelData?.data)
      ? hotelData.data
      : Array.isArray(hotelData)
      ? hotelData
      : [];
    setHotels(list);
    if (list.length && (justUpdated || !selectedHotel)) {
      setSelectedHotel(list[0]);
      setEditData(list[0]);
      setJustUpdated(false);
    }
  }, [hotelData, selectedHotel, justUpdated]);

  // Fetch images from API when selectedHotel changes
  useEffect(() => {
    const fetchImages = async () => {
      const id = getId(selectedHotel);
      if (!id) {
        setImages([]);
        return;
      }
      try {
        const res = await hotelApiService.getImagesByHotelId(id);
        // Sửa lại lấy mảng ảnh đúng trường
        const arr = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.images)
          ? res.images
          : [];
        setImages(arr);
      } catch (e) {
        setImages([]);
      }
    };
    fetchImages();
  }, [selectedHotel, justUpdated]);

  // Fetch amenities from API when selectedHotel changes
  useEffect(() => {
    if (!selectedHotel) return;
    const id = getId(selectedHotel);
    if (!id) return;
    const fetchAmenities = async () => {
      try {
        // Sử dụng hook thay vì gọi trực tiếp axiosClient
        const arr = await getByHotel(id);
        setAmenities(arr);
      } catch (e) {
        setAmenities([]);
      }
    };
    fetchAmenities();
  }, [selectedHotel]);

  // Lấy danh sách tiện nghi tổng khi mount
  useEffect(() => {
    getAmenities({ page: 1, limit: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map tiện nghi của khách sạn sang chi tiết từ master list
  const amenitiesDetails = useMemo(() => {
    // Debug dữ liệu
    console.log('Amenities raw:', amenities);
    console.log('Master amenities:', masterAmenities);

    if (!Array.isArray(amenities) || !Array.isArray(masterAmenities)) return [];
    return amenities
      .map(a => {
        const id = String(a.amenity_id ?? a.id ?? a.amenityId);
        return masterAmenities.find(m => String(m.amenity_id) === id || String(m.id) === id || String(m.amenityId) === id);
      })
      .filter(Boolean);
  }, [amenities, masterAmenities]);

  const handleHotelSelect = (hotel) => {
    setSelectedHotel(hotel);
    setEditData(hotel);
    setIsEditing(false);
    // Trigger fetch for all related hotel data immediately
    const hotelId = getId(hotel);
    if (hotelId) {
      // Fetch room types
      fetchRoomTypes(hotelId);
      // Fetch rooms
      fetchRooms(hotelId);
      // Fetch amenities
      getAmenities({ page: 1, limit: 200 });
      // Fetch hotel amenities
      getByHotel(hotelId);
      // Fetch hotel images
      hotelApiService.getImagesByHotelId(hotelId);
      // Fetch room type images
      if (roomTypes && roomTypes.length > 0 && getImages) {
        roomTypes.forEach(rt => {
          const rtId = rt.room_type_id || rt.id;
          if (rtId) getImages(rtId).catch(console.error);
        });
      }
    }
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const id = getId(selectedHotel);
      if (!id) return;
      await updateOwnerHotel(id, editData);
      setJustUpdated(true);
      fetchOwnerHotel(); // Refetch lại danh sách khách sạn sau khi cập nhật
      setIsEditing(false);
    } catch (e) {
      console.error('Error updating hotel:', e);
    }
  };

  const handleCancel = () => {
    setEditData(selectedHotel);
    setIsEditing(false);
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    const id = getId(selectedHotel);
    if (!files.length || !id) return;
    try {
      await uploadHotelImages(id, files);
      setJustUpdated(true); // trigger image refetch
    } catch (e) {
      console.error('Error uploading images:', e);
    }
  };

  const removeImage = async (index, imageId) => {
    const id = getId(selectedHotel);
    if (imageId && id) {
      try {
        await deleteHotelImage(id, imageId);
        setJustUpdated(true); // trigger image refetch
      } catch (e) {
        console.error('Error deleting image:', e);
      }
    } else {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const amenitiesIcons = {
    wifi: <Wifi size={16} />,
    parking: <Car size={16} />,
    restaurant: <Utensils size={16} />,
    gym: <Dumbbell size={16} />,
    pool: <Waves size={16} />,
    security: <Shield size={16} />,
  };

  // Hàm chuyển trạng thái khách sạn sang pending
  const handleSubmitHotel = async () => {
    const id = getId(selectedHotel);
    if (!id) return;

    if (!window.confirm('Bạn có chắc chắn muốn gửi khách sạn này để admin duyệt? Sau khi gửi sẽ không thể chỉnh sửa.')) {
      return;
    }

    try {
      // Gửi toàn bộ thông tin khách sạn kèm status: 'pending'
      await updateOwnerHotel(id, { ...selectedHotel, status: 'pending' });
      setJustUpdated(true);
      await fetchOwnerHotel(); // Đảm bảo refetch hoàn tất
      setIsEditing(false);
      alert('Đã gửi khách sạn cho admin duyệt thành công!');
    } catch (e) {
      console.error('Error submitting hotel:', e);
      alert('Lỗi khi nộp khách sạn: ' + (e.message || 'Lỗi không xác định'));
    }
  };


  // Thêm biến loading tổng cho hình ảnh phòng
  const isRoomImagesLoading = useMemo(() => {
    if (!roomTypes || roomTypes.length === 0) return false;
    return roomTypes.some(rt => loadingByType[rt.room_type_id || rt.id]);
  }, [roomTypes, loadingByType]);

  // Biến loading tổng cho trạng thái (đặt sau khi khai báo loading và isRoomImagesLoading)
  const isDataLoading = loading || isRoomImagesLoading;


  // Tính trạng thái hoàn thiện các mục mỗi khi selectedHotel thay đổi
  const [completionStatus, setCompletionStatus] = useState({
    isInfoDone: false,
    isImagesDone: false,
    isAmenitiesDone: false,
    isRoomTypeDone: false,
    isRoomListDone: false,
    isRoomStatusDone: false,
    isRoomImagesDone: false,
    allDone: false,
  });

  useEffect(() => {
    if (!selectedHotel) return;
    const isInfoDone = !!selectedHotel?.name && !!selectedHotel?.address && !!selectedHotel?.city;
    const isImagesDone = images.length > 0;
    const isAmenitiesDone = Array.isArray(amenities) && amenities.length > 0;
    const isRoomTypeDone = Array.isArray(roomTypes) && roomTypes.length > 0;
    const isRoomListDone = Array.isArray(rooms) && rooms.length > 0;
    const isRoomStatusDone = Array.isArray(rooms) && rooms.length > 0 &&
      rooms.some(r => r.status && ['available', 'occupied', 'maintenance', 'out_of_order', 'cleaning'].includes(r.status));
    const isRoomImagesDone = Object.keys(imagesByType).length > 0 &&
      Object.values(imagesByType).some(arr => Array.isArray(arr) && arr.length > 0);
    const allDone = isInfoDone && isImagesDone && isAmenitiesDone && isRoomTypeDone && isRoomListDone && isRoomStatusDone && isRoomImagesDone;
    setCompletionStatus({
      isInfoDone,
      isImagesDone,
      isAmenitiesDone,
      isRoomTypeDone,
      isRoomListDone,
      isRoomStatusDone,
      isRoomImagesDone,
      allDone,
    });
  }, [selectedHotel, images, amenities, roomTypes, rooms, imagesByType]);

  const isInfoDone = completionStatus.isInfoDone;
  const isImagesDone = completionStatus.isImagesDone;
  const isAmenitiesDone = completionStatus.isAmenitiesDone;
  const isRoomTypeDone = completionStatus.isRoomTypeDone;
  const isRoomListDone = completionStatus.isRoomListDone;
  const isRoomStatusDone = completionStatus.isRoomStatusDone;
  const isRoomImagesDone = completionStatus.isRoomImagesDone;
  const allDone = completionStatus.allDone;

  const handleSendContract = async () => {
    // TODO: Gọi API gửi hợp đồng, cập nhật trạng thái contractStatus
    setContractStatus('pending');
    setNote('Đã gửi hợp đồng, admin sẽ duyệt trong 3-7 ngày.');
  };

  // Handler cho từng nút bổ sung (bỏ handleAddSettings)
  const handleAddInfo = () => setIsEditing(true); // chỉnh sửa ngay tại trang này
  const handleAddImages = () => navigate('/hotel-owner/hotel/images');
  const handleAddAmenities = () => navigate('/hotel-owner/hotel/amenities');
  const handleAddRoomType = () => navigate('/hotel-owner/rooms/types');
  const handleAddRoomList = () => navigate('/hotel-owner/rooms/list');
  const handleAddRoomStatus = () => navigate('/hotel-owner/rooms/status');
  const handleAddRoomImages = () => navigate('/hotel-owner/rooms/images');

  // Fetch dữ liệu từ context khi selectedHotel thay đổi hoặc khi quay lại trang
  useEffect(() => {
    fetchOwnerHotel();
    if (selectedHotel) {
      const hotelId = getId(selectedHotel);
      if (hotelId) {
        fetchRoomTypes(hotelId);
        fetchRooms(hotelId);
        getAmenities({ page: 1, limit: 200 });
        if (roomTypes && roomTypes.length > 0 && getImages) {
          roomTypes.forEach(rt => {
            const rtId = rt.room_type_id || rt.id;
            if (rtId) getImages(rtId).catch(console.error);
          });
        }
      }
    }
    // eslint-disable-next-line
  }, [location]);

  // Sửa lại: fetch hình ảnh room types khi có roomTypes
  useEffect(() => {
    if (roomTypes && roomTypes.length > 0 && getImages) {
      roomTypes.forEach(rt => {
        const rtId = rt.room_type_id || rt.id;
        if (rtId) {
          getImages(rtId).catch(console.error);
        }
      });
    }
  }, [roomTypes, getImages]); // Phụ thuộc vào roomTypes và getImages

  const [currentPage, setCurrentPage] = useState(1);
  const hotelsPerPage = 5; // Số khách sạn mỗi trang

  // Tính toán danh sách khách sạn hiển thị theo trang
  const totalPages = Math.ceil(hotels.length / hotelsPerPage);
  const paginatedHotels = useMemo(() => {
    const startIdx = (currentPage - 1) * hotelsPerPage;
    return hotels.slice(startIdx, startIdx + hotelsPerPage);
  }, [hotels, currentPage, hotelsPerPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (!hotels.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Nút đăng ký khách sạn mới luôn hiển thị ở đầu trang */}
      <div className="flex justify-end mb-2">
        {draftHotels.length < 3 && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            onClick={() => {
              if (draftHotels.length >= 3) {
                setShowDraftLimitModal(true);
              } else {
                setShowCreateModal(true);
              }
            }}
          >
            Đăng ký khách sạn mới
          </button>
        )}
      </div>

      {/* Modal cảnh báo vượt quá giới hạn draft */}
      {showDraftLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-red-200">
            <h2 className="text-xl font-bold text-red-600 mb-4">Không thể tạo thêm khách sạn</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Bạn chỉ được tạo tối đa <span className="font-bold">3 khách sạn</span> ở trạng thái <span className="font-bold">nháp (draft)</span>.<br />
              Vui lòng hoàn tất thông tin và nhấn <span className="font-semibold">Nộp</span> để chuyển sang trạng thái <span className="font-bold">chờ duyệt (pending)</span>.
            </p>
            <button
              onClick={() => setShowDraftLimitModal(false)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}

      <CreateHotelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (form) => {
          // Gọi API tạo khách sạn mới ở trạng thái draft
          if (draftHotels.length >= 3) {
            setShowDraftLimitModal(true);
            return;
          }
          try {
            await createOwnerHotel({ ...form, status: 'draft' });
            setShowCreateModal(false);
            fetchOwnerHotel();
          } catch (e) {
            alert('Lỗi tạo khách sạn mới!');
          }
        }}
      />

      {/* Chọn khách sạn (nếu >1) */}
      {hotels.length > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Chọn khách sạn</h3>
          <div className="flex flex-wrap gap-2">
            {paginatedHotels.map((hotel, idx) => {
              const hid = getId(hotel) ?? hotel.hotelId ?? hotel.slug ?? `h-${idx}`;
              return (
                <button
                  key={hid}
                  onClick={() => handleHotelSelect(hotel)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    (getId(selectedHotel) ?? selectedHotel?.hotelId) === (getId(hotel) ?? hotel.hotelId)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <Building2 size={16} className="mr-2" />
                    <span>{hotel.name}</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        hotel.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : hotel.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {hotel.status === 'approved' && 'Đã duyệt'}
                      {hotel.status === 'pending' && 'Chờ duyệt'}
                      {hotel.status === 'rejected' && 'Từ chối'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 gap-2">
              <button
                className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                &lt; Trước
              </button>
              <span className="mx-2 text-sm">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Sau &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Building2 size={24} className="text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedHotel?.name || 'Thông tin khách sạn'}
              </h1>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Chỉ hiển thị nút khi status là draft */}
            {selectedHotel?.status === 'draft' && (
              <>
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit size={16} className="mr-2" />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={handleSubmitHotel}
                      disabled={!allDone && !isDataLoading}
                      className={`flex items-center bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors ${
                        (!allDone && !isDataLoading) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={(!allDone && !isDataLoading) ? 'Vui lòng bổ sung đầy đủ các mục trước khi nộp' : 'Nộp khách sạn để admin duyệt'}
                    >
                      <Save size={16} className="mr-2" />
                      {isDataLoading ? 'Đang tải...' : 'Nộp'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X size={16} className="mr-2" />
                      Hủy
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save size={16} className="mr-2" />
                      Lưu
                    </button>
                  </>
                )}
              </>
            )}
            {/* Khi trạng thái là pending thì disable/tắt nút */}
            {selectedHotel?.status === 'pending' && (
              <span className="text-sm text-gray-500 italic">
                Khách sạn đang chờ duyệt, không thể chỉnh sửa hoặc nộp lại
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              selectedHotel?.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : selectedHotel?.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {selectedHotel?.status === 'approved' && '✅ Đã duyệt'}
            {selectedHotel?.status === 'pending' && '⏳ Chờ duyệt'}
            {selectedHotel?.status === 'rejected' && '❌ Từ chối'}
            {!selectedHotel?.status && '⏳ Chờ duyệt'}
          </span>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên khách sạn</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tên khách sạn"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{selectedHotel?.name || 'Chưa có tên'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hạng sao</label>
            <div className="flex items-center">
              {selectedHotel?.starRating ? (
                <>
                  {[...Array(parseInt(selectedHotel.starRating))].map((_, i) => (
                    <Star key={`star-${i}`} size={16} className="text-yellow-400 fill-current" />
                  ))}
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">Hạng sao do admin đánh giá, không thể tự chỉnh sửa</p>
                  )}
                </>
              ) : (
                <span className="text-gray-500">Chưa có đánh giá</span>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            {isEditing ? (
              <textarea
                rows={4}
                value={editData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mô tả về khách sạn..."
              />
            ) : (
              <p className="text-gray-700">{selectedHotel?.description || 'Chưa có mô tả'}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Phone size={20} className="mr-2 text-blue-600" />
            Thông tin liên hệ
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" /> Địa chỉ
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              ) : (
                <p className="text-gray-700">{selectedHotel?.address || 'Chưa có địa chỉ'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập thành phố"
                />
              ) : (
                <p className="text-gray-700">{selectedHotel?.city || 'Chưa có thành phố'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" /> Số điện thoại
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phoneNumber || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              ) : (
                <p className="text-gray-700">{selectedHotel?.phoneNumber || 'Chưa có số điện thoại'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-1" /> Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập email"
                />
              ) : (
                <p className="text-gray-700">{selectedHotel?.email || 'Chưa có email'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe size={16} className="inline mr-1" /> Website
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={editData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              ) : (
                <p className="text-gray-700">
                  {selectedHotel?.website ? (
                    <a
                      href={selectedHotel.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedHotel.website}
                    </a>
                  ) : 'Chưa có website'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" /> Thời gian nhận/trả phòng
              </label>
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={editData.check_in_time || '14:00'}
                    onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">đến</span>
                  <input
                    type="time"
                    value={editData.check_out_time || '12:00'}
                    onChange={(e) => handleInputChange('check_out_time', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">đến</span>
                </div>
              ) : (
                <p className="text-gray-700">
                  Nhận phòng: {selectedHotel?.check_in_time || '14:00'} - Trả phòng: {selectedHotel?.check_out_time || '12:00'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Amenities (hiển thị) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tiện nghi</h2>
          {Array.isArray(amenitiesDetails) && amenitiesDetails.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {amenitiesDetails.map(a => (
                <div key={a.amenity_id} className="flex items-center p-4 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                  {a.icon_url ? (
                    <img src={a.icon_url} alt={a.name} className="w-8 h-8 rounded mr-3" />
                  ) : (
                    <Shield size={32} className="text-blue-300 mr-3" />
                  )}
                  <div className="font-semibold text-blue-900">{a.name}</div>
                  {a.description && <div className="text-sm text-blue-700">{a.description}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">Chưa có thông tin tiện nghi</div>
          )}
        </div>

        {/* Images Gallery */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hình ảnh khách sạn</h2>
          {isEditing && (
            <div className="mb-4">
              <label className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center">
                  <Camera size={24} className="text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">Thêm hình ảnh</span>
                </div>
                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="hidden"
                  multiple
                  accept="image/*"
                />
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.id ?? image._id ?? image.imageId ?? image.url ?? `img-${index}`} className="relative group">
                <img
                  src={image.image_url || image.imageUrl || image.url}
                  alt={image.caption || `Hotel image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                {isEditing && (
                  <button
                    onClick={() => removeImage(index, image.id ?? image._id ?? image.imageId)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {images.length === 0 && (
            <div className="text-center py-8">
              <Camera size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Chưa có hình ảnh nào</p>
            </div>
          )}
        </div>

        {/* Bảng trạng thái hoàn thiện các mục */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Trạng thái hoàn thiện khách sạn</h2>
          <table className="w-full text-left mb-2">
            <thead>
              <tr>
                <th className="py-2">Mục</th>
                <th className="py-2">Trạng thái</th>
                <th className="py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Thông tin khách sạn
                  <div className="text-xs text-gray-500">Tên, địa chỉ, thành phố...</div>
                </td>
                <td>{isInfoDone ? <span className="text-green-600">Đã đủ</span> : <span className="text-red-600">Thiếu</span>}</td>
                <td>
                  {!isInfoDone && (
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={handleAddInfo}>
                      Bổ sung
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  Hình ảnh khách sạn
                  <div className="text-xs text-gray-500">Ít nhất 1 ảnh khách sạn</div>
                </td>
                <td>{isImagesDone ? <span className="text-green-600">Đã đủ</span> : <span className="text-red-600">Thiếu</span>}</td>
                <td>
                  {!isImagesDone && (
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={handleAddImages}>
                      Bổ sung
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  Tiện nghi
                  <div className="text-xs text-gray-500">Chọn các tiện nghi có sẵn</div>
                </td>
                <td>{isAmenitiesDone ? <span className="text-green-600">Đã đủ</span> : <span className="text-red-600">Thiếu</span>}</td>
                <td>
                  {!isAmenitiesDone && (
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={handleAddAmenities}>
                      Bổ sung
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  Loại phòng
                  <div className="text-xs text-gray-500">Thêm ít nhất 1 loại phòng</div>
                </td>
                <td>{isRoomTypeDone ? <span className="text-green-600">Đã đủ</span> : <span className="text-red-600">Thiếu</span>}</td>
                <td>
                  {!isRoomTypeDone && (
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={handleAddRoomType}>
                      Bổ sung
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  Danh sách phòng
                  <div className="text-xs text-gray-500">Thêm phòng cụ thể</div>
                </td>
                <td>{isRoomListDone ? <span className="text-green-600">Đã đủ</span> : <span className="text-red-600">Thiếu</span>}</td>
                <td>
                  {!isRoomListDone && (
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={handleAddRoomList}>
                      Bổ sung
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  Trạng thái phòng
                  <div className="text-xs text-gray-500">Cập nhật trạng thái phòng</div>
                </td>
                <td>{isRoomStatusDone ? <span className="text-green-600">Đã đủ</span> : <span className="text-red-600">Thiếu</span>}</td>
                <td>
                  {!isRoomStatusDone && (
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={handleAddRoomStatus}>
                      Bổ sung
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  Hình ảnh phòng
                  <div className="text-xs text-gray-500">Thêm ảnh cho phòng</div>
                </td>
                <td>
                  {isRoomImagesLoading
                    ? <span className="text-gray-500">Đang tải...</span>
                    : isRoomImagesDone
                      ? <span className="text-green-600">Đã đủ</span>
                      : <span className="text-red-600">Thiếu</span>
                  }
                </td>
                <td>
                  {!isRoomImagesDone && !isRoomImagesLoading && (
                    <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={handleAddRoomImages}>
                      Bổ sung
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          
        </div>
      </div>
    </div>
  );
};



export default HotelInfo;

