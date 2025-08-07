// src/pages/admin/PromotionManagement/PromotionCreate.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PromotionForm from '../../../components/promotions/PromotionForm';
import promotionService from '../../../api/promotions.service';

const PromotionCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);

      if (!promotionService || typeof promotionService.createPromotion !== 'function') {
        throw new Error('promotionService.createPromotion is not available');
      }
      
      const result = await promotionService.createPromotion(formData);

      const isSuccess = result && (
        result.success === true || 
        result.httpStatus === 200 || 
        result.httpStatus === 201 ||
        result.status === 'success' ||
        (result.data && typeof result.data === 'object')
      );

      if (isSuccess) {
        alert('✅ Tạo khuyến mãi thành công!');
        navigate('/admin/promotions');
        
        return {
          success: true,
          data: result,
          message: 'Khuyến mãi đã được tạo thành công!'
        };
      } else {
        throw new Error(result?.message || 'API response indicates failure');
      }
      
    } catch (error) {
      if (error.response) {
        const serverError = error.response.data;
        const errorMessage = serverError?.message || 
                            serverError?.error || 
                            serverError?.details ||
                            `HTTP ${error.response.status}: ${error.response.statusText}`;
        
        alert(`❌ Lỗi server (${error.response.status}): ${errorMessage}`);
        
      } else if (error.request) {
        alert('❌ Lỗi mạng: Không thể kết nối tới server');
        
      } else {
        alert(`❌ Lỗi: ${error.message}`);
      }
      
      throw error;
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/promotions');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tạo khuyến mãi mới</h1>
        <p className="text-gray-600">Tạo mã khuyến mãi mới cho khách sạn của bạn</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <PromotionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default PromotionCreate;