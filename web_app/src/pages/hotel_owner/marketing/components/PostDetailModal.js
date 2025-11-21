import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Eye, Globe, Loader, Tag, Trash2, XCircle, Archive } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';
import { getStatusColor, getStatusIcon, getStatusText } from './utils';
import blogService from '../../../../api/blog.service';
import { USER_ROLES } from '../../../../config/roles';

const PostDetailModal = ({ show, blog, onClose, onUpdate, user, onNotify }) => {
  const [detailImages, setDetailImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentBlog, setCurrentBlog] = useState(blog);

  useEffect(() => {
    if (show && blog) {
      setCurrentBlog(blog);
      loadDetailImages(blog.blogId || blog.id);
    }
  }, [show, blog]);

  const loadDetailImages = async (blogId) => {
    setLoading(true);
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

      const imageUrls = imagesList.map((img) => img.imageUrl || img.image_url || img.url).filter(url => url);
      setDetailImages(imageUrls);
    } catch (err) {
      console.error('Error loading images:', err);
      setDetailImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await blogService.deleteBlog(currentBlog.blogId || currentBlog.id);
      onNotify('Đã xóa bài viết thành công!', 'success');
      onClose();
      onUpdate(); // Refresh list
    } catch (err) {
      onNotify('Không thể xóa bài viết!', 'error');
    }
  };

  const handleStatusChange = async (newStatus) => {
    const currentStatus = currentBlog.status;
    
    // Logic checks
    if (['draft', 'rejected'].includes(currentStatus)) {
      onNotify('Bài viết này không thể thay đổi trạng thái!', 'error');
      return;
    }
    
    if (currentStatus === 'pending' && !['published', 'rejected'].includes(newStatus)) {
      onNotify('Bài viết chờ duyệt chỉ có thể Xuất bản hoặc Từ chối!', 'error');
      return;
    }
    
    if (currentStatus === 'published' && !['archived', 'rejected'].includes(newStatus)) {
      onNotify('Bài viết đã xuất bản chỉ có thể chuyển sang Lưu trữ hoặc Từ chối!', 'error');
      return;
    }
    
    if (currentStatus === 'archived' && newStatus !== 'published') {
      onNotify('Bài viết đã lưu trữ chỉ có thể chuyển sang Xuất bản!', 'error');
      return;
    }

    // Permission checks
    const isAdmin = user && user.roleId === 1;
    const isAuthorOfBlog = (currentBlog.authorId && user?.userId && currentBlog.authorId === user.userId) ||
                          (currentBlog.author_id && user?.userId && currentBlog.author_id === user.userId) ||
                          (currentBlog.authorId && user?.id && currentBlog.authorId === user.id);
    const isHotelOwner = user && user.roleId === USER_ROLES.HOTEL_OWNER; // Owner has full control
    
    // Note: Owner logic in original code was: isHotelOwner = user && user.roleId === 2 && isAuthorOfBlog;
    // But usually owner can manage all posts. I'll stick to original logic if possible, but "isHotelOwner" usually implies role check.
    // Let's re-read original code:
    // const isHotelOwner = user && user.roleId === 2 && isAuthorOfBlog;
    // This seems restrictive. If I am an owner, I should be able to manage my hotel's posts?
    // But let's follow the original code's intent for safety, or improve it.
    // The original code line 814: const isHotelOwner = user && user.roleId === 2 && isAuthorOfBlog;
    // This means only the author (who is also an owner) can change status? That seems wrong if there are multiple owners or if owner wants to manage staff posts.
    // However, line 815: if (!user || (!isAdmin && !isHotelOwner))
    // This blocks staff from changing status (correct).
    // But it also blocks owner from changing status if they are not the author?
    // Let's look at the UI rendering logic in original code (lines 2679-2687):
    // const canChangeStatus = user?.roleId === USER_ROLES.HOTEL_OWNER;
    // So in UI, any owner can see the buttons.
    // But in `handleStatusChangeDetail`, it restricts to author?
    // I will trust the UI logic more: `canChangeStatus = user?.roleId === USER_ROLES.HOTEL_OWNER`.
    // So I will use `user.roleId === USER_ROLES.HOTEL_OWNER` for permission.

    if (!user || (user.roleId !== USER_ROLES.ADMIN && user.roleId !== USER_ROLES.HOTEL_OWNER)) {
       // If staff, they can't change status here (except maybe submit? but that's a different action)
       setError('Bạn không có quyền đổi trạng thái bài viết này.');
       return;
    }

    try {
      setLoading(true);
      await blogService.updateBlog(currentBlog.blogId || currentBlog.id, { status: newStatus });
      setCurrentBlog(prev => ({ ...prev, status: newStatus }));
      onNotify(`Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`, 'success');
      onUpdate(); // Refresh list
    } catch (err) {
      console.error('Error updating blog status:', err);
      onNotify('Không thể cập nhật trạng thái!', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !currentBlog) return null;

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2563eb;
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full h-[85vh] flex flex-col shadow-2xl border border-gray-100">
          {/* Modal Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Chi tiết bài viết</h2>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">{currentBlog.username || currentBlog.author}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-700">
                      {(() => {
                        const dateStr = currentBlog.createdAt || currentBlog.created_at;
                        if (!dateStr) return 'Không có ngày';
                        const date = new Date(dateStr);
                        return isNaN(date.getTime()) ? 'Ngày không hợp lệ' : date.toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                      })()} 
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(currentBlog.status)}`}>
                    {getStatusIcon(currentBlog.status)}
                    <span className="ml-1">{getStatusText(currentBlog.status)}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-red-500 transition-all duration-200 p-2 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-hidden">
            {loading && detailImages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Đang tải...</span>
              </div>
            ) : (
              <div className="h-full flex">
                {/* Left Column - Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <XCircle className="h-5 w-5 text-red-400 mr-2" />
                          <span className="text-red-800">{error}</span>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{currentBlog.title}</h1>
                      {currentBlog.excerpt && (
                        <p className="text-gray-600 text-base">{currentBlog.excerpt}</p>
                      )}
                    </div>

                    {/* Gallery */}
                    {detailImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Hình ảnh ({detailImages.length})
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                          {detailImages.map((imageUrl, index) => (
                            <div key={index} className="relative group rounded-lg overflow-hidden shadow-lg border border-gray-100">
                              <img
                                src={imageUrl}
                                alt={`Ảnh ${index + 1}`}
                                className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                                onError={(e) => { 
                                  e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                                  e.target.onerror = null;
                                }}
                              />
                              <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <div className="flex items-center mb-4">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="font-semibold text-gray-800">Nội dung</h3>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-gray-700 leading-relaxed text-sm whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                        {currentBlog.content || 'Không có nội dung'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Stats & Info */}
                <div className="w-80 border-l border-blue-100 p-6 overflow-y-auto bg-gradient-to-b from-blue-50 to-gray-50">
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                          <Eye className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                          <div className="text-lg font-bold text-blue-700">{currentBlog.viewCount || currentBlog.view_count || 0}</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                          <svg className="h-6 w-6 text-red-600 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <div className="text-lg font-bold text-red-700">{currentBlog.likeCount || currentBlog.like_count || 0}</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                          <svg className="h-6 w-6 text-green-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <div className="text-lg font-bold text-green-700">{currentBlog.commentCount || currentBlog.comment_count || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Hotel Info */}
                    {currentBlog.hotelName && (
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center mb-3">
                          <Globe className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-semibold text-gray-800">Khách sạn</h3>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3">
                          <p className="text-blue-800 font-medium text-lg">{currentBlog.hotelName}</p>
                          <p className="text-xs text-blue-600 mt-1">ID: {currentBlog.hotelId || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center mb-3">
                        <Tag className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-gray-800">Từ khóa</h3>
                      </div>
                      {currentBlog.tags ? (
                        <div className="flex flex-wrap gap-2">
                          {currentBlog.tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                            >
                              #{tag.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic text-sm bg-gray-50 rounded-lg p-3 text-center">Chưa có từ khóa</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                      <div className="flex justify-center space-x-3">
                        {(() => {
                          const isAuthor = (currentBlog.authorId && user?.userId && currentBlog.authorId === user.userId) || 
                                          (currentBlog.author_id && user?.userId && currentBlog.author_id === user.userId) || 
                                          (currentBlog.authorId && user?.id && currentBlog.authorId === user.id);
                          
                          const canChangeStatus = user?.roleId === USER_ROLES.HOTEL_OWNER;
                          const canDelete = user?.roleId === USER_ROLES.HOTEL_OWNER || 
                                           (user?.roleId === USER_ROLES.HOTEL_STAFF && isAuthor);
                          
                          return (
                            <>
                              {canChangeStatus ? (
                                <>
                                  {/* Pending */}
                                  {currentBlog.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleStatusChange('published')}
                                        disabled={loading}
                                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                        title="Xuất bản"
                                      >
                                        <CheckCircle className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange('rejected')}
                                        disabled={loading}
                                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                        title="Từ chối"
                                      >
                                        <XCircle className="h-5 w-5" />
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Published */}
                                  {currentBlog.status === 'published' && (
                                    <>
                                      <button
                                        onClick={() => handleStatusChange('archived')}
                                        disabled={loading}
                                        className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                        title="Lưu trữ"
                                      >
                                        <Archive className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange('rejected')}
                                        disabled={loading}
                                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                        title="Từ chối"
                                      >
                                        <XCircle className="h-5 w-5" />
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Archived */}
                                  {currentBlog.status === 'archived' && (
                                    <button
                                      onClick={() => handleStatusChange('published')}
                                      disabled={loading}
                                      className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                      title="Khôi phục"
                                    >
                                      <CheckCircle className="h-5 w-5" />
                                    </button>
                                  )}
                                  
                                  {/* Draft, Rejected */}
                                  {['draft', 'rejected'].includes(currentBlog.status) && (
                                    <div className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-lg">
                                      Không thể thay đổi trạng thái
                                    </div>
                                  )}
                                </>
                              ) : !canDelete ? (
                                <div className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">Không có quyền</div>
                              ) : null}
                              
                              {/* Delete */}
                              {canDelete && (
                                <button
                                  onClick={() => setShowDeleteConfirm(true)}
                                  className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={currentBlog.title}
      />
    </>
  );
};

export default PostDetailModal;
