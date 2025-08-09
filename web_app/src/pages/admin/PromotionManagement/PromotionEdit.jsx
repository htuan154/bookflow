// src/pages/admin/PromotionManagement/PromotionEdit.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PromotionForm } from '../../../components/promotions';
import { usePromotions } from '../../../hooks/usePromotions';

const PromotionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPromotionDetails, currentPromotion, loading } = usePromotions();

  console.log('🎯 PromotionEdit component render - ID:', id);
  console.log('📄 Current promotion:', currentPromotion);
  console.log('🌐 Current URL:', window.location.pathname);

  useEffect(() => {
    if (id) {
      console.log('🔍 Đang tải thông tin khuyến mãi cho ID:', id);
      getPromotionDetails(id);
    }
  }, [id, getPromotionDetails]);

  const { updatePromotion } = usePromotions();

  const handleSubmit = async (formData) => {
    console.log('🎯 PromotionEdit.handleSubmit - STARTED', formData);
    try {
      console.log('Dữ liệu gửi lên cập nhật:', formData);
      const result = await updatePromotion(id, formData);
      console.log('Kết quả trả về từ backend:', result);
      alert('✅ Cập nhật khuyến mãi thành công!');
      navigate('/admin/promotions');
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật khuyến mãi:', error);
      alert('❌ Lỗi khi cập nhật khuyến mãi: ' + (error?.message || 'Không xác định'));
      return { success: false, error: error.message || 'Không xác định' };
    }
  };

  const handleCancel = () => {
    navigate('/admin/promotions');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
      </div>
    );
  }

  if (!currentPromotion) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center text-gray-500">Không tìm thấy khuyến mãi</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa khuyến mãi</h1>
        <p className="text-gray-600">Cập nhật thông tin khuyến mãi</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <PromotionForm
          initialData={currentPromotion}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default PromotionEdit;
