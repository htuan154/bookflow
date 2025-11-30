import React, { useState, useEffect } from 'react';

const ImageUrlDialog = ({ show, onClose, onAdd, initialUrl = '' }) => {
  const [imageUrl, setImageUrl] = useState(initialUrl);

  useEffect(() => {
    setImageUrl(initialUrl);
  }, [initialUrl, show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm ảnh từ URL</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL ảnh
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Nhập URL ảnh (ví dụ: https://example.com/image.jpg)"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
        
        {/* Preview */}
        {imageUrl && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
            <img 
              src={imageUrl} 
              alt="Preview" 
              className="w-full h-32 object-cover rounded border"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setImageUrl('');
              onClose();
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              if (imageUrl.trim()) {
                onAdd(imageUrl.trim());
                setImageUrl('');
              }
            }}
            disabled={!imageUrl.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Thêm ảnh
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUrlDialog;
