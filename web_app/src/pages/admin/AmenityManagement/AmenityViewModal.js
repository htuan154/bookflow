// src/pages/admin/AmenityManagement/AmenityViewModal.js
import React from 'react';
import { X, Edit2 } from 'lucide-react';

const AmenityViewModal = ({ amenity, onClose, onEdit }) => {
  if (!amenity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Chi tiết tiện nghi</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Icon */}
          {amenity.iconUrl && (
            <div className="flex justify-center">
              <img
                src={amenity.iconUrl}
                alt={amenity.name}
                className="w-24 h-24 object-contain border border-gray-200 rounded-lg p-2"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/96?text=Icon';
                }}
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tên tiện nghi
            </label>
            <p className="text-lg font-semibold text-gray-900">{amenity.name}</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Mô tả
            </label>
            <p className="text-gray-700">{amenity.description || 'Không có mô tả'}</p>
          </div>

          {/* Icon URL */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              URL Icon
            </label>
            <p className="text-sm text-gray-600 break-all">
              {amenity.iconUrl || 'Không có'}
            </p>
          </div>

          {/* Amenity ID */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              ID
            </label>
            <p className="text-sm text-gray-600 font-mono break-all">
              {amenity.amenityId}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Edit2 size={16} />
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmenityViewModal;
