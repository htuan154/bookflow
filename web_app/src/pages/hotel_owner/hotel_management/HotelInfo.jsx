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
import { staffApiService } from '../../../api/staff.service';
import userService from '../../../api/user.service';
import useAuth from '../../../hooks/useAuth';
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
import ActionButton, { ActionButtonsGroup } from '../../../components/common/ActionButton';
import EditHotelModal from '../../../components/hotel/EditHotelModal';
import useBankAccount from '../../../hooks/useBankAccount';
import { CreditCardIcon, PlusIcon } from '@heroicons/react/24/outline';
import useIM from '../../../hooks/useIM';
import Toast from '../../../components/common/Toast';
import { useToast } from '../../../hooks/useToast';

// helper: lấy id khách sạn/amenity an toàn
const getId = (obj) => obj?.hotelId ?? obj?.hotel_id ?? obj?.id ?? obj?._id ?? null;
const getAmenityId = (a) =>
  (typeof a === 'object'
    ? a.amenity_id ?? null
    : a ?? null);

const HotelInfo = () => {
  const { user } = useAuth();
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
  const {
    createBankAccount,
    unsetDefaultBankAccountsByHotel,
  } = useBankAccount();
  const { createGroup } = useIM();

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [hotelToEdit, setHotelToEdit] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [showDraftLimitModal, setShowDraftLimitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hotelToSubmit, setHotelToSubmit] = useState(null);
  const [contractStatus, setContractStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'
  const [note, setNote] = useState('');
  const [defaultBankAccount, setDefaultBankAccount] = useState(null);
  const [isBankAccountFormOpen, setIsBankAccountFormOpen] = useState(false);
  const [bankAccountFormData, setBankAccountFormData] = useState({
    bankName: '',
    accountNumber: '',
    holderName: '',
    branchName: '',
    isDefault: true
  });

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

  // Fetch default bank account when selectedHotel changes
  useEffect(() => {
    if (!selectedHotel) {
      setDefaultBankAccount(null);
      return;
    }
    const fetchDefaultBankAccount = async () => {
      try {
        const hotelId = getId(selectedHotel);
        const response = await axiosClient.get(API_ENDPOINTS.BANK_ACCOUNTS.GET_DEFAULT, {
          params: { hotel_id: hotelId }
        });
        if (response.data && response.data.success) {
          setDefaultBankAccount(response.data.data);
        } else {
          setDefaultBankAccount(null);
        }
      } catch (error) {
        console.error('Error fetching default bank account:', error);
        setDefaultBankAccount(null);
      }
    };
    fetchDefaultBankAccount();
  }, [selectedHotel]);

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

  // Hàm mở modal xác nhận nộp khách sạn
  const handleOpenSubmitModal = async (hotel) => {
    setHotelToSubmit(hotel);
    setSelectedHotel(hotel); // Đặt selectedHotel để tính toán trạng thái hoàn thiện
    setShowSubmitModal(true);
    
    // Fetch data ngay lập tức để đảm bảo trạng thái được tính toán đúng
    const hotelId = getId(hotel);
    if (hotelId) {
      try {
        // Fetch tất cả data cần thiết
        const [roomTypesData, roomsData, amenitiesData, imagesData] = await Promise.all([
          fetchRoomTypes(hotelId).catch(() => []),
          fetchRooms(hotelId).catch(() => []),
          getByHotel(hotelId).catch(() => []), // amenities
          hotelApiService.getImagesByHotelId(hotelId).then(res => {
            const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : Array.isArray(res?.images) ? res.images : [];
            return arr;
          }).catch(() => []),
        ]);
        
        // Set images immediately
        setImages(imagesData);
        setAmenities(amenitiesData);
        
        // Fetch room type images if we have room types
        if (roomTypesData && roomTypesData.length > 0) {
          await Promise.all(
            roomTypesData.map(rt => {
              const rtId = rt.room_type_id || rt.id;
              return rtId ? getImages(rtId).catch(console.error) : Promise.resolve();
            })
          );
        }
      } catch (error) {
        console.error('Error fetching hotel data for submit modal:', error);
      }
    }
  };

  // Hàm chuyển trạng thái khách sạn sang pending
  const handleSubmitHotel = async () => {
    const hotel = hotelToSubmit || selectedHotel;
    const id = getId(hotel);
    if (!id) return;

    try {
      // Gửi toàn bộ thông tin khách sạn kèm status: 'pending'
      await updateOwnerHotel(id, { ...hotel, status: 'pending' });
      setJustUpdated(true);
      await fetchOwnerHotel(); // Đảm bảo refetch hoàn tất
      setIsEditing(false);
      setShowSubmitModal(false);
      setHotelToSubmit(null);
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
    isBankAccountDone: false,
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

    // Sửa logic: chỉ 'Đã đủ' nếu tất cả loại phòng của khách sạn đều có ít nhất 1 hình ảnh
    let isRoomImagesDone = false;
    if (Array.isArray(roomTypes) && roomTypes.length > 0) {
      isRoomImagesDone = roomTypes.every(rt => {
        const rtId = rt.room_type_id || rt.id;
        const imgs = imagesByType[rtId];
        return Array.isArray(imgs) && imgs.length > 0;
      });
    }

    const isBankAccountDone = !!defaultBankAccount;
    const allDone = isInfoDone && isImagesDone && isAmenitiesDone && isRoomTypeDone && isRoomListDone && isRoomStatusDone && isRoomImagesDone && isBankAccountDone;
    setCompletionStatus({
      isInfoDone,
      isImagesDone,
      isAmenitiesDone,
      isRoomTypeDone,
      isRoomListDone,
      isRoomStatusDone,
      isRoomImagesDone,
      isBankAccountDone,
      allDone,
    });
  }, [selectedHotel, images, amenities, roomTypes, rooms, imagesByType, defaultBankAccount]);

  const isInfoDone = completionStatus.isInfoDone;
  const isImagesDone = completionStatus.isImagesDone;
  const isAmenitiesDone = completionStatus.isAmenitiesDone;
  const isRoomTypeDone = completionStatus.isRoomTypeDone;
  const isRoomListDone = completionStatus.isRoomListDone;
  const isRoomStatusDone = completionStatus.isRoomStatusDone;
  const isRoomImagesDone = completionStatus.isRoomImagesDone;
  const isBankAccountDone = completionStatus.isBankAccountDone;
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
  const handleAddBankAccount = () => setIsBankAccountFormOpen(true);

  const handleBankAccountInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBankAccountFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBankAccountSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHotel) {
      alert('Vui lòng chọn khách sạn trước!');
      return;
    }

    try {
      const hotelId = getId(selectedHotel);
      const accountData = {
        bankName: bankAccountFormData.bankName,
        accountNumber: bankAccountFormData.accountNumber,
        holderName: bankAccountFormData.holderName,
        branchName: bankAccountFormData.branchName,
        isDefault: bankAccountFormData.isDefault,
        hotelId: hotelId,
        bank_name: bankAccountFormData.bankName,
        account_number: bankAccountFormData.accountNumber,
        holder_name: bankAccountFormData.holderName,
        branch_name: bankAccountFormData.branchName,
        is_default: bankAccountFormData.isDefault,
        hotel_id: hotelId,
      };

      if (bankAccountFormData.isDefault) {
        await unsetDefaultBankAccountsByHotel(hotelId);
      }

      await createBankAccount(accountData);
      
      // Fetch lại default bank account
      const response = await axiosClient.get(API_ENDPOINTS.BANK_ACCOUNTS.GET_DEFAULT, {
        params: { hotel_id: hotelId }
      });
      if (response.data && response.data.success) {
        setDefaultBankAccount(response.data.data);
      }

      setBankAccountFormData({
        bankName: '',
        accountNumber: '',
        holderName: '',
        branchName: '',
        isDefault: true
      });
      setIsBankAccountFormOpen(false);
    } catch (error) {
      console.error('Error saving bank account:', error);
      alert('Có lỗi khi lưu tài khoản ngân hàng');
    }
  };

  const handleBankAccountCancel = () => {
    setIsBankAccountFormOpen(false);
    setBankAccountFormData({
      bankName: '',
      accountNumber: '',
      holderName: '',
      branchName: '',
      isDefault: true
    });
  };

  // Handler cho action buttons trong bảng
  const handleViewHotelDetail = (hotel) => {
    const hotelId = getId(hotel);
    navigate(`/hotel-owner/hotel/${hotelId}`, { 
      state: { hotel: hotel }
    });
  };

  const handleEditHotel = (hotel) => {
    setHotelToEdit(hotel);
    setShowEditModal(true);
  };
  // Xử lý lưu thông tin khách sạn sau khi chỉnh sửa
  const handleEditHotelSubmit = async (data) => {
    // Lấy ID từ hotelToEdit để cập nhật
    const hotelId = getId(hotelToEdit);
    console.log('Debug - hotelToEdit:', hotelToEdit);
    console.log('Debug - hotelId:', hotelId);
    console.log('Debug - data:', data);
    
    if (!hotelId) {
      alert('Không tìm thấy ID khách sạn!');
      return;
    }
    try {
      // Gọi API cập nhật với hotelId và dữ liệu mới
      await updateOwnerHotel(hotelId, data);
      alert('Cập nhật khách sạn thành công!');
      setShowEditModal(false);
      setHotelToEdit(null);
      // Refresh lại danh sách khách sạn
      fetchOwnerHotel();
    } catch (error) {
      console.error('Error updating hotel:', error);
      alert('Lỗi cập nhật khách sạn: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEditHotelClose = () => {
    setShowEditModal(false);
    setHotelToEdit(null);
  };

  const handleDeleteHotel = async (hotel) => {
    if (!hotel) return;
    const hotelId = getId(hotel);
    if (!hotelId) return alert('Không tìm thấy ID khách sạn!');
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách sạn này?')) return;
    try {
      await hotelApiService.deleteHotel(hotelId);
      alert('Đã xóa khách sạn thành công!');
      fetchOwnerHotel(); // Refresh list
    } catch (error) {
      let errorMessage = 'Xóa khách sạn thất bại!';
      if (error.response?.data?.error) errorMessage = error.response.data.error;
      else if (error.response?.data?.message) errorMessage = error.response.data.message;
      alert(errorMessage);
    }
  };



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
  const [selectedStatus, setSelectedStatus] = useState('all'); // Trạng thái filter

  // Thống kê số lượng khách sạn theo trạng thái
  const statusCounts = useMemo(() => {
    const counts = {
      all: hotels.length,
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      active: 0,
      inactive: 0
    };
    
    hotels.forEach(hotel => {
      if (hotel.status && counts.hasOwnProperty(hotel.status)) {
        counts[hotel.status]++;
      }
    });
    
    return counts;
  }, [hotels]);

  // Lọc khách sạn theo trạng thái đã chọn
  const filteredHotels = useMemo(() => {
    if (selectedStatus === 'all') return hotels;
    return hotels.filter(hotel => hotel.status === selectedStatus);
  }, [hotels, selectedStatus]);

  // Tính toán danh sách khách sạn hiển thị theo trang (sau khi lọc)
  const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage);
  const paginatedHotels = useMemo(() => {
    const startIdx = (currentPage - 1) * hotelsPerPage;
    return filteredHotels.slice(startIdx, startIdx + hotelsPerPage);
  }, [filteredHotels, currentPage, hotelsPerPage]);

  // Reset trang về 1 khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  if (loading && hotels.length === 0) {
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

      {/* Bảng danh sách khách sạn */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Danh sách khách sạn của tôi</h2>
              <p className="text-sm text-gray-600 mt-1">Quản lý tất cả khách sạn đã đăng ký</p>
            </div>
            
            {/* Filter theo trạng thái */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedStatus === 'all'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Tất cả ({statusCounts.all})
              </button>
              
              {statusCounts.draft > 0 && (
                <button
                  onClick={() => setSelectedStatus('draft')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'draft'
                      ? 'bg-gray-100 text-gray-800 border border-gray-300'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Nháp ({statusCounts.draft})
                </button>
              )}
              
              {statusCounts.pending > 0 && (
                <button
                  onClick={() => setSelectedStatus('pending')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      : 'bg-yellow-50 text-yellow-600 border border-yellow-200 hover:bg-yellow-100'
                  }`}
                >
                  Chờ duyệt ({statusCounts.pending})
                </button>
              )}
              
              {statusCounts.approved > 0 && (
                <button
                  onClick={() => setSelectedStatus('approved')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'approved'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  Đã duyệt ({statusCounts.approved})
                </button>
              )}
              
              {statusCounts.active > 0 && (
                <button
                  onClick={() => setSelectedStatus('active')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'active'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  Đang hoạt động ({statusCounts.active})
                </button>
              )}
              
              {statusCounts.rejected > 0 && (
                <button
                  onClick={() => setSelectedStatus('rejected')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'rejected'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  Bị từ chối ({statusCounts.rejected})
                </button>
              )}
              
              {statusCounts.inactive > 0 && (
                <button
                  onClick={() => setSelectedStatus('inactive')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === 'inactive'
                      ? 'bg-gray-100 text-gray-800 border border-gray-300'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Ngừng hoạt động ({statusCounts.inactive})
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách sạn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedHotels.map((hotel, index) => (
                <tr key={getId(hotel) || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{hotel.name}</div>
                        <div className="text-sm text-gray-500">{hotel.category || 'Chưa phân loại'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{hotel.address}</div>
                    <div className="text-sm text-gray-500">{hotel.city}, {hotel.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{hotel.phoneNumber || 'Chưa có'}</div>
                    <div className="text-sm text-gray-500">{hotel.email || 'Chưa có'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                 hotel.status === 'approved' ? 'bg-green-100 text-green-800' :
                 hotel.status === 'active' ? 'bg-green-100 text-green-800' :
                 hotel.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                 hotel.status === 'rejected' ? 'bg-red-100 text-red-800' :
                 hotel.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                 hotel.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                 'bg-gray-100 text-gray-800'
                    }`}>
                 {hotel.status === 'approved' ? 'Đã duyệt' :
                  hotel.status === 'active' ? 'Đang hoạt động' :
                  hotel.status === 'pending' ? 'Chờ duyệt' :
                  hotel.status === 'rejected' ? 'Bị từ chối' :
                  hotel.status === 'inactive' ? 'Ngừng hoạt động' :
                  hotel.status === 'draft' ? 'Nháp' :
                  'Không xác định'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2 items-center">
                      {hotel.status === 'draft' ? (
                        <>
                          <ActionButtonsGroup
                            onView={() => handleViewHotelDetail(hotel)}
                            onEdit={() => handleEditHotel(hotel)}
                            onDelete={() => handleDeleteHotel(hotel)}
                          />
                          {/* Nút Nộp cho khách sạn draft */}
                          <button
                            className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 text-xs font-semibold"
                            title="Nộp khách sạn để admin duyệt"
                            onClick={() => handleOpenSubmitModal(hotel)}
                          >
                            Nộp
                          </button>
                        </>
                      ) : (
                        <>
                          <ActionButton type="view" onClick={() => handleViewHotelDetail(hotel)} title="Xem" />
                          <ActionButton type="delete" onClick={() => handleDeleteHotel(hotel)} title="Xoá" />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Trang {currentPage} / {totalPages} 
                {selectedStatus === 'all' ? (
                  <span> (Tổng: {hotels.length} khách sạn)</span>
                ) : (
                  <span> (Hiển thị: {filteredHotels.length} / {hotels.length} khách sạn)</span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Thông báo khi không có dữ liệu sau khi lọc */}
        {filteredHotels.length === 0 && selectedStatus !== 'all' && (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-500">
              <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Không có khách sạn nào</p>
              <p className="text-sm">
                Không tìm thấy khách sạn nào có trạng thái "{
                  selectedStatus === 'draft' ? 'Nháp' :
                  selectedStatus === 'pending' ? 'Chờ duyệt' :
                  selectedStatus === 'approved' ? 'Đã duyệt' :
                  selectedStatus === 'active' ? 'Đang hoạt động' :
                  selectedStatus === 'rejected' ? 'Bị từ chối' :
                  selectedStatus === 'inactive' ? 'Ngừng hoạt động' :
                  selectedStatus
                }"
              </p>
            </div>
          </div>
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

      {/* Modal xác nhận nộp khách sạn */}
      {showSubmitModal && hotelToSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Building2 className="mr-3 text-blue-600" />
              Trạng thái hoàn thiện - {hotelToSubmit.name}
            </h2>
            
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  ⚠️ Sau khi nộp, bạn sẽ không thể chỉnh sửa thông tin khách sạn cho đến khi admin duyệt.
                </p>
              </div>
            </div>

            {/* Bảng trạng thái hoàn thiện */}
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Kiểm tra trạng thái hoàn thiện</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mục</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Thông tin khách sạn</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Tên, địa chỉ, thành phố...</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isInfoDone ? 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Đã đủ
                          </span> : 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            ❌ Thiếu
                          </span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Hình ảnh khách sạn</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Ít nhất 1 ảnh khách sạn</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isImagesDone ? 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Đã đủ
                          </span> : 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            ❌ Thiếu
                          </span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Tiện nghi</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Chọn các tiện nghi có sẵn</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAmenitiesDone ? 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Đã đủ
                          </span> : 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            ❌ Thiếu
                          </span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Loại phòng</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Thêm ít nhất 1 loại phòng</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isRoomTypeDone ? 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Đã đủ
                          </span> : 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            ❌ Thiếu
                          </span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Danh sách phòng</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Thêm phòng cụ thể</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isRoomListDone ? 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Đã đủ
                          </span> : 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            ❌ Thiếu
                          </span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Trạng thái phòng</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Cập nhật trạng thái phòng</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isRoomStatusDone ? 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Đã đủ
                          </span> : 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            ❌ Thiếu
                          </span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Hình ảnh phòng</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Thêm ảnh cho phòng</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isRoomImagesLoading ? 
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            🔄 Đang tải...
                          </span> :
                          isRoomImagesDone ? 
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✅ Đã đủ
                            </span> : 
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              ❌ Thiếu
                            </span>
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">Tài khoản ngân hàng</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Thêm ít nhất 1 tài khoản ngân hàng mặc định</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isBankAccountDone ? 
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              ✅ Đã đủ
                            </span> : 
                            <>
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                ❌ Thiếu
                              </span>
                              <button
                                onClick={handleAddBankAccount}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Thêm tài khoản ngân hàng"
                              >
                                <PlusIcon className="h-3 w-3" />
                                Thêm
                              </button>
                            </>
                          }
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tổng kết */}
            <div className="mb-6">
              <div className={`rounded-lg p-4 ${allDone ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  {allDone ? (
                    <>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-bold">✓</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Sẵn sàng nộp!</h3>
                        <p className="text-sm text-green-700">Tất cả thông tin đã đầy đủ, bạn có thể nộp khách sạn để admin duyệt.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold">!</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Chưa đầy đủ thông tin</h3>
                        <p className="text-sm text-red-700">Một số mục còn thiếu. Bạn vẫn có thể nộp nhưng admin có thể yêu cầu bổ sung.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setHotelToSubmit(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitHotel}
                className={`px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium flex items-center ${!allDone ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-600'}`}
                disabled={!allDone}
                title={!allDone ? 'Vui lòng hoàn thiện tất cả mục trước khi nộp' : ''}
              >
                <Save size={16} className="mr-2" />
                Xác nhận nộp
              </button>
            </div>
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
            // 1. Tạo khách sạn
            const hotelRes = await createOwnerHotel({ ...form, status: 'draft' });
            // 2. Lấy hotelId từ response (ưu tiên các trường phổ biến)
            const hotelId = hotelRes?.hotelId || hotelRes?.hotel_id || hotelRes?.id || hotelRes?._id;
            // 3. Lấy userId từ user context
            const userId = user?.userId || user?.id || user?._id;
            // 4. Lấy phoneNumber từ user profile (nếu chưa có thì fetch từ API)
            let contact = user?.phoneNumber || user?.phone || '';
            if (!contact && userId) {
              try {
                const userProfile = await userService.getUserById(userId);
                contact = userProfile?.phoneNumber || userProfile?.phone || '';
              } catch (err) {
                // fallback: để trống nếu không lấy được
                contact = '';
              }
            }
            // 5. Gọi API tạo staff cho hotel_owner
            if (hotelId && userId) {
              const staffPayload = {
                hotel_id: hotelId,
                user_id: userId,
                job_position: 'Hotel_owner',
                start_date: new Date().toISOString(),
                hired_by: userId,
                contact,
                status: 'active',
              };
              console.log('[DEBUG] addExistingUserAsStaff payload:', staffPayload);
              try {
                await staffApiService.addExistingUserAsStaff(hotelId, staffPayload);
              } catch (err) {
                if (err?.response) {
                  console.log('[DEBUG] addExistingUserAsStaff error response:', err.response.data);
                } else {
                  console.log('[DEBUG] addExistingUserAsStaff error:', err);
                }
                throw err;
              }
              // 6. Tạo Group B (Owner + All Staff) cho khách sạn
              try {
                await createGroup({
                  hotel_id: hotelId,
                  owner_id: userId,
                  name: `Nhóm nội bộ ${form.name || 'Khách sạn'}`,
                  staff_ids: [] // Mới tạo hotel chưa có staff
                });
                console.log('[DEBUG] Group B created for hotel:', hotelId);
              } catch (err) {
                console.warn('[DEBUG] Group B creation failed (non-critical):', err);
                // Non-critical: không throw, chỉ log warning
              }
            }
            setShowCreateModal(false);
            fetchOwnerHotel();
          } catch (e) {
            alert('Lỗi tạo khách sạn mới!');
          }
        }}
      />

      <EditHotelModal
        isOpen={showEditModal}
        onClose={handleEditHotelClose}
        onSubmit={handleEditHotelSubmit}
        initialData={hotelToEdit}
      />

      {/* Hidden sections - now that everything is integrated in one page */}
      {false && (
        <>
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
                          onClick={() => handleOpenSubmitModal(selectedHotel)}
                          disabled={!selectedHotel}
                          className={`flex items-center bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors ${
                            !selectedHotel ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Nộp khách sạn để admin duyệt"
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
                  <tr>
                    <td>
                      Tài khoản ngân hàng
                      <div className="text-xs text-gray-500">Thêm ít nhất 1 tài khoản ngân hàng mặc định</div>
                    </td>
                    <td>{isBankAccountDone ? <span className="text-green-600">Đã đủ</span> : <span className="text-red-600">Thiếu</span>}</td>
                    <td>
                      {!isBankAccountDone && (
                        <button className="bg-blue-500 text-white px-2 py-1 rounded text-xs" onClick={handleAddBankAccount}>
                          Bổ sung
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              
            </div>
          </div>
        </>
      )}

      {/* Bank Account Form Modal */}
      {isBankAccountFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Thêm tài khoản ngân hàng</h3>
                <button
                  onClick={handleBankAccountCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleBankAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên ngân hàng *
                  </label>
                  <select
                    name="bankName"
                    value={bankAccountFormData.bankName || ''}
                    onChange={handleBankAccountInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    <option value="ACB">ACB</option>
                    <option value="Agribank">Agribank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="HDBank">HDBank</option>
                    <option value="HSBC">HSBC</option>
                    <option value="LPBank">LPBank</option>
                    <option value="MB">MB</option>
                    <option value="Sacombank">Sacombank</option>
                    <option value="SHB">SHB</option>
                    <option value="Shinhan Bank">Shinhan Bank</option>
                    <option value="Standard Chartered">Standard Chartered</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="TPBank">TPBank</option>
                    <option value="VIB">VIB</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="VPBank">VPBank</option>
                    <option value="Woori Bank">Woori Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số tài khoản *
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={bankAccountFormData.accountNumber}
                    onChange={handleBankAccountInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số tài khoản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chủ tài khoản *
                  </label>
                  <input
                    type="text"
                    name="holderName"
                    value={bankAccountFormData.holderName}
                    onChange={handleBankAccountInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên chủ tài khoản"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi nhánh
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={bankAccountFormData.branchName}
                    onChange={handleBankAccountInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tên chi nhánh"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={bankAccountFormData.isDefault}
                    onChange={handleBankAccountInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                    Đặt làm tài khoản mặc định
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBankAccountCancel}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Thêm mới
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default HotelInfo;