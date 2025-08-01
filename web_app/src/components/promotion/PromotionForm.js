// src/components/promotion/PromotionForm.js
import React, { useState, useEffect } from 'react';
import InputField from '../common/InputField';
import Button from '../common/Button';

const PromotionForm = ({ initialData, onSubmit, isSubmitting, isEdit = false }) => {
    const [formData, setFormData] = useState({
        hotelId: '',
        code: '',
        name: '',
        description: '',
        discountValue: '',
        minBookingPrice: '',
        validFrom: '',
        validUntil: '',
        usageLimit: '',
        promotionType: 'percentage'
    });

    const [errors, setErrors] = useState({});

    // Load initial data when editing
    useEffect(() => {
        if (initialData && isEdit) {
            const formatDateForInput = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            setFormData({
                hotelId: initialData.hotelId || '',
                code: initialData.code || '',
                name: initialData.name || '',
                description: initialData.description || '',
                discountValue: initialData.discountValue || '',
                minBookingPrice: initialData.minBookingPrice || '',
                validFrom: formatDateForInput(initialData.validFrom),
                validUntil: formatDateForInput(initialData.validUntil),
                usageLimit: initialData.usageLimit || '',
                promotionType: initialData.promotionType || 'percentage'
            });
        }
    }, [initialData, isEdit]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.hotelId.trim()) {
            newErrors.hotelId = 'Hotel ID là bắt buộc';
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Mã khuyến mãi là bắt buộc';
        } else if (formData.code.length < 3) {
            newErrors.code = 'Mã khuyến mãi phải có ít nhất 3 ký tự';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Tên khuyến mãi là bắt buộc';
        }

        if (!formData.discountValue) {
            newErrors.discountValue = 'Giá trị giảm giá là bắt buộc';
        } else {
            const discountValue = parseFloat(formData.discountValue);
            if (isNaN(discountValue) || discountValue <= 0) {
                newErrors.discountValue = 'Giá trị giảm giá phải là số dương';
            } else if (formData.promotionType === 'percentage' && discountValue > 100) {
                newErrors.discountValue = 'Phần trăm giảm giá không được vượt quá 100%';
            }
        }

        if (!formData.validFrom) {
            newErrors.validFrom = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.validUntil) {
            newErrors.validUntil = 'Ngày kết thúc là bắt buộc';
        }

        // Date validation
        if (formData.validFrom && formData.validUntil) {
            const startDate = new Date(formData.validFrom);
            const endDate = new Date(formData.validUntil);
            
            if (startDate >= endDate) {
                newErrors.validUntil = 'Ngày kết thúc phải sau ngày bắt đầu';
            }

            if (!isEdit && startDate < new Date().setHours(0, 0, 0, 0)) {
                newErrors.validFrom = 'Ngày bắt đầu không được trong quá khứ';
            }
        }

        // Optional field validations
        if (formData.minBookingPrice && (isNaN(formData.minBookingPrice) || parseFloat(formData.minBookingPrice) < 0)) {
            newErrors.minBookingPrice = 'Giá booking tối thiểu phải là số không âm';
        }

        if (formData.usageLimit && (isNaN(formData.usageLimit) || parseInt(formData.usageLimit) <= 0)) {
            newErrors.usageLimit = 'Giới hạn sử dụng phải là số nguyên dương';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            // Prepare data for submission
            const submitData = {
                ...formData,
                discountValue: parseFloat(formData.discountValue),
                minBookingPrice: formData.minBookingPrice ? parseFloat(formData.minBookingPrice) : null,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
            };

            await onSubmit(submitData);

            // Reset form if not editing
            if (!isEdit) {
                setFormData({
                    hotelId: '',
                    code: '',
                    name: '',
                    description: '',
                    discountValue: '',
                    minBookingPrice: '',
                    validFrom: '',
                    validUntil: '',
                    usageLimit: '',
                    promotionType: 'percentage'
                });
                setErrors({});
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hotel ID */}
                <div>
                    <InputField
                        label="Hotel ID"
                        name="hotelId"
                        value={formData.hotelId}
                        onChange={handleChange}
                        error={errors.hotelId}
                        placeholder="Nhập ID khách sạn"
                        required
                    />
                </div>

                {/* Promotion Code */}
                <div>
                    <InputField
                        label="Mã khuyến mãi"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        error={errors.code}
                        placeholder="VD: SUMMER2024"
                        required
                    />
                </div>

                {/* Promotion Name */}
                <div className="md:col-span-2">
                    <InputField
                        label="Tên khuyến mãi"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        placeholder="Nhập tên khuyến mãi"
                        required
                    />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập mô tả chi tiết về khuyến mãi"
                    />
                </div>

                {/* Promotion Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loại khuyến mãi <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="promotionType"
                        value={formData.promotionType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        required
                    >
                        <option value="percentage">Phần trăm (%)</option>
                        <option value="fixed_amount">Số tiền cố định (VNĐ)</option>
                        <option value="free_night">Đêm miễn phí</option>
                    </select>
                </div>

                {/* Discount Value */}
                <div>
                    <InputField
                        label={`Giá trị giảm ${formData.promotionType === 'percentage' ? '(%)' : '(VNĐ)'}`}
                        name="discountValue"
                        type="number"
                        value={formData.discountValue}
                        onChange={handleChange}
                        error={errors.discountValue}
                        placeholder={formData.promotionType === 'percentage' ? '20' : '100000'}
                        min="0"
                        max={formData.promotionType === 'percentage' ? '100' : undefined}
                        step={formData.promotionType === 'percentage' ? '0.1' : '1000'}
                        required
                    />
                </div>

                {/* Valid From Date */}
                <div>
                    <InputField
                        label="Ngày bắt đầu"
                        name="validFrom"
                        type="date"
                        value={formData.validFrom}
                        onChange={handleChange}
                        error={errors.validFrom}
                        required
                    />
                </div>

                {/* Valid Until Date */}
                <div>
                    <InputField
                        label="Ngày kết thúc"
                        name="validUntil"
                        type="date"
                        value={formData.validUntil}
                        onChange={handleChange}
                        error={errors.validUntil}
                        required
                    />
                </div>

                {/* Min Booking Price */}
                <div>
                    <InputField
                        label="Giá booking tối thiểu (VNĐ)"
                        name="minBookingPrice"
                        type="number"
                        value={formData.minBookingPrice}
                        onChange={handleChange}
                        error={errors.minBookingPrice}
                        placeholder="500000"
                        min="0"
                        step="10000"
                    />
                </div>

                {/* Usage Limit */}
                <div>
                    <InputField
                        label="Giới hạn sử dụng"
                        name="usageLimit"
                        type="number"
                        value={formData.usageLimit}
                        onChange={handleChange}
                        error={errors.usageLimit}
                        placeholder="100"
                        min="1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Để trống nếu không giới hạn
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isSubmitting ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Tạo khuyến mãi')}
                </Button>
            </div>
        </form>
    );
};

export default PromotionForm;