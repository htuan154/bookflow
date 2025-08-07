// src/components/promotions/PromotionForm.jsx
import React, { useEffect, useState } from 'react';
import { usePromotionForm } from '../../hooks/usePromotions';
import { useHotel } from '../../hooks/useHotel';

const PromotionForm = ({ initialData, onSubmit, onCancel, isSubmitting: externalSubmitting = false }) => {
  const {
    formData,
    errors,
    isSubmitting: internalSubmitting,
    updateFormData,
    submitForm,
    isValid
  } = usePromotionForm(initialData);

  const isSubmitting = externalSubmitting || internalSubmitting;

  const {
    approvedHotels,
    hasApprovedHotels,
    isLoading: loadingHotels,
    hasError: hotelError,
    fetchApprovedHotels,
    clearError: clearHotelError
  } = useHotel();

  // Load hotels when component mounts
  useEffect(() => {
    const loadHotels = async () => {
      try {
        clearHotelError();
        await fetchApprovedHotels();
      } catch (error) {
        console.error('Failed to load hotels:', error);
      }
    };

    loadHotels();
  }, [fetchApprovedHotels, clearHotelError]);

  // Date formatting for datetime-local input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Handle initial data
  useEffect(() => {
    if (initialData) {
      const dataToUse = initialData.data || initialData;
      
      const mappedData = {
        hotelId: dataToUse.hotelId || dataToUse.hotel_id || '',
        code: (dataToUse.code || '').toString().toUpperCase(),
        name: (dataToUse.name || '').toString(),
        description: (dataToUse.description || '').toString(),
        promotionType: dataToUse.promotionType || dataToUse.promotion_type || 'general',
        discountValue: Number(dataToUse.discountValue || dataToUse.discount_value || 0) || '',
        minBookingPrice: Number(dataToUse.minBookingPrice || dataToUse.min_booking_price || 0),
        usageLimit: Number(dataToUse.usageLimit || dataToUse.usage_limit || 1),
        validFrom: formatDateForInput(dataToUse.validFrom || dataToUse.valid_from),
        validUntil: formatDateForInput(dataToUse.validUntil || dataToUse.valid_until),
        status: dataToUse.status || 'active'
      };

      updateFormData(mappedData);
    }
  }, [initialData, updateFormData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parse discount value - FIXED VERSION
    const rawDiscountValue = formData.discountValue;
    let discountValue;
    
    // More robust parsing
    if (rawDiscountValue === '' || rawDiscountValue === null || rawDiscountValue === undefined) {
      alert('❌ Lỗi: Vui lòng nhập giá trị giảm giá!');
      return { success: false, error: 'Giá trị giảm giá không được để trống' };
    }
    
    if (typeof rawDiscountValue === 'string') {
      discountValue = parseFloat(rawDiscountValue.replace(/,/g, '')); // Remove commas if any
    } else {
      discountValue = Number(rawDiscountValue);
    }

    // Enhanced validation for discount value
    if (isNaN(discountValue) || !isFinite(discountValue) || discountValue <= 0) {
      alert('❌ Lỗi: Giá trị giảm giá phải là số dương lớn hơn 0!');
      return { success: false, error: 'Giá trị giảm giá phải lớn hơn 0' };
    }

    // Additional check for minimum value
    if (discountValue < 0.01) {
      alert('❌ Lỗi: Giá trị giảm giá tối thiểu là 0.01!');
      return { success: false, error: 'Giá trị giảm giá tối thiểu là 0.01' };
    }

    const cleanedData = {
      hotel_id: formData.hotelId || null,
      code: String(formData.code || '').toUpperCase().trim(),
      name: String(formData.name || '').trim(),
      description: String(formData.description || '').trim(),
      promotion_type: formData.promotionType === 'room_specific' ? 'room_specific' : 'general',
      discount_value: Number(discountValue.toFixed(2)),
      min_booking_price: formData.minBookingPrice > 0 
        ? Math.min(Number(formData.minBookingPrice), 99999999.99) 
        : null,
      usage_limit: formData.usageLimit > 0 
        ? Math.min(Number(formData.usageLimit), 2147483647)
        : null,
      valid_from: formData.validFrom ? new Date(formData.validFrom).toISOString() : null,
      valid_until: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
      status: formData.status || 'active'
    };
    
    // Validation
    const validationErrors = [];
    
    if (!cleanedData.code) validationErrors.push('Mã khuyến mãi không được để trống');
    if (!cleanedData.name) validationErrors.push('Tên chương trình không được để trống');
    if (cleanedData.discount_value <= 0) validationErrors.push('Giá trị giảm giá phải lớn hơn 0');
    if (cleanedData.discount_value > 999.99) validationErrors.push('Giá trị giảm giá không được vượt quá 999.99');
    if (!cleanedData.valid_from) validationErrors.push('Thời gian bắt đầu không được để trống');
    if (!cleanedData.valid_until) validationErrors.push('Thời gian kết thúc không được để trống');
    
    if (cleanedData.valid_from && cleanedData.valid_until) {
      if (new Date(cleanedData.valid_from) >= new Date(cleanedData.valid_until)) {
        validationErrors.push('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
    }

    const allowedStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
    if (!allowedStatuses.includes(cleanedData.status)) {
      validationErrors.push('Trạng thái không hợp lệ');
    }

    const allowedPromotionTypes = ['general', 'room_specific'];
    if (!allowedPromotionTypes.includes(cleanedData.promotion_type)) {
      validationErrors.push('Loại khuyến mãi không hợp lệ');
    }

    if (validationErrors.length > 0) {
      alert('Lỗi validation:\n' + validationErrors.join('\n'));
      return { success: false, errors: validationErrors };
    }

    // Debug log to check the data being sent
    console.log('Submitting promotion data:', cleanedData);

    // Call parent onSubmit handler
    if (onSubmit && typeof onSubmit === 'function') {
      try {
        const result = await onSubmit(cleanedData);
        
        if (result === undefined || result === null) {
          return { success: true, data: cleanedData, message: 'Operation completed successfully' };
        }
        
        if (result === true) {
          return { success: true, data: cleanedData, message: 'Operation completed successfully' };
        }
        
        if (typeof result === 'object' && result.hasOwnProperty('success')) {
          return result;
        }
        
        if (typeof result === 'object') {
          return { success: true, data: result, message: 'Operation completed successfully' };
        }
        
        return { success: true, data: result, message: 'Operation completed successfully' };
        
      } catch (error) {
        const errorMessage = error?.message || 
                            error?.response?.data?.message || 
                            error?.data?.message ||
                            'Có lỗi xảy ra khi xử lý yêu cầu';
        
        alert(`❌ Lỗi: ${errorMessage}`);
        return { success: false, error: errorMessage, originalError: error };
      }
    } else {
      alert('❌ onSubmit handler is not available!');
      return { success: false, error: 'onSubmit handler is not available' };
    }
  };

  // Hotel options rendering
  const renderHotelOptions = () => {
    if (!approvedHotels || approvedHotels.length === 0) {
      return null;
    }

    try {
      const validHotels = approvedHotels.filter((hotel, index, self) => {
        const isValid = hotel && 
          (hotel.hotel_id || hotel.hotelId) && 
          hotel.name &&
          self.findIndex(h => {
            const currentId = String(h.hotel_id || h.hotelId);
            const checkId = String(hotel.hotel_id || hotel.hotelId);
            return currentId === checkId;
          }) === index;
        
        return isValid;
      });

      return validHotels.map((hotel) => {
        const hotelId = hotel.hotel_id || hotel.hotelId;
        const location = hotel.city || hotel.address || 'Không có địa chỉ';
        
        return (
          <option 
            key={`hotel-${hotelId}`} 
            value={hotelId}
          >
            {hotel.name} - {location}
          </option>
        );
      });
    } catch (error) {
      console.error('Error rendering hotel options:', error);
      return (
        <option disabled value="">
          Lỗi khi tải danh sách khách sạn
        </option>
      );
    }
  };

  // Input change handlers
  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    updateFormData({ code: value });
  };

  // FIXED: Enhanced discount change handler
  const handleDiscountChange = (e) => {
    const inputValue = e.target.value;
    
    // Allow empty value for user experience
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      updateFormData({ discountValue: '' });
      return;
    }
    
    // Parse and validate the number
    let value = parseFloat(inputValue.replace(/,/g, '')); // Remove commas if any
    
    if (isNaN(value)) {
      // Don't update if it's not a valid number
      return;
    }
    
    // Enforce maximum value
    if (value > 999.99) {
      value = 999.99;
    }
    
    // Enforce minimum value (but allow 0 for temporary state during typing)
    if (value < 0) {
      value = 0;
    }
    
    updateFormData({ discountValue: value });
  };

  const handleNumberChange = (field) => (e) => {
    const value = Number(e.target.value) || 0;
    const maxValues = {
      minBookingPrice: 99999999.99,
      usageLimit: 2147483647
    };
    updateFormData({ 
      [field]: Math.min(Math.max(0, value), maxValues[field] || Number.MAX_SAFE_INTEGER)
    });
  };

  // Helper function to check if discount value is valid for submission
  const isDiscountValueValid = () => {
    const value = Number(formData.discountValue);
    return !isNaN(value) && isFinite(value) && value > 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hotel Selection */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Khách sạn <span className="text-gray-400">(Tùy chọn)</span>
          </label>
          <select
            value={formData.hotelId || ''}
            onChange={(e) => updateFormData({ hotelId: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loadingHotels || isSubmitting}
          >
            <option value="">Khuyến mãi chung (Áp dụng cho tất cả khách sạn)</option>
            {renderHotelOptions()}
          </select>
          
          {loadingHotels && (
            <div className="flex items-center mt-1 text-blue-500">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span className="text-sm">Đang tải danh sách khách sạn...</span>
            </div>
          )}
          
          {hotelError && (
            <p className="text-red-500 text-sm mt-1">
              ⚠️ Không thể tải danh sách khách sạn
            </p>
          )}
          
          {errors.hotelId && <p className="text-red-500 text-sm mt-1">{errors.hotelId}</p>}
        </div>

        {/* Promotion Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã khuyến mãi *
          </label>
          <input
            type="text"
            value={formData.code || ''}
            onChange={handleCodeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VD: SUMMER2024"
            disabled={isSubmitting}
            maxLength={50}
            required
          />
          {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
        </div>

        {/* Promotion Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên chương trình *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="VD: Giảm giá mùa hè 2024"
            disabled={isSubmitting}
            maxLength={255}
            required
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mô tả chi tiết về chương trình khuyến mãi"
            disabled={isSubmitting}
          />
        </div>

        {/* Promotion Type */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại khuyến mãi *
          </label>
          <select
            value={formData.promotionType || 'general'}
            onChange={(e) => updateFormData({ promotionType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          >
            <option value="general">Khuyến mãi chung</option>
            <option value="room_specific">Theo phòng</option>
          </select>
          {errors.promotionType && <p className="text-red-500 text-sm mt-1">{errors.promotionType}</p>}
        </div>

        {/* Discount Value - ENHANCED */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá trị giảm giá *
            <span className="text-xs text-gray-500 ml-1">(Tối thiểu: 0.01, Tối đa: 999.99)</span>
          </label>
          <input
            type="number"
            min="0.01"
            max="999.99"
            step="0.01"
            value={formData.discountValue || ''}
            onChange={handleDiscountChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formData.discountValue && !isDiscountValueValid() 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="Nhập giá trị giảm giá (tối thiểu 0.01)"
            disabled={isSubmitting}
            required
          />
          {formData.discountValue && !isDiscountValueValid() && (
            <p className="text-red-500 text-sm mt-1">Giá trị giảm giá phải lớn hơn 0</p>
          )}
          {errors.discountValue && <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>}
        </div>

        {/* Min Booking Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá trị đặt chỗ tối thiểu
            <span className="text-xs text-gray-500 ml-1">(VNĐ)</span>
          </label>
          <input
            type="number"
            min="0"
            max="99999999.99"
            step="0.01"
            value={formData.minBookingPrice || ''}
            onChange={handleNumberChange('minBookingPrice')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0 (Không giới hạn)"
            disabled={isSubmitting}
          />
        </div>

        {/* Usage Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giới hạn sử dụng (lần)
          </label>
          <input
            type="number"
            min="0"
            max="2147483647"
            step="1"
            value={formData.usageLimit || ''}
            onChange={handleNumberChange('usageLimit')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0 (Không giới hạn)"
            disabled={isSubmitting}
          />
          {errors.usageLimit && <p className="text-red-500 text-sm mt-1">{errors.usageLimit}</p>}
        </div>

        {/* Valid From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian bắt đầu *
          </label>
          <input
            type="datetime-local"
            value={formData.validFrom || ''}
            onChange={(e) => updateFormData({ validFrom: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            min={new Date().toISOString().slice(0, 16)}
            required
          />
          {errors.validFrom && <p className="text-red-500 text-sm mt-1">{errors.validFrom}</p>}
        </div>

        {/* Valid Until */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian kết thúc *
          </label>
          <input
            type="datetime-local"
            value={formData.validUntil || ''}
            onChange={(e) => updateFormData({ validUntil: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            min={formData.validFrom || new Date().toISOString().slice(0, 16)}
            required
          />
          {errors.validUntil && <p className="text-red-500 text-sm mt-1">{errors.validUntil}</p>}
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái *
          </label>
          <select
            value={formData.status || 'active'}
            onChange={(e) => updateFormData({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          >
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Bị từ chối</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Error display */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra!</h3>
              <div className="mt-1 text-sm text-red-700">
                {errors.submit}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isSubmitting}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={
            isSubmitting || 
            !formData.code || 
            !formData.name || 
            !formData.validFrom || 
            !formData.validUntil || 
            !formData.discountValue ||
            !isDiscountValueValid()
          }
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              {initialData ? 'Đang cập nhật...' : 'Đang tạo...'}
            </>
          ) : (
            initialData ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'
          )}
        </button>
      </div>
    </form>
  );
};

export default PromotionForm;