import React, { useState, useEffect } from 'react';
import { FiImage } from 'react-icons/fi';
import { USER_ROLES } from '../../../../config/roles';

const CreatePostModal = ({ 
  show, 
  onClose, 
  onSubmit, 
  loading, 
  selectedHotel,
  user 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [slug, setSlug] = useState('');
  const [tags, setTags] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [blogImages, setBlogImages] = useState([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [blogImageUrl, setBlogImageUrl] = useState('');
  const [currentHotel, setCurrentHotel] = useState(selectedHotel);

  useEffect(() => {
    if (show) {
      setCurrentHotel(selectedHotel);
    }
  }, [selectedHotel, show]);

  if (!show) return null;

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !currentHotel) {
      // Validation handled by parent or show error here
      // For now, we'll let parent handle notification, but we should validate here too
      // or pass a callback to show notification
      return;
    }

    // Auto-generate slug if not provided
    const finalSlug = slug.trim() || title.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const initialStatus = user?.roleId === USER_ROLES.HOTEL_STAFF ? 'draft' : 'pending';

    const blogData = {
      hotel_id: currentHotel,
      title: title.trim(),
      slug: finalSlug,
      content: content.trim(),
      excerpt: excerpt.trim() || null,
      tags: tags.trim() || null,
      meta_description: metaDescription.trim() || null,
      featured_image_url: thumbnail || null,
      status: initialStatus,
      author_id: user?.userId || user?.id || user?.user_id,
      blog_images: blogImages.map((url, index) => ({
        image_url: url,
        order_index: index,
        caption: ''
      }))
    };

    // The parent component seems to expect `allImages`, so we reconstruct it
    // even though it seems redundant with the data in `blogData`.
    const allImages = [];
    if (thumbnail) allImages.push(thumbnail);
    allImages.push(...blogImages);

    onSubmit(blogData, allImages);
    
    // Reset form is handled by parent closing the modal, 
    // but we can also reset here if we want to keep modal open (not the case here)
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setExcerpt('');
    setSlug('');
    setTags('');
    setMetaDescription('');
    setThumbnail(null);
    setBlogImages([]);
    setThumbnailUrl('');
    setBlogImageUrl('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Tạo bài viết mới</h3>
          <button 
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề bài viết</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết nội dung bài viết của bạn..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="6"
              required
            />
          </div>

          {/* Slug Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đường dẫn (Slug) <span className="text-gray-400 text-xs">(Tự động tạo nếu để trống)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="duong-dan-url (tự động tạo từ tiêu đề)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Excerpt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tóm tắt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Viết tóm tắt ngắn gọn..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
          </div>

          {/* Tags and Meta Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="du lịch, khách sạn, resort"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
              <input
                type="text"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Mô tả cho SEO"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Thumbnail Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh đại diện (Thumbnail)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {thumbnail ? (
                <div className="relative">
                  <img 
                    src={thumbnail} 
                    alt="Thumbnail" 
                    className="w-full h-48 object-cover rounded"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnail(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiImage className="mx-auto text-gray-400 text-4xl mb-2" />
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Nhập URL ảnh đại diện..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (thumbnailUrl.trim()) {
                        setThumbnail(thumbnailUrl.trim());
                        setThumbnailUrl('');
                      }
                    }}
                    disabled={!thumbnailUrl.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Thêm ảnh đại diện
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Blog Images Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ảnh bài viết (Blog Images) - Có thể thêm nhiều ảnh
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {/* Add Image Input */}
              <div className="mb-4">
                <input
                  type="url"
                  value={blogImageUrl}
                  onChange={(e) => setBlogImageUrl(e.target.value)}
                  placeholder="Nhập URL ảnh bài viết..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (blogImageUrl.trim()) {
                      setBlogImages(prev => [...prev, blogImageUrl.trim()]);
                      setBlogImageUrl('');
                    }
                  }}
                  disabled={!blogImageUrl.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  + Thêm ảnh
                </button>
              </div>

              {/* Images Grid */}
              {blogImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {blogImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img} 
                        alt={`Blog ${index + 1}`} 
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Invalid'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setBlogImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all text-xs"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiImage className="mx-auto text-4xl mb-2" />
                  <p className="text-sm">Chưa có ảnh nào</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          {!currentHotel && (
            <p className="text-xs text-red-600 mr-auto font-medium">
              Vui lòng chọn một khách sạn để tạo bài viết.
            </p>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim() || !currentHotel}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? 'Đang tạo...' : 'Tạo bài viết'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { CreatePostModal };
