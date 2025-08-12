import React, { useState, useEffect } from 'react';
import { 
    Building2, Wifi, Car, Utensils, Dumbbell, Waves, 
    Shield, Coffee, Tv, Wind, Phone, Bath, 
    Save, X, CheckCircle, AlertCircle, Plus, ChevronDown
} from 'lucide-react';
import { useHotelOwner } from '../../../hooks/useHotelOwner';
import useAuth from '../../../hooks/useAuth';

// Danh sách icon cho các tiện nghi
const amenityIcons = {
    wifi: <Wifi size={20} className="text-blue-500" />,
    parking: <Car size={20} className="text-green-500" />,
    restaurant: <Utensils size={20} className="text-orange-500" />,
    gym: <Dumbbell size={20} className="text-red-500" />,
    pool: <Waves size={20} className="text-cyan-500" />,
    security: <Shield size={20} className="text-gray-500" />,
    coffee: <Coffee size={20} className="text-yellow-600" />,
    tv: <Tv size={20} className="text-purple-500" />,
    ac: <Wind size={20} className="text-blue-400" />,
    phone: <Phone size={20} className="text-green-600" />,
    bath: <Bath size={20} className="text-blue-300" />,
    default: <Shield size={20} className="text-gray-400" />
};

const HotelAmenities = () => {
    const { user } = useAuth();
    const {
        hotelData,
        loading,
        error,
        fetchOwnerHotel,
        updateHotelAmenities,
        getAvailableAmenities,
        clearError
    } = useHotelOwner();

    const [availableAmenities, setAvailableAmenities] = useState([]);
    const [selectedAmenities, setSelectedAmenities] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHotel, setSelectedHotel] = useState(null); // Add hotel selection

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchOwnerHotel();
        loadAvailableAmenities();
    }, [fetchOwnerHotel]);

    // Set default hotel when hotelData is available
    useEffect(() => {
        console.log('useEffect - Hotel data changed:', hotelData);
        
        if (hotelData && Array.isArray(hotelData) && hotelData.length > 0) {
            // If no hotel is selected, select the first one by default
            if (!selectedHotel) {
                const firstHotel = hotelData[0];
                setSelectedHotel(firstHotel);
                console.log('Selected default hotel for HotelAmenities:', firstHotel);
            }
        } else if (hotelData && !Array.isArray(hotelData)) {
            // Handle single hotel object
            setSelectedHotel(hotelData);
        }
    }, [hotelData]);

    // Update selectedAmenities khi selectedHotel thay đổi
    useEffect(() => {
        if (selectedHotel && selectedHotel.amenities) {
            setSelectedAmenities(selectedHotel.amenities.map(amenity => 
                typeof amenity === 'object' ? amenity.id : amenity
            ));
        } else {
            setSelectedAmenities([]);
        }
    }, [selectedHotel]);

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

    const loadAvailableAmenities = async () => {
        try {
            const response = await getAvailableAmenities();
            setAvailableAmenities(response.data || response || []);
        } catch (error) {
            console.error('Error loading amenities:', error);
            setAvailableAmenities([]);
        }
    };

    // Toggle amenity selection
    const toggleAmenity = (amenityId) => {
        setSelectedAmenities(prev => {
            if (prev.includes(amenityId)) {
                return prev.filter(id => id !== amenityId);
            } else {
                return [...prev, amenityId];
            }
        });
    };

    // Save amenities
    const handleSave = async () => {
        const hotelId = getHotelId();
        
        if (!hotelId) {
            alert('Không tìm thấy thông tin khách sạn');
            return;
        }

        try {
            setSaveLoading(true);
            await updateHotelAmenities(hotelId, selectedAmenities);
            
            // Refresh hotel data
            await fetchOwnerHotel();
            
            setIsEditing(false);
            alert('Cập nhật tiện nghi thành công!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Cập nhật thất bại: ' + (error.message || 'Lỗi không xác định'));
        } finally {
            setSaveLoading(false);
        }
    };

    // Cancel editing
    const handleCancel = () => {
        // Reset về trạng thái ban đầu
        if (selectedHotel && selectedHotel.amenities) {
            setSelectedAmenities(selectedHotel.amenities.map(amenity => 
                typeof amenity === 'object' ? amenity.id : amenity
            ));
        }
        setIsEditing(false);
    };

    // Filter amenities based on search
    const filteredAmenities = availableAmenities.filter(amenity =>
        amenity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        amenity.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get selected amenities details
    const getSelectedAmenitiesDetails = () => {
        if (!selectedHotel?.amenities) return [];
        
        return selectedHotel.amenities.map(amenity => {
            if (typeof amenity === 'object') {
                return amenity;
            }
            // Nếu chỉ có ID, tìm trong availableAmenities
            return availableAmenities.find(a => a.id === amenity) || { id: amenity, name: amenity };
        });
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

    // Handle both array and single object response
    const hotels = Array.isArray(hotelData) ? hotelData : (hotelData ? [hotelData] : []);

    if (!hotelData || hotels.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-12">
                    <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chưa có khách sạn
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Bạn cần tạo thông tin khách sạn trước khi quản lý tiện nghi
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
                        <Shield size={24} className="text-blue-600 mr-3" />
                        <h1 className="text-2xl font-bold text-gray-900">Tiện nghi khách sạn</h1>
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
                {hotels.length > 1 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chọn khách sạn:
                        </label>
                        <div className="relative">
                            <select
                                value={selectedHotel?.hotelId || selectedHotel?.hotel_id || selectedHotel?.id || selectedHotel?._id || ''}
                                onChange={(e) => {
                                    const hotel = hotels.find(h => 
                                        (h.hotelId || h.hotel_id || h.id || h._id) === e.target.value
                                    );
                                    setSelectedHotel(hotel);
                                    // Reset editing state when switching hotels
                                    setIsEditing(false);
                                }}
                                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8"
                            >
                                {hotels.map((hotel) => {
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
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">{selectedHotel.name}</h3>
                                <p className="text-gray-600">{selectedHotel.address}, {selectedHotel.city}</p>
                            </div>
                            {hotels.length === 1 && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    Khách sạn duy nhất
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Action buttons - only show if hotel is selected */}
                {selectedHotel && (
                    <div className="flex justify-end">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Chỉnh sửa tiện nghi
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleCancel}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <X size={16} className="mr-2 inline" />
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saveLoading}
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
                )}
            </div>

            {/* Current Amenities */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Tiện nghi hiện tại {selectedHotel ? `(${getSelectedAmenitiesDetails().length})` : ''}
                </h2>
                
                {!selectedHotel ? (
                    <div className="text-center py-8 text-gray-500">
                        Vui lòng chọn khách sạn để xem tiện nghi
                    </div>
                ) : getSelectedAmenitiesDetails().length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {getSelectedAmenitiesDetails().map((amenity) => (
                            <div 
                                key={amenity.id} 
                                className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                            >
                                {amenityIcons[amenity.key] || amenityIcons.default}
                                <div className="ml-3">
                                    <div className="font-medium text-green-900">{amenity.name}</div>
                                    {amenity.description && (
                                        <div className="text-sm text-green-700">{amenity.description}</div>
                                    )}
                                </div>
                                <CheckCircle size={16} className="ml-auto text-green-600" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Shield size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Chưa có tiện nghi nào
                        </h3>
                        <p className="text-gray-600">
                            Thêm tiện nghi để khách hàng biết về dịch vụ của {selectedHotel.name}
                        </p>
                    </div>
                )}
            </div>

            {/* Edit Amenities */}
            {isEditing && selectedHotel && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Chọn tiện nghi cho {selectedHotel.name}
                        </h2>
                        
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm tiện nghi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Amenities grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredAmenities.map((amenity) => {
                            const isSelected = selectedAmenities.includes(amenity.id);
                            
                            return (
                                <div
                                    key={amenity.id}
                                    onClick={() => toggleAmenity(amenity.id)}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                                        isSelected
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {amenityIcons[amenity.key] || amenityIcons.default}
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
                                    
                                    {/* Checkbox */}
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        isSelected 
                                            ? 'bg-blue-600 border-blue-600' 
                                            : 'border-gray-300'
                                    }`}>
                                        {isSelected && (
                                            <CheckCircle size={14} className="text-white" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredAmenities.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">
                                {searchTerm ? 'Không tìm thấy tiện nghi phù hợp' : 'Chưa có tiện nghi nào'}
                            </p>
                        </div>
                    )}

                    {/* Selected count */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-blue-800">
                            Đã chọn: <strong>{selectedAmenities.length}</strong> tiện nghi cho {selectedHotel.name}
                        </p>
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

export default HotelAmenities;