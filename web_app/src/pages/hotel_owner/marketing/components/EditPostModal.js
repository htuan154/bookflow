import React, { useState, useEffect } from 'react';
import { Archive, CheckCircle, Loader, XCircle } from 'lucide-react';
import ImageUrlDialog from './ImageUrlDialog';
import { getStatusColor, getStatusIcon, getStatusText } from './utils';
import blogService from '../../../../api/blog.service';

const EditPostModal = ({ show, blog, onClose, onSave }) => {
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    slug: '',
    excerpt: '',
    tags: '',
    metaDescription: '',
    status: 'draft'
  });
  const [editImages, setEditImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImageUrlDialog, setShowImageUrlDialog] = useState(false);

  useEffect(() => {
    if (show && blog) {
      // Initialize form
      setEditForm({
        title: blog.title || '',
        content: blog.content || '',
        slug: blog.slug || '',
        excerpt: blog.excerpt || '',
        tags: blog.tags || '',
        metaDescription: blog.metaDescription || blog.meta_description || '',
        status: blog.status || 'draft'
      });

      // Load images
      loadBlogImages(blog.blogId || blog.id);
    }
  }, [show, blog]);

  const loadBlogImages = async (blogId) => {
    try {
      const response = await blogService.getBlogImages(blogId);
      let imagesList = [];
      
      if (response && response.data && Array.isArray(response.data)) {
        imagesList = response.data;
      } else if (response && response.images && Array.isArray(response.images)) {
        imagesList = response.images;
      } else if (response && Array.isArray(response)) {
        imagesList = response;
      }

      const imagesData = imagesList.map((img) => ({
        imageId: img.id, // Assuming API returns id for image
        imageUrl: img.imageUrl || img.image_url || img.url,
        isFromDatabase: true
      })).filter(img => img.imageUrl);

      setEditImages(imagesData);
    } catch (error) {
      console.error('Error loading images:', error);
      setEditImages([]);
    }
  };

  const handleSave = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        slug: editForm.slug.trim() || null,
        excerpt: editForm.excerpt.trim() || null,
        tags: editForm.tags.trim() || null,
        meta_description: editForm.metaDescription.trim() || null,
        status: editForm.status,
        featured_image_url: editImages.length > 0 ? editImages[0].imageUrl : null
      };

      await onSave(blog.blogId || blog.id, updateData, editImages);
      // onClose is handled by parent after successful save
    } catch (error) {
      console.error('Error saving blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = (url) => {
    setEditImages(prev => [...prev, {
      imageId: null,
      imageUrl: url,
      isFromDatabase: false
    }]);
    setShowImageUrlDialog(false);
  };

  const handleRemoveImage = async (index) => {
    const imageData = editImages[index];
    
    // If it's from database, we might want to delete it immediately or mark for deletion
    // The original code deleted it immediately.
    if (imageData.isFromDatabase && imageData.imageId) {
      try {
        await blogService.deleteBlogImageById(imageData.imageId);
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Không thể xóa ảnh. Vui lòng thử lại!');
        return;
      }
    }
    
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!show || !blog) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Edit Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa bài viết</h2>
            <p className="text-sm text-gray-600 mt-1">ID: {blog.blogId || blog.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Edit Form */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập tiêu đề bài viết..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{editForm.title.length}/200 ký tự</p>
          </div>
          
          {/* Image Management */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Hình ảnh ({editImages.length})
              </label>
              <button
                type="button"
                onClick={() => setShowImageUrlDialog(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Thêm ảnh
              </button>
            </div>
            
            {/* Images Grid */}
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-80 overflow-y-auto">
              {editImages.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {editImages.map((imageData, index) => (
                    <div key={index} className="relative group bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 aspect-square">
                      <img 
                        src={imageData.imageUrl} 
                        alt={`Ảnh ${index + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSIjOTQ5NDk0IiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiIGZpbGw9IiM5NDk0OTQiLz4KPHBhdGggZD0ibTIxIDEwLTUgNUw5IDhsLTYgNiIgc3Ryb2tlPSIjOTQ5NDk0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                          e.target.className += ' p-2';
                        }}
                      />
                      
                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa ảnh"
                      >
                        ×
                      </button>
                      
                      {/* Image Index */}
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm font-medium mb-1">Chưa có ảnh nào</p>
                  <p className="text-xs">Nhấn "Thêm ảnh" để thêm ảnh từ URL</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nội dung *
            </label>
            <textarea
              value={editForm.content}
              onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Nhập nội dung bài viết..."
              rows={10}
            />
            <p className="text-xs text-gray-500 mt-1">{editForm.content.length} ký tự</p>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đường dẫn (Slug) <span className="text-gray-400 text-xs">(Tự động tạo nếu để trống)</span>
            </label>
            <input
              type="text"
              value={editForm.slug}
              onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="duong-dan-url (tự động tạo từ tiêu đề)"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tóm tắt
            </label>
            <textarea
              value={editForm.excerpt}
              onChange={(e) => setEditForm(prev => ({ ...prev, excerpt: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Viết tóm tắt ngắn gọn..."
              rows={3}
            />
          </div>

          {/* Tags and Meta Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="du lịch, khách sạn, resort"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
              <input
                type="text"
                value={editForm.metaDescription}
                onChange={(e) => setEditForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mô tả cho SEO"
              />
            </div>
          </div>
          
          {/* Status - Hiển thị trạng thái hiện tại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái hiện tại
            </label>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-2 rounded-md text-sm font-medium ${getStatusColor(editForm.status)}`}>
                {getStatusIcon(editForm.status)} {getStatusText(editForm.status)}
              </span>
            </div>
          </div>

          {/* Status Actions - Chuyển đổi trạng thái */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thay đổi trạng thái
            </label>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {/* Pending: Xuất bản hoặc Từ chối */}
              {editForm.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'published' }))}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Xuất bản
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'rejected' }))}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Từ chối
                  </button>
                </>
              )}
              
              {/* Published: Lưu trữ hoặc Từ chối */}
              {editForm.status === 'published' && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'archived' }))}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-colors flex items-center"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Lưu trữ
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'rejected' }))}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Từ chối
                  </button>
                </>
              )}
              
              {/* Archived: Xuất bản hoặc Từ chối */}
              {editForm.status === 'archived' && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'published' }))}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Xuất bản
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, status: 'rejected' }))}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Từ chối
                  </button>
                </>
              )}
              
              {/* Draft, Rejected: Không thể đổi */}
              {['draft', 'rejected'].includes(editForm.status) && (
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
                  ⚠️ Không thể thay đổi trạng thái từ {getStatusText(editForm.status)}
                </div>
              )}
            </div>
          </div>

        </div>
        
        {/* Edit Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !editForm.title.trim() || !editForm.content.trim()}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && <Loader className="h-4 w-4 animate-spin mr-2" />}
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <ImageUrlDialog
        show={showImageUrlDialog}
        onClose={() => setShowImageUrlDialog(false)}
        onAdd={handleAddImage}
      />
    </div>
  );
};

export default EditPostModal;
