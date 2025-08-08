import React, { useState} from 'react';
import promotionService from '../../../api/promotions.service';
import {
  PromotionList,
  PromotionFilters,
  PromotionModal,
  PromotionForm,
  PromotionDetails
} from '../../../components/promotions';
import { usePromotions } from '../../../hooks/usePromotions';

const PromotionManagement = () => {
  const {
    promotions,
    loading,
    error,
    fetchPromotions,
    pagination,
    updatePagination,
    createPromotion,
    updatePromotion
  } = usePromotions({ autoFetch: true });

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'create', 'edit', 'view'
    data: null
  });

  const openModal = (type, data = null) => {
    setModalState({ isOpen: true, type, data });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
  };

  const handleCreate = () => {
    openModal('create');
  };

  const handleEdit = (promotion) => {
    openModal('edit', promotion);
  };

  const handleView = (promotion) => {
    openModal('view', promotion);
  };

  const handleDelete = async (promotion) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khuyến mãi "${promotion.name}"?`)) {
      try {
        // Gọi API xoá khuyến mãi
        await promotionService.deletePromotion(promotion.promotionId);
        await fetchPromotions(); // Refresh after delete
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      console.log('📝 PromotionManagement.handleFormSubmit called với:', { type: modalState.type, formData });
      
      if (modalState.type === 'create') {
        console.log('➕ Tạo khuyến mãi mới');
        const result = await createPromotion(formData);
        console.log('✅ Kết quả tạo mới:', result);
        alert('✅ Tạo khuyến mãi thành công!');
      } else if (modalState.type === 'edit' && modalState.data?.promotionId) {
        console.log('✏️ Cập nhật khuyến mãi với ID:', modalState.data.promotionId);
        const result = await updatePromotion(modalState.data.promotionId, formData);
        console.log('✅ Kết quả cập nhật:', result);
        alert('✅ Cập nhật khuyến mãi thành công!');
      }
      
      closeModal();
      await fetchPromotions(); // Refresh list
      return { success: true };
    } catch (error) {
      console.error('❌ Lỗi trong handleFormSubmit:', error);
      alert('❌ Lỗi: ' + (error?.message || 'Không xác định'));
      return { success: false, error: error.message };
    }
  };

  const handlePageChange = (page) => {
    updatePagination({ currentPage: page });
  };

  const renderModalContent = () => {
    switch (modalState.type) {
      case 'create':
        return (
          <PromotionForm
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
          />
        );
      case 'edit':
        return (
          <PromotionForm
            initialData={modalState.data}
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
            isSubmitting={false}
          />
        );
      case 'view':
        return (
          <PromotionDetails promotionId={modalState.data?.promotionId} />
        );
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (modalState.type) {

      case 'view': return 'Chi tiết khuyến mãi';
      default: return '';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khuyến mãi</h1>
          <p className="text-gray-600">Quản lý các chương trình khuyến mãi và mã giảm giá cho khách sạn</p>
        </div>
      
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <PromotionFilters />
      </div>

      {/* Statistics Overview */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{promotions?.length || 0}</div>
          <div className="text-sm text-gray-500">Tổng số khuyến mãi</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {promotions?.filter(p => p.status === 'active').length || 0}
          </div>
          <div className="text-sm text-gray-500">Đang hoạt động</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {promotions?.filter(p => p.status === 'inactive').length || 0}
          </div>
          <div className="text-sm text-gray-500">Không hoạt động</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-red-600">
            {promotions?.filter(p => {
              const now = new Date();
              return new Date(p.validUntil) < now;
            }).length || 0}
          </div>
          <div className="text-sm text-gray-500">Đã hết hạn</div>
        </div>
      </div>

      {/* Promotions List */}
      <div className="mb-6">
        <PromotionList
          promotions={promotions}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            Trước
          </button>
          
          {[...Array(pagination.totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-3 py-2 text-sm rounded-md ${
                pagination.currentPage === index + 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
          >
            Tiếp
          </button>
        </div>
      )}

      {/* Modal */}
      <PromotionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={getModalTitle()}
      >
        {renderModalContent()}
      </PromotionModal>
    </div>
  );
};

export default PromotionManagement;