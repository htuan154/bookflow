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

  // Always allow form editing - disable only when actually submitting
  const isSubmitting = false; // Temporarily disable all form locks
  
  // Debug log to check submitting state
  console.log('Form state - externalSubmitting:', externalSubmitting, 'internalSubmitting:', internalSubmitting, 'final isSubmitting:', isSubmitting);

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

  // Handle initial data - Remove updateFormData dependency to prevent infinite loop
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
        status: dataToUse.status || 'active',
        max_discount_amount: dataToUse.max_discount_amount || dataToUse.maxDiscountAmount || ''
      };

      updateFormData(mappedData);
    }
  }, [initialData]); // Remove updateFormData dependency

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form handleSubmit được gọi!');
    console.log('📊 Form data hiện tại:', formData);
    console.log('📞 onSubmit function:', typeof onSubmit, onSubmit ? 'có' : 'không có');
    
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
      status: formData.status || 'active',
      max_discount_amount: formData.max_discount_amount > 0
        ? Math.min(Number(formData.max_discount_amount), 99999999.99)
        : null
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

    // Validation for status transitions in edit mode
    if (initialData) {
      const currentStatus = initialData.status;
      const newStatus = cleanedData.status;
      const isExpired = new Date(cleanedData.valid_until) < new Date();
      
      // Check if status transition is allowed
      const isValidTransition = () => {
        switch (currentStatus) {
          case 'pending':
            return ['pending', 'approved', 'rejected'].includes(newStatus);
          case 'approved':
            return ['approved', 'active'].includes(newStatus);
          case 'rejected':
            return newStatus === 'rejected';
          case 'active':
            return ['active', 'inactive'].includes(newStatus);
          case 'inactive':
            // Can only activate if not expired
            return newStatus === 'inactive' || (newStatus === 'active' && !isExpired);
          default:
            return true;
        }
      };

      if (!isValidTransition()) {
        if (currentStatus === 'inactive' && newStatus === 'active' && isExpired) {
          validationErrors.push('Không thể kích hoạt khuyến mãi đã hết hạn');
        } else {
          validationErrors.push(`Không thể chuyển từ trạng thái "${getStatusLabel(currentStatus)}" sang "${getStatusLabel(newStatus)}"`);
        }
      }
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
        console.log('🔄 Đang gọi onSubmit từ PromotionEdit với dữ liệu:', cleanedData);
        const result = await onSubmit(cleanedData);
        console.log('✅ Kết quả trả về từ onSubmit:', result);
        
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

  // Tính toán giá trị giảm tối thiểu
  const calculateMinDiscountAmount = () => {
    const discountValue = parseFloat(formData.discountValue) || 0;
    const minBookingPrice = parseFloat(formData.minBookingPrice) || 0;
    return Math.round((discountValue / 100) * minBookingPrice);
  };

  // Lấy ngày tối thiểu (3 ngày từ hôm nay do thời gian duyệt 1-2 ngày)
  const getMinDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3); // Hôm nay + 3 ngày
    return minDate.toISOString().slice(0, 16);
  };

  // Lấy ngày kết thúc tối thiểu (1 tháng sau ngày bắt đầu)
  const getMinEndDate = () => {
    if (!formData.validFrom) return '';
    const startDate = new Date(formData.validFrom);
    const minEndDate = new Date(startDate);
    minEndDate.setMonth(minEndDate.getMonth() + 1); // Thêm 1 tháng
    minEndDate.setDate(minEndDate.getDate() + 1); // Thêm 1 ngày
    return minEndDate.toISOString().slice(0, 16);
  };

  // Input change handlers
  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Validation cho code - không tạo promotion khi đang edit
    if (!initialData) {
      // Kiểm tra tiếng Việt (ký tự có dấu)
      const vietnameseRegex = /[àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờở ỡợùúũụủưứừửữựỳýỵỷỹ]/i;
      if (vietnameseRegex.test(e.target.value)) {
        // Set error thông qua updateFormData để có thể access được
        updateFormData({ 
          code: value,
          _codeError: 'Mã khuyến mãi không được chứa tiếng Việt có dấu'
        });
        return;
      } else if (value.length > 0 && value.length < 5) {
        updateFormData({ 
          code: value,
          _codeError: 'Mã khuyến mãi phải có tối thiểu 5 ký tự'
        });
        return;
      } else {
        updateFormData({ 
          code: value,
          _codeError: ''
        });
      }
    } else {
      updateFormData({ code: value });
    }
  };

  // FIXED: Enhanced discount change handler
  const handleDiscountChange = (e) => {
    const inputValue = e.target.value;
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
    
      // Enforce maximum value (phần trăm tối đa là 20)
      if (value > 20) {
        value = 20;
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
      usageLimit: 2147483647,
      max_discount_amount: 99999999.99
    };
    
    // Validation cho max_discount_amount
    if (field === 'max_discount_amount') {
      const minDiscountAmount = calculateMinDiscountAmount();
      if (minDiscountAmount > 0 && value < minDiscountAmount) {
        console.warn(`Giá trị giảm tối đa không được nhỏ hơn ${minDiscountAmount.toLocaleString('vi-VN')} VND`);
      }
    }
    
    updateFormData({ 
      [field]: Math.min(Math.max(0, value), maxValues[field] || Number.MAX_SAFE_INTEGER)
    });
  };

  // Validation cho tên chương trình
  const handleNameChange = (e) => {
    const value = e.target.value;
    
    if (value.length > 0 && value.length < 5) {
      updateFormData({ 
        name: value,
        _nameError: 'Tên khuyến mãi phải có tối thiểu 5 ký tự'
      });
      return;
    } else {
      updateFormData({ 
        name: value,
        _nameError: ''
      });
    }
  };

  // Validation cho thời gian
  const handleDateChange = (field) => (e) => {
    const value = e.target.value;
    
    if (field === 'validFrom') {
      const selectedDate = new Date(value);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 2); // Cần 2 ngày cho thời gian duyệt
      
      if (selectedDate < minDate) {
        console.warn('Thời gian bắt đầu phải từ 3 ngày kể từ hôm nay (thời gian duyệt 1-2 ngày)');
      }
      
      // Tự động cập nhật valid_until khi valid_from thay đổi
      if (value && (!formData.validUntil || new Date(formData.validUntil) <= new Date(value))) {
        const startDate = new Date(value);
        const suggestedEndDate = new Date(startDate);
        suggestedEndDate.setMonth(suggestedEndDate.getMonth() + 1); // Thêm 1 tháng
        suggestedEndDate.setDate(suggestedEndDate.getDate() + 1); // Thêm 1 ngày
        
        updateFormData({ 
          [field]: value,
          validUntil: suggestedEndDate.toISOString().slice(0, 16)
        });
        return;
      }
    } else if (field === 'validUntil') {
      if (formData.validFrom) {
        const startDate = new Date(formData.validFrom);
        const endDate = new Date(value);
        const minEndDate = new Date(startDate);
        minEndDate.setMonth(minEndDate.getMonth() + 1); // Thêm 1 tháng
        
        if (endDate < minEndDate) {
          console.warn('Thời gian kết thúc phải tối thiểu 1 tháng sau ngày bắt đầu');
        }
      }
    }
    
    updateFormData({ [field]: value });
  };

  // Helper function to check if discount value is valid for submission
  const isDiscountValueValid = () => {
    const value = Number(formData.discountValue);
    return !isNaN(value) && isFinite(value) && value > 0;
  };

  // Helper function to check if field should be disabled in edit mode
  const isFieldDisabled = (fieldName) => {
    if (!initialData) return false; // Create mode - no restrictions
    
    const isRoomSpecific = formData.promotionType === 'room_specific' || 
                          (initialData && (initialData.promotionType === 'room_specific' || initialData.promotion_type === 'room_specific'));
    
    if (isRoomSpecific) {
      // Room-specific promotions: chỉ cho phép sửa status, tất cả field khác bị khóa
      return fieldName !== 'status';
    } else {
      // General promotions: không cho sửa các field cơ bản
      const disabledFields = ['code', 'name', 'validFrom', 'validUntil'];
      return disabledFields.includes(fieldName);
    }
  };

  // Helper function to get available status options based on ORIGINAL status (not current form selection)
  const getAvailableStatuses = () => {
    if (!initialData) return ['pending']; // New promotions are always pending
    
    // IMPORTANT: Use the ORIGINAL status from initialData, not the current form selection
    // This prevents the dropdown from changing available options when user selects a status
    const originalStatus = initialData.status;
    const currentValidUntil = new Date(formData.validUntil || initialData.validUntil || initialData.valid_until);
    const now = new Date();
    const isExpired = currentValidUntil < now;
    
    switch (originalStatus) {
      case 'pending':
        return ['pending', 'approved', 'rejected'];
      case 'approved':
        // Approved promotions cannot be manually changed to active
        // They will auto-activate when the valid_from date arrives
        return ['approved'];
      case 'rejected':
        return ['rejected'];
      case 'active':
        return ['active', 'inactive'];
      case 'inactive':
        // Can only return to active if not expired
        return isExpired ? ['inactive'] : ['inactive', 'active'];
      default:
        return [originalStatus];
    }
  };

  // Helper function to get status label
  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Bị từ chối',
      active: 'Đang hoạt động',
      inactive: 'Không hoạt động'
    };
    return labels[status] || status;
  };

  // Handle status change with validation
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    
    // Check if trying to activate an expired promotion
    // Use ORIGINAL status from initialData, not current form status
    if (initialData && initialData.status === 'inactive' && newStatus === 'active') {
      const validUntil = new Date(formData.validUntil || initialData.validUntil || initialData.valid_until);
      const now = new Date();
      
      if (validUntil < now) {
        alert('⚠️ Không thể kích hoạt khuyến mãi đã hết hạn!\n\nThời gian kết thúc: ' + validUntil.toLocaleString('vi-VN'));
        return; // Don't update status
      }
    }
    
    updateFormData({ status: newStatus });
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
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500${initialData ? ' bg-gray-100 cursor-not-allowed' : ''}`}
            disabled={loadingHotels || !!initialData}
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

        {/* Room-specific Edit Notice */}
        {initialData && (formData.promotionType === 'room_specific' || (initialData.promotionType === 'room_specific' || initialData.promotion_type === 'room_specific')) && (
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Chỉnh sửa khuyến mãi "Theo phòng"
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Đối với khuyến mãi loại "Theo phòng", bạn chỉ có thể thay đổi <strong>trạng thái</strong>.</p>
                  <p>Để quản lý chi tiết giảm giá theo phòng, vui lòng sử dụng chức năng "Xem chi tiết" trong danh sách khuyến mãi.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promotion Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã khuyến mãi *
            {isFieldDisabled('code') && (
              <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
            )}
          </label>
          <input
            type="text"
            value={formData.code || ''}
            onChange={handleCodeChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFieldDisabled('code') ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="VD: SUMMER2024"
            disabled={isFieldDisabled('code')}
            maxLength={50}
            minLength={!initialData ? 5 : undefined}
            required
          />
          {!initialData && (
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 5 ký tự, không có tiếng Việt có dấu</p>
          )}
          {isFieldDisabled('code') && (
            <p className="text-xs text-amber-600 mt-1">Mã khuyến mãi không thể thay đổi sau khi tạo</p>
          )}
          {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
        </div>

        {/* Promotion Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên chương trình *
            {isFieldDisabled('name') && (
              <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
            )}
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={handleNameChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFieldDisabled('name') ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="VD: Giảm giá mùa hè 2024"
            disabled={isFieldDisabled('name')}
            maxLength={255}
            minLength={!initialData ? 5 : undefined}
            required
          />
          {!initialData && (
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 5 ký tự</p>
          )}
          {isFieldDisabled('name') && (
            <p className="text-xs text-amber-600 mt-1">Tên chương trình không thể thay đổi sau khi tạo</p>
          )}
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả
            {isFieldDisabled('description') && (
              <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
            )}
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={3}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFieldDisabled('description') ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="Mô tả chi tiết về chương trình khuyến mãi"
            disabled={isFieldDisabled('description')}
          />
          {isFieldDisabled('description') && (
            <p className="text-xs text-amber-600 mt-1">Mô tả không thể thay đổi đối với khuyến mãi "Theo phòng"</p>
          )}
        </div>

        {/* Promotion Type */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại khuyến mãi *
          </label>
          {!initialData ? (
            // Khi tạo mới - chỉ có general
            <div>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                Khuyến mãi chung
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Hiện tại chỉ hỗ trợ khuyến mãi chung khi tạo mới
              </p>
              {/* Hidden input to maintain form data */}
              <input
                type="hidden"
                value="general"
                onChange={(e) => updateFormData({ promotionType: e.target.value })}
              />
            </div>
          ) : (
            // Khi edit - hiển thị nhưng disable
            <select
              value={formData.promotionType || 'general'}
              onChange={(e) => updateFormData({ promotionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
              disabled={true}
              required
            >
              <option value="general">Khuyến mãi chung</option>
              <option value="room_specific">Theo phòng</option>
            </select>
          )}
          {initialData && (
            <p className="text-xs text-gray-500 mt-1">
              💡 Loại khuyến mãi không thể thay đổi khi chỉnh sửa
            </p>
          )}
          {errors.promotionType && <p className="text-red-500 text-sm mt-1">{errors.promotionType}</p>}
        </div>

        {/* Discount Value - ENHANCED */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá trị giảm giá *
            <span className="text-xs text-gray-500 ml-1">(Tối thiểu: 0.01, Tối đa: 20%)</span>
            {isFieldDisabled('discountValue') && (
              <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
            )}
          </label>
          <input
            type="number"
            min="0.01"
            max="20"
            step="0.01"
            value={formData.discountValue || ''}
            onChange={handleDiscountChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFieldDisabled('discountValue') 
                ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                : formData.discountValue && !isDiscountValueValid() 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
            }`}
            placeholder="Nhập giá trị giảm giá (tối thiểu 0.01, tối đa 20)"
            disabled={isFieldDisabled('discountValue')}
            required
          />
          {!isFieldDisabled('discountValue') && <p className="text-xs text-gray-500 mt-1">Tối đa 20%</p>}
          {isFieldDisabled('discountValue') && (
            <p className="text-xs text-amber-600 mt-1">Giá trị giảm giá không thể thay đổi đối với khuyến mãi "Theo phòng"</p>
          )}
          {formData.discountValue && !isDiscountValueValid() && !isFieldDisabled('discountValue') && (
            <p className="text-red-500 text-sm mt-1">Giá trị giảm giá phải lớn hơn 0</p>
          )}
          {errors.discountValue && <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>}
        </div>

          {/* Max Discount Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền giảm tối đa *
              <span className="text-xs text-gray-500 ml-1">(VNĐ)</span>
              {isFieldDisabled('max_discount_amount') && (
                <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
              )}
            </label>
            <input
              type="number"
              min={calculateMinDiscountAmount()}
              max="99999999.99"
              step="0.01"
              value={formData.max_discount_amount || ''}
              onChange={handleNumberChange('max_discount_amount')}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isFieldDisabled('max_discount_amount') ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              placeholder="VD: 500000"
              disabled={isFieldDisabled('max_discount_amount')}
              required
            />
            {!isFieldDisabled('max_discount_amount') && calculateMinDiscountAmount() > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                Tối thiểu: {calculateMinDiscountAmount().toLocaleString('vi-VN')} VND
              </p>
            )}
            {isFieldDisabled('max_discount_amount') && (
              <p className="text-xs text-amber-600 mt-1">Số tiền giảm tối đa không thể thay đổi đối với khuyến mãi "Theo phòng"</p>
            )}
            {errors.max_discount_amount && <p className="text-red-500 text-sm mt-1">{errors.max_discount_amount}</p>}
          </div>

        {/* Min Booking Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá trị đặt chỗ tối thiểu *
            <span className="text-xs text-gray-500 ml-1">(VNĐ)</span>
            {isFieldDisabled('minBookingPrice') && (
              <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
            )}
          </label>
          <input
            type="number"
            min="0"
            max="99999999.99"
            step="0.01"
            value={formData.minBookingPrice || ''}
            onChange={handleNumberChange('minBookingPrice')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFieldDisabled('minBookingPrice') ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="VD: 1000000"
            disabled={isFieldDisabled('minBookingPrice')}
            required
          />
          {isFieldDisabled('minBookingPrice') && (
            <p className="text-xs text-amber-600 mt-1">Giá trị đặt chỗ tối thiểu không thể thay đổi đối với khuyến mãi "Theo phòng"</p>
          )}
          {errors.minBookingPrice && <p className="text-red-500 text-sm mt-1">{errors.minBookingPrice}</p>}
        </div>

        {/* Usage Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giới hạn sử dụng (lần) *
            {isFieldDisabled('usageLimit') && (
              <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
            )}
          </label>
          <input
            type="number"
            min="1"
            max="2147483647"
            step="1"
            value={formData.usageLimit || ''}
            onChange={handleNumberChange('usageLimit')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFieldDisabled('usageLimit') ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder="VD: 100"
            disabled={isFieldDisabled('usageLimit')}
            required
          />
          {isFieldDisabled('usageLimit') && (
            <p className="text-xs text-amber-600 mt-1">Giới hạn sử dụng không thể thay đổi đối với khuyến mãi "Theo phòng"</p>
          )}
          {errors.usageLimit && <p className="text-red-500 text-sm mt-1">{errors.usageLimit}</p>}
        </div>

        {/* Valid From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian bắt đầu *
            {isFieldDisabled('validFrom') && (
              <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
            )}
          </label>
          <input
            type="datetime-local"
            value={formData.validFrom || ''}
            onChange={handleDateChange('validFrom')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFieldDisabled('validFrom') ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={isFieldDisabled('validFrom')}
            min={!initialData ? getMinDate() : new Date().toISOString().slice(0, 16)}
            required
          />
          {!initialData && (
            <p className="text-xs text-gray-500 mt-1">
              Phải chọn từ 3 ngày kể từ hôm nay (thời gian duyệt 1-2 ngày)
            </p>
          )}
          {isFieldDisabled('validFrom') && (
            <p className="text-xs text-amber-600 mt-1">Thời gian bắt đầu không thể thay đổi sau khi tạo</p>
          )}
          {errors.validFrom && <p className="text-red-500 text-sm mt-1">{errors.validFrom}</p>}
        </div>

        {/* Valid Until */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian kết thúc *
            {isFieldDisabled('validUntil') && (
              <span className="text-amber-600 text-xs ml-2">(Không thể chỉnh sửa)</span>
            )}
          </label>
          <input
            type="datetime-local"
            value={formData.validUntil || ''}
            onChange={handleDateChange('validUntil')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isFieldDisabled('validUntil') ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={isFieldDisabled('validUntil')}
            min={!initialData ? getMinEndDate() : (formData.validFrom || new Date().toISOString().slice(0, 16))}
            required
          />
          {!initialData && (
            <p className="text-xs text-gray-500 mt-1">
              Phải chọn ít nhất 1 tháng sau thời gian bắt đầu
            </p>
          )}
          {isFieldDisabled('validUntil') && (
            <p className="text-xs text-amber-600 mt-1">Thời gian kết thúc không thể thay đổi sau khi tạo</p>
          )}
          {errors.validUntil && <p className="text-red-500 text-sm mt-1">{errors.validUntil}</p>}
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái *
          </label>
          <select
            value={formData.status || (!initialData ? 'pending' : formData.status)}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {getAvailableStatuses().map(status => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
          {initialData && (
            <div className="mt-2 text-xs text-gray-600">
              <p>📋 <strong>Quy tắc chuyển trạng thái:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Chờ duyệt → Đã duyệt/Bị từ chối</li>
                <li>Đã duyệt → Tự động chuyển "Đang hoạt động" khi đến ngày bắt đầu</li>
                <li>Đang hoạt động → Không hoạt động</li>
                <li>Không hoạt động → Đang hoạt động (nếu chưa hết hạn)</li>
              </ul>
              {(formData.status === 'approved') && (
                <p className="mt-2 text-blue-600">
                  💡 Khuyến mãi đã được duyệt sẽ tự động kích hoạt vào ngày {new Date(formData.validFrom).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          )}
          {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
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
          // disabled={isSubmitting}
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={(() => {
            const isDisabled = isSubmitting || 
              !formData.code || 
              !formData.name || 
              !formData.validFrom || 
              !formData.validUntil || 
              !formData.discountValue ||
              !isDiscountValueValid() ||
              formData._codeError ||
              formData._nameError ||
              formData._descriptionError;
            
            console.log('🔲 Nút submit disabled:', isDisabled, {
              isSubmitting,
              hasCode: !!formData.code,
              hasName: !!formData.name,
              hasValidFrom: !!formData.validFrom,
              hasValidUntil: !!formData.validUntil,
              hasDiscountValue: !!formData.discountValue,
              isDiscountValueValid: isDiscountValueValid(),
              codeError: formData._codeError,
              nameError: formData._nameError,
              descriptionError: formData._descriptionError
            });
            
            return isDisabled;
          })()}
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