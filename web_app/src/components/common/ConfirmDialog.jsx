import React from 'react';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  onConfirm,
  onCancel,
  loading = false,
  type = 'warning' // warning, danger, info, success
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      borderColor: 'border-yellow-200'
    },
    danger: {
      icon: XCircleIcon,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      confirmBg: 'bg-red-600 hover:bg-red-700',
      borderColor: 'border-red-200'
    },
    info: {
      icon: InformationCircleIcon,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      borderColor: 'border-blue-200'
    },
    success: {
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      confirmBg: 'bg-green-600 hover:bg-green-700',
      borderColor: 'border-green-200'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md border-2 ${config.borderColor}`}>
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${config.iconBg} mr-4`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-gray-600">
            {typeof message === 'string' ? (
              <p>{message}</p>
            ) : (
              message
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${config.confirmBg} text-white px-6 py-2 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center`}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Đang xử lý...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;