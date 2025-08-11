// src/pages/hotel_owner/HotelInfo.jsx
import React, { useState, useEffect } from 'react';
import { 
    Building2, MapPin, Phone, Mail, Star, Globe, 
    Edit, Save, X, Camera, Trash2, Plus, Clock,
    Wifi, Car, Utensils, Dumbbell, Waves, Shield
} from 'lucide-react';
import { useHotelOwner } from '../../hooks/useHotelOwner';

const HotelInfo = () => {
    const { 
        hotelData, 
        loading, 
        error, 
        fetchOwnerHotel, // Hoặc dùng fetchOwnerHotels nếu muốn lấy tất cả
        updateOwnerHotel, 
        uploadHotelImages, 
        deleteHotelImage,
        clearError,
        getStatusText,
        getStatusColor
    } = useHotelOwner();
    
    const [hotels, setHotels] = useState([]); // Thay đổi để lưu mảng khách sạn
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [images, setImages] = useState([]);

    // Lấy thông tin tất cả khách sạn khi component mount
    useEffect(() => {
        fetchHotelsInfo();
    }, []);

    // Cập nhật local state khi hotelData thay đổi
    useEffect(() => {
        if (hotelData && Array.isArray(hotelData)) {
            setHotels(hotelData);
            // Tự động chọn khách sạn đầu tiên nếu chưa có khách sạn được chọn
            if (hotelData.length > 0 && !selectedHotel) {
                setSelectedHotel(hotelData[0]);
                setEditData(hotelData[0]);
                setImages(hotelData[0].images || []);
            }
        }
    }, [hotelData, selectedHotel]);

    const fetchHotelsInfo = async () => {
        try {
            await fetchOwnerHotel(); // Hoặc fetchOwnerHotels() nếu muốn lấy tất cả
        } catch (error) {
            console.error('Error fetching hotels data:', error);
        }
    };

    const handleHotelSelect = (hotel) => {
        setSelectedHotel(hotel);
        setEditData(hotel);
        setImages(hotel.images || []);
        setIsEditing(false); // Tắt chế độ edit khi chuyển khách sạn
    };

    const handleInputChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        try {
            await updateOwnerHotel(selectedHotel.hotel_id, editData);
            setSelectedHotel(editData);
            // Cập nhật trong danh sách hotels
            setHotels(prev => prev.map(hotel => 
                hotel.hotel_id === selectedHotel.hotel_id ? editData : hotel
            ));
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating hotel:', error);
        }
    };

    const handleCancel = () => {
        setEditData(selectedHotel);
        setIsEditing(false);
    };

    const handleImageUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0 && selectedHotel?.hotel_id) {
            try {
                await uploadHotelImages(selectedHotel.hotel_id, files);
                // Images sẽ được cập nhật tự động thông qua hook
            } catch (error) {
                console.error('Error uploading images:', error);
            }
        }
    };

    const removeImage = async (index, imageId) => {
        if (imageId && selectedHotel?.hotel_id) {
            try {
                await deleteHotelImage(selectedHotel.hotel_id, imageId);
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        } else {
            setImages(prev => prev.filter((_, i) => i !== index));
        }
    };

    const amenitiesIcons = {
        'wifi': <Wifi size={16} />,
        'parking': <Car size={16} />,
        'restaurant': <Utensils size={16} />,
        'gym': <Dumbbell size={16} />,
        'pool': <Waves size={16} />,
        'security': <Shield size={16} />
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!hotels || hotels.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                    <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chưa có thông tin khách sạn
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Bạn chưa đăng ký khách sạn nào hoặc khách sạn đang chờ duyệt
                    </p>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Đăng ký khách sạn mới
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hotel Selection - Hiển thị khi có nhiều hơn 1 khách sạn */}
            {hotels.length > 1 && (
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Chọn khách sạn</h3>
                    <div className="flex flex-wrap gap-2">
                        {hotels.map((hotel) => (
                            <button
                                key={hotel.hotel_id}
                                onClick={() => handleHotelSelect(hotel)}
                                className={`px-4 py-2 rounded-lg border transition-colors ${
                                    selectedHotel?.hotel_id === hotel.hotel_id
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center">
                                    <Building2 size={16} className="mr-2" />
                                    <span>{hotel.name}</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                        hotel.status === 'approved' 
                                            ? 'bg-green-100 text-green-800' 
                                            : hotel.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {hotel.status === 'approved' && 'Đã duyệt'}
                                        {hotel.status === 'pending' && 'Chờ duyệt'}
                                        {hotel.status === 'rejected' && 'Từ chối'}
                                        {!hotel.status && 'Chờ duyệt'}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
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
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Edit size={16} className="mr-2" />
                                Chỉnh sửa
                            </button>
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
                    </div>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedHotel?.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedHotel?.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {selectedHotel?.status === 'approved' && '✅ Đã duyệt'}
                        {selectedHotel?.status === 'pending' && '⏳ Chờ duyệt'}
                        {selectedHotel?.status === 'rejected' && '❌ Từ chối'}
                        {!selectedHotel?.status && '⏳ Chờ duyệt'}
                    </span>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tên khách sạn
                        </label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Hạng sao
                        </label>
                        <div className="flex items-center">
                            {selectedHotel?.star_rating ? (
                                <>
                                    {[...Array(parseInt(selectedHotel.star_rating))].map((_, i) => (
                                        <Star key={i} size={16} className="text-yellow-400 fill-current" />
                                    ))}
                                    <span className="ml-2 text-gray-600">{selectedHotel.star_rating} sao</span>
                                </>
                            ) : (
                                <span className="text-gray-500">Chưa có đánh giá</span>
                            )}
                        </div>
                        {isEditing && (
                            <p className="text-xs text-gray-500 mt-1">
                                Hạng sao do admin đánh giá, không thể tự chỉnh sửa
                            </p>
                        )}
                    </div>

                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mô tả
                        </label>
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
                            <MapPin size={16} className="inline mr-1" />
                            Địa chỉ
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thành phố
                        </label>
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
                            <Phone size={16} className="inline mr-1" />
                            Số điện thoại
                        </label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={editData.phone_number || ''}
                                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập số điện thoại"
                            />
                        ) : (
                            <p className="text-gray-700">{selectedHotel?.phone_number || 'Chưa có số điện thoại'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail size={16} className="inline mr-1" />
                            Email
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
                            <Globe size={16} className="inline mr-1" />
                            Website
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
                            <Clock size={16} className="inline mr-1" />
                            Thời gian nhận/trả phòng
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
                            </div>
                        ) : (
                            <p className="text-gray-700">
                                Nhận phòng: {selectedHotel?.check_in_time || '14:00'} - 
                                Trả phòng: {selectedHotel?.check_out_time || '12:00'}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Tiện nghi</h2>
                {isEditing ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(amenitiesIcons).map(([key, icon]) => (
                            <label key={key} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editData.amenities?.includes(key) || false}
                                    onChange={(e) => {
                                        const currentAmenities = editData.amenities || [];
                                        if (e.target.checked) {
                                            handleInputChange('amenities', [...currentAmenities, key]);
                                        } else {
                                            handleInputChange('amenities', currentAmenities.filter(a => a !== key));
                                        }
                                    }}
                                    className="mr-2"
                                />
                                {icon}
                                <span className="ml-2 capitalize">{key}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {selectedHotel?.amenities?.length > 0 ? (
                            selectedHotel.amenities.map((amenity) => (
                                <span
                                    key={amenity}
                                    className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                >
                                    {amenitiesIcons[amenity] || <Shield size={16} />}
                                    <span className="ml-1 capitalize">{amenity}</span>
                                </span>
                            ))
                        ) : (
                            <p className="text-gray-500">Chưa có thông tin tiện nghi</p>
                        )}
                    </div>
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
                                className="hidden" 
                                multiple 
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={image.url || image}
                                alt={`Hotel image ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                            />
                            {isEditing && (
                                <button
                                    onClick={() => removeImage(index, image.id)}
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
        </div>
    );
};

export default HotelInfo;