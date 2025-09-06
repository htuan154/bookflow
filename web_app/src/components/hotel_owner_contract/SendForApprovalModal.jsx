// src/pages/hotel_owner/contract_management/SendForApprovalModal.jsx
import React from 'react';

const SendForApprovalModal = ({ isOpen, onClose, onConfirm, contractTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 className="text-lg font-bold mb-4 text-blue-700">Gửi hợp đồng cho admin duyệt</h3>
        <p className="mb-4 text-gray-700">
          Bạn có chắc chắn muốn gửi hợp đồng <span className="font-semibold text-blue-600">{contractTitle}</span> cho admin duyệt không?
          Sau khi gửi, bạn sẽ không thể chỉnh sửa hoặc xóa hợp đồng này.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={onConfirm}
          >
            Gửi duyệt
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendForApprovalModal;