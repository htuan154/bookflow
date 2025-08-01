// src/pages/admin/PromotionManagement/PromotionCreate.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PromotionForm } from '../../../components/promotions';

const PromotionCreate = () => {
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate('/admin/promotions');
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
        />
      </div>
    </div>
  );
};

export default PromotionCreate;