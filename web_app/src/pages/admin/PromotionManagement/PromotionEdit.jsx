// src/pages/admin/PromotionManagement/PromotionEdit.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PromotionForm } from '../../../components/promotions';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../../components/common/Toast';
import { usePromotions } from '../../../hooks/usePromotions';

const PromotionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPromotionDetails, currentPromotion, loading, updatePromotion } = usePromotions({ autoFetch: false });
  const { toasts, removeToast, showSuccess, showError } = useToast();

  console.log('🎯 PromotionEdit component render - ID:', id);
  console.log('📄 Current promotion:', currentPromotion);
  console.log('🌐 Current URL:', window.location.pathname);

  useEffect(() => {
    if (id) {
      console.log('🔍 Đang tải thông tin khuyến mãi cho ID:', id);
      getPromotionDetails(id);
    }
  }, [id, getPromotionDetails]);

  const handleSubmit = async (formData) => {
    console.log('🎯 PromotionEdit.handleSubmit - STARTED', formData);
    try {
      console.log('Dữ liệu gửi lên cập nhật:', formData);
      const result = await updatePromotion(id, formData);
      console.log('Kết quả trả về từ backend:', result);
      showSuccess(
        'Cập nhật thành công!',
        'Thông tin khuyến mãi đã được cập nhật.'
      );
      
      // Delay navigation để user thấy thông báo
      setTimeout(() => {
        navigate('/admin/promotions');
      }, 1500);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật khuyến mãi:', error);
      showError(
        'Cập nhật thất bại!',
        error?.message || 'Có lỗi xảy ra khi cập nhật khuyến mãi.'
      );
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

  // Kiểm tra nếu là room_specific thì không cho phép chỉnh sửa
  const isRoomSpecific = currentPromotion.promotionType === 'room_specific' || 
                         currentPromotion.promotion_type === 'room_specific';

  if (isRoomSpecific) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-amber-800">
                Không thể chỉnh sửa khuyến mãi này
              </h3>
              <p className="mt-2 text-amber-700">
                Khuyến mãi loại "Theo phòng" không thể chỉnh sửa trực tiếp. 
                Vui lòng sử dụng chức năng quản lý chi tiết khuyến mãi để thay đổi thông tin.
              </p>
              <div className="mt-4">
                <button
                  onClick={handleCancel}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                >
                  Quay lại danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
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

      {/* Toast Container */}
      
    </div>
  );
};

export default PromotionEdit;
