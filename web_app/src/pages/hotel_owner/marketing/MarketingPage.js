import React, { useState, useEffect, useContext } from 'react';
import { Edit, Trash2, Eye, Calendar, Tag, Globe, CheckCircle, XCircle, Clock, AlertTriangle, Archive, Loader, ArrowLeft } from 'lucide-react';
import { FiImage, FiMapPin, FiHash, FiSmile, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
// Đã gộp toàn bộ logic CRUD và giao diện danh sách bài viết vào file này, không còn dùng component con
import { useHotel } from '../../../hooks/useHotel';
import { hotelApiService } from '../../../api/hotel.service';
import blogService from '../../../api/blog.service';
import { AuthContext } from '../../../context/AuthContext';

import useBlog from '../../../hooks/useBlog';

const MarketingPage = () => {
  const [postContent, setPostContent] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [images, setImages] = useState([]);
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  // Thêm state cho bộ lọc trạng thái
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImageUrlDialog, setShowImageUrlDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showAllImages, setShowAllImages] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(9);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalInteractions: 0,
    totalComments: 0
  });

  const [hotels, setHotels] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const { loading: hotelLoading } = useHotel();
  const { user } = useContext(AuthContext); // Lấy thông tin user hiện tại
  const { getOwnerBlogs } = useBlog(); // Sử dụng hook

  // State for detail view
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [detailImages, setDetailImages] = useState([]);
  
  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    status: 'draft'
  });
  const [editLoading, setEditLoading] = useState(false);
  
  // State cho quản lý nhiều ảnh trong edit modal
  const [editImages, setEditImages] = useState([]);
  const [showEditImageUrlDialog, setShowEditImageUrlDialog] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState('');

  // State để lưu trữ ảnh của từng blog cho trang chính
  const [blogImages, setBlogImages] = useState({});

  // State cho modal notification (bảng lớn giữa trang)
  const [modalNotification, setModalNotification] = useState({ message: '', type: '' });

  // Modal Notification component (bảng lớn giữa trang)
  const ModalNotification = ({ message, type, onClose }) => (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        zIndex: 99999,
        display: message ? 'block' : 'none',
      }} onClick={onClose} />
      
      {/* Modal Content */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100000,
        minWidth: 400,
        maxWidth: 500,
        background: type === 'error' ? '#fee2e2' : '#e0f2fe',
        color: type === 'error' ? '#b91c1c' : '#0369a1',
        border: `2px solid ${type === 'error' ? '#f87171' : '#38bdf8'}`,
        borderRadius: 16,
        padding: '32px 48px',
        boxShadow: '0 8px 64px rgba(0,0,0,0.3)',
        fontWeight: 600,
        textAlign: 'center',
        fontSize: 18,
        display: message ? 'block' : 'none',
        pointerEvents: 'auto',
      }}>
        {message}
        <button onClick={onClose} style={{ 
          position: 'absolute', 
          top: 12, 
          right: 16, 
          color: '#888', 
          background: 'none', 
          border: 'none', 
          fontSize: 24, 
          cursor: 'pointer',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background-color 0.2s'
        }}>×</button>
      </div>
    </>
  );

  // Tự động ẩn modal notification sau 3s
  useEffect(() => {
    if (modalNotification.message) {
      const timer = setTimeout(() => setModalNotification({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [modalNotification]);

  // Hàm đóng tất cả dropdown
  const closeAllDropdowns = () => {
    const dropdowns = ['emojiDropdown', 'locationDropdown', 'hashtagDropdown'];
    dropdowns.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.style.display = 'none';
    });
  };

  // Hàm refresh posts dùng chung
  const refreshPosts = async () => {
    console.log('🔄 Refreshing posts...');
    await loadPosts();
  };

  // Gọi API lấy blog của hotel owner đang đăng nhập thông qua hook
  const loadPosts = async () => {
    setLoadingData(true);
    try {
      console.log('🔄 Loading hotel owner posts via hook...');
      
      const result = await getOwnerBlogs({
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      const blogs = result?.blogs || [];
      console.log('📋 Owner blogs from hook:', blogs);
      
      // Normalize dữ liệu giống như logic cũ
      const normalized = (Array.isArray(blogs) ? blogs : []).map(post => {
        return {
          // IDs
          id: post.blogId || post.blog_id || post.id,
          blogId: post.blogId || post.blog_id || post.id,
          blog_id: post.blogId || post.blog_id || post.id,
          
          // Core fields
          title: post.title || '',
          slug: post.slug || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          
          // Images
          featured_image_url: post.featuredImageUrl || post.featured_image_url || '',
          featuredImageUrl: post.featuredImageUrl || post.featured_image_url || '',
          
          // Meta
          meta_description: post.metaDescription || post.meta_description || '',
          metaDescription: post.metaDescription || post.meta_description || '',
          tags: post.tags || '',
          
          // Hotel info
          hotel_id: post.hotelId || post.hotel_id || '',
          hotelId: post.hotelId || post.hotel_id || '',
          hotelName: post.hotel_name || post.hotelName || '',
          
          // Status
          status: post.status || 'draft',
          
          // Stats
          view_count: post.viewCount || post.view_count || 0,
          viewCount: post.viewCount || post.view_count || 0,
          like_count: post.likeCount || post.like_count || 0,
          likeCount: post.likeCount || post.like_count || 0,
          comment_count: post.commentCount || post.comment_count || 0,
          commentCount: post.commentCount || post.comment_count || 0,
          
          // Dates
          created_at: post.createdAt || post.created_at,
          createdAt: post.createdAt || post.created_at,
          
          // Author
          author: post.author || post.username || 'Ẩn danh',
          
          // Additional fields
          images: post.blog_images?.map(img => img.image_url) || 
                  (post.featuredImageUrl || post.featured_image_url ? [post.featuredImageUrl || post.featured_image_url] : []),
          postType: post.post_type || 'general',
        };
      });
      
      console.log('✅ Normalized owner blogs:', normalized);
      setPosts(normalized);
      
      // Update stats
      setStats({
        totalPosts: normalized.length,
        totalInteractions: normalized.reduce((sum, b) => sum + (b.likeCount || 0), 0),
        totalComments: normalized.reduce((sum, b) => sum + (b.commentCount || 0), 0),
      });

      // Load ảnh cho tất cả blog sau khi có posts
      if (normalized.length > 0) {
        // Truyền normalized posts để không phụ thuộc vào state
        loadAllBlogImages(normalized);
      }
    } catch (error) {
      console.error('❌ Error loading hotel owner posts via hook:', error);
      setPosts([]);
      setStats({ totalPosts: 0, totalInteractions: 0, totalComments: 0 });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    // Gọi API lấy tất cả khách sạn đã duyệt cho dropdown
    const loadApprovedHotels = async () => {
      try {
        console.log('🔄 Loading all approved hotels for dropdown...');
        const response = await hotelApiService.getApprovedHotelsDropdown();
        console.log('✅ All approved hotels loaded:', response);
        
        // Extract hotels from response - lấy tất cả khách sạn đã duyệt
        const hotelList = response?.data || response?.hotels || response || [];
        console.log('🟢 DEBUG Hotels data from API:', hotelList);
        console.log('🟢 DEBUG First hotel object:', hotelList[0]);
        setHotels(hotelList);
      } catch (error) {
        console.error('❌ Error loading approved hotels:', error);
        setHotels([]);
      }
    };
    
    loadApprovedHotels();
  }, []); // Chỉ chạy 1 lần khi component mount

  // useEffect riêng cho loadPosts, chỉ cần gọi 1 lần khi mount
  useEffect(() => {
    loadPosts();
  }, []); // Chỉ chạy 1 lần khi component mount

  // useEffect riêng cho event listeners
  useEffect(() => {
    // Đóng dropdown khi click ra ngoài
    const handleClickOutside = (event) => {
      const dropdowns = ['emojiDropdown', 'locationDropdown', 'hashtagDropdown'];
      const isClickInsideDropdown = dropdowns.some(id => {
        const element = document.getElementById(id);
        return element && element.contains(event.target);
      });
      if (!isClickInsideDropdown) closeAllDropdowns();
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    // Xử lý phím ESC để đóng dialog
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowImageUrlDialog(false);
        closeAllDropdowns();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageFromUrl = () => {
    if (imageUrl.trim()) {
      // Kiểm tra xem URL có hợp lệ không
      const img = new Image();
      img.onload = () => {
        setImages(prev => [...prev, imageUrl.trim()]);
        setImageUrl('');
        setShowImageUrlDialog(false);
      };
      img.onerror = () => {
        setModalNotification({ message: 'URL ảnh không hợp lệ hoặc không thể tải. Vui lòng thử lại.', type: 'error' });
      };
      img.src = imageUrl.trim();
    }
  };

  const handleCancelImageUrl = () => {
    setImageUrl('');
    setShowImageUrlDialog(false);
  };

  // Hàm di chuyển ảnh lên trước (giảm order_index)
  const moveImageUp = (index) => {
    if (index > 0) {
      const newImages = [...images];
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      setImages(newImages);
    }
  };

  // Hàm di chuyển ảnh xuống sau (tăng order_index)
  const moveImageDown = (index) => {
    if (index < images.length - 1) {
      const newImages = [...images];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      setImages(newImages);
    }
  };

  // Hàm xóa ảnh
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Hàm đặt ảnh làm ảnh đại diện (di chuyển lên đầu tiên)
  const setAsFirstImage = (index) => {
    if (index > 0) {
      const newImages = [...images];
      const [selectedImage] = newImages.splice(index, 1);
      newImages.unshift(selectedImage);
      setImages(newImages);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postContent.trim() || !selectedHotel) {
      setModalNotification({ message: 'Vui lòng nhập nội dung và chọn khách sạn!', type: 'error' });
      return;
    }

    try {
      setLoadingData(true);
      
      // Tìm hotel ID từ tên được chọn
      const selectedHotelObj = hotels.find(h => h.name === selectedHotel);
      const hotelIdToSend = selectedHotelObj?.hotelId || selectedHotelObj?.hotel_id;
      
      if (!hotelIdToSend) {
        setModalNotification({ message: 'Không tìm thấy thông tin khách sạn. Vui lòng chọn lại!', type: 'error' });
        return;
      }

      // Chuẩn bị dữ liệu blog theo cấu trúc database
      const blogData = {
        hotel_id: hotelIdToSend,
        title: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''), // Auto generate title from content
        content: postContent,
        featured_image_url: images.length > 0 ? images[0] : null,
        status: 'published', // Tạo luôn ở trạng thái published
        blog_images: images.map((url, index) => ({
          image_url: url,
          order_index: index,
          caption: ''
        }))
      };

      console.log('🟢 DEBUG blogData:', blogData);

      // Gọi API tạo blog
      const response = await blogService.createBlog(blogData);
      console.log('✅ Blog created successfully:', response);
      
      // Refresh danh sách posts bằng cách gọi lại refreshPosts()
      console.log('🔄 Refreshing posts after blog creation...');
      await refreshPosts();
      
      // Reset form
      setPostContent('');
      setImages([]);
      setSelectedHotel('');
      setShowCreateForm(false);
      setShowAllImages(false);
      setCurrentPage(1);
      setModalNotification({ message: '✅ Tạo bài viết thành công!', type: 'success' });
    } catch (error) {
      console.error('❌ Error creating blog post:', error);
      setModalNotification({ message: '❌ Lỗi tạo bài viết: ' + (error.message || 'Vui lòng thử lại'), type: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  // Handle change status
  const handleChangeStatus = async (blogId, newStatus) => {
    try {
      await blogService.updateBlogStatus(blogId, newStatus);
      setModalNotification({ message: `Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`, type: 'success' });
      refreshPosts();
    } catch (err) {
      setModalNotification({ message: 'Không thể cập nhật trạng thái!', type: 'error' });
    }
  };

  // Tính toán số lượng bài viết theo trạng thái
  const statusCounts = {
    all: 0,
    published: 0,
    draft: 0,
    archived: 0
  };

  // Đếm số lượng bài viết theo từng trạng thái (chỉ của hotel owner, không bao gồm admin)
  posts.forEach(post => {
    // Loại bỏ bài viết của admin
    if (post.roleId && post.roleId === 1) return;
    if (post.author === 'admin') return;
    if (post.authorRole && post.authorRole === 1) return;
    if (post.userRole && post.userRole === 1) return;
    
    // Đếm tổng số
    statusCounts.all++;
    
    // Đếm theo từng trạng thái
    if (post.status === 'published') statusCounts.published++;
    else if (post.status === 'draft') statusCounts.draft++;
    else if (post.status === 'archived') statusCounts.archived++;
  });

  // Filter and sort posts
  const filteredAndSortedPosts = posts
    .filter(post => {
      // Loại bỏ bài viết của admin - CHỈ LẤY BLOG CỦA CHỦ KHÁCH SẠN
      // Kiểm tra nhiều trường để đảm bảo không lấy blog admin
      if (post.roleId && post.roleId === 1) return false; // Loại bỏ nếu roleId = 1 (admin)
      if (post.author === 'admin') return false; // Loại bỏ nếu author = 'admin'  
      if (post.authorRole && post.authorRole === 1) return false; // Loại bỏ nếu authorRole = 1
      if (post.userRole && post.userRole === 1) return false; // Loại bỏ nếu userRole = 1
      
      // Lọc theo trạng thái
      if (statusFilter !== 'all' && post.status !== statusFilter) return false;
      // Lọc theo từ khóa tìm kiếm
      if (!searchTerm) return true;
      return post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at);
        case 'oldest':
          return new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at);
        case 'most_liked':
          return (b.likes || 0) - (a.likes || 0);
        default:
          return 0;
      }
    });

  // Pagination logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredAndSortedPosts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // ✅ CRUD Handlers cho blog posts
  const handleViewBlog = (blog) => {
    setDetailError(null);
    setDetailLoading(true);
    setSelectedBlog(null);
    
    // Sử dụng dữ liệu blog có sẵn thay vì gọi API
    // Vì dữ liệu đã được load đầy đủ từ danh sách
    setTimeout(() => {
      console.log('🔍 Viewing blog:', blog);
      
      // Chuẩn hoá dữ liệu blog cho modal
      const normalizedBlog = {
        // IDs
        blogId: blog.blogId || blog.blog_id || blog.id,
        id: blog.blogId || blog.blog_id || blog.id,
        
        // Core fields
        title: blog.title || 'Không có tiêu đề',
        content: blog.content || 'Không có nội dung',
        excerpt: blog.excerpt || '',
        
        // Images
        featuredImageUrl: blog.featuredImageUrl || blog.featured_image_url || '',
        
        // Meta
        metaDescription: blog.metaDescription || blog.meta_description || '',
        tags: blog.tags || '',
        
        // Hotel info
        hotelId: blog.hotelId || blog.hotel_id || '',
        hotelName: blog.hotelName || blog.hotel_name || '',
        
        // Status
        status: blog.status || 'draft',
        
        // Stats
        viewCount: blog.viewCount || blog.view_count || 0,
        likeCount: blog.likeCount || blog.like_count || 0,
        commentCount: blog.commentCount || blog.comment_count || 0,
        
        // Dates
        createdAt: blog.createdAt || blog.created_at,
        
        // Author
        author: blog.author || 'Ẩn danh'
      };
      
      console.log('✅ Normalized blog for modal:', normalizedBlog);
      setSelectedBlog(normalizedBlog);
      
      // Load ảnh chi tiết của blog
      loadDetailImages(normalizedBlog.blogId || normalizedBlog.id);
      
      setDetailLoading(false);
    }, 300); // Thêm delay nhỏ để có animation loading
  };
  // Hàm dùng chung để lấy tất cả ảnh của một blog từ API blog_images
  const fetchBlogImages = async (blogId, fallbackBlog = null) => {
    try {
      console.log('🖼️ [DEBUG] === FETCHING IMAGES FOR BLOG ===');
      console.log('🖼️ [DEBUG] Blog ID:', blogId);
      console.log('🖼️ [DEBUG] API URL:', `http://localhost:8080/api/v1/blogs/${blogId}/images`);
      
      const response = await blogService.getBlogImages(blogId);
      console.log('🖼️ [DEBUG] Raw API response:', response);
      console.log('🖼️ [DEBUG] Response type:', typeof response);
      console.log('🖼️ [DEBUG] Response keys:', response ? Object.keys(response) : 'null');
      
      let imageUrls = [];
      
      // Xử lý response từ server - chỉ lấy từ blog_images table
      let imagesList = [];
      if (response && response.data && Array.isArray(response.data)) {
        imagesList = response.data;
        console.log('🖼️ [DEBUG] Found images in response.data:', imagesList.length);
        imagesList.forEach((img, i) => console.log(`🖼️ [DEBUG] Image ${i}:`, img));
      } else if (response && response.images && Array.isArray(response.images)) {
        imagesList = response.images;
        console.log('🖼️ [DEBUG] Found images in response.images:', imagesList.length);
        imagesList.forEach((img, i) => console.log(`🖼️ [DEBUG] Image ${i}:`, img));
      } else if (response && Array.isArray(response)) {
        imagesList = response;
        console.log('🖼️ [DEBUG] Response is direct array:', imagesList.length);
        imagesList.forEach((img, i) => console.log(`🖼️ [DEBUG] Image ${i}:`, img));
      } else {
        console.log('🖼️ [DEBUG] No valid image array found in response');
      }
      
      if (imagesList.length > 0) {
        imageUrls = imagesList.map((img, index) => {
          const url = img.imageUrl || img.image_url || img.url;
          console.log(`🖼️ [DEBUG] Extracted URL ${index}:`, url);
          return url;
        }).filter(url => {
          const isValid = url && url.trim() !== '';
          console.log('🖼️ [DEBUG] URL valid:', isValid, 'URL:', url);
          return isValid;
        });
      }
      
      console.log('🖼️ [DEBUG] === FINAL RESULT ===');
      console.log('🖼️ [DEBUG] Total images found:', imageUrls.length);
      console.log('🖼️ [DEBUG] Image URLs:', imageUrls);
      console.log('🖼️ [DEBUG] ========================');
      
      return imageUrls;
      
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching images:', error);
      return [];
    }
  };

  // Hàm load ảnh chi tiết cho modal view - sử dụng hàm chung
  const loadDetailImages = async (blogId) => {
    const images = await fetchBlogImages(blogId, selectedBlog);
    setDetailImages(images);
  };

  const handleCloseDetail = () => {
    setSelectedBlog(null);
    setDetailError(null);
    setShowDeleteConfirm(false);
    setDetailImages([]);
  };

  const handleDeleteDetail = async () => {
    if (!selectedBlog) return;
    try {
      await blogService.deleteBlog(selectedBlog.blogId);
      setModalNotification({ message: 'Đã xóa bài viết thành công!', type: 'success' });
      handleCloseDetail();
      refreshPosts();
    } catch (err) {
      setModalNotification({ message: 'Không thể xóa bài viết!', type: 'error' });
    }
  };

  const handleStatusChangeDetail = async (newStatus) => {
    if (!selectedBlog) return;
    // Phân quyền FE: admin (roleId=1) luôn được đổi, chủ khách sạn (roleId=2) chỉ được đổi nếu là người tạo
    const isAdmin = user && user.roleId === 1;
    const isHotelOwner = user && user.roleId === 2 && (user.id === selectedBlog.authorId || user.id === selectedBlog.author || user.username === selectedBlog.author);
    if (!user || (!isAdmin && !isHotelOwner)) {
      setDetailError('Bạn không có quyền đổi trạng thái bài viết này.');
      return;
    }
    try {
      setDetailLoading(true);
      // Gọi API updateBlog giống như modal edit, chỉ truyền status mới
      await blogService.updateBlog(selectedBlog.blogId || selectedBlog.id, { status: newStatus });
      setSelectedBlog(prev => ({ ...prev, status: newStatus }));
      // Làm mới danh sách posts để cập nhật trạng thái mới
      await refreshPosts();
      setModalNotification({ message: `Đã cập nhật trạng thái thành "${getStatusText(newStatus)}"`, type: 'success' });
    } catch (err) {
      console.error('Error updating blog status:', err);
      setModalNotification({ message: 'Không thể cập nhật trạng thái!', type: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      draft: 'Nháp',
      pending: 'Chờ duyệt',
      published: 'Đã xuất bản',
      archived: 'Lưu trữ',
      rejected: 'Bị từ chối'
    };
    return statusMap[status] || status;
  };
  const getStatusIcon = (status) => {
    const iconMap = {
      draft: <AlertTriangle className="h-4 w-4" />,
      pending: <Clock className="h-4 w-4" />,
      published: <CheckCircle className="h-4 w-4" />,
      archived: <Archive className="h-4 w-4" />,
      rejected: <XCircle className="h-4 w-4" />
    };
    return iconMap[status] || <AlertTriangle className="h-4 w-4" />;
  };
  const getStatusColor = (status) => {
    const colorMap = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const handleEditBlog = (blog) => {
    console.log('✏️ Editing blog:', blog);
    
    // Normalize blog data giống như handleViewBlog
    const normalizedBlog = {
      blogId: blog.blogId || blog.blog_id || blog.id,
      id: blog.blogId || blog.blog_id || blog.id,
      title: blog.title || '',
      content: blog.content || '',
      status: blog.status || 'draft',
      featuredImageUrl: blog.featuredImageUrl || blog.featured_image_url || '',
      featured_image_url: blog.featuredImageUrl || blog.featured_image_url || ''
    };
    
    setEditingBlog(normalizedBlog);
    setEditForm({
      title: normalizedBlog.title,
      content: normalizedBlog.content,
      status: normalizedBlog.status
    });
    
    // Load ảnh trước khi mở modal - sử dụng cùng hàm như modal chi tiết
    const blogId = normalizedBlog.blogId || normalizedBlog.id;
    console.log('🔄 [handleEditBlog] About to load images for blogId:', blogId);
    
    // Dùng fetchBlogImages như modal chi tiết
    fetchBlogImages(blogId, normalizedBlog).then(imageUrls => {
      console.log('🔄 [handleEditBlog] Loaded images:', imageUrls);
      // Chuyển mảng URL thành format cho edit modal (cần imageId để xóa)
      const imagesData = imageUrls.map((url, index) => ({
        imageId: null, // Sẽ được cập nhật sau nếu cần xóa
        imageUrl: url,
        isFromDatabase: true
      }));
      setEditImages(imagesData);
      setShowEditModal(true);
    }).catch(error => {
      console.error('❌ [handleEditBlog] Error loading images:', error);
      setEditImages([]);
      setShowEditModal(true);
    });
  };

  // Hàm lưu ảnh vào database thông qua API blog_images
  const saveBlogImages = async (blogId, images) => {
    try {
      if (!images || images.length === 0) {
        console.log('🖼️ No images to save');
        return;
      }

      // Xóa tất cả ảnh cũ của blog trước khi thêm ảnh mới
      const existingImages = await blogService.getBlogImages(blogId);
      if (existingImages && existingImages.length > 0) {
        console.log('🗑️ Deleting existing images:', existingImages.length);
        for (const img of existingImages) {
          await blogService.deleteBlogImageById(img.id);
        }
      }

      // Chuyển đổi format từ editImages sang format phù hợp với API
      // Chỉ lưu những ảnh chưa có trong database hoặc mới thêm
      const newImages = images.filter(img => !img.isFromDatabase);
      if (newImages.length === 0) {
        console.log('🖼️ No new images to save');
        return;
      }
      
      const imageData = newImages.map((imageData, index) => ({
        image_url: imageData.imageUrl,
        caption: '', // Có thể thêm caption sau
        order_index: index + 1 // Thứ tự ảnh
      }));

      console.log('🖼️ Saving images to database:', imageData);
      await blogService.addBlogImages(blogId, imageData);
      console.log('✅ Images saved successfully');
    } catch (error) {
      console.error('❌ Error saving images:', error);
      throw error;
    }
  };
  
  const handleSaveEdit = async () => {
    if (!editingBlog || !editForm.title.trim() || !editForm.content.trim()) {
      setModalNotification({ message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung!', type: 'error' });
      return;
    }
    
    try {
      setEditLoading(true);
      
      // Gửi các trường Blog cơ bản + ảnh đầu tiên làm featured_image_url
      const updateData = {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        status: editForm.status,
        featured_image_url: editImages.length > 0 ? editImages[0].imageUrl : null
      };
      
      console.log('🔄 Updating blog:', editingBlog.blogId, updateData);
      
      await blogService.updateBlog(editingBlog.blogId || editingBlog.id, updateData);
      
      // Sau khi cập nhật blog thành công, lưu ảnh vào blog_images
      if (editImages.length > 0) {
        const blogId = editingBlog.blogId || editingBlog.id;
        await saveBlogImages(blogId, editImages);
      }
      console.log('🖼️ Saved', editImages.length, 'images to blog_images table');
      
      setModalNotification({ message: '✅ Cập nhật bài viết thành công!', type: 'success' });
      setShowEditModal(false);
      setEditingBlog(null);
      refreshPosts();
      
    } catch (error) {
      console.error('❌ Error updating blog:', error);
      setModalNotification({ message: '❌ Lỗi cập nhật bài viết: ' + (error.message || 'Vui lòng thử lại'), type: 'error' });
    } finally {
      setEditLoading(false);
    }
  };
  
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBlog(null);
    setEditForm({ title: '', content: '', status: 'draft' });
    setEditImages([]);
    setShowEditImageUrlDialog(false);
    setEditImageUrl('');
  };

  // Hàm xử lý thêm ảnh từ URL trong edit modal
  const handleAddEditImageFromUrl = () => {
    if (editImageUrl.trim()) {
      setEditImages(prev => [...prev, {
        imageId: null,
        imageUrl: editImageUrl.trim(),
        isFromDatabase: false
      }]);
      setEditImageUrl('');
      setShowEditImageUrlDialog(false);
    }
  };

  // Hàm xóa ảnh trong edit modal
  const handleRemoveEditImage = async (index) => {
    const imageData = editImages[index];
    
    try {
      // Nếu ảnh có imageId (từ database), xóa khỏi database trước
      if (imageData.isFromDatabase && imageData.imageId) {
        console.log('🖼️ Deleting image from database:', imageData.imageId, imageData.imageUrl);
        await blogService.deleteBlogImageById(imageData.imageId);
        console.log('✅ Image deleted from database successfully');
      } else {
        console.log('🖼️ Removing image from UI only (not saved in database):', imageData.imageUrl);
      }
      
      // Xóa khỏi UI sau khi xóa thành công từ database
      setEditImages(prev => prev.filter((_, i) => i !== index));
      console.log('✅ Image removed from UI:', imageData.imageUrl);
      
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      // Hiển thị thông báo lỗi cho user
      setModalNotification({ 
        message: 'Không thể xóa ảnh. Vui lòng thử lại!', 
        type: 'error' 
      });
    }
  };



  // Hàm hủy dialog thêm ảnh trong edit modal
  const handleCancelEditImageUrl = () => {
    setEditImageUrl('');
    setShowEditImageUrlDialog(false);
  };



  // Hàm load tất cả ảnh của blog cho edit modal - sử dụng cùng hàm như modal chi tiết
  const loadBlogImages = async (blogId) => {
    console.log('🔄 [loadBlogImages] Starting to load images for blogId:', blogId);
    console.log('🔄 [loadBlogImages] editingBlog:', editingBlog);
    const imageUrls = await fetchBlogImages(blogId, editingBlog);
    console.log('🔄 [loadBlogImages] Fetched images:', imageUrls);
    // Chuyển mảng URL thành format cho edit modal
    const imagesData = imageUrls.map((url, index) => ({
      imageId: null,
      imageUrl: url,
      isFromDatabase: true
    }));
    setEditImages(imagesData);
    console.log('🔄 [loadBlogImages] Updated editImages state');
  };

  // Hàm load chỉ ảnh đầu tiên cho tất cả blog để hiển thị ở trang chính
  const loadAllBlogImages = async (postsList = null) => {
    try {
      const currentPosts = postsList || posts;
      const imageMap = {};
      for (let i = 0; i < currentPosts.length; i++) {
        const post = currentPosts[i];
        const blogId = post.blogId || post.id || post.blog_id;
        try {
          const imageUrls = await fetchBlogImages(blogId, post);
          if (imageUrls.length > 0) {
            imageMap[blogId] = [imageUrls[0]]; // chỉ lấy hình đầu tiên
          } else {
            imageMap[blogId] = [];
          }
        } catch (error) {
          imageMap[blogId] = [];
        }
      }
      setBlogImages(imageMap);
    } catch (error) {
      setBlogImages({});
    }
  };
  // Tự động load lại ảnh khi danh sách posts thay đổi
  useEffect(() => {
    if (posts.length > 0) {
      console.log('🔄 [Main] Posts changed, loading images for', posts.length, 'posts');
      loadAllBlogImages(posts);
    }
  }, [posts]);

  // Debug: Log blogImages state changes
  useEffect(() => {
    console.log('🎯 [Main] blogImages state updated:', blogImages);
  }, [blogImages]);

  const handleDeleteBlog = async (blog) => {
    // Sử dụng modal confirmation dialog thay vì window.confirm
    setShowDeleteConfirm(blog);
  };

  // Hàm xử lý xác nhận xóa từ modal
  const confirmDeleteBlog = async (blog) => {
    try {
      await blogService.deleteBlog(blog.blogId || blog.id || blog.blog_id);
      setModalNotification({ message: 'Đã xóa bài viết thành công!', type: 'success' });
      setShowDeleteConfirm(false);
      refreshPosts();
    } catch (err) {
      setModalNotification({ message: 'Không thể xóa bài viết!', type: 'error' });
      setShowDeleteConfirm(false);
    }
  };
  const handleSaveDraft = async () => {
  if (!postContent.trim() || !selectedHotel) {
    setModalNotification({ message: 'Vui lòng nhập nội dung và chọn khách sạn!', type: 'error' });
    return;
  }
  try {
    setLoadingData(true);
    const selectedHotelObj = hotels.find(h => h.name === selectedHotel);
    const hotelIdToSend = selectedHotelObj?.hotelId || selectedHotelObj?.hotel_id;
    if (!hotelIdToSend) {
      setModalNotification({ message: 'Không tìm thấy thông tin khách sạn. Vui lòng chọn lại!', type: 'error' });
      return;
    }
    const blogData = {
      hotel_id: hotelIdToSend,
      title: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''),
      content: postContent,
      featured_image_url: images.length > 0 ? images[0] : null,
      status: 'draft',
      blog_images: images.map((url, index) => ({
        image_url: url,
        order_index: index,
        caption: ''
      }))
    };
    await blogService.createBlog(blogData);
    await refreshPosts();
    setPostContent('');
    setImages([]);
    setSelectedHotel('');
    setShowCreateForm(false);
    setShowAllImages(false);
    setCurrentPage(1);
    setModalNotification({ message: '✅ Đã lưu vào bản nháp!', type: 'success' });
  } catch (error) {
    setModalNotification({ message: '❌ Lỗi lưu nháp: ' + (error.message || 'Vui lòng thử lại'), type: 'error' });
  } finally {
    setLoadingData(false);
  }
};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing</h1>
            <p className="text-gray-600 mt-1">Quản lý bài viết marketing cho khách sạn của bạn</p>
            {loadingData && <p className="text-xs text-blue-600 mt-1">🔄 Đang tải dữ liệu...</p>}
          </div>
        </div>

        {/* Stats removed - bình luận và bài viết */}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tạo bài viết mới</h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-sm"
              >
                ✕
              </button>
            </div>
          
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hotel Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn khách sạn</label>
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  disabled={hotelLoading}
                >
                  <option value="">{loadingData || hotelLoading ? 'Đang tải...' : 'Chọn khách sạn...'}</option>
                  {hotels.map(hotel => (
                    <option key={hotel.hotelId} value={hotel.name}>
                      {hotel.name} - {hotel.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Input */}
              <div>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Chia sẻ về khách sạn của bạn..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  rows="4"
                  required
                />
              </div>
                
              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {/* Image URL */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowImageUrlDialog(true)}
                      className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer transition-colors text-sm"
                    >
                      <FiImage className="mr-1" />
                      Ảnh
                    </button>
                  </div>

                  {/* Emoji Picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        closeAllDropdowns();
                        const dropdown = document.getElementById('emojiDropdown');
                        dropdown.style.display = 'block';
                      }}
                      className="flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-xs"
                    >
                      😊
                    </button>

                    <div
                      id="emojiDropdown"
                      style={{ display: 'none' }}
                      className="absolute top-8 left-0 bg-white border border-gray-200 rounded shadow-lg p-2 z-10 w-48"
                    >
                      <div className="grid grid-cols-6 gap-1">
                        {['😊', '😂', '🥰', '😍', '🤩', '😘', '😎', '🤗', '🤔', '😌', '😋', '😏', '❤️', '💙', '💚', '💛', '🧡', '💜', '👍', '👎', '👏', '🙌', '👌', '✌️', '🔥', '💯', '💪', '🎉', '🎊', '🥇', '🏆', '🎯', '🏨', '🏖️', '🏝️', '🏔️'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setPostContent(prev => prev + ' ' + emoji);
                              document.getElementById('emojiDropdown').style.display = 'none';
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-sm transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        closeAllDropdowns();
                        const dropdown = document.getElementById('locationDropdown');
                        dropdown.style.display = 'block';
                      }}
                      className="flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-xs"
                    >
                      📍
                    </button>

                    <div
                      id="locationDropdown"
                      style={{ display: 'none' }}
                      className="absolute top-8 left-0 bg-white border border-gray-200 rounded shadow-lg p-2 z-10 w-36"
                    >
                      <div className="space-y-1">
                        {['TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Hạ Long'].map(location => (
                          <button
                            key={location}
                            type="button"
                            onClick={() => {
                              setPostContent(prev => prev + ' 📍 ' + location);
                              document.getElementById('locationDropdown').style.display = 'none';
                            }}
                            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs transition-colors"
                          >
                            {location}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
                <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-medium transition-colors text-sm"
              onClick={handleSaveDraft}
              disabled={loadingData}
            >
              Lưu nháp
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors text-sm"
              disabled={loadingData}
            >
              Đăng bài
              {loadingData }
            </button>
          </div>       
              </div>

              {/* Image Preview - Compact Scrollable Layout */}
              {images.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{images.length}</span> ảnh đã chọn
                    </p>
                  </div>
                  
                  {/* Container có chiều cao cố định và scroll */}
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-cols-4 gap-3">
                      {images.map((image, index) => (
                        <div key={index} className="relative group bg-white rounded-lg overflow-hidden shadow-sm">
                          {/* Ảnh đại diện badge */}
                          {index === 0 && (
                            <div className="absolute top-1 left-1 z-10 bg-blue-500 text-white text-xs px-2 py-0.5 rounded font-medium">
                              Ảnh đại diện
                            </div>
                          )}
                          
                          <div className="aspect-square overflow-hidden bg-gray-100">
                            <img 
                              src={image} 
                              alt={`Ảnh ${index + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSIjOTQ5NDk0IiBzdHJva2Utd2lkdGg9IjIiLz4KPGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiIGZpbGw9IiM5NDk0OTQiLz4KPHBhdGggZD0ibTIxIDEwLTUgNUw5IDhsLTYgNiIgc3Ryb2tlPSIjOTQ5NDk0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                                e.target.className += ' p-2';
                              }}
                            />
                          </div>
                          
                          {/* Control buttons - Chỉ hiện khi hover */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex space-x-1">
                              {/* Làm ảnh đại diện */}
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setAsFirstImage(index)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white rounded p-1 text-xs transition-colors"
                                  title="Đặt làm ảnh đại diện (featured_image_url)"
                                >
                                  🏆
                                </button>
                              )}
                              
                              {/* Di chuyển lên */}
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveImageUp(index)}
                                  className="bg-gray-700 hover:bg-gray-800 text-white rounded p-1 text-xs transition-colors"
                                  title="Di chuyển lên"
                                >
                                  ↑
                                </button>
                              )}
                              
                              {/* Di chuyển xuống */}
                              {index < images.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveImageDown(index)}
                                  className="bg-gray-700 hover:bg-gray-800 text-white rounded p-1 text-xs transition-colors"
                                  title="Di chuyển xuống"
                                >
                                  ↓
                                </button>
                              )}
                              
                              {/* Xóa */}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="bg-red-500 hover:bg-red-600 text-white rounded p-1 text-xs transition-colors"
                                title="Xóa ảnh"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                          
                          {/* Số thứ tự */}
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Hướng dẫn nếu chưa có ảnh */}
                    {images.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-sm">Chưa có ảnh nào</p>
                        <p className="text-xs mt-1">Click nút "Ảnh" để thêm ảnh từ URL</p>
                      </div>
                    )}
                  </div>
                  

                </div>
              )}
            </form>
          </div>
        )}

        {/* Image URL Dialog */}
        {showImageUrlDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelImageUrl}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddImageFromUrl}
                  disabled={!imageUrl.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Thêm ảnh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Toolbar */}
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Bài viết</h3>
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                />
                {/* Bộ lọc trạng thái */}
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ minWidth: 120 }}
                >
                  <option value="all">Tất cả trạng thái ({statusCounts.all})</option>
                  <option value="published">Đã xuất bản ({statusCounts.published})</option>
                  <option value="draft">Bản nháp ({statusCounts.draft})</option>
                  <option value="archived">Đã lưu trữ ({statusCounts.archived})</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <FiPlus className="mr-1" />
                Tạo
              </button>
            </div>
          </div>

          {/* Posts Content */}
          <div className="p-4">
            {currentPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPosts.map((blog) => {
                    const getStatusColor = (status) => {
                      const colors = {
                        draft: 'bg-gray-100 text-gray-800',
                        pending: 'bg-yellow-100 text-yellow-800',
                        published: 'bg-green-100 text-green-800',
                        rejected: 'bg-red-100 text-red-800'
                      };
                      return colors[status] || 'bg-gray-100 text-gray-800';
                    };
                    const getStatusText = (status) => {
                      const texts = {
                        draft: 'Bản nháp',
                        pending: 'Chờ duyệt',
                        published: 'Đã xuất bản',
                        rejected: 'Bị từ chối'
                      };
                      return texts[status] || status;
                    };
                    const formatDate = (dateString) => {
                      if (!dateString) return '';
                      return new Date(dateString).toLocaleDateString('vi-VN', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      });
                    };
                    const truncateText = (text, maxLength = 150) => {
                      if (!text) return '';
                      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
                    };
                    return (
                      <div key={blog.blogId || blog.blog_id || blog.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 h-full flex flex-col overflow-hidden">
                        {/* Gallery ảnh */}
                        {(() => {
                          const blogId = blog.blogId || blog.id || blog.blog_id;
                          
                          // Thử dùng ảnh từ API trước, nếu không có thì dùng featuredImageUrl
                          let displayImage = (blogImages[blogId] && blogImages[blogId][0]) || blog.featuredImageUrl || blog.featured_image_url;
                          if (displayImage) {
                            return (
                              <div className="h-48 overflow-hidden">
                                <img 
                                  src={displayImage}
                                  alt={blog.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                  onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/1829/1829586.png'; }}
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                                <img src="https://cdn-icons-png.flaticon.com/512/1829/1829586.png" alt="No image" className="w-16 h-16 opacity-50" />
                              </div>
                            );
                          }
                        })()}
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-3">
                            {blog.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {blog.category.name || blog.category}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(blog.status)}`}>
                              {getStatusText(blog.status)}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{blog.excerpt || truncateText(blog.content, 150)}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              <span>{blog.author?.name || blog.author || 'Ẩn danh'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span>{formatDate(blog.createdAt || blog.created_at)}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                <span>{blog.viewCount || blog.view_count || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                <span>{blog.likeCount || blog.like_count || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                <span>{blog.commentCount || blog.comment_count || 0}</span>
                              </div>
                            </div>
                          </div>
                          {/* Actions CRUD */}
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handleViewBlog(blog)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            
                            </button>
                            <div className="flex items-center space-x-2">
                              {blog.status === 'draft' && (
                                <button
                                  onClick={() => handleChangeStatus(blog.blogId || blog.id || blog.blog_id, 'published')}
                                  className="inline-flex items-center px-2 py-1 border border-green-500 text-green-700 bg-green-50 rounded hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50"
                                  title="Xuất bản"
                                >
                                  Xuất bản
                                </button>
                              )}
                              <button
                                onClick={() => handleEditBlog(blog)}
                                className="inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                                title="Chỉnh sửa bài viết"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(blog)}
                                className="inline-flex items-center p-2 border border-transparent rounded-md text-orange-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                                title="Xóa"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Nếu không có bài viết thì hiển thị khối này */}
                {currentPosts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                      📝
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? `Không tìm thấy "${searchTerm}"` : 'Chưa có bài viết'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {searchTerm ? 'Thử tìm kiếm khác hoặc tạo bài mới' : 'Tạo bài viết đầu tiên!'}
                    </p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Tạo bài viết
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bài viết nào</h3>
                <p className="text-gray-500 mb-4">Hãy tạo bài viết đầu tiên của bạn!</p>
                <button
                    onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <FiPlus className="w-4 h-4 mr-2" />
                  Tạo bài viết
                </button>
              </div>
            )}
            </div>

            {/* Pagination - theo mẫu BlogManagement */}
            <div className="flex justify-between items-center mt-8 bg-white p-4 rounded-lg shadow border">
                {/* Thông tin hiển thị bên trái */}
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                        {(() => {
                            const startItem = filteredAndSortedPosts.length > 0 ? ((currentPage - 1) * postsPerPage) + 1 : 0;
                            const endItem = Math.min(currentPage * postsPerPage, filteredAndSortedPosts.length);
                            return `Hiển thị ${startItem}-${endItem} trong tổng số ${filteredAndSortedPosts.length} bài viết`;
                        })()}
                    </span>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Hiển thị:</span>
                        <select 
                            value={postsPerPage}
                            onChange={(e) => {
                                setCurrentPage(1);
                                // Có thể thêm logic thay đổi postsPerPage nếu cần
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                            <option value={9}>9 mục</option>
                            <option value={18}>18 mục</option>
                            <option value={27}>27 mục</option>
                        </select>
                    </div>
                </div>
                
                {/* Navigation bên phải */}
                <div className="flex items-center space-x-2">
                    {/* Nút về đầu */}
                    <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                        title="Trang đầu"
                    >
                        &laquo;&laquo;
                    </button>
                    {/* Nút về trước */}
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                        title="Trang trước"
                    >
                        Trước
                    </button>
                    
                    {/* Số trang hiện tại */}
                    <button
                        className="px-3 py-1 bg-blue-600 text-white border border-blue-600 rounded text-sm font-medium"
                        disabled
                    >
                        {currentPage}
                    </button>
                    
                    {/* Nút về sau */}
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages || 1))}
                        disabled={currentPage === (totalPages || 1)}
                        className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                        title="Trang sau"
                    >
                        Tiếp
                    </button>
                    {/* Nút về cuối */}
                    <button
                        onClick={() => setCurrentPage(totalPages || 1)}
                        disabled={currentPage === (totalPages || 1)}
                        className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                        title="Trang cuối"
                    >
                        &raquo;&raquo;
                    </button>
                    
                    {/* Input nhảy trang */}
                    <div className="flex items-center space-x-1 ml-2">
                        <span className="text-sm text-gray-600">Đến trang:</span>
                        <input
                            type="number"
                            min={1}
                            max={totalPages || 1}
                            defaultValue={currentPage}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const val = Number(e.target.value);
                                    const maxPage = totalPages || 1;
                                    if (val >= 1 && val <= maxPage) {
                                        setCurrentPage(val);
                                    }
                                }
                            }}
                            className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Modal xác nhận xóa */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full text-center">
              <h2 className="text-lg font-semibold mb-4 text-orange-700">Xác nhận xóa</h2>
              <p className="mb-6 text-gray-700">
                Bạn có chắc chắn muốn xóa bài viết <b>{showDeleteConfirm.title}</b>?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  onClick={() => confirmDeleteBlog(showDeleteConfirm)}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        <>
          {/* Detail Modal for Viewing Blog */}
          {/* Custom CSS for scrollbar */}
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
        </>

        {(selectedBlog || detailLoading || detailError) && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-6xl w-full h-[85vh] flex flex-col shadow-2xl border border-gray-100">
              {/* Modal Header - Thiết kế hiện đại */}
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Chi tiết bài viết</h2>
                    {selectedBlog && (
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700 font-medium">{selectedBlog.author}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full shadow-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-700">
                            {(() => {
                              const dateStr = selectedBlog.createdAt || selectedBlog.created_at;
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
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(selectedBlog.status)}`}>
                          {getStatusIcon(selectedBlog.status)}
                          <span className="ml-1">{getStatusText(selectedBlog.status)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleCloseDetail}
                    className="text-gray-400 hover:text-white hover:bg-red-500 transition-all duration-200 p-2 rounded-full"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-hidden">
                {detailLoading && (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Đang tải...</span>
                  </div>
                )}

                {detailError && (
                  <div className="p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-800">{detailError}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlog && !detailLoading && (
                  <div className="h-full flex">
                    {/* Left Column - Content */}
                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="space-y-4">
                        {/* Title */}
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{selectedBlog.title}</h1>
                          {selectedBlog.excerpt && (
                            <p className="text-gray-600 text-base">{selectedBlog.excerpt}</p>
                          )}
                        </div>

                        {/* Gallery ảnh */}
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
                        


                        {/* Nội dung bài viết */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                          <div className="flex items-center mb-4">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="font-semibold text-gray-800">Nội dung</h3>
                          </div>
                          <div className="bg-white rounded-xl p-4 text-gray-700 leading-relaxed text-sm whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar">
                            {selectedBlog.content || 'Không có nội dung'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Stats & Info */}
                    <div className="w-80 border-l border-blue-100 p-6 overflow-y-auto bg-gradient-to-b from-blue-50 to-gray-50">
                      <div className="space-y-6">
                        {/* Thống kê - Chỉ biểu tượng */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                              <Eye className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                              <div className="text-lg font-bold text-blue-700">{selectedBlog.viewCount || selectedBlog.view_count || 0}</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                              <svg className="h-6 w-6 text-red-600 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                              <div className="text-lg font-bold text-red-700">{selectedBlog.likeCount || selectedBlog.like_count || 0}</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                              <svg className="h-6 w-6 text-green-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <div className="text-lg font-bold text-green-700">{selectedBlog.commentCount || selectedBlog.comment_count || 0}</div>
                            </div>
                          </div>
                        </div>

                        {/* Khách sạn */}
                        {selectedBlog.hotelName && (
                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center mb-3">
                              <Globe className="h-5 w-5 text-blue-600 mr-2" />
                              <h3 className="font-semibold text-gray-800">Khách sạn</h3>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-blue-800 font-medium text-lg">{selectedBlog.hotelName}</p>
                              <p className="text-xs text-blue-600 mt-1">ID: {selectedBlog.hotelId || 'N/A'}</p>
                            </div>
                          </div>
                        )}

                        {/* Từ khóa */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center mb-3">
                            <Tag className="h-5 w-5 text-blue-600 mr-2" />
                            <h3 className="font-semibold text-gray-800">Từ khóa</h3>
                          </div>
                          {selectedBlog.tags ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedBlog.tags.split(',').map((tag, index) => (
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

                        {/* Hành động - Chỉ biểu tượng */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                          <div className="flex justify-center space-x-3">
                            {user && (user.roleId === 1 || (user.roleId === 2 && (user.id === selectedBlog.authorId || user.id === selectedBlog.author || user.username === selectedBlog.author))) ? (
                              <>
                                {selectedBlog.status === 'draft' && (
                                  <button
                                    onClick={() => handleStatusChangeDetail('published')}
                                    disabled={detailLoading}
                                    className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                    title="Xuất bản"
                                  >
                                    <CheckCircle className="h-5 w-5" />
                                  </button>
                                )}
                                {selectedBlog.status === 'published' && (
                                  <button
                                    onClick={() => handleStatusChangeDetail('archived')}
                                    disabled={detailLoading}
                                    className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                    title="Lưu trữ"
                                  >
                                    <Archive className="h-5 w-5" />
                                  </button>
                                )}
                                {selectedBlog.status === 'archived' && (
                                  <button
                                    onClick={() => handleStatusChangeDetail('published')}
                                    disabled={detailLoading}
                                    className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                    title="Khôi phục"
                                  >
                                    <CheckCircle className="h-5 w-5" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">Không có quyền</div>
                            )}
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                              title="Xóa"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal trong Detail View */}
        {showDeleteConfirm && selectedBlog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <XCircle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Xác nhận xóa</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa bài viết "<strong>{selectedBlog.title}</strong>"? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteDetail}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Modal */}
        {showEditModal && editingBlog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Edit Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa bài viết</h2>
                  <p className="text-sm text-gray-600 mt-1">ID: {editingBlog.blogId || editingBlog.id}</p>
                </div>
                <button
                  onClick={handleCloseEditModal}
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
                      onClick={() => setShowEditImageUrlDialog(true)}
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
                    {/* Debug logging */}
                    {console.log('🎯 [Edit Modal] editImages:', editImages)}
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
                              onClick={() => handleRemoveEditImage(index)}
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
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Bản nháp</option>
                    <option value="published">Đã xuất bản</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </div>


              </div>
              
              {/* Edit Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
                <button
                  onClick={handleCloseEditModal}
                  disabled={editLoading}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading || !editForm.title.trim() || !editForm.content.trim()}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {editLoading && <Loader className="h-4 w-4 animate-spin mr-2" />}
                  {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Image URL Dialog */}
        {showEditImageUrlDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thêm ảnh từ URL</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL ảnh
                </label>
                <input
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="Nhập URL ảnh (ví dụ: https://example.com/image.jpg)"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              
              {/* Preview */}
              {editImageUrl && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
                  <img 
                    src={editImageUrl} 
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
                  onClick={handleCancelEditImageUrl}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddEditImageFromUrl}
                  disabled={!editImageUrl.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Thêm ảnh
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Notification (luôn hiển thị ở giữa trang) */}
        {modalNotification.message && (
          <ModalNotification
            message={modalNotification.message}
            type={modalNotification.type}
            onClose={() => setModalNotification({ message: '', type: '' })}
          />
        )}
      </div>
    
  );
};

export default MarketingPage;

