// src/pages/admin/AmenityManagement/AmenityCreateModal.js
import React, { useState } from 'react';
import { X } from 'lucide-react';
import useAmenity from '../../../hooks/useAmenity';

const AmenityCreateModal = ({ onClose, onSuccess }) => {
  const { createAmenity, localLoading } = useAmenity();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    iconUrl: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên tiện nghi');
      return;
    }

    try {
      await createAmenity({
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon_url: formData.iconUrl.trim()
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Lỗi khi tạo tiện nghi');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">Thêm tiện nghi mới</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên tiện nghi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ví dụ: WiFi miễn phí"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Mô tả chi tiết về tiện nghi..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Icon
              </label>
              <input
                type="url"
                name="iconUrl"
                value={formData.iconUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://example.com/icon.png"
              />
              {formData.iconUrl && (
                <div className="mt-2">
                  <img
                    src={formData.iconUrl}
                    alt="Preview"
                    className="w-12 h-12 object-contain border border-gray-200 rounded p-1"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={localLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              disabled={localLoading}
            >
              {localLoading ? 'Đang tạo...' : 'Tạo tiện nghi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AmenityCreateModal;
