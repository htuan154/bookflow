import React, { useState, useEffect } from 'react';
import { 
    Building2, Camera, Trash2, Upload, ImageIcon, 
    Eye, Star, Plus, X, AlertCircle, CheckCircle, ChevronDown
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import useAuth from '../../../hooks/useAuth';

const HotelImages = () => {
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

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);
    const [selectedHotel, setSelectedHotel] = useState(null); // Add hotel selection

    // Load hotel data khi component mount
    useEffect(() => {
        fetchOwnerHotel();
    }, [fetchOwnerHotel]);

    // Set default hotel when hotelData is available
    useEffect(() => {
        console.log('useEffect - Hotel data changed:', hotelData);
        
        if (hotelData && Array.isArray(hotelData) && hotelData.length > 0) {
            // If no hotel is selected, select the first one by default
            if (!selectedHotel) {
                const firstHotel = hotelData[0];
                setSelectedHotel(firstHotel);
                console.log('Selected default hotel for HotelImages:', firstHotel);
            }
        }
    }, [hotelData]);

    // Get hotel ID from selected hotel
    const getHotelId = () => {
        const possibleIds = [
            selectedHotel?.hotel_id,
            selectedHotel?.id,
            selectedHotel?.hotelId
        ];
        
        for (const id of possibleIds) {
            if (id) {
                return id;
            }
        }
        
        return null;
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        
        // Validate files
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            return isImage && isValidSize;
        });

        if (validFiles.length !== files.length) {
            alert('Một số file không hợp lệ (chỉ chấp nhận ảnh dưới 5MB)');
        }

        setSelectedFiles(validFiles);
        
        // Create preview URLs
        const previews = validFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(previews);
    };

    // Handle upload
    const handleUpload = async () => {
        const hotelId = getHotelId();
        
        if (!hotelId || selectedFiles.length === 0) {
            alert('Vui lòng chọn khách sạn và ảnh để upload');
            return;
        }

        try {
            setUploadLoading(true);
            await uploadHotelImages(hotelId, selectedFiles);
            
            // Reset selection
            setSelectedFiles([]);
            setPreviewUrls([]);
            
            // Refresh hotel data
            await fetchOwnerHotel();
            
            alert('Upload ảnh thành công!');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload thất bại: ' + (error.message || 'Lỗi không xác định'));
        } finally {
            setUploadLoading(false);
        }
    };

    // Handle delete image
    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) {
            return;
        }

        const hotelId = getHotelId();
        if (!hotelId) {
            alert('Không tìm thấy thông tin khách sạn');
            return;
        }

        try {
            await deleteHotelImage(hotelId, imageId);
            await fetchOwnerHotel(); // Refresh data
            alert('Xóa ảnh thành công!');
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Xóa ảnh thất bại: ' + (error.message || 'Lỗi không xác định'));
        }
    };

    // Clear file selection
    const clearSelection = () => {
        setSelectedFiles([]);
        setPreviewUrls([]);
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

    if (!hotelData || !Array.isArray(hotelData) || hotelData.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                    <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chưa có khách sạn
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Bạn cần tạo thông tin khách sạn trước khi upload ảnh
                    </p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Tạo khách sạn
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <Camera size={24} className="text-blue-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-900">Hình ảnh khách sạn</h1>
                    </div>
                    
                    {/* Hotel status */}
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

                {/* Hotel Selection */}
                {hotelData.length > 1 && (
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
                                    // Clear any selected files when switching hotels
                                    setSelectedFiles([]);
                                    setPreviewUrls([]);
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
                            {hotelData.length === 1 && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    Khách sạn duy nhất
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload ảnh mới</h2>
                
                {!selectedHotel ? (
                    <div className="text-center py-8 text-gray-500">
                        Vui lòng chọn khách sạn để upload ảnh
                    </div>
                ) : (
                    <>
                        {/* File Input */}
                        <div className="mb-4">
                            <label className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col items-center">
                                    <Upload size={24} className="text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">
                                        Chọn ảnh hoặc kéo thả vào đây
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        PNG, JPG, JPEG dưới 5MB
                                    </span>
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    multiple 
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                            </label>
                        </div>

                        {/* Selected Files Preview */}
                        {selectedFiles.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-900">
                                        Ảnh đã chọn ({selectedFiles.length})
                                    </h3>
                                    <button
                                        onClick={clearSelection}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        <X size={16} className="inline mr-1" />
                                        Xóa tất cả
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg border"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newFiles = selectedFiles.filter((_, i) => i !== index);
                                                    const newPreviews = previewUrls.filter((_, i) => i !== index);
                                                    setSelectedFiles(newFiles);
                                                    setPreviewUrls(newPreviews);
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={uploadLoading}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {uploadLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                                            Đang upload...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} className="inline mr-2" />
                                            Upload {selectedFiles.length} ảnh cho {selectedHotel.name}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Current Images */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Ảnh hiện tại {selectedHotel ? `(${selectedHotel.images?.length || 0})` : ''}
                    </h2>
                </div>

                {!selectedHotel ? (
                    <div className="text-center py-8 text-gray-500">
                        Vui lòng chọn khách sạn để xem ảnh
                    </div>
                ) : selectedHotel.images && selectedHotel.images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedHotel.images.map((image, index) => (
                            <div key={image.id || index} className="relative group">
                                <img
                                    src={image.url || image.image_url}
                                    alt={`Hotel image ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg border cursor-pointer"
                                    onClick={() => setSelectedImageIndex(index)}
                                />
                                
                                {/* Image controls overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setSelectedImageIndex(index)}
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
                                                className="bg-yellow-600 text-white p-2 rounded-full hover:bg-yellow-700"
                                                title="Đặt làm ảnh đại diện"
                                            >
                                                <Star size={16} />
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => handleDeleteImage(image.id)}
                                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                            title="Xóa ảnh"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Thumbnail badge */}
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

            {/* Image Modal */}
            {selectedImageIndex !== null && selectedHotel?.images && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="max-w-4xl max-h-full p-4">
                        <img
                            src={selectedHotel.images[selectedImageIndex].url || selectedHotel.images[selectedImageIndex].image_url}
                            alt={`Hotel image ${selectedImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setSelectedImageIndex(null)}
                            className="absolute top-4 right-4 bg-white bg-opacity-20 text-white p-2 rounded-full hover:bg-opacity-30"
                        >
                            <X size={24} />
                        </button>
                        
                        {/* Image info overlay */}
                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded">
                            <p className="text-sm">
                                Ảnh {selectedImageIndex + 1} của {selectedHotel.images.length} - {selectedHotel.name}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle size={20} className="text-red-600 mr-2" />
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
        </div>
    );
};

export default HotelImages;