// Thay thông báo localhost khi tạo khuyến mãi thành công bằng thông báo này
// src/components/promotions/CreatePromotionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Percent, DollarSign, Clock, Users, Tag, FileText, Settings } from 'lucide-react';
import PromotionService from '../../api/promotions.service';
import { useToast } from '../../hooks/useToast';
import Toast from '../common/Toast';
import PromotionDetailModal from './PromotionDetailModal';

const CreatePromotionModal = ({ isOpen, onClose, selectedHotel, onSuccess }) => {
  const [formData, setFormData] = useState({
    hotel_id: selectedHotel?.hotelId || '',
    code: '',
    name: '',
    description: '',
    discount_value: '',
    min_booking_price: '',
    max_discount_amount: '',
    valid_from: '',
    valid_until: '',
    usage_limit: '',
    promotion_type: 'general',
    status: 'pending' // Luôn là chờ duyệt
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [createdPromotion, setCreatedPromotion] = useState(null);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Update hotel_id when selectedHotel changes
  useEffect(() => {
    if (selectedHotel?.hotelId) {
      setFormData(prev => ({
        ...prev,
        hotel_id: selectedHotel.hotelId
      }));
    }
  }, [selectedHotel]);

  // Tính toán giá trị giảm tối thiểu
  const calculateMinDiscountAmount = () => {
    const discountValue = parseFloat(formData.discount_value) || 0;
    const minBookingPrice = parseFloat(formData.min_booking_price) || 0;
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
    if (!formData.valid_from) return '';
    const startDate = new Date(formData.valid_from);
    const minEndDate = new Date(startDate);
    minEndDate.setMonth(minEndDate.getMonth() + 1); // Thêm 1 tháng
    minEndDate.setDate(minEndDate.getDate() + 1); // Thêm 1 ngày
    return minEndDate.toISOString().slice(0, 16);
  };

  const handleInputChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    
    // Validation cho name (chỉ hiển thị lỗi, không block)
    if (name === 'name') {
      if (value.length > 0 && value.length < 5) {
        setErrors(prev => ({
          ...prev,
          name: 'Tên khuyến mãi phải có tối thiểu 5 ký tự'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          name: ''
        }));
      }
    }

    // Validation cho code (chỉ hiển thị lỗi, không block)
    if (name === 'code') {
      // Kiểm tra tiếng Việt (ký tự có dấu)
      const vietnameseRegex = /[àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờở ỡợùúũụủưứừửữựỳýỵỷỹ]/i;
      if (vietnameseRegex.test(value)) {
        setErrors(prev => ({
          ...prev,
          code: 'Mã khuyến mãi không được chứa tiếng Việt có dấu'
        }));
      } else if (value.length > 0 && value.length < 5) {
        setErrors(prev => ({
          ...prev,
          code: 'Mã khuyến mãi phải có tối thiểu 5 ký tự'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          code: ''
        }));
      }
    }

    // Tự động giới hạn discount_value về 20% nếu vượt quá
    if (name === 'discount_value') {
      const numValue = parseFloat(value);
      if (numValue > 20) {
        value = '20';
      }
    }

    // Validation cho valid_from (chỉ hiển thị lỗi, không block)
    if (name === 'valid_from') {
      const selectedDate = new Date(value);
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 2); // Cần 2 ngày cho thời gian duyệt
      
      if (selectedDate < minDate) {
        setErrors(prev => ({
          ...prev,
          valid_from: 'Thời gian bắt đầu phải từ 3 ngày kể từ hôm nay (thời gian duyệt 1-2 ngày)'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          valid_from: ''
        }));
      }
    }

    // Validation cho valid_until (chỉ hiển thị lỗi, không block)
    if (name === 'valid_until') {
      if (formData.valid_from) {
        const startDate = new Date(formData.valid_from);
        const endDate = new Date(value);
        const minEndDate = new Date(startDate);
        minEndDate.setMonth(minEndDate.getMonth() + 1); // Thêm 1 tháng
        //minEndDate.setDate(minEndDate.getDate() + 1); // Thêm 1 ngày
        
        if (endDate < minEndDate) {
          setErrors(prev => ({
            ...prev,
            valid_until: 'Thời gian kết thúc phải tối thiểu 1 tháng sau ngày bắt đầu'
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            valid_until: ''
          }));
        }
      }
    }

    // Validation cho max_discount_amount (chỉ hiển thị lỗi, không block)
    if (name === 'max_discount_amount') {
      const minDiscountAmount = calculateMinDiscountAmount();
      const numValue = parseFloat(value);
      if (minDiscountAmount > 0 && numValue < minDiscountAmount) {
        setErrors(prev => ({
          ...prev,
          max_discount_amount: `Giá trị giảm tối đa không được nhỏ hơn ${minDiscountAmount.toLocaleString('vi-VN')} VND`
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          max_discount_amount: ''
        }));
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Tự động cập nhật max_discount_amount khi discount_value hoặc min_booking_price thay đổi
    if (name === 'discount_value' || name === 'min_booking_price') {
      const newFormData = { ...formData, [name]: value };
      const discountValue = parseFloat(newFormData.discount_value) || 0;
      const minBookingPrice = parseFloat(newFormData.min_booking_price) || 0;
      const suggestedMax = Math.round((discountValue / 100) * minBookingPrice);
      
      if (suggestedMax > 0 && (!formData.max_discount_amount || parseFloat(formData.max_discount_amount) < suggestedMax)) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          max_discount_amount: suggestedMax.toString()
        }));
      }
    }

    // Tự động cập nhật valid_until khi valid_from thay đổi
    if (name === 'valid_from') {
      if (value && (!formData.valid_until || new Date(formData.valid_until) <= new Date(value))) {
        const startDate = new Date(value);
        const suggestedEndDate = new Date(startDate);
        suggestedEndDate.setMonth(suggestedEndDate.getMonth() + 1); // Thêm 1 tháng
        suggestedEndDate.setDate(suggestedEndDate.getDate() + 1); // Thêm 1 ngày
        
        setFormData(prev => ({
          ...prev,
          [name]: value,
          valid_until: suggestedEndDate.toISOString().slice(0, 16)
        }));
      }
    }
  };

  // Kiểm tra form có hợp lệ không
  const isFormValid = () => {
    const hasErrors = Object.values(errors).some(error => error !== '');
    const requiredFields = ['name', 'code', 'discount_value', 'min_booking_price', 'max_discount_amount', 'valid_from', 'valid_until', 'usage_limit'];
    const hasAllRequiredFields = requiredFields.every(field => formData[field] && formData[field].trim() !== '');
    
    return !hasErrors && hasAllRequiredFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data for API
      const promotionData = {
        ...formData,
        hotel_id: selectedHotel?.hotelId || formData.hotel_id,
        discount_value: parseFloat(formData.discount_value),
        min_booking_price: parseFloat(formData.min_booking_price) || null,
        max_discount_amount: parseFloat(formData.max_discount_amount) || null,
        usage_limit: parseInt(formData.usage_limit) || null,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
      };

      console.log('Creating promotion with data:', promotionData);
      
      const result = await PromotionService.createPromotion(promotionData);
      
      console.log('Promotion API response:', result);
      
      // Check if the result indicates success
      if (result && result.success) {
        // Store created promotion for detail modal
        setCreatedPromotion(result.data);
        
        // Show success toast
        showSuccess(
          'Tạo thành công!',
          `Khuyến mãi "${formData.name}" đã được tạo và đang chờ duyệt.`
        );
      } else {
        // Handle API error response
        const errorMessage = result?.message || 'Có lỗi xảy ra khi tạo khuyến mãi';
        showError('Tạo thất bại!', errorMessage);
        return;
      }
      
      // Reset form data
      setFormData({
        hotel_id: selectedHotel?.hotelId || '',
        code: '',
        name: '',
        description: '',
        discount_value: '',
        min_booking_price: '',
        max_discount_amount: '',
        valid_from: '',
        valid_until: '',
        usage_limit: '',
        promotion_type: 'general',
        status: 'pending'
      });
      
      // Clear any errors
      setErrors({});
      
      // Call success callback to refresh parent data
      if (onSuccess) {
        onSuccess(result);
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating promotion:', error);
      
      // Show error toast - handle both error object and direct error
      let errorMessage = 'Có lỗi xảy ra khi tạo khuyến mãi';
      
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = error.message;
        } else if (error.details && error.details.message) {
          errorMessage = error.details.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      showError('Tạo thất bại!', errorMessage);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  if (!isOpen) return null;

  return (
    <>
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tạo khuyến mãi mới</h2>
            <p className="text-gray-600 mt-1">
              Khách sạn: <span className="font-medium">{selectedHotel?.name || 'Chưa chọn khách sạn'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Thông tin cơ bản
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Promotion Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  minLength="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ví dụ: Giảm giá mùa hè 2025"
                />
                <p className="text-xs text-gray-500 mt-1">Tối thiểu 5 ký tự</p>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Promotion Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã khuyến mãi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  minLength="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="SUMMER2025"
                  style={{ textTransform: 'uppercase' }}
                />
                <p className="text-xs text-gray-500 mt-1">Tối thiểu 5 ký tự, không có tiếng Việt có dấu</p>
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
              </div>

              {/* Promotion Type */}
              <div>
                <label htmlFor="promotion_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Loại khuyến mãi
                </label>
                <select
                  id="promotion_type"
                  name="promotion_type"
                  value={formData.promotion_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">Tổng quát</option>
                  <option value="room_specific">Theo phòng cụ thể</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600">
                  Chờ duyệt
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Khuyến mãi sẽ được duyệt trong vòng 1-2 ngày làm việc
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả khuyến mãi
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mô tả chi tiết về chương trình khuyến mãi..."
              />
            </div>
          </div>

          {/* Discount Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Percent className="w-5 h-5 mr-2" />
              Thông tin giảm giá
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Discount Value */}
              <div>
                <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị giảm (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="discount_value"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    min="0"
                    max="20"
                    step="0.01"
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="15.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Tối đa 20%</p>
                {errors.discount_value && <p className="mt-1 text-sm text-red-600">{errors.discount_value}</p>}
              </div>

              {/* Min Booking Price */}
              <div>
                <label htmlFor="min_booking_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Giá tối thiểu (VND) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="min_booking_price"
                    name="min_booking_price"
                    value={formData.min_booking_price}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000000"
                  />
                </div>
              </div>

              {/* Max Discount Amount */}
              <div>
                <label htmlFor="max_discount_amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Giảm tối đa (VND) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="max_discount_amount"
                    name="max_discount_amount"
                    value={formData.max_discount_amount}
                    onChange={handleInputChange}
                    min={calculateMinDiscountAmount()}
                    //step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500000"
                  />
                </div>
                {calculateMinDiscountAmount() > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tối thiểu: {calculateMinDiscountAmount().toLocaleString('vi-VN')} VND
                  </p>
                )}
                {errors.max_discount_amount && <p className="mt-1 text-sm text-red-600">{errors.max_discount_amount}</p>}
              </div>
            </div>
          </div>

          {/* Time & Usage Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Thời gian & Sử dụng
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Valid From */}
              <div>
                <label htmlFor="valid_from" className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian bắt đầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="valid_from"
                  name="valid_from"
                  value={formData.valid_from}
                  onChange={handleInputChange}
                  min={getMinDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Phải chọn từ 3 ngày kể từ hôm nay (thời gian duyệt 1-2 ngày)
                </p>
                {errors.valid_from && <p className="mt-1 text-sm text-red-600">{errors.valid_from}</p>}
              </div>

              {/* Valid Until */}
              <div>
                <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian kết thúc <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="valid_until"
                  name="valid_until"
                  value={formData.valid_until}
                  onChange={handleInputChange}
                  min={getMinEndDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tối thiểu 1 tháng sau ngày bắt đầu
                </p>
                {errors.valid_until && <p className="mt-1 text-sm text-red-600">{errors.valid_until}</p>}
              </div>

              {/* Usage Limit */}
              <div>
                <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700 mb-2">
                  Giới hạn sử dụng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="usage_limit"
                    name="usage_limit"
                    value={formData.usage_limit}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="100"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-gray-500 text-sm">lượt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Specific Notice */}
          {formData.promotion_type === 'room_specific' && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-800">Khuyến mãi theo phòng cụ thể</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      {createdPromotion 
                        ? 'Khuyến mãi đã được tạo thành công. Bây giờ bạn có thể thêm chi tiết giảm giá cho từng loại phòng.'
                        : 'Sau khi tạo khuyến mãi, bạn sẽ cần thêm chi tiết giảm giá cho từng loại phòng cụ thể.'
                      }
                    </p>
                  </div>
                </div>
                {createdPromotion && (
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(true)}
                    className="ml-4 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors flex items-center"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Tạo chi tiết
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
              {isSubmitting ? 'Đang tạo...' : 'Tạo khuyến mãi'}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Promotion Detail Modal */}
    {showDetailModal && createdPromotion && (
      <PromotionDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        selectedHotel={selectedHotel}
        promotion={createdPromotion}
        onSuccess={(result) => {
          console.log('Promotion details created:', result);
          setShowDetailModal(false);
          // Optionally refresh data or show success message
        }}
      />
    )}
    </>
  );
};

export default CreatePromotionModal;