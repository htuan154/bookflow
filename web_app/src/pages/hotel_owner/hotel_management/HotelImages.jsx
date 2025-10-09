import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Trash2, Eye, Star, Plus, X, ChevronDown, ImageIcon, ArrowLeft } from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import useAuth from '../../../hooks/useAuth';
import { hotelApiService } from '../../../api/hotel.service';

const HotelImages = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [urlInput, setUrlInput] = useState('');
    const [captionInput, setCaptionInput] = useState('');
    const { user } = useAuth();
    const {
        hotelData,
        loading,
        error,
        fetchOwnerHotel,
        uploadHotelImages,
        deleteHotelImage,
        clearError
    } = useHotelOwner();

    // Check if hotel is locked from detail page
    const lockedHotel = location.state?.hotel;
    const isLocked = location.state?.lockHotel;
    const returnTo = location.state?.returnTo;

    const [selectedHotel, setSelectedHotel] = useState(null);
    const [hotelImages, setHotelImages] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    // Kiểm tra trạng thái có cho phép chỉnh sửa không
    const isEditable = selectedHotel && selectedHotel.status === 'draft';

    // Load hotel data khi component mount
    useEffect(() => {
        // If hotel is locked, don't fetch API, use the locked hotel
        if (isLocked && lockedHotel) {
            setSelectedHotel(lockedHotel);
            return; // Exit early, don't fetch
        }
        
        // Only fetch if not locked
        fetchOwnerHotel();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set default hotel when hotelData is available (only if not locked)
    useEffect(() => {
        // Skip if hotel is already locked
        if (isLocked && lockedHotel) return;
        
        if (hotelData && Array.isArray(hotelData) && hotelData.length > 0) {
            // If no hotel is selected, select the first one by default
            if (!selectedHotel) {
                const firstHotel = hotelData[0];
                setSelectedHotel(firstHotel);
            }
        }
    }, [hotelData, selectedHotel, isLocked, lockedHotel]);

    // Fetch images when selectedHotel changes
    useEffect(() => {
        async function fetchImages() {
            if (!selectedHotel) {
                setHotelImages([]);
                return;
            }
            const hotelId = getHotelId();
            if (!hotelId) {
                setHotelImages([]);
                return;
            }
            try {
                // Thêm log để kiểm tra hotelId và dữ liệu trả về
                console.log('HotelImages: hotelId', hotelId);
                const res = await hotelApiService.getImagesByHotelId(hotelId);
                console.log('HotelImages: API response', res);
                const images = Array.isArray(res) ? res : (res.data || res || []);
                setHotelImages(images);
            } catch (err) {
                setHotelImages([]);
            }
        }
        fetchImages();
    }, [selectedHotel]);

    // Get hotel ID from selected hotel
    const getHotelId = () => {
        if (!selectedHotel) return null;
        
        const possibleIds = [
            selectedHotel?.hotel_id,
            selectedHotel?.id,
            selectedHotel?.hotelId,
            selectedHotel?._id
        ];
        
        for (const id of possibleIds) {
            if (id) {
                return id;
            }
        }
        
        return null;
    };

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    };

    // Handle upload from URL
    const handleUploadUrl = async () => {
        const hotelId = getHotelId();
        if (!urlInput.trim()) {
            showToast('Vui lòng nhập URL hình ảnh.', 'error');
            return;
        }
        if (!hotelId) {
            showToast('Vui lòng chọn khách sạn.', 'error');
            return;
        }
        // Kiểm tra URL hợp lệ
        const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
        if (!urlPattern.test(urlInput)) {
            showToast('URL hình ảnh phải là URL hợp lệ và có định dạng ảnh (jpg, png, gif, webp)', 'error');
            return;
        }
        setUploadLoading(true);
        try {
            await uploadHotelImages(hotelId, [{
                image_url: urlInput,
                caption: captionInput,
                is_thumbnail: false
            }]);
            setUrlInput('');
            setCaptionInput('');
            showToast('Đã thêm hình ảnh từ URL thành công');
            // Refresh images
            const res = await hotelApiService.getImagesByHotelId(hotelId);
            const images = Array.isArray(res) ? res : (res.data || res || []);
            setHotelImages(images);
            await fetchOwnerHotel();
        } catch (error) {
            showToast('Upload thất bại: ' + (error.message || 'Lỗi không xác định'), 'error');
        } finally {
            setUploadLoading(false);
        }
    };

    // Handle delete image
    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return;
        const hotelId = getHotelId();
        if (!hotelId) {
            showToast('Không tìm thấy thông tin khách sạn', 'error');
            return;
        }
        try {
            await deleteHotelImage(hotelId, imageId);
            const res = await hotelApiService.getImagesByHotelId(hotelId);
            const images = Array.isArray(res) ? res : (res.data || res || []);
            setHotelImages(images);
            await fetchOwnerHotel();
            showToast('Xóa ảnh thành công!');
        } catch (error) {
            showToast('Xóa ảnh thất bại: ' + (error.message || 'Lỗi không xác định'), 'error');
        }
    };

    // Thêm hàm đặt thumbnail cho ảnh khách sạn
    const handleSetThumbnailHotelImage = async (imageId) => {
        const hotelId = getHotelId();
        if (!hotelId || !imageId) return;
        try {
            await hotelApiService.setThumbnail(hotelId, imageId);
            const res = await hotelApiService.getImagesByHotelId(hotelId);
            const images = Array.isArray(res) ? res : (res.data || res || []);
            setHotelImages(images);
            await fetchOwnerHotel();
            showToast('Đã đặt ảnh đại diện thành công!');
        } catch (error) {
            showToast('Đặt ảnh đại diện thất bại: ' + (error.message || 'Lỗi không xác định'), 'error');
        }
    };

    if (loading && !hotelData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin khách sạn...</p>
                </div>
            </div>
        );
    }

    // Skip loading check if hotel is locked
    if (!isLocked && (!hotelData || !Array.isArray(hotelData) || hotelData.length === 0)) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chưa có khách sạn nào được tìm thấy</p>
                </div>
            </div>
        );
    }

    return (
    <div className="space-y-6">
        {/* Toast notification */}
        {toast && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center`}>
                <div className={`p-6 rounded-xl shadow-xl border text-center min-w-[300px] max-w-[90vw] transition-all
                    ${toast.type === 'error'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-green-100 text-green-800 border-green-200'
                    }`}>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-lg font-semibold">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="mt-2 px-4 py-1 rounded bg-white border text-gray-700 hover:bg-gray-50">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    {isLocked && (
                        <button
                            onClick={() => {
                              // Use returnTo if available, otherwise construct URL from locked hotel
                              const getHotelId = () => lockedHotel?.hotel_id || lockedHotel?.id || lockedHotel?.hotelId;
                              const targetUrl = returnTo || `/hotel-owner/hotel/${getHotelId()}`;
                              console.log('🔙 Navigating back to:', targetUrl);
                              navigate(targetUrl);
                            }}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors mr-3"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    )}
                    <Camera size={24} className="text-blue-600 mr-3" />
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isLocked ? `Hình ảnh - ${lockedHotel?.name}` : 'Hình ảnh khách sạn'}
                    </h1>
                </div>
                {selectedHotel && (
                    <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            selectedHotel.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : selectedHotel.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {selectedHotel.status === 'approved' && '✅ Đã duyệt'}
                            {selectedHotel.status === 'pending' && '⏳ Chờ duyệt'}
                            {selectedHotel.status === 'rejected' && '❌ Từ chối'}
                        </span>
                    </div>
                )}
            </div>
            {/* Hotel Selection - Only show if not locked */}
            {!isLocked && hotelData && hotelData.length > 1 && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn khách sạn:
                    </label>
                    <div className="relative">
                        <select
                            value={selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id || ''}
                            onChange={(e) => {
                                const hotel = hotelData.find(h => 
                                    (h.hotelId || h.hotel_id || h.id || h._id) === e.target.value
                                );
                                setSelectedHotel(hotel);
                            }}
                            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8"
                        >
                            {hotelData.map((hotel) => {
                                const hotelId = hotel.hotelId || hotel.hotel_id || hotel.id || hotel._id;
                                return (
                                    <option key={hotelId} value={hotelId}>
                                        {hotel.name} - {hotel.address}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown size={16} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            )}
            {/* Selected Hotel info */}
            {selectedHotel && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">{selectedHotel.name}</h3>
                            <p className="text-gray-600">{selectedHotel.address}, {selectedHotel.city}</p>
                        </div>
                        {!isLocked && hotelData && hotelData.length === 1 && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                Khách sạn duy nhất
                            </span>
                        )}
                        {isLocked && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                Đang chỉnh sửa
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Upload Section - chỉ giữ thêm ảnh bằng URL */}
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm ảnh bằng URL</h2>
            {!selectedHotel ? (
                <div className="text-center py-8 text-gray-500">
                    Vui lòng chọn khách sạn để upload ảnh
                </div>
            ) : !isEditable ? (
                <div className="text-center py-8 text-gray-500">
                    Khách sạn đang chờ duyệt hoặc đã duyệt, không thể thêm/xóa/chỉnh sửa ảnh.
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL hình ảnh</label>
                    <input
                        type="url"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            urlInput && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(urlInput) 
                                ? 'border-red-300 bg-red-50' 
                                : 'border-gray-300'
                        }`}
                    />
                    {urlInput && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(urlInput) && (
                        <p className="text-red-500 text-sm mt-1">
                            URL phải có định dạng: https://example.com/image.jpg
                        </p>
                    )}
                    <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">Chú thích</label>
                    <input
                        type="text"
                        value={captionInput}
                        onChange={e => setCaptionInput(e.target.value)}
                        placeholder="Nhập chú thích cho hình ảnh..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={handleUploadUrl}
                        disabled={
                            uploadLoading || 
                            !urlInput.trim() || 
                            !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(urlInput) ||
                            !selectedHotel
                        }
                        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploadLoading ? 'Đang upload...' : 'Thêm ảnh bằng URL'}
                    </button>
                </div>
            )}
        </div>

        {/* Current Images */}
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                    Ảnh hiện tại {selectedHotel ? `(${hotelImages.length})` : ''}
                </h2>
                {selectedHotel && (
                    <button
                        onClick={async () => {
                            const hotelId = getHotelId();
                            if (hotelId) {
                                try {
                                    const res = await hotelApiService.getImagesByHotelId(hotelId);
                                    const images = Array.isArray(res) ? res : (res.data || res || []);
                                    setHotelImages(images);
                                } catch (err) {}
                            }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        🔄 Làm mới
                    </button>
                )}
            </div>
            {!selectedHotel ? (
                <div className="text-center py-8 text-gray-500">
                    Vui lòng chọn khách sạn để xem ảnh
                </div>
            ) : hotelImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {hotelImages.map((image, index) => (
                        <div key={image.id || image.imageId || image._id || index} className="relative group">
                            <img
                                src={image.image_url || image.imageUrl || image.url}
                                alt={image.caption || `Hotel image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border cursor-pointer"
                            />
                            {/* Image controls overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setSelectedImage(image)}
                                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                                        title="Xem chi tiết"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    {image.is_thumbnail ? (
                                        <div className="bg-yellow-500 text-white p-2 rounded-full">
                                            <Star size={16} />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSetThumbnailHotelImage(image.id || image.imageId || image._id)}
                                            className="bg-yellow-600 text-white p-2 rounded-full hover:bg-yellow-700"
                                            title="Đặt làm ảnh đại diện"
                                            disabled={!isEditable}
                                        >
                                            <Star size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteImage(image.id || image.imageId || image._id)}
                                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                        title="Xóa ảnh"
                                        disabled={!isEditable}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {image.is_thumbnail && (
                                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                                    Ảnh đại diện
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chưa có ảnh nào
                    </h3>
                    <p className="text-gray-600">
                        Upload ảnh đầu tiên cho khách sạn {selectedHotel.name}
                    </p>
                </div>
            )}
        </div>
        {/* Error Display */}
        {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <span className="text-red-800">{error}</span>
                    <button
                        onClick={clearError}
                        className="ml-auto text-red-600 hover:text-red-800"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* Image Detail Modal */}
        {selectedImage && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Chi tiết hình ảnh</h2>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex flex-col md:flex-row">
                        <div className="md:flex-1 p-4 bg-gray-50 flex items-center justify-center">
                            <img
                                src={selectedImage.image_url || selectedImage.imageUrl || selectedImage.url}
                                alt={selectedImage.caption}
                                className="max-w-full max-h-96 object-contain rounded-lg"
                                onError={e => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDE5VjVDMjEgMy45IDIwLjEgMyAxOSAzSDVDMy45IDMgMyAzLjkgMyA1VjE5QzMgMjAuMSAzLjkgMjEgNSAyMUgxOUMyMC4xIDIxIDIxIDIwLjEgMjEgMTlaIiBzdHJva2U9IiNEMUQ1REIiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNOC41IDEwQzkuMzI4NDMgMTAgMTAgOS4zMjg0MyAxMCA4LjVDMTAgNy42NzE1NyA5LjMyODQzIDcgOC41IDdDNy42NzE1NyA3IDcgNy42NzE1NyA3IDguNUM3IDkuMzI4NDMgNy42NzE1NyAxMCA4LjUgMTBaIiBzdHJva2U9IiNEMUQ1REIiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMjEgMTVMMTYgMTBMNSAyMSIgc3Ryb2tlPSIjRDFENURCIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
                                }}
                            />
                        </div>
                        <div className="md:w-80 p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chú thích</label>
                                <p className="text-gray-900">{selectedImage.caption || 'Không có chú thích'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={selectedImage.image_url || selectedImage.imageUrl || selectedImage.url}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                {selectedImage.is_thumbnail ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <Star className="w-3 h-3 mr-1 fill-current" />
                                        Ảnh đại diện
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Hình ảnh thường
                                    </span>
                                )}
                            </div>
                            {/* Actions */}
                            <div className="pt-4 border-t space-y-3">
                                {!selectedImage.is_thumbnail && (
                                    <button
                                        onClick={() => {
                                            handleSetThumbnailHotelImage(selectedImage.id || selectedImage.imageId || selectedImage._id);
                                            setSelectedImage(null);
                                        }}
                                        className="w-full bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 flex items-center justify-center gap-2"
                                    >
                                        <Star className="w-4 h-4" />
                                        Đặt làm ảnh đại diện
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        handleDeleteImage(selectedImage.id || selectedImage.imageId || selectedImage._id);
                                        setSelectedImage(null);
                                    }}
                                    className="w-full bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Xóa ảnh
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
    );
};

export default HotelImages;