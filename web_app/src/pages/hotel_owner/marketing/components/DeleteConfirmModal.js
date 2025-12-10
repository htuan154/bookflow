import React from 'react';
import { XCircle } from 'lucide-react';

const DeleteConfirmModal = ({ blog, onConfirm, onCancel, message, confirmText = 'Xóa' }) => {
  if (!blog) return null;

  const blogTitle = blog?.title || 'bài viết này';
  const displayMessage = message || `Bạn có chắc chắn muốn xóa bài viết "${blogTitle}"? Hành động này không thể hoàn tác.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <XCircle className="h-6 w-6 text-red-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Xác nhận</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          {displayMessage}
        </p>
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
