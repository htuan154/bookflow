// src/components/promotions/EditPromotionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, AlertTriangle, Lock } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import Toast from '../common/Toast';
import promotionService from '../../api/promotions.service';

const EditPromotionModal = ({ isOpen, onClose, promotion, onSuccess }) => {
  const [formData, setFormData] = useState({
    description: '',
    discountValue: '',
    minBookingPrice: '',
    usageLimit: '',
    status: '',
    promotionType: '',
    maxDiscountAmount: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && promotion) {
      setFormData({
        description: promotion.description || '',
        discountValue: promotion.discountValue || '',
        minBookingPrice: promotion.minBookingPrice || '',
        usageLimit: promotion.usageLimit || '',
        status: promotion.status || '',
        promotionType: promotion.promotionType || '',
        maxDiscountAmount: promotion.maxDiscountAmount || ''
      });
      // Clear errors when modal opens
      setErrors({});
    }
  }, [isOpen, promotion]);

  // Tính toán giá trị giảm tối thiểu
  const calculateMinDiscountAmount = () => {
    const discountValue = parseFloat(formData.discountValue) || 0;
    const minBookingPrice = parseFloat(formData.minBookingPrice) || 0;
    return Math.round((discountValue / 100) * minBookingPrice);
  };

  // Check if status can be changed
  const canChangeStatus = () => {
    if (!promotion) return false;
    
    const status = promotion.status;
    const validUntil = new Date(promotion.validUntil);
    const today = new Date();
    
    // pending, approved, rejected cannot be changed
    if (['pending', 'approved', 'rejected'].includes(status)) {
      return false;
    }
    
    // active can be changed to inactive
    if (status === 'active') {
      return true;
    }
    
    // inactive can be changed to active only if not expired
    if (status === 'inactive') {
      return today <= validUntil;
    }
    
    return false;
  };

  // Get available status options
  const getStatusOptions = () => {
    if (!promotion) return [];
    
    const currentStatus = promotion.status;
    
    if (['pending', 'approved', 'rejected'].includes(currentStatus)) {
      return [{ value: currentStatus, label: getStatusLabel(currentStatus) }];
    }
    
    if (currentStatus === 'active') {
      return [
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'inactive', label: 'Tạm dừng' }
      ];
    }
    
    if (currentStatus === 'inactive') {
      const validUntil = new Date(promotion.validUntil);
      const today = new Date();
      
      if (today <= validUntil) {
        return [
          { value: 'inactive', label: 'Tạm dừng' },
          { value: 'active', label: 'Đang hoạt động' }
        ];
      } else {
        return [{ value: 'inactive', label: 'Tạm dừng (Đã hết hạn)' }];
      }
    }
    
    return [];
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Chờ duyệt',
      'approved': 'Đã duyệt',
      'rejected': 'Bị từ chối',
      'active': 'Đang hoạt động',
      'inactive': 'Tạm dừng'
    };
    return statusMap[status] || status;
  };

  const handleInputChange = (field, value) => {
    // Validation cho discount_value
    if (field === 'discountValue') {
      const numValue = parseFloat(value);
      if (numValue > 20) {
        value = '20'; // Tự động giới hạn về 20% nếu vượt quá
      }
    }

    // Validation cho max_discount_amount
    if (field === 'maxDiscountAmount') {
      const minDiscountAmount = calculateMinDiscountAmount();
      const numValue = parseFloat(value);
      if (minDiscountAmount > 0 && numValue < minDiscountAmount) {
        setErrors(prev => ({
          ...prev,
          maxDiscountAmount: `Giá trị giảm tối đa không được nhỏ hơn ${minDiscountAmount.toLocaleString('vi-VN')} VND`
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          maxDiscountAmount: ''
        }));
      }
    }

    // Clear errors for other fields
    if (field === 'discountValue' || field === 'minBookingPrice') {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Tự động cập nhật max_discount_amount khi discount_value hoặc min_booking_price thay đổi
    if (field === 'discountValue' || field === 'minBookingPrice') {
      const newFormData = { ...formData, [field]: value };
      const discountValue = parseFloat(newFormData.discountValue) || 0;
      const minBookingPrice = parseFloat(newFormData.minBookingPrice) || 0;
      const suggestedMax = Math.round((discountValue / 100) * minBookingPrice);
      
      if (suggestedMax > 0 && (!formData.maxDiscountAmount || parseFloat(formData.maxDiscountAmount) < suggestedMax)) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          maxDiscountAmount: suggestedMax.toString()
        }));
      }
    }
  };

  // Kiểm tra form có hợp lệ không
  const isFormValid = () => {
    const hasErrors = Object.values(errors).some(error => error !== '');
    const requiredFields = ['discountValue', 'minBookingPrice', 'maxDiscountAmount', 'usageLimit'];
    const hasAllRequiredFields = requiredFields.every(field => {
      const value = formData[field];
      return value !== '' && value !== null && value !== undefined;
    });
    
    // Additional validation for numerical values
    const discountValue = parseFloat(formData.discountValue);
    const minBookingPrice = parseFloat(formData.minBookingPrice);
    const maxDiscountAmount = parseFloat(formData.maxDiscountAmount);
    
    const isNumericValid = discountValue > 0 && 
                          discountValue <= 20 && 
                          minBookingPrice > 0 && 
                          maxDiscountAmount > 0 && 
                          maxDiscountAmount >= calculateMinDiscountAmount();
    
    return !hasErrors && hasAllRequiredFields && isNumericValid;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Prepare promotion update data theo format của service có sẵn
      // Bao gồm cả các trường không thay đổi để tránh validation error
      const promotionUpdateData = {
        hotel_id: promotion.hotelId,
        code: promotion.code,
        name: promotion.name,
        description: formData.description,
        discount_value: parseFloat(formData.discountValue) || 0,
        min_booking_price: parseFloat(formData.minBookingPrice) || 0,
        valid_from: promotion.validFrom,
        valid_until: promotion.validUntil,
        usage_limit: parseInt(formData.usageLimit) || null,
        status: formData.status,
        promotion_type: promotion.promotionType,
        max_discount_amount: parseFloat(formData.maxDiscountAmount) || null
      };

      console.log('🔄 Updating promotion with data:', promotionUpdateData);
      console.log('🔄 Original promotion data:', promotion);

      // 1. Update the main promotion first
      const updateResult = await promotionService.updatePromotion(promotion.promotionId, promotionUpdateData);
      console.log('✅ Promotion updated successfully:', updateResult);

      // 2. If promotion is room_specific, handle promotion_details logic
      if (promotion.promotionType === 'room_specific') {
        console.log('🏨 Processing room_specific promotion details...');
        
        try {
          const updatedDetails = await promotionService.processRoomSpecificPromotionUpdate(
            promotion.promotionId,
            formData.discountValue,
            formData.maxDiscountAmount
          );
          
          console.log('✅ Room-specific promotion details processed:', updatedDetails.length, 'details');
        } catch (detailsError) {
          console.warn('⚠️ Error processing promotion details:', detailsError);
          // Continue execution - main promotion was updated successfully
        }
      }
      
      showSuccess('Cập nhật thành công!', 'Thông tin khuyến mãi đã được cập nhật.');
      
      if (onSuccess) {
        onSuccess(formData);
      }

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('❌ Error updating promotion:', error);
      const errorMessage = error.message || error.details?.message || 'Có lỗi xảy ra khi cập nhật khuyến mãi';
      showError('Cập nhật thất bại!', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa khuyến mãi</h2>
              <p className="text-gray-600 mt-1">
                Mã: <span className="font-medium">{promotion?.code}</span>
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
            <form onSubmit={handleSubmit}>
              {/* Read-only Information */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Thông tin không thể thay đổi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên khuyến mãi
                    </label>
                    <input
                      type="text"
                      value={promotion?.name || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã khuyến mãi
                    </label>
                    <input
                      type="text"
                      value={promotion?.code || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="text"
                      value={promotion?.validFrom ? formatDate(promotion.validFrom) : ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="text"
                      value={promotion?.validUntil ? formatDate(promotion.validUntil) : ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại khuyến mãi
                    </label>
                    <input
                      type="text"
                      value={promotion?.promotionType === 'general' ? 'Tổng quát' : 'Theo loại phòng'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
                {/* Info about room_specific processing */}
                {promotion?.promotionType === 'room_specific' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-blue-800">
                          Lưu ý về khuyến mãi theo loại phòng
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>Khi cập nhật khuyến mãi này, hệ thống sẽ tự động:</p>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Cập nhật giá trị giảm giá cho các phòng có loại <strong>percentage</strong> = giá trị giảm giá mới</li>
                            <li>Kiểm tra và điều chỉnh giá trị giảm giá cho các phòng có loại <strong>fixed_amount</strong> nếu vượt quá giới hạn tối đa</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Information */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập mô tả cho khuyến mãi"
                    />
                  </div>

                  {/* Discount Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá trị giảm giá
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="20"
                        value={formData.discountValue}
                        onChange={(e) => handleInputChange('discountValue', e.target.value)}
                        className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Tối đa 20%</p>
                    {errors.discountValue && <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>}
                  </div>

                  {/* Min Booking Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá trị đơn hàng tối thiểu
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.minBookingPrice}
                      onChange={(e) => handleInputChange('minBookingPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối thiểu: {formatCurrency(formData.minBookingPrice || 0)}
                    </p>
                    {errors.minBookingPrice && <p className="mt-1 text-sm text-red-600">{errors.minBookingPrice}</p>}
                  </div>

                  {/* Usage Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giới hạn sử dụng
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usageLimit}
                      onChange={(e) => handleInputChange('usageLimit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Không giới hạn"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Đã sử dụng: {promotion?.usedCount || 0} lần
                    </p>
                  </div>

                  {/* Max Discount Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giảm tối đa
                      {promotion?.promotionType === 'room_specific' && (
                        <span className="text-xs text-blue-600 ml-1">(áp dụng cho fixed_amount)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={calculateMinDiscountAmount()}
                      //step="1000"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => handleInputChange('maxDiscountAmount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Không giới hạn"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.maxDiscountAmount ? 
                        `Tối đa: ${formatCurrency(formData.maxDiscountAmount)}` : 
                        'Không giới hạn'
                      }
                    </p>
                    {calculateMinDiscountAmount() > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        Tối thiểu: {formatCurrency(calculateMinDiscountAmount())} VND
                      </p>
                    )}
                    {errors.maxDiscountAmount && <p className="mt-1 text-sm text-red-600">{errors.maxDiscountAmount}</p>}
                    {promotion?.promotionType === 'room_specific' && (
                      <p className="text-xs text-blue-600 mt-1">
                        Giá trị này sẽ được áp dụng cho các phòng có loại giảm giá fixed_amount
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={!canChangeStatus()}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !canChangeStatus() ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    >
                      {getStatusOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {!canChangeStatus() && (
                      <p className="text-xs text-amber-600 mt-1">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Trạng thái không thể thay đổi
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
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
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang lưu...
                    </span>
                  ) : (
                    'Lưu thông tin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditPromotionModal;