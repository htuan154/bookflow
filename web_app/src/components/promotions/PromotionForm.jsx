// src/components/promotions/PromotionForm.jsx
import React, { useState, useEffect } from 'react';
import { usePromotionForm } from '../../hooks/usePromotions';

const PromotionForm = ({ initialData, onSubmit, onCancel }) => {
  const {
    formData,
    errors,
    isSubmitting,
    updateFormData,
    submitForm,
    resetForm,
    isValid
  } = usePromotionForm(initialData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await submitForm();
    if (success && onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mã khuyến mãi *
          </label>
          <input
            type="text"
            value={formData.code || ''}
            onChange={(e) => updateFormData({ code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mã khuyến mãi"
          />
          {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên chương trình *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateFormData({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập tên chương trình"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập mô tả chương trình"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại khuyến mãi *
          </label>
          <select
            value={formData.promotionType || 'percentage'}
            onChange={(e) => updateFormData({ promotionType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage">Theo tỷ lệ phần trăm</option>
            <option value="fixed">Theo giá cố định</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá trị giảm giá *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.discountValue || ''}
            onChange={(e) => updateFormData({ discountValue: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập giá trị giảm giá"
          />
          {errors.discountValue && <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giá trị đặt chỗ tối thiểu
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.minBookingPrice || ''}
            onChange={(e) => updateFormData({ minBookingPrice: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập giá trị đặt chỗ tối thiểu"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giới hạn sử dụng *
          </label>
          <input
            type="number"
            min="1"
            value={formData.usageLimit || ''}
            onChange={(e) => updateFormData({ usageLimit: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập giới hạn sử dụng"
          />
          {errors.usageLimit && <p className="text-red-500 text-sm mt-1">{errors.usageLimit}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian bắt đầu *
          </label>
          <input
            type="datetime-local"
            value={formData.validFrom || ''}
            onChange={(e) => updateFormData({ validFrom: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.validFrom && <p className="text-red-500 text-sm mt-1">{errors.validFrom}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian kết thúc *
          </label>
          <input
            type="datetime-local"
            value={formData.validUntil || ''}
            onChange={(e) => updateFormData({ validUntil: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.validUntil && <p className="text-red-500 text-sm mt-1">{errors.validUntil}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trạng thái
          </label>
          <select
            value={formData.status || 'active'}
            onChange={(e) => updateFormData({ status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Đang lưu...'
            : initialData
            ? 'Cập nhật'
            : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
};

export default PromotionForm;

