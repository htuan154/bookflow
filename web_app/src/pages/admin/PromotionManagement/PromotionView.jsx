// src/pages/admin/PromotionManagement/PromotionView.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PromotionDetails, PromotionStats } from '../../../components/promotions';
import { usePromotions } from '../../../hooks/usePromotions';

const PromotionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPromotionDetails, currentPromotion, loading } = usePromotions();

  useEffect(() => {
    if (id) {
      getPromotionDetails(id);
    }
  }, [id, getPromotionDetails]);

  const handleEdit = () => {
    navigate(`/admin/promotions/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/admin/promotions');
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
      </div>
    );
  }

  if (!currentPromotion) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center text-gray-500">Không tìm thấy khuyến mãi</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentPromotion.name}</h1>
          <p className="text-gray-600">Mã khuyến mãi: {currentPromotion.code}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Chỉnh sửa
          </button>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6">
        <PromotionStats promotionId={id} />
      </div>

      {/* Details */}
      <PromotionDetails promotionId={id} />
    </div>
  );
};

export default PromotionView;