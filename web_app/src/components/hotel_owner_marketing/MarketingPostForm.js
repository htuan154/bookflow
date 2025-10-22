import React, { useState } from 'react';
import { FiImage, FiVideo, FiMapPin, FiTag } from 'react-icons/fi';

const MarketingPostForm = ({ hotels = [], onSubmit }) => {
  const [postData, setPostData] = useState({
    content: '',
    images: [],
    selectedHotel: '',
    postType: 'general', // general, promotion, event
    tags: []
  });

  const [previewImages, setPreviewImages] = useState([]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setPostData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImages(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPostData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(postData);
    // Reset form
    setPostData({
      content: '',
      images: [],
      selectedHotel: '',
      postType: 'general',
      tags: []
    });
    setPreviewImages([]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
          <FiTag className="text-orange-600 text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Tạo bài viết mới</h3>
          <p className="text-sm text-gray-500">Chia sẻ thông tin về khách sạn của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hotel Selection */}
        {hotels.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn khách sạn
            </label>
            <select
              value={postData.selectedHotel}
              onChange={(e) => setPostData(prev => ({ ...prev, selectedHotel: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              required
            >
              <option value="">Chọn khách sạn...</option>
              {hotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Post Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại bài viết
          </label>
          <div className="flex space-x-4">
            {[
              { value: 'general', label: 'Giới thiệu chung', icon: '📝' },
              { value: 'promotion', label: 'Khuyến mãi', icon: '🎉' },
              { value: 'event', label: 'Sự kiện', icon: '🎊' }
            ].map(type => (
              <label key={type.value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="postType"
                  value={type.value}
                  checked={postData.postType === type.value}
                  onChange={(e) => setPostData(prev => ({ ...prev, postType: e.target.value }))}
                  className="sr-only"
                />
                <div className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  postData.postType === type.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <textarea
            value={postData.content}
            onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Bạn muốn chia sẻ điều gì về khách sạn..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-colors"
            rows="4"
            required
          />
        </div>

        {/* Image Preview */}
        {previewImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {previewImages.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <label className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
              <FiImage className="mr-2" />
              Hình ảnh
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FiVideo className="mr-2" />
              Video
            </button>
            <button
              type="button"
              className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FiMapPin className="mr-2" />
              Vị trí
            </button>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            Đăng bài
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarketingPostForm;