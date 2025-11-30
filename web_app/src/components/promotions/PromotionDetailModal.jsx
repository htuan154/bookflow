// src/components/promotions/PromotionDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Percent, DollarSign, Building, Trash2 } from 'lucide-react';
import PromotionService from '../../api/promotions.service';
import { useToast } from '../../hooks/useToast';
import Toast from '../common/Toast';

const PromotionDetailModal = ({ isOpen, onClose, selectedHotel, promotion, onSuccess, existingDetails = [] }) => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  const [details, setDetails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Load room types for selected hotel
  useEffect(() => {
    console.log('PromotionDetailModal useEffect:', { isOpen, selectedHotel });
    if (isOpen && selectedHotel?.hotelId) {
      // Reset state when modal opens
      console.log('🔄 Resetting modal state');
      setDetails([]);
      setRoomTypes([]);
      loadRoomTypes();
    } else {
      console.log('Not loading room types - missing conditions:', { isOpen, hotelId: selectedHotel?.hotelId });
    }
  }, [isOpen, selectedHotel]);

  const loadRoomTypes = async () => {
    console.log('🟢 loadRoomTypes called!');
    try {
      setLoadingRoomTypes(true);
      console.log('Loading room types for hotel:', selectedHotel.hotelId);
      const response = await PromotionService.getRoomTypesByHotelId(selectedHotel.hotelId);
      console.log('Room types API response:', response);
      
      // Extract actual room types array from response
      const roomTypesData = response?.data || response || [];
      console.log('Extracted room types data:', roomTypesData);
      console.log('✅ roomTypesData.length:', roomTypesData.length);
      
      setRoomTypes(roomTypesData);
      
      console.log('✅ existingDetails:', existingDetails);
      console.log('✅ existingDetails.length:', existingDetails.length);
      
      // Initialize details with empty entries for each room type that doesn't have promotion details yet
      if (roomTypesData.length > 0) {
        console.log('🚀 Starting to initialize details, current details.length:', details.length);
        // Get room type IDs that already have promotion details
        console.log('🔸 About to map existingDetails:', existingDetails);
        const existingRoomTypeIds = existingDetails.map(detail => {
          // Handle both possible field names from API response
          const id = detail.roomTypeId || detail.room_type_id;
          console.log('⚡ Existing detail:', detail, '→ ID:', id);
          return id;
        });
        console.log('🔸 Finished mapping existingRoomTypeIds');
        
        console.log('🔍 Existing room type IDs array:', existingRoomTypeIds);
        
        // Filter out room types that already have promotion details
        const availableRoomTypes = roomTypesData.filter(roomType => {
          // Handle both possible field names from room types API
          const roomTypeId = roomType.roomTypeId || roomType.room_type_id;
          const isAvailable = !existingRoomTypeIds.includes(roomTypeId);
          console.log(`🏠 Room type "${roomType.name}" (${roomTypeId}):`, 
            `exists=${existingRoomTypeIds.includes(roomTypeId)}, available=${isAvailable}`);
          return isAvailable;
        });
        
        console.log('Existing details:', existingDetails);
        console.log('Existing room type IDs:', existingRoomTypeIds);
        console.log('All room types:', roomTypesData);
        console.log('All room type IDs:', roomTypesData.map(rt => rt.roomTypeId || rt.room_type_id));
        console.log('Available room types (without existing details):', availableRoomTypes);
        
        const initialDetails = availableRoomTypes.map(roomType => ({
          room_type_id: roomType.roomTypeId || roomType.room_type_id,
          room_type_name: roomType.name,
          discount_type: promotion?.discountType || 'percentage',
          discount_value: promotion?.discountType === 'percentage' ? promotion?.discountValue || '' : '',
          isActive: false
        }));
        console.log('✅ Setting details:', initialDetails);
        setDetails(initialDetails);
        console.log('✅ Details set complete');
      }
    } catch (error) {
      console.error('Error loading room types:', error);
      showError('Lỗi!', 'Không thể tải danh sách loại phòng');
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...details];
    
    if (field === 'discount_type') {
      // When changing discount type, set appropriate default value
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value,
        discount_value: value === 'percentage' ? (promotion?.discountValue || '') : ''
      };
    } else if (field === 'discount_value' && updatedDetails[index].discount_type === 'fixed_amount') {
      // For fixed_amount, validate against max_discount_amount
      const maxAmount = promotion?.maxDiscountAmount || Infinity;
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        // If not a valid number, keep the current value or set empty
        updatedDetails[index] = {
          ...updatedDetails[index],
          [field]: value
        };
      } else if (numValue > maxAmount) {
        // If value exceeds max, set to max amount
        updatedDetails[index] = {
          ...updatedDetails[index],
          [field]: maxAmount.toString()
        };
      } else {
        // Value is within range
        updatedDetails[index] = {
          ...updatedDetails[index],
          [field]: value
        };
      }
    } else {
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value
      };
    }
    
    setDetails(updatedDetails);
  };

  const toggleDetailActive = (index) => {
    const updatedDetails = [...details];
    const newActiveState = !updatedDetails[index].isActive;
    
    updatedDetails[index].isActive = newActiveState;
    
    if (newActiveState) {
      // When activating, set appropriate default value based on discount type
      if (updatedDetails[index].discount_type === 'percentage') {
        updatedDetails[index].discount_value = promotion?.discountValue || '';
      } else {
        // For fixed_amount, keep empty to let user input
        updatedDetails[index].discount_value = '';
      }
    } else {
      // Clear values if deactivating
      updatedDetails[index].discount_value = '';
    }
    
    setDetails(updatedDetails);
  };

  const getActiveDetails = () => {
    return details.filter(detail => {
      if (!detail.isActive) return false;
      
      // For percentage, value should come from promotion
      if (detail.discount_type === 'percentage') {
        return detail.discount_value && parseFloat(detail.discount_value) > 0;
      }
      
      // For fixed_amount, user must enter a value
      return detail.discount_value && parseFloat(detail.discount_value) > 0;
    });
  };

  const isFormValid = () => {
    const activeDetails = getActiveDetails();
    return activeDetails.length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const activeDetails = getActiveDetails();
      const detailsToCreate = activeDetails.map(detail => ({
        promotion_id: promotion.promotionId,
        room_type_id: detail.room_type_id,
        discount_type: detail.discount_type,
        discount_value: parseFloat(detail.discount_value)
      }));

      console.log('Creating promotion details:', detailsToCreate);

      // Call API to create promotion details
      const response = await PromotionService.createPromotionDetails(promotion.promotionId, {
        details: detailsToCreate
      });

      if (response) {
        showSuccess(
          'Tạo thành công!',
          `Đã tạo ${activeDetails.length} chi tiết khuyến mãi cho các loại phòng.`
        );

        // Reset form
        setDetails(details.map(detail => ({
          ...detail,
          discount_value: '',
          isActive: false
        })));

        // Call success callback
        if (onSuccess) {
          onSuccess(response);
        }

        // Close modal after delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating promotion details:', error);
      const errorMessage = error?.message || 'Có lỗi xảy ra khi tạo chi tiết khuyến mãi';
      showError('Tạo thất bại!', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết khuyến mãi theo phòng</h2>
              <p className="text-gray-600 mt-1">
                Khuyến mãi: <span className="font-medium">{promotion?.name || 'N/A'}</span>
              </p>
              <p className="text-gray-600">
                Khách sạn: <span className="font-medium">{selectedHotel?.name || 'N/A'}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loadingRoomTypes ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Đang tải loại phòng...</span>
              </div>
            ) : details.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {roomTypes.length === 0 
                    ? 'Không có loại phòng nào cho khách sạn này'
                    : 'Tất cả loại phòng đã có chi tiết khuyến mãi'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Total Room Types: {roomTypes.length} | Available: {details.length}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Hướng dẫn</h4>
                      <div className="text-sm text-blue-700 mt-1">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Chọn các loại phòng muốn áp dụng khuyến mãi</li>
                          <li>Chọn loại giảm giá: theo phần trăm hoặc số tiền cố định</li>
                          <li>Nhập giá trị giảm giá phù hợp cho từng loại phòng</li>
                          <li>Ít nhất một loại phòng phải được chọn</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Room Types List */}
                <div className="space-y-4">
                  {details.map((detail, index) => (
                    <div
                      key={detail.room_type_id}
                      className={`border rounded-lg p-4 transition-all ${
                        detail.isActive 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id={`room-${detail.room_type_id}`}
                            checked={detail.isActive}
                            onChange={() => toggleDetailActive(index)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`room-${detail.room_type_id}`}
                            className={`font-medium ${
                              detail.isActive ? 'text-blue-900' : 'text-gray-700'
                            }`}
                          >
                            {detail.room_type_name}
                          </label>
                        </div>
                      </div>

                      {detail.isActive && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                          {/* Discount Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Loại giảm giá
                            </label>
                            <select
                              value={detail.discount_type}
                              onChange={(e) => handleDetailChange(index, 'discount_type', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="percentage">Phần trăm (%)</option>
                              <option value="fixed_amount">Số tiền cố định (VND)</option>
                            </select>
                          </div>

                          {/* Discount Value */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Giá trị giảm
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={detail.discount_value}
                                onChange={(e) => handleDetailChange(index, 'discount_value', e.target.value)}
                                disabled={detail.discount_type === 'percentage'}
                                min="0"
                                step={detail.discount_type === 'percentage' ? '0.01' : '1000'}
                                max={detail.discount_type === 'percentage' ? '100' : promotion?.maxDiscountAmount}
                                className={`w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  detail.discount_type === 'percentage' 
                                    ? 'bg-gray-100 cursor-not-allowed' 
                                    : ''
                                }`}
                                placeholder={detail.discount_type === 'percentage' ? 'Tự động từ khuyến mãi' : '500000'}
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <span className="text-gray-500 text-sm">
                                  {detail.discount_type === 'percentage' ? '%' : 'VND'}
                                </span>
                              </div>
                            </div>
                            {detail.discount_type === 'percentage' ? (
                              <p className="text-xs text-blue-600 mt-1">
                                Giá trị lấy từ khuyến mãi: {promotion?.discountValue || 0}%
                              </p>
                            ) : (
                              <p className="text-xs text-gray-500 mt-1">
                                Tối đa: {formatCurrency(promotion?.maxDiscountAmount || 0)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {getActiveDetails().length > 0 && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-6">
                    <h4 className="text-sm font-medium text-green-800 mb-2">
                      Tóm tắt ({getActiveDetails().length} loại phòng được chọn)
                    </h4>
                    <div className="space-y-1">
                      {getActiveDetails().map((detail) => (
                        <div key={detail.room_type_id} className="text-sm text-green-700 flex justify-between">
                          <span>{detail.room_type_name}</span>
                          <span className="font-medium">
                            {detail.discount_type === 'percentage' 
                              ? `${detail.discount_value}%`
                              : formatCurrency(parseFloat(detail.discount_value))
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid() || isSubmitting}
                    className={`px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                      isFormValid() && !isSubmitting
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'Đang tạo...' : `Tạo chi tiết (${getActiveDetails().length})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PromotionDetailModal;