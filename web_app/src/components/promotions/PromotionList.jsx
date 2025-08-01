// src/components/promotions/PromotionList.jsx
import React from 'react';
import PromotionCard from './PromotionCard';

const PromotionList = ({ 
  promotions, 
  loading, 
  onEdit, 
  onDelete, 
  onView, 
  emptyMessage = "Không tìm thấy khuyến mãi nào"
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {promotions.map((promotion) => (
        <PromotionCard
          key={promotion.promotionId}
          promotion={promotion}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
};

export default PromotionList;