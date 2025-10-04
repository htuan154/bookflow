// src/components/promotions/EditPromotionDetailModal.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import PromotionService from '../../api/promotions.service';
import { useToast, ToastContainer } from '../common/Toast';

const EditPromotionDetailModal = ({ isOpen, onClose, selectedHotel, promotion, promotionDetails = [], onSuccess }) => {
  const [details, setDetails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { toasts, removeToast, showSuccess, showError } = useToast();

  // Debug log
  console.log('🔍 showDeleteConfirm state:', showDeleteConfirm);
  console.log('🔍 details length:', details.length);

  // Initialize details when modal opens
  useEffect(() => {
    if (isOpen && promotionDetails.length > 0) {
      console.log('Initializing edit modal with details:', promotionDetails);
      const initialDetails = promotionDetails.map(detail => ({
        detailId: detail.detailId,
        room_type_id: detail.roomTypeId || detail.room_type_id,
        room_type_name: detail.roomTypeName || detail.room_type_name || `Room Type ${detail.roomTypeId}`,
        discount_type: detail.discountType || detail.discount_type,
        discount_value: detail.discountValue || detail.discount_value,
        isModified: false,
        isDeleted: false
      }));
      setDetails(initialDetails);
    }
  }, [isOpen, promotionDetails]);

  const handleDetailChange = (index, field, value) => {
    const updatedDetails = [...details];
    
    if (field === 'discount_type') {
      // When changing discount type, set appropriate default value
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value,
        discount_value: value === 'percentage' ? (promotion?.discountValue || '') : '',
        isModified: true
      };
    } else if (field === 'discount_value' && updatedDetails[index].discount_type === 'fixed_amount') {
      // For fixed_amount, validate against max_discount_amount
      const maxAmount = promotion?.maxDiscountAmount || Infinity;
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        updatedDetails[index] = {
          ...updatedDetails[index],
          [field]: value,
          isModified: true
        };
      } else if (numValue > maxAmount) {
        // If value exceeds max, set to max amount
        updatedDetails[index] = {
          ...updatedDetails[index],
          [field]: maxAmount.toString(),
          isModified: true
        };
      } else {
        updatedDetails[index] = {
          ...updatedDetails[index],
          [field]: value,
          isModified: true
        };
      }
    } else {
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value,
        isModified: true
      };
    }
    
    setDetails(updatedDetails);
  };

  const handleDeleteDetail = (index) => {
    console.log('🗑️ Delete button clicked for index:', index);
    console.log('🗑️ Detail to delete:', details[index]);
    setShowDeleteConfirm(index);
    console.log('🗑️ showDeleteConfirm set to:', index);
  };

  const confirmDelete = (index) => {
    const updatedDetails = [...details];
    updatedDetails[index] = {
      ...updatedDetails[index],
      isDeleted: true,
      isModified: true
    };
    setDetails(updatedDetails);
    setShowDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const restoreDetail = (index) => {
    const updatedDetails = [...details];
    updatedDetails[index] = {
      ...updatedDetails[index],
      isDeleted: false,
      isModified: true
    };
    setDetails(updatedDetails);
  };

  const getActiveDetails = () => {
    return details.filter(detail => 
      !detail.isDeleted && 
      detail.discount_value && 
      parseFloat(detail.discount_value) > 0
    );
  };

  const getModifiedDetails = () => {
    return details.filter(detail => detail.isModified);
  };

  const isFormValid = () => {
    const modifiedDetails = getModifiedDetails();
    return modifiedDetails.length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const modifiedDetails = getModifiedDetails();
      
      // Separate updates and deletes
      const detailsToUpdate = modifiedDetails.filter(detail => !detail.isDeleted);
      const detailsToDelete = modifiedDetails.filter(detail => detail.isDeleted);

      console.log('Details to update:', detailsToUpdate);
      console.log('Details to delete:', detailsToDelete);

      // Handle deletions first (individual API calls)
      for (const detail of detailsToDelete) {
        await PromotionService.deletePromotionDetail(promotion.promotionId, detail.detailId);
      }

      // Handle bulk updates if there are any
      let updateResponse = null;
      if (detailsToUpdate.length > 0) {
        const bulkUpdateData = {
          details: detailsToUpdate.map(detail => ({
            detailId: detail.detailId,
            room_type_id: detail.room_type_id,
            discount_type: detail.discount_type,
            discount_value: parseFloat(detail.discount_value)
          }))
        };

        console.log('Bulk updating promotion details:', bulkUpdateData);
        updateResponse = await PromotionService.bulkUpdatePromotionDetails(promotion.promotionId, bulkUpdateData);
      }

      const response = updateResponse || { success: true };

      if (response) {
        const updateCount = detailsToUpdate.length;
        const deleteCount = detailsToDelete.length;
        
        let message = '';
        if (updateCount > 0 && deleteCount > 0) {
          message = `Đã cập nhật ${updateCount} và xóa ${deleteCount} chi tiết khuyến mãi.`;
        } else if (updateCount > 0) {
          message = `Đã cập nhật ${updateCount} chi tiết khuyến mãi.`;
        } else if (deleteCount > 0) {
          message = `Đã xóa ${deleteCount} chi tiết khuyến mãi.`;
        }

        showSuccess('Cập nhật thành công!', message);

        // Call success callback
        if (onSuccess) {
          onSuccess(response);
        }

        // Close modal after delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }

    } catch (error) {
      console.error('Error updating promotion details:', error);
      const errorMessage = error?.message || 'Có lỗi xảy ra khi cập nhật chi tiết khuyến mãi';
      showError('Cập nhật thất bại!', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Delete Confirmation Modal Component
  const DeleteConfirmationModal = () => {
    if (showDeleteConfirm === null) return null;
    
    return ReactDOM.createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{zIndex: 10000}}>
        <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Bạn có chắc chắn muốn xóa chi tiết khuyến mãi cho "{details[showDeleteConfirm]?.room_type_name}"?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={cancelDelete}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => confirmDelete(showDeleteConfirm)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (!isOpen) return null;

  const activeDetails = getActiveDetails();
  const modifiedCount = getModifiedDetails().length;

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa chi tiết khuyến mãi</h2>
              <p className="text-gray-600 mt-1">
                Khuyến mãi: <span className="font-medium">{promotion?.name || 'N/A'}</span>
              </p>
              <p className="text-gray-600">
                Khách sạn: <span className="font-medium">{selectedHotel?.name || 'N/A'}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">Hướng dẫn chỉnh sửa</h4>
                    <div className="text-sm text-blue-700 mt-1">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Thay đổi loại giảm giá và giá trị cho từng loại phòng</li>
                        <li>Nhấn nút xóa để loại bỏ chi tiết khuyến mãi</li>
                        <li>Có thể chuyển đổi giữa phần trăm và số tiền cố định</li>
                        <li>Phải có ít nhất một chi tiết còn lại sau khi lưu</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Types List */}
              <div className="space-y-4">
                {details.map((detail, index) => (
                  <div
                    key={detail.detailId}
                    className={`border rounded-lg p-4 transition-all ${
                      detail.isDeleted 
                        ? 'border-red-300 bg-red-50 opacity-50' 
                        : detail.isModified 
                          ? 'border-yellow-300 bg-yellow-50' 
                          : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h4 className={`font-medium ${
                          detail.isDeleted ? 'text-red-600 line-through' : 'text-gray-900'
                        }`}>
                          {detail.room_type_name}
                        </h4>
                        {detail.isModified && !detail.isDeleted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Đã thay đổi
                          </span>
                        )}
                        {detail.isDeleted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Sẽ xóa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {detail.isDeleted ? (
                          <button
                            type="button"
                            onClick={() => restoreDetail(index)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Khôi phục
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteDetail(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Xóa chi tiết này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {!detail.isDeleted && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Discount Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Loại giảm giá
                          </label>
                          <select
                            value={detail.discount_type}
                            onChange={(e) => handleDetailChange(index, 'discount_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="percentage">Phần trăm (%)</option>
                            <option value="fixed_amount">Số tiền cố định (VND)</option>
                          </select>
                        </div>

                        {/* Discount Value */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Giá trị giảm
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={detail.discount_value}
                              onChange={(e) => handleDetailChange(index, 'discount_value', e.target.value)}
                              disabled={detail.discount_type === 'percentage'}
                              min="0"
                              step={detail.discount_type === 'percentage' ? '0.01' : '1000'}
                              max={detail.discount_type === 'percentage' ? '100' : promotion?.maxDiscountAmount}
                              className={`w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                detail.discount_type === 'percentage' 
                                  ? 'bg-gray-100 cursor-not-allowed' 
                                  : ''
                              }`}
                              placeholder={detail.discount_type === 'percentage' ? 'Tự động từ khuyến mãi' : '500000'}
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              <span className="text-gray-500 text-sm">
                                {detail.discount_type === 'percentage' ? '%' : 'VND'}
                              </span>
                            </div>
                          </div>
                          {detail.discount_type === 'percentage' ? (
                            <p className="text-xs text-blue-600 mt-1">
                              Giá trị lấy từ khuyến mãi: {promotion?.discountValue || 0}%
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              Tối đa: {formatCurrency(promotion?.maxDiscountAmount || 0)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              {activeDetails.length > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-6">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    Tóm tắt ({activeDetails.length} chi tiết còn lại)
                  </h4>
                  <div className="space-y-1">
                    {activeDetails.map((detail) => (
                      <div key={detail.detailId} className="text-sm text-green-700 flex justify-between">
                        <span>{detail.room_type_name}</span>
                        <span className="font-medium">
                          {detail.discount_type === 'percentage' 
                            ? `${detail.discount_value}%`
                            : formatCurrency(parseFloat(detail.discount_value))
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting || modifiedCount === 0}
                  className={`px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                    isFormValid() && !isSubmitting && modifiedCount > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Đang cập nhật hàng loạt...' : `Cập nhật hàng loạt (${modifiedCount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>


      
      <DeleteConfirmationModal />
    </>
  );
};

export default EditPromotionDetailModal;