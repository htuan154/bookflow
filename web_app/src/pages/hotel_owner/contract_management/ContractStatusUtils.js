// src/pages/hotel_owner/contract_management/ContractStatusUtils.js

/**
 * Kiểm tra quyền CRUD của hotel owner dựa vào trạng thái hợp đồng
 * @param {string} status - Trạng thái hợp đồng
 * @returns {object} - Các quyền
 */
export const getHotelOwnerPermissions = (status) => {
  switch (status) {
    case 'draft':
      return {
        canEdit: true,
        canDelete: true,
        canSendForApproval: true,
        canView: true
      };
    case 'pending':
    case 'active':
    case 'expired':
    case 'terminated':
    case 'cancelled':
      return {
        canEdit: false,
        canDelete: false,
        canSendForApproval: false,
        canView: true
      };
    default:
      return {
        canEdit: false,
        canDelete: false,
        canSendForApproval: false,
        canView: true
      };
  }
};

/**
 * Lấy nhãn trạng thái hợp đồng
 */
export const getContractStatusLabel = (status) => {
  const statusLabels = {
    draft: { label: 'Nháp', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    pending: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    active: { label: 'Hiệu lực', color: 'bg-green-100 text-green-800 border-green-300' },
    expired: { label: 'Hết hạn', color: 'bg-red-100 text-red-800 border-red-300' },
    terminated: { label: 'Chấm dứt', color: 'bg-red-100 text-red-800 border-red-300' },
    cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800 border-gray-300' }
  };
  
  return statusLabels[status] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-800' };
};

