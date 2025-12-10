import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Image as ImageIcon, 
  Trash2, 
  Star, 
  Link, 
  Eye, 
  Edit3, 
  Grid, 
  List, 
  Download, 
  Copy,
  Check,
  X,
  AlertTriangle,
  Plus,
  ArrowLeft
} from 'lucide-react';
import roomTypeService from '../../../api/roomType.service';
import { hotelApiService } from '../../../api/hotel.service';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import { useRoomTypeList } from '../../../hooks/useRoomType';
import { useRoomTypeImages } from '../../../hooks/useRoomTypeImage';
import roomTypeImageService from '../../../api/roomTypeImage.service';
import { RoomProvider } from '../../../context/RoomContext';
import { RoomTypeImageProvider } from '../../../context/RoomTypeImageContext';

function InnerRoomTypeImagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if hotel and room type are locked from previous page
  const lockedHotel = location.state?.hotel;
  const lockedRoomType = location.state?.roomType;
  const lockHotel = location.state?.lockHotel || location.state?.lockSelection;
  const lockRoomType = location.state?.lockRoomType || location.state?.lockSelection;
  const returnTo = location.state?.returnTo;
  const returnWithHotel = location.state?.returnWithHotel;
  
  // Lấy dữ liệu khách sạn và loại phòng
  const { hotelData, fetchOwnerHotel } = useHotelOwner();
  const hotels = lockHotel && lockedHotel ? [lockedHotel] : (Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []));
  const [hotel, setHotel] = useState(null);
  const hotelId = hotel?.hotel_id || hotel?.hotelId || hotel?.id || '';
  const { list: roomTypes } = useRoomTypeList({ hotelId, auto: !!hotelId });
  const [roomType, setRoomType] = useState(null);
  const roomTypeId = roomType?.room_type_id || roomType?.id || '';

  const [viewMode, setViewMode] = useState('grid');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [editingCaption, setEditingCaption] = useState(null);
  const [editCaptionValue, setEditCaptionValue] = useState('');
  
  // Thay thế useRoomsOfType bằng useRoomTypeImages
  const {
    list: images,
    loading,
    error,
    refresh: refreshImages
  } = useRoomTypeImages(roomTypeId, { auto: true });

  const handleUploadUrl = async () => {
    // Validation chi tiết hơn
    if (!imageUrl.trim()) {
      showToast('Vui lòng nhập URL hình ảnh.', 'error');
      return;
    }

    // Kiểm tra roomTypeId hợp lệ trước khi upload
    if (
      !roomTypeId ||
      typeof roomTypeId !== 'string' ||
      roomTypeId === 'undefined' ||
      roomTypeId === 'null' ||
      roomTypeId.length < 10 // UUID thường dài hơn 10 ký tự
    ) {
      showToast('Vui lòng chọn loại phòng hợp lệ trước khi thêm hình ảnh.', 'error');
      return;
    }

    // Kiểm tra URL hợp lệ với regex - chỉ kiểm tra format
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(imageUrl)) {
      showToast('URL hình ảnh phải là URL hợp lệ', 'error');
      return;
    }

    setUploadLoading(true);
    try {
      await roomTypeImageService.uploadUrl(roomTypeId, {
        image_url: imageUrl,
        caption: caption || 'Image from URL'
      });
      
      setImageUrl('');
      setCaption('');
      setShowUploadModal(false);
      showToast('Đã thêm hình ảnh từ URL thành công');
      refreshImages();
    } catch (error) {
      console.error('Error uploading URL:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi thêm hình ảnh từ URL';
      showToast(errorMessage, 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;
    
    try {
      await roomTypeImageService.deleteImage(roomTypeId, imageId);
      showToast('Đã xóa hình ảnh thành công');
      refreshImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Có lỗi xảy ra khi xóa hình ảnh. Vui lòng thử lại.', 'error');
    }
  };

  const handleSetThumbnail = async (imageId) => {
    try {
      await roomTypeImageService.setThumbnail(roomTypeId, imageId);
      showToast('Đã đặt thumbnail thành công');
      refreshImages();
    } catch (error) {
      console.error('Error setting thumbnail:', error);
      showToast('Có lỗi xảy ra khi đặt thumbnail. Vui lòng thử lại.', 'error');
    }
  };

  const handleEditCaption = async (imageId, newCaption) => {
    try {
      await roomTypeImageService.updateImage(roomTypeId, imageId, { caption: newCaption });
      setEditingCaption(null);
      setEditCaptionValue('');
      showToast('Đã cập nhật chú thích thành công');
      refreshImages();
    } catch (error) {
      console.error('Error updating caption:', error);
      showToast('Có lỗi xảy ra khi cập nhật chú thích. Vui lòng thử lại.', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedImages.length} hình ảnh đã chọn?`)) return;
    
    try {
      const deletePromises = selectedImages.map(imageId => 
        roomTypeImageService.deleteImage(roomTypeId, imageId)
      );
      
      await Promise.all(deletePromises);
      
      setSelectedImages([]);
      setIsSelectionMode(false);
      showToast(`Đã xóa thành công ${selectedImages.length} hình ảnh`);
      refreshImages();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      showToast('Có lỗi xảy ra khi xóa hình ảnh. Vui lòng thử lại.', 'error');
    }
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const copyImageUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Đã copy URL vào clipboard');
    }).catch(() => {
      showToast('Không thể copy URL', 'error');
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toast component - centered
  const Toast = ({ message, type, onClose }) => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center`}>
      <div className={`p-6 rounded-xl shadow-xl border text-center min-w-[300px] max-w-[90vw] transition-all
        ${type === 'error'
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-green-100 text-green-800 border-green-200'
        }`}>
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-semibold">{message}</span>
          <button onClick={onClose} className="mt-2 px-4 py-1 rounded bg-white border text-gray-700 hover:bg-gray-50">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  // Error component
  const ErrorMessage = ({ error, onRetry }) => (
    <div className="text-center py-16">
      <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
      <p className="text-gray-500 mb-6">{error}</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Thử lại
      </button>
    </div>
  );

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sửa lại useEffect: chỉ cập nhật hotel khi roomType thay đổi
  useEffect(() => {
    if (roomType && roomType.hotelId) {
      const h = hotels.find(x => (x.hotel_id || x.hotelId || x.id) === roomType.hotelId) || null;
      if (h) setHotel(h);
      // Nếu không tìm thấy, giữ nguyên hotel hiện tại
    }
  }, [roomType, hotels]);

  // Initialize data on mount
  React.useEffect(() => {
    // If hotel and room type are locked, use them directly
    if ((lockHotel || lockRoomType) && lockedHotel && lockedRoomType) {
      console.log('🔒 Using locked hotel and room type:', { lockedHotel, lockedRoomType });
      setHotel(lockedHotel);
      setRoomType(lockedRoomType);
      // Don't fetch hotel data when locked
      return;
    }
    
    // Otherwise fetch hotel data normally
    fetchOwnerHotel && fetchOwnerHotel();
  }, [lockHotel, lockRoomType, lockedHotel, lockedRoomType, fetchOwnerHotel]);

  const { roomTypeId: paramRoomTypeId } = useParams();

  // Auto-select room type from URL params (only if not locked)
  useEffect(() => {
    if (!lockRoomType && paramRoomTypeId && roomTypes.length > 0) {
      const rt = roomTypes.find(x => (x.room_type_id || x.id) === paramRoomTypeId);
      if (rt) setRoomType(rt);
    }
  }, [paramRoomTypeId, roomTypes, lockRoomType]);

  return (
    <div className="w-full max-w-none bg-gray-50 p-6 min-h-screen">
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {returnTo && (
              <button
                onClick={() => {
                  // Use returnTo if available, otherwise construct URL from locked data
                  const targetUrl = returnTo || `/hotel-owner/rooms/types`;
                  console.log('🔙 Navigating back to:', targetUrl, {
                    originalReturnTo: location.state?.originalReturnTo,
                    originalState: location.state?.originalState
                  });
                  
                  // If we have original state from detail page, restore it
                  if (location.state?.originalState) {
                    navigate(targetUrl, {
                      state: location.state.originalState
                    });
                  } else if (returnWithHotel) {
                    // Navigate back with hotel data to preserve selection
                    navigate(targetUrl, {
                      state: {
                        hotel: returnWithHotel,
                        lockHotel: true,
                        autoSelect: true
                      }
                    });
                  } else {
                    navigate(targetUrl);
                  }
                }}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors mr-3"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {(lockHotel || lockRoomType) ? `Hình ảnh - ${lockedRoomType?.name} (${lockedHotel?.name})` : 'Quản lý hình ảnh loại phòng'}
              </h1>
              <p className="text-gray-600 mt-1">Quản lý và tổ chức hình ảnh cho loại phòng của bạn</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Selection mode toggle */}
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`px-4 py-2 rounded-lg border ${isSelectionMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white'}`}
            >
              {isSelectionMode ? 'Hủy chọn' : 'Chọn nhiều'}
            </button>
            
            {/* Upload button */}
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={!hotelId || !roomTypeId}
              className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 ${
                (!hotelId || !roomTypeId) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Plus className="w-4 h-4" />
              Thêm hình ảnh
            </button>
          </div>
        </div>

        {/* Hotel and Room Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn:</label>
            <select
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${lockHotel ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={hotelId}
              disabled={lockHotel}
              onChange={e => {
                const h = hotels.find(x => (x.hotel_id || x.hotelId || x.id) === e.target.value) || null;
                setHotel(h);
                setRoomType(null); // reset loại phòng khi chọn khách sạn mới
              }}
            >
              <option value="">— Chọn khách sạn —</option>
              {hotels.map(h => {
                const id = h.hotel_id || h.hotelId || h.id;
                return <option key={id} value={id}>{h.name} - {h.address}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn loại phòng:</label>
            <select
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${lockRoomType ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              value={roomTypeId}
              disabled={lockRoomType || !hotelId}
              onChange={e => {
                const rt = roomTypes.find(x => (x.room_type_id || x.id) === e.target.value) || null;
                setRoomType(rt); // KHÔNG reset hotel ở đây!
              }}
            >
              <option value="">— Chọn loại phòng —</option>
              {roomTypes.map(rt => {
                const id = rt.room_type_id || rt.id;
                return <option key={id} value={id}>{rt.name}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Lock state notification */}
        {(lockHotel || lockRoomType) && (
          <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm text-blue-700">
              <strong>Đang quản lý hình ảnh cho:</strong> {lockedHotel?.name} - {lockedRoomType?.name}
              {lockHotel && lockRoomType && (
                <span className="block mt-1">
                  Không thể thay đổi khách sạn và loại phòng. {returnTo && "Click 'Quay lại' để trở về trang trước."}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Selected Room Type Info */}
        {roomType && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">Loại phòng:</span>
                <p className="font-medium text-gray-900">{roomType.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Khách sạn:</span>
                <p className="font-medium text-gray-900">{hotel?.name || roomType.hotelId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Số phòng:</span>
                <p className="font-medium text-gray-900">{roomType.numberOfRooms ?? roomType.number_of_rooms}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Sức chứa:</span>
                <p className="font-medium text-gray-900">{roomType.maxOccupancy ?? roomType.max_occupancy} người</p>
              </div>
              {roomType.description && (
                <div className="md:col-span-2 lg:col-span-4">
                  <span className="text-sm text-gray-500">Mô tả:</span>
                  <p className="text-gray-600">{roomType.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thêm hình ảnh</h2>
            {!hotelId || !roomTypeId ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Vui lòng chọn khách sạn và loại phòng để thêm hình ảnh
              </div>
            ) : (
              <div className="space-y-4">
                {/* URL input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL hình ảnh
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      imageUrl && !/^https?:\/\/.+/i.test(imageUrl) 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                  />
                  {imageUrl && !/^https?:\/\/.+/i.test(imageUrl) && (
                    <p className="text-red-500 text-sm mt-1">
                      URL phải có định dạng hợp lệ: https://example.com/image
                    </p>
                  )}
                </div>

                {/* Caption input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chú thích
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Nhập chú thích cho hình ảnh..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Submit button */}
                <button
                  onClick={handleUploadUrl}
                  disabled={
                    uploadLoading || 
                    !imageUrl.trim() || 
                    !/^https?:\/\/.+/i.test(imageUrl) ||
                    !roomTypeId
                  }
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Thêm từ URL
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Images */}
        <div className="lg:col-span-3">
          {/* Bulk actions */}
          {isSelectionMode && selectedImages.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">Đã chọn {selectedImages.length} hình ảnh</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa đã chọn
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Images Grid/List */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Hình ảnh {roomType ? `(${images.length})` : ''}
              </h2>
              {images.length > 0 && (
                <button
                  onClick={refreshImages}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  🔄 Làm mới
                </button>
              )}
            </div>

            {loading && images.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <ErrorMessage error={error} onRetry={refreshImages} />
            ) : images.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có hình ảnh</h3>
                <p className="text-gray-500 mb-6">Bắt đầu bằng cách thêm hình ảnh đầu tiên cho loại phòng này</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                : 'space-y-4'
              }>
                {images.map((image) => (
                  <div key={image.imageId} className={viewMode === 'grid' ? 'group relative' : 'flex items-center gap-4 p-4 border rounded-lg'}>
                    {viewMode === 'grid' ? (
                      // Grid view
                      <div className="relative">
                        {/* Selection checkbox */}
                        {isSelectionMode && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedImages.includes(image.imageId)}
                              onChange={() => toggleImageSelection(image.imageId)}
                              className="w-5 h-5 rounded"
                            />
                          </div>
                        )}
                        
                        {/* Thumbnail badge */}
                        {image.isThumbnail && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              Thumbnail
                            </span>
                          </div>
                        )}
                        
                        {/* Image */}
                        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-blue-200 transition-colors">
                          <img
                            src={image.imageUrl}
                            alt={image.caption || 'Room image'}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => {
                              setSelectedImage(image);
                              setShowImageModal(true);
                            }}
                          />
                        </div>
                        
                        {/* Image info and actions */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate text-sm">
                                {image.caption || 'Không có chú thích'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(image.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyImageUrl(image.imageUrl)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                title="Copy URL"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedImage(image);
                                  setShowImageModal(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              {!image.isThumbnail && (
                                <button
                                  onClick={() => handleSetThumbnail(image.imageId)}
                                  className="p-1.5 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                                  title="Đặt làm thumbnail"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(image.imageId)}
                                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Xóa hình ảnh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List view
                      <div className="flex items-center gap-4 p-4 border rounded-lg">
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedImages.includes(image.imageId)}
                            onChange={() => toggleImageSelection(image.imageId)}
                            className="w-5 h-5 rounded"
                          />
                        )}
                        <div className="w-20 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={image.imageUrl}
                            alt={image.caption || 'Room image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900 truncate">
                                {image.caption || 'Không có chú thích'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(image.uploadedAt)}
                              </p>
                            </div>
                            {image.isThumbnail && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                Thumbnail
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => copyImageUrl(image.imageUrl)}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedImage(image);
                                setShowImageModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!image.isThumbnail && (
                              <button
                                onClick={() => handleSetThumbnail(image.imageId)}
                                className="p-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(image.imageId)}
                              className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Thêm hình ảnh</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* URL input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL hình ảnh
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      imageUrl && !/^https?:\/\/.+/i.test(imageUrl) 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                  />
                  {imageUrl && !/^https?:\/\/.+/i.test(imageUrl) && (
                    <p className="text-red-500 text-sm mt-1">
                      URL phải có định dạng hợp lệ: https://example.com/image
                    </p>
                  )}
                </div>

                {/* Caption input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chú thích
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Nhập chú thích cho hình ảnh..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUploadUrl}
                disabled={
                  uploadLoading || 
                  !imageUrl.trim() || 
                  !/^https?:\/\/.+/i.test(imageUrl) ||
                  !roomTypeId
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Thêm từ URL
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Detail Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chi tiết hình ảnh</h2>
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col lg:flex-row">
              {/* Image preview */}
              <div className="lg:flex-1 p-4 bg-gray-50 flex items-center justify-center">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.caption}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzSDVDMy45IDMgMyAzLjkgMyA1VjE5QzMgMjAuMSAzLjkgMjEgNSAyMUgxOUMyMC4xIDIxIDIxIDIwLjEgMjEgMTlaIiBzdHJva2U9IiNEMUQ1REIiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNOC41IDEwQzkuMzI4NDMgMTAgMTAgOS4zMjg0MyAxMCA4LjVDMTAgNy42NzE1NyA5LjMyODQzIDcgOC41IDdDNy42NzE1NyA3IDcgNy42NzE1NyA3IDguNUM3IDkuMzI4NDMgNy42NzE1NyAxMCA4LjUgMTBaIiBzdHJva2U9IiNEMUQ1REIiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjEgMTVMMTYgMTBMNSAyMSIgc3Ryb2tlPSIjRDFENURCIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
                  }}
                />
              </div>
              
              {/* Image info */}
              <div className="lg:w-80 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chú thích</label>
                  <p className="text-gray-900">{selectedImage.caption || 'Không có chú thích'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tải lên</label>
                  <p className="text-gray-600">{formatDate(selectedImage.uploadedAt)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedImage.imageUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => copyImageUrl(selectedImage.imageUrl)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  {selectedImage.isThumbnail ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Thumbnail
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Hình ảnh thường
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="pt-4 border-t space-y-3">
                  {!selectedImage.isThumbnail && (
                    <button
                      onClick={() => {
                        handleSetThumbnail(selectedImage.imageId);
                        setShowImageModal(false);
                        setSelectedImage(null);
                      }}
                      className="w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Đặt làm thumbnail
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedImage.imageUrl;
                      link.download = selectedImage.caption || 'image';
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Tải xuống
                  </button>
                  
                  <button
                    onClick={() => {
                      handleDelete(selectedImage.imageId);
                      setShowImageModal(false);
                      setSelectedImage(null);
                    }}
                    className="w-full bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa hình ảnh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoomTypeImagesPage(props) {
  return (
    <RoomTypeImageProvider>
      <RoomProvider>
        <InnerRoomTypeImagesPage {...props} />
      </RoomProvider>
    </RoomTypeImageProvider>
  );
}