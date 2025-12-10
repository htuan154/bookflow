import React, { useState, useEffect, useContext, useCallback } from 'react';
import { hotelApiService } from '../../../api/hotel.service';
import blogService from '../../../api/blog.service';
import { staffApiService } from '../../../api/staff.service';
import { AuthContext } from '../../../context/AuthContext';
import { USER_ROLES } from '../../../config/roles';
import useBlog from '../../../hooks/useBlog';

// Import components
import PostList from './components/PostList';
import ModalNotification from './components/ModalNotification';
import {CreatePostModal} from './components/CreatePostModal';
import EditPostModal from './components/EditPostModal';
import PostDetailModal from './components/PostDetailModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import CommentsPanel from './components/CommentsPanel';
import { getStatusText } from './components/utils';

const MarketingPage = () => {
  // States
  const [selectedHotel, setSelectedHotel] = useState('');
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(9);
  const [hotels, setHotels] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [detailImages, setDetailImages] = useState([]);
  const [modalNotification, setModalNotification] = useState({ message: '', type: '' });
  
  // Comments states
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [selectedBlogForComments, setSelectedBlogForComments] = useState(null);

  const { user } = useContext(AuthContext);
  const { getBlogsByHotel } = useBlog();

  // Load hotels
  useEffect(() => {
    const loadHotels = async () => {
      try {
        if (user?.roleId === USER_ROLES.HOTEL_OWNER) {
          // Lấy TẤT CẢ hotels (bao gồm cả pending, active, inactive, approved)
          const response = await hotelApiService.getHotelsForOwner();
          
          let hotelList = response.data || response.hotels || response;
          if (!Array.isArray(hotelList)) {
            hotelList = [];
          }
          
          // Remove duplicates based on hotel ID
          const uniqueHotelsMap = new Map();
          hotelList.forEach(hotel => {
            const hotelId = hotel.hotelId || hotel.hotel_id || hotel.id;
            if (hotelId && !uniqueHotelsMap.has(hotelId)) {
              uniqueHotelsMap.set(hotelId, hotel);
            }
          });
          
          const uniqueHotels = Array.from(uniqueHotelsMap.values());
          setHotels(uniqueHotels);
          
          if (uniqueHotels.length > 0) {
            const firstHotelId = uniqueHotels[0].hotelId || uniqueHotels[0].hotel_id || uniqueHotels[0].id;
            setSelectedHotel(prev => {
              if (prev) {
                const exists = uniqueHotels.some(h => 
                  (h.hotelId || h.hotel_id || h.id) === prev
                );
                if (exists) return prev;
              }
              return firstHotelId;
            });
          }
        } else if (user?.roleId === USER_ROLES.HOTEL_STAFF) {
          const response = await staffApiService.getStaffByUserId(user.userId || user.id);
          const staffData = Array.isArray(response.data) ? response.data[0] : response.data;
          const staffHotelId = staffData?.hotelId || staffData?.hotel_id;
          if (staffHotelId) {
            setSelectedHotel(staffHotelId);
            const hotelRes = await hotelApiService.getHotelById(staffHotelId);
            setHotels([hotelRes.data || hotelRes]);
          }
        }
      } catch (error) {
        console.error('Error loading hotels:', error);
        setModalNotification({ message: 'Không thể tải danh sách khách sạn', type: 'error' });
      }
    };

    if (user) {
      loadHotels();
    }
  }, [user]);

  // Load posts
  const loadPosts = useCallback(async () => {
    if (!selectedHotel) {
      setLoadingData(false);
      return;
    }

    try {
      setLoadingData(true);
      const resp = await getBlogsByHotel(selectedHotel, {
        page: currentPage,
        limit: postsPerPage,
        search: searchTerm,
        sortBy,
        status: statusFilter === 'all' ? undefined : statusFilter
      });

      let blogsList = [];
      let paginationData = { totalPages: 1, totalItems: 0 };
      
      if (resp?.data?.blogs) {
        blogsList = resp.data.blogs;
        paginationData = resp.data.pagination || paginationData;
      } else if (resp?.blogs) {
        blogsList = resp.blogs;
        paginationData = resp.pagination || paginationData;
      } else if (Array.isArray(resp?.data)) {
        blogsList = resp.data;
      } else if (Array.isArray(resp)) {
        blogsList = resp;
      }

      setPosts(blogsList);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error loading posts:', error);
      setModalNotification({ message: 'Lỗi tải bài viết', type: 'error' });
    } finally {  
      setLoadingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, currentPage, postsPerPage, searchTerm, sortBy, statusFilter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, sortBy]);

  // Backend handles filtering and sorting, so we just use the posts directly
  const currentPosts = posts;

  // Refresh posts
  const refreshPosts = async () => {
    await loadPosts();
  };

  // CRUD Handlers
  const handleViewBlog = (blog) => {
    setDetailError(null);
    setDetailLoading(true);
    setSelectedBlog(null);
    
    setTimeout(async () => {
      const normalizedBlog = {
        blogId: blog.blogId || blog.blog_id || blog.id,
        id: blog.blogId || blog.blog_id || blog.id,
        title: blog.title || 'Không có tiêu đề',
        content: blog.content || 'Không có nội dung',
        excerpt: blog.excerpt || '',
        featuredImageUrl: blog.featuredImageUrl || blog.featured_image_url || '',
        metaDescription: blog.metaDescription || blog.meta_description || '',
        tags: blog.tags || '',
        hotelId: blog.hotelId || blog.hotel_id || '',
        hotelName: blog.hotelName || blog.hotel_name || '',
        status: blog.status || 'draft',
        viewCount: blog.viewCount || blog.view_count || 0,
        likeCount: blog.likeCount || blog.like_count || 0,
        commentCount: blog.commentCount || blog.comment_count || 0,
        createdAt: blog.createdAt || blog.created_at,
        author: blog.username || blog.author || 'Ẩn danh'
      };
      
      setSelectedBlog(normalizedBlog);
      
      // Load images
      try {
        const response = await blogService.getBlogImages(normalizedBlog.blogId);
        let imageUrls = [];
        const imagesList = response?.data || response?.images || response || [];
        if (Array.isArray(imagesList)) {
          imageUrls = imagesList
            .map(img => img.imageUrl || img.image_url || img.url)
            .filter(url => url && url.trim() !== '');
        }
        setDetailImages(imageUrls);
      } catch (error) {
        console.error('Error loading images:', error);
      }
      
      setDetailLoading(false);
    }, 300);
  };

  const handleEditBlog = (blog) => {
    const isOwner = user?.roleId === USER_ROLES.HOTEL_OWNER;
    const isStaff = user?.roleId === USER_ROLES.HOTEL_STAFF;
    
    // Normalize IDs from both user and blog objects
    const currentUserId = user?.userId || user?.id;
    const authorId = blog?.userId || blog?.authorId || blog?.author_id;
    
    const isAuthor = currentUserId && authorId && currentUserId === authorId;

    const canEdit = isOwner || isStaff;

    if (canEdit) {
      setEditingBlog(blog);
      setShowEditModal(true);
    } else {
      setModalNotification({ 
        message: 'Bạn không có quyền sửa bài viết này.', 
        type: 'error' 
      });
    }
  };

  const handleDeleteBlog = (blog) => {
    // Hiển thị modal xác nhận để reject blog
    setSelectedBlog(blog);
    setShowDeleteConfirm(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedBlog) return;
    
    try {
      // Chuyển trạng thái sang rejected thay vì xóa
      await blogService.updateBlog(selectedBlog.blogId || selectedBlog.id, { 
        status: 'rejected' 
      });
      setModalNotification({ message: 'Đã từ chối bài viết thành công!', type: 'success' });
      setShowDeleteConfirm(false);
      setSelectedBlog(null);
      await refreshPosts();
    } catch (err) {
      setModalNotification({ message: 'Không thể từ chối bài viết!', type: 'error' });
    }
  };

  const handleShowComments = (blog) => {
    setSelectedBlogForComments(blog);
    setShowCommentsPanel(true);
  };

  const handleCloseDetail = () => {
    setSelectedBlog(null);
    setDetailError(null);
    setShowDeleteConfirm(false);
    setDetailImages([]);
  };

  const handleStatusChangeDetail = async (newStatus) => {
    if (!selectedBlog) return;
    
    try {
      setDetailLoading(true);
      await blogService.updateBlog(selectedBlog.blogId || selectedBlog.id, { status: newStatus });
      setSelectedBlog(prev => ({ ...prev, status: newStatus }));
      await refreshPosts();
      setModalNotification({ message: `Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`, type: 'success' });
    } catch (err) {
      console.error('Error updating blog status:', err);
      setModalNotification({ message: 'Không thể cập nhật trạng thái!', type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateBlog = async (blogData) => {
    try {
      setLoadingData(true);
      const response = await blogService.createBlog(blogData);
      
      if (response?.data?.blogId && blogData.blog_images?.length > 0) {
        await blogService.addBlogImages(response.data.blogId, blogData.blog_images);
      }
      
      await refreshPosts();
      setShowCreateModal(false);
      setModalNotification({ message: '✅ Tạo bài viết thành công!', type: 'success' });
    } catch (error) {
      console.error('Error creating blog:', error);
      setModalNotification({ message: '❌ Lỗi tạo bài viết!', type: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveEdit = async (blogData, newImages = []) => {
    try {
      const blogId = editingBlog.blogId || editingBlog.id;
      
      // 1. Cập nhật thông tin blog (không bao gồm blog_images)
      await blogService.updateBlog(blogId, blogData);
      
      // 2. Nếu có các ảnh mới, thêm vào database qua API riêng
      if (newImages && newImages.length > 0) {
        console.log('🖼️ Thêm', newImages.length, 'ảnh mới vào blog', blogId);
        await blogService.addBlogImages(blogId, newImages);
      }
      
      setShowEditModal(false);
      setEditingBlog(null);
      await refreshPosts();
      setModalNotification({ message: 'Cập nhật bài viết thành công!', type: 'success' });
    } catch (error) {
      console.error('Error updating blog:', error);
      setModalNotification({ message: 'Lỗi cập nhật bài viết!', type: 'error' });
    }
  };

  // Pagination props
  const paginationProps = {
    currentPage,
    totalPages: pagination.totalPages,
    postsPerPage,
    totalPosts: pagination.totalItems,
    onPageChange: setCurrentPage,
    onLimitChange: (newLimit) => {
      setPostsPerPage(newLimit);
      setCurrentPage(1); // Reset to page 1 when changing limit
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing</h1>
          <p className="text-gray-600">Quản lý bài viết marketing cho khách sạn của bạn</p>
          
          {/* Hotel Selector */}
          {hotels.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khách sạn:
              </label>
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn khách sạn</option>
                {hotels.map((hotel) => {
                  const hotelId = hotel.hotelId || hotel.hotel_id || hotel.id;
                  const hotelName = hotel.name || hotel.hotel_name || hotel.hotelName || '';
                  const city = hotel.city || '';
                  const status = hotel.status || '';
                  
                  // Tạo label theo mẫu: "Tên - Thành phố (trạng thái)"
                  let displayName = hotelName;
                  if (city) {
                    displayName += ` - ${city}`;
                  }
                  if (status) {
                    displayName += ` (${status})`;
                  }
                  
                  return (
                    <option key={hotelId} value={hotelId}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* Post List */}
        <PostList
          posts={currentPosts}
          loading={loadingData}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onView={handleViewBlog}
          onEdit={handleEditBlog}
          onDelete={handleDeleteBlog}
          onShowComments={handleShowComments}
          onCreate={() => setShowCreateModal(true)}
          user={user}
          paginationProps={paginationProps}
        />
      </div>

      {/* Modals */}
      <ModalNotification
        message={modalNotification.message}
        type={modalNotification.type}
        onClose={() => setModalNotification({ message: '', type: '' })}
      />

      {showCreateModal && (
        <CreatePostModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBlog}
          selectedHotel={selectedHotel}
          user={user}
          loading={loadingData}
        />
      )}

      {showEditModal && editingBlog && (
        <EditPostModal
          show={showEditModal}
          blog={editingBlog}
          onClose={() => {
            setShowEditModal(false);
            setEditingBlog(null);
          }}
          onSave={handleSaveEdit}
          user={user}
        />
      )}

      {selectedBlog && (
        <PostDetailModal
          blog={selectedBlog}
          loading={detailLoading}
          error={detailError}
          images={detailImages}
          onClose={handleCloseDetail}
          onDelete={() => setShowDeleteConfirm(selectedBlog)}
          onStatusChange={handleStatusChangeDetail}
          user={user}
        />
      )}

      {showDeleteConfirm && selectedBlog && (
        <DeleteConfirmModal
          blog={selectedBlog}
          onConfirm={handleConfirmReject}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedBlog(null);
          }}
          message="Bạn có chắc muốn từ chối bài viết này? Bài viết sẽ được chuyển sang trạng thái 'Rejected'."
          confirmText="Từ chối"
        />
      )}

      {showCommentsPanel && selectedBlogForComments && (
        <CommentsPanel
          blog={selectedBlogForComments}
          onClose={() => {
            setShowCommentsPanel(false);
            setSelectedBlogForComments(null);
          }}
        />
      )}
    </div>
  );
};

export default MarketingPage;
