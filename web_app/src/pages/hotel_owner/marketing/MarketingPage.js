import React, { useState, useEffect, useContext } from 'react';
import { Edit, Trash2, Eye, Calendar, Tag, Globe, CheckCircle, XCircle, Clock, AlertTriangle, Archive, Loader, ArrowLeft, MessageCircle, Send, X } from 'lucide-react';
import { FiImage, FiMapPin, FiHash, FiSmile, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
// Đã gộp toàn bộ logic CRUD và giao diện danh sách bài viết vào file này, không còn dùng component con
import { useHotel } from '../../../hooks/useHotel';
import { hotelApiService } from '../../../api/hotel.service';
import blogService from '../../../api/blog.service';
import commentService from '../../../api/comment.service';
import { staffApiService } from '../../../api/staff.service';
import { AuthContext } from '../../../context/AuthContext';
import { USER_ROLES } from '../../../config/roles';

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
  const { getBlogsByHotel } = useBlog(); // Sử dụng hook

  // State for create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createThumbnail, setCreateThumbnail] = useState(''); // Ảnh thumbnail
  const [createBlogImages, setCreateBlogImages] = useState([]); // Các ảnh blog_images
  const [createTitle, setCreateTitle] = useState('');
  const [createContent, setCreateContent] = useState('');
  const [createExcerpt, setCreateExcerpt] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createTags, setCreateTags] = useState('');
  const [createMetaDescription, setCreateMetaDescription] = useState('');
  const [createThumbnailUrl, setCreateThumbnailUrl] = useState(''); // URL input for thumbnail
  const [createBlogImageUrl, setCreateBlogImageUrl] = useState(''); // URL input for blog images

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
    slug: '',
    excerpt: '',
    tags: '',
    metaDescription: '',
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

  // State cho chức năng bình luận - Redesigned
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [selectedBlogForComments, setSelectedBlogForComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedComments, setExpandedComments] = useState(new Set());
  
  // State cho infinite scroll
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsPerPage] = useState(10); // Tăng lên 10 cho infinite scroll
  const [totalComments, setTotalComments] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  
  // State cho sorting và filtering
  const [commentSortBy, setCommentSortBy] = useState('newest'); // newest, oldest, popular
  const [commentFilter, setCommentFilter] = useState('all'); // all, approved, pending

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

  // Hàm refresh posts dùng chung - load lại blogs của hotel hiện tại
  const refreshPosts = async () => {
    if (!selectedHotel) return;
    try {
      setLoadingData(true);
      console.log('🔄 Loading blogs for hotel:', selectedHotel);
      const resp = await getBlogsByHotel(selectedHotel, { page: currentPage, limit: postsPerPage });
      console.log('📦 Response from getBlogsByHotel:', resp);
      console.log('📦 resp.data:', resp?.data);
      console.log('📦 resp.data.blogs:', resp?.data?.blogs);
      
      // Extract blogs from response - handle multiple response formats
      let blogsList = [];
      if (resp?.data?.blogs) {
        // Format: { data: { blogs: [...], pagination: {...} } }
        blogsList = resp.data.blogs;
        console.log('✅ Extracted from resp.data.blogs');
      } else if (resp?.blogs) {
        // Format: { blogs: [...], pagination: {...} }
        blogsList = resp.blogs;
        console.log('✅ Extracted from resp.blogs');
      } else if (Array.isArray(resp?.data)) {
        // Format: { data: [...] }
        blogsList = resp.data;
        console.log('✅ Extracted from resp.data (array)');
      } else if (Array.isArray(resp)) {
        // Format: [...]
        blogsList = resp;
        console.log('✅ Extracted from resp (array)');
      }
      
      console.log('📊 Total blogs extracted:', blogsList.length);
      console.log('📊 Blogs data:', blogsList);
      console.log('✅ Extracted blogs:', blogsList);
      console.log('✅ About to setPosts with:', blogsList.length, 'blogs');
      setPosts(Array.isArray(blogsList) ? blogsList : []);
      setStats(prev => ({ ...prev, totalPosts: Array.isArray(blogsList) ? blogsList.length : 0 }));
    } catch (err) {
      console.error('❌ Failed to refresh posts:', err);
      setPosts([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    // Load hotels for the current owner/staff and default to the first hotel, then load its blogs
    const loadHotelsForOwner = async () => {
      try {
        setLoadingData(true);
        
        // Nếu là HOTEL_STAFF, load thông tin staff để lấy hotel_id
        if (user?.roleId === USER_ROLES.HOTEL_STAFF && user?.userId) {
          try {
            const response = await staffApiService.getStaffByUserId(user.userId);
            if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
              const staff = response.data[0];
              if (staff.hotelId) {
                // Load thông tin hotel từ hotelId
                const hotelResponse = await hotelApiService.getHotelById(staff.hotelId);
                const hotel = hotelResponse?.data || hotelResponse;
                if (hotel) {
                  setHotels([hotel]);
                  const defaultHotelId = hotel.hotel_id || hotel.hotelId || hotel.id || hotel._id;
                  setSelectedHotel(defaultHotelId);
                  
                  // Load blogs cho hotel của staff
                  try {
                    const resp = await getBlogsByHotel(defaultHotelId, { page: 1, limit: postsPerPage });
                    let blogsList = [];
                    if (resp?.data?.blogs) {
                      blogsList = resp.data.blogs;
                    } else if (resp?.blogs) {
                      blogsList = resp.blogs;
                    } else if (Array.isArray(resp?.data)) {
                      blogsList = resp.data;
                    } else if (Array.isArray(resp)) {
                      blogsList = resp;
                    }
                    setPosts(Array.isArray(blogsList) ? blogsList : []);
                    setStats(prev => ({ ...prev, totalPosts: Array.isArray(blogsList) ? blogsList.length : 0 }));
                  } catch (err) {
                    console.error('❌ Failed to load blogs for staff hotel:', err);
                    setPosts([]);
                  }
                }
              }
            }
            setLoadingData(false);
            return;
          } catch (error) {
            console.error('❌ Error loading staff hotel info:', error);
          }
        }
        
        // Nếu là HOTEL_OWNER, load danh sách khách sạn
        const ownerId = user?.id || user?.user_id || null;
        const response = await hotelApiService.getHotelsForOwner({ ownerId });
        const hotelList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : response?.hotels || [];
        setHotels(hotelList);

        if (hotelList.length > 0) {
          const defaultHotelId = hotelList[0].hotel_id || hotelList[0].hotelId || hotelList[0].id || hotelList[0]._id;
          setSelectedHotel(defaultHotelId);
          console.log('🏨 Default hotel selected:', defaultHotelId);

          // Load blogs for the selected/default hotel
          try {
            const resp = await getBlogsByHotel(defaultHotelId, { page: 1, limit: postsPerPage });
            console.log('📦 Initial blogs response:', resp);
            console.log('📦 Initial resp.data:', resp?.data);
            console.log('📦 Initial resp.data.blogs:', resp?.data?.blogs);
            
            // Extract blogs - same logic as refreshPosts
            let blogsList = [];
            if (resp?.data?.blogs) {
              blogsList = resp.data.blogs;
            } else if (resp?.blogs) {
              blogsList = resp.blogs;
            } else if (Array.isArray(resp?.data)) {
              blogsList = resp.data;
            } else if (Array.isArray(resp)) {
              blogsList = resp;
            }
            
            console.log('✅ Initial blogs loaded:', blogsList.length);
            setPosts(Array.isArray(blogsList) ? blogsList : []);
            setStats(prev => ({ ...prev, totalPosts: Array.isArray(blogsList) ? blogsList.length : 0 }));
          } catch (err) {
            console.error('❌ Failed to load blogs for default hotel:', err);
            setPosts([]);
          }
        }
      } catch (error) {
        console.error('❌ Error loading owner hotels:', error);
        setHotels([]);
      } finally {
        setLoadingData(false);
      }
    };

    loadHotelsForOwner();
  }, []); // Chỉ chạy 1 lần khi component mount

  // useEffect riêng cho loadPosts, chỉ cần gọi 1 lần khi mount
  useEffect(() => {
    // Previously used loadPosts(); now use refreshPosts() which loads blogs for the selected/default hotel
    refreshPosts();
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

  // Khi người dùng đổi khách sạn trên selector (ở header)
  const handleHotelChange = async (hotelId) => {
    setSelectedHotel(hotelId);
    console.log('🔄 Hotel changed to:', hotelId);
    try {
      setLoadingData(true);
      const resp = await getBlogsByHotel(hotelId, { page: 1, limit: postsPerPage });
      console.log('📦 Blogs response for hotel change:', resp);
      console.log('📦 resp.data:', resp?.data);
      console.log('📦 resp.data.blogs:', resp?.data?.blogs);
      
      // Extract blogs - same logic as refreshPosts
      let blogsList = [];
      if (resp?.data?.blogs) {
        blogsList = resp.data.blogs;
        console.log('✅ Extracted from resp.data.blogs');
      } else if (resp?.blogs) {
        blogsList = resp.blogs;
        console.log('✅ Extracted from resp.blogs');
      } else if (Array.isArray(resp?.data)) {
        blogsList = resp.data;
        console.log('✅ Extracted from resp.data (array)');
      } else if (Array.isArray(resp)) {
        blogsList = resp;
        console.log('✅ Extracted from resp (array)');
      }
      
      console.log('📊 Total blogs extracted:', blogsList.length);
      console.log('📊 Blogs data:', blogsList);
      console.log('✅ Blogs loaded for hotel:', blogsList.length);
      setPosts(Array.isArray(blogsList) ? blogsList : []);
      setCurrentPage(1);
      setStats(prev => ({ ...prev, totalPosts: Array.isArray(blogsList) ? blogsList.length : 0 }));
    } catch (err) {
      console.error('❌ Failed to load posts for selected hotel:', err);
      setModalNotification({ message: err.message || 'Không thể tải bài viết', type: 'error' });
      setPosts([]);
    } finally {
      setLoadingData(false);
    }
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
    if (e) e.preventDefault();
    
    if (!createTitle.trim() || !createContent.trim() || !selectedHotel) {
      setModalNotification({ message: 'Vui lòng nhập đầy đủ tiêu đề, nội dung và chọn khách sạn!', type: 'error' });
      return;
    }

    try {
      setLoadingData(true);
      
      // Prepare all blog images (thumbnail + blog_images)
      const allImages = [];
      if (createThumbnail) allImages.push(createThumbnail);
      allImages.push(...createBlogImages);

      // Auto-generate slug if not provided
      const finalSlug = createSlug.trim() || createTitle.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Chuẩn bị dữ liệu blog theo cấu trúc database
      // Nếu là staff thì tạo blog với status = draft, nếu là owner thì pending
      const initialStatus = user?.roleId === USER_ROLES.HOTEL_STAFF ? 'draft' : 'pending';
      
      const blogData = {
        hotel_id: selectedHotel,
        title: createTitle.trim(),
        slug: finalSlug,
        content: createContent.trim(),
        excerpt: createExcerpt.trim() || null,
        tags: createTags.trim() || null,
        meta_description: createMetaDescription.trim() || null,
        featured_image_url: createThumbnail || null,
        status: initialStatus,
        author_id: user?.userId || user?.id || user?.user_id,
        blog_images: allImages.map((url, index) => ({
          image_url: url,
          order_index: index,
          caption: ''
        }))
      };

      console.log('🟢 DEBUG blogData:', blogData);

      // Gọi API tạo blog
      const response = await blogService.createBlog(blogData);
      console.log('✅ Blog created successfully:', response);
      
      // Lưu blog_images vào database nếu có
      if (response?.data?.blogId && allImages.length > 0) {
        console.log('📸 Saving blog images to database...');
        try {
          const imageData = allImages.map((url, index) => ({
            image_url: url,
            caption: '',
            order_index: index
          }));
          await blogService.addBlogImages(response.data.blogId, imageData);
          console.log('✅ Blog images saved successfully');
        } catch (imgError) {
          console.error('⚠️ Error saving blog images:', imgError);
          // Không throw error vì blog đã được tạo thành công
        }
      }
      
      // Refresh danh sách posts
      await refreshPosts();
      
      // Reset form and close modal
      setCreateTitle('');
      setCreateContent('');
      setCreateExcerpt('');
      setCreateSlug('');
      setCreateTags('');
      setCreateMetaDescription('');
      setCreateThumbnail(null);
      setCreateBlogImages([]);
      setCreateThumbnailUrl('');
      setCreateBlogImageUrl('');
      setShowCreateModal(false);
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
    pending: 0,
    archived: 0,
    rejected: 0
  };

  // Đếm số lượng bài viết theo từng trạng thái
  // NOTE: Không filter theo admin nữa, vì tất cả blog đã được filter theo hotel_id từ API
  posts.forEach(post => {
    // Đếm tổng số
    statusCounts.all++;
    
    // Đếm theo từng trạng thái
    const status = post.status?.toLowerCase();
    if (status === 'published') statusCounts.published++;
    else if (status === 'draft') statusCounts.draft++;
    else if (status === 'pending') statusCounts.pending++;
    else if (status === 'archived') statusCounts.archived++;
    else if (status === 'rejected') statusCounts.rejected++;
  });

  // Filter and sort posts
  const filteredAndSortedPosts = posts
    .filter(post => {
      // NOTE: Không lọc theo author/username nữa vì đã lọc theo hotel_id rồi
      // Tất cả blog trả về từ API getBlogsByHotel đều thuộc về khách sạn này
      // Chỉ cần lọc theo statusFilter và searchTerm
      
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
        author: blog.username || blog.author || 'Ẩn danh'
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
    
    const currentStatus = selectedBlog.status;
    
    // Kiểm tra logic chuyển trạng thái
    // draft, rejected không được chuyển trạng thái từ detail view
    if (['draft', 'rejected'].includes(currentStatus)) {
      setModalNotification({ message: 'Bài viết này không thể thay đổi trạng thái!', type: 'error' });
      return;
    }
    
    // pending chỉ có thể -> published hoặc rejected
    if (currentStatus === 'pending' && !['published', 'rejected'].includes(newStatus)) {
      setModalNotification({ message: 'Bài viết chờ duyệt chỉ có thể Xuất bản hoặc Từ chối!', type: 'error' });
      return;
    }
    
    // published chỉ có thể -> archived hoặc rejected
    if (currentStatus === 'published' && !['archived', 'rejected'].includes(newStatus)) {
      setModalNotification({ message: 'Bài viết đã xuất bản chỉ có thể chuyển sang Lưu trữ hoặc Từ chối!', type: 'error' });
      return;
    }
    
    // archived chỉ có thể -> published
    if (currentStatus === 'archived' && newStatus !== 'published') {
      setModalNotification({ message: 'Bài viết đã lưu trữ chỉ có thể chuyển sang Xuất bản!', type: 'error' });
      return;
    }
    
    // ✅ FIX: Phân quyền - bỏ qua các giá trị undefined
    const isAdmin = user && user.roleId === 1;
    const isAuthorOfBlog = (selectedBlog.authorId && user?.userId && selectedBlog.authorId === user.userId) ||
                          (selectedBlog.author_id && user?.userId && selectedBlog.author_id === user.userId) ||
                          (selectedBlog.authorId && user?.id && selectedBlog.authorId === user.id);
    const isHotelOwner = user && user.roleId === 2 && isAuthorOfBlog;
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
      slug: blog.slug || '',
      excerpt: blog.excerpt || '',
      tags: blog.tags || '',
      metaDescription: blog.metaDescription || blog.meta_description || '',
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
        slug: editForm.slug.trim() || null,
        excerpt: editForm.excerpt.trim() || null,
        tags: editForm.tags.trim() || null,
        meta_description: editForm.metaDescription.trim() || null,
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
    setEditForm({ 
      title: '', 
      content: '', 
      slug: '',
      excerpt: '',
      tags: '',
      metaDescription: '',
      status: 'draft' 
    });
    setEditImages([]);
    setShowEditImageUrlDialog(false);
    setEditImageUrl('');
  };

  // Hàm submit blog từ draft sang pending (cho staff)
  const handleSubmitBlogForReview = async (blog) => {
    try {
      await blogService.updateBlogStatus(blog.blogId || blog.blog_id || blog.id, 'pending');
      setModalNotification({ message: '✅ Đã nộp bài viết để chờ duyệt!', type: 'success' });
      refreshPosts();
    } catch (error) {
      console.error('❌ Error submitting blog:', error);
      setModalNotification({ message: '❌ Lỗi nộp bài viết!', type: 'error' });
    }
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
    console.log('📊 [Main] Posts state changed!');
    console.log('📊 [Main] Total posts:', posts.length);
    console.log('📊 [Main] Posts data:', posts);
    if (posts.length > 0) {
      console.log('🔄 [Main] Posts changed, loading images for', posts.length, 'posts');
      posts.forEach((post, idx) => {
        console.log(`📋 Post ${idx + 1}:`, {
          id: post.blogId || post.id,
          title: post.title,
          author: post.username,
          status: post.status
        });
      });
      loadAllBlogImages(posts);
    } else {
      console.log('⚠️ [Main] Posts array is empty!');
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

  // Hàm xử lý hiển thị panel bình luận (thay thế modal)
  const handleShowComments = async (blog) => {
    console.log('🚀 [handleShowComments] Starting to load comments for blog:', blog);
    
    // Reset TOÀN BỘ state trước khi mở panel mới
    console.log('🔄 Resetting all comment states before opening new panel');
    setComments([]);
    setNewComment('');
    setReplyingTo(null);
    setReplyContent('');
    setExpandedComments(new Set());
    setCommentsPage(1);
    setTotalComments(0);
    setHasMoreComments(false);
    setLoadingMoreComments(false);
    setCommentSortBy('newest');
    setCommentFilter('all');
    
    setSelectedBlogForComments(blog);
    setShowCommentsPanel(true);
    setCommentsLoading(true);
    
    try {
      await loadCommentsData(blog, 1, true); // true = reset comments
    } catch (error) {
      console.error('❌ [handleShowComments] Error:', error);
      setModalNotification({ message: 'Lỗi khi tải bình luận: ' + error.message, type: 'error' });
    } finally {
      setCommentsLoading(false);
    }
  };

  // Hàm load dữ liệu bình luận (dùng chung cho first load và infinite scroll)
  const loadCommentsData = async (blog, page = 1, resetComments = false) => {
    const blogId = blog.blogId || blog.blog_id || blog.id;
    const params = `page=${page}&limit=${commentsPerPage}&sort=${commentSortBy}&filter=${commentFilter}`;
    
    console.log('📡 [loadCommentsData] Loading page:', page, 'params:', params);
    
    const response = await commentService.getBlogCommentsWithUser(blogId, params);
    
    // Parse response data
    let commentsData = [];
    let total = 0;
    let parentTotal = 0; // Số lượng parent comments (không tính replies)
    
    if (Array.isArray(response)) {
      commentsData = response;
      // Đếm chỉ parent comments (không có parentCommentId)
      parentTotal = response.filter(c => !c.parentCommentId && !c.parent_comment_id).length;
      total = parentTotal;
    } else if (response?.data && Array.isArray(response.data)) {
      commentsData = response.data;
      // Đếm chỉ parent comments
      parentTotal = response.data.filter(c => !c.parentCommentId && !c.parent_comment_id).length;
      total = response.totalParents || response.parentTotal || parentTotal;
    } else if (response?.comments && Array.isArray(response.comments)) {
      commentsData = response.comments;
      // Đếm chỉ parent comments
      parentTotal = response.comments.filter(c => !c.parentCommentId && !c.parent_comment_id).length;
      total = response.totalParents || response.parentTotal || parentTotal;
    }
    
    const organizedComments = organizeCommentsTree(commentsData, commentFilter);
    
    if (resetComments) {
      setComments(organizedComments);
    } else {
      setComments(prev => [...prev, ...organizedComments]);
    }
    
    setTotalComments(total);
    // Check if there are more comments: current page results >= perPage AND we haven't loaded all yet
    const currentLoadedCount = resetComments ? organizedComments.length : comments.length + organizedComments.length;
    setHasMoreComments(organizedComments.length >= commentsPerPage && currentLoadedCount < total);
    setCommentsPage(page);
    
    return { commentsData, total };
  };

  // Hàm load thêm bình luận (Infinite scroll)
  const handleLoadMoreComments = async () => {
    if (loadingMoreComments || !hasMoreComments || !selectedBlogForComments) return;
    
    setLoadingMoreComments(true);
    const nextPage = commentsPage + 1;
    
    try {
      await loadCommentsData(selectedBlogForComments, nextPage, false); // false = append comments
    } catch (error) {
      console.error('❌ Error loading more comments:', error);
      setModalNotification({ message: 'Lỗi khi tải thêm bình luận', type: 'error' });
    } finally {
      setLoadingMoreComments(false);
    }
  };

  // Hàm đóng panel bình luận
  const handleCloseCommentsPanel = () => {
    console.log('📤 Closing comments panel - resetting ALL states');
    setShowCommentsPanel(false);
    setSelectedBlogForComments(null);
    setComments([]);
    setNewComment('');
    setReplyingTo(null);
    setReplyContent('');
    setExpandedComments(new Set());
    // Reset states
    setCommentsPage(1);
    setTotalComments(0);
    setHasMoreComments(false);
    setLoadingMoreComments(false);
    // Reset filter và sort về mặc định
    setCommentSortBy('newest');
    setCommentFilter('all');
    setCommentsLoading(false);
  };

  // Hàm thay đổi sort/filter và reload comments
  const handleCommentSortChange = async (newSort) => {
    if (newSort === commentSortBy) return;
    
    setCommentSortBy(newSort);
    setCommentsLoading(true);
    
    try {
      await loadCommentsData(selectedBlogForComments, 1, true);
    } catch (error) {
      setModalNotification({ message: 'Lỗi khi tải bình luận', type: 'error' });
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCommentFilterChange = async (newFilter) => {
    if (newFilter === commentFilter) return;
    
    console.log('🔄 Changing filter from', commentFilter, 'to', newFilter);
    setCommentFilter(newFilter);
    setCommentsLoading(true);
    
    try {
      // Fetch lại data với filter mới
      const blogId = selectedBlogForComments.blogId || selectedBlogForComments.blog_id || selectedBlogForComments.id;
      const params = `page=1&limit=${commentsPerPage}&sort=${commentSortBy}&filter=${newFilter}`;
      const response = await commentService.getBlogCommentsWithUser(blogId, params);
      
      let commentsData = [];
      if (Array.isArray(response)) {
        commentsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        commentsData = response.data;
      }
      
      // Organize ngay với newFilter (không chờ state update)
      const organizedComments = organizeCommentsTree(commentsData, newFilter);
      setComments(organizedComments);
      setCommentsPage(1);
    } catch (error) {
      setModalNotification({ message: 'Lỗi khi tải bình luận', type: 'error' });
    } finally {
      setCommentsLoading(false);
    }
  };

  // Hàm tổ chức comments thành cây (Facebook-style)
  const organizeCommentsTree = (comments, filterStatus = commentFilter) => {
    // 🔥 FILTER CHỈ PARENT COMMENTS (không filter replies)
    // Nếu filter theo status, chỉ lọc parent comments, GIỮ NGUYÊN replies
    let parentComments = comments.filter(c => !c.parentCommentId && !c.parent_comment_id);
    let allReplies = comments.filter(c => c.parentCommentId || c.parent_comment_id);
    
    // Apply filter chỉ cho parent comments (dùng filterStatus parameter)
    if (filterStatus && filterStatus !== 'all') {
      const originalCount = parentComments.length;
      parentComments = parentComments.filter(c => c.status === filterStatus);
      console.log(`🔍 Filtered PARENT comments from ${originalCount} to ${parentComments.length} with status: ${filterStatus}`);
      console.log(`🔍 Keeping ALL ${allReplies.length} replies (not filtered)`);
    }
    
    // Combine: filtered parents + ALL replies
    const filteredComments = [...parentComments, ...allReplies];
    
    const commentMap = {};
    const rootComments = [];

    // First pass: create a map of all comments
    filteredComments.forEach(comment => {
      commentMap[comment.commentId || comment.comment_id] = {
        ...comment,
        replies: []
      };
    });

    // Second pass: organize into tree structure (chỉ từ filtered comments)
    filteredComments.forEach(comment => {
      const commentObj = commentMap[comment.commentId || comment.comment_id];
      if (comment.parentCommentId || comment.parent_comment_id) {
        const parentId = comment.parentCommentId || comment.parent_comment_id;
        const parent = commentMap[parentId];
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    // Sort ONLY parent comments by newest/oldest
    // Keep child replies in chronological order (as returned from API)
    rootComments.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at);
      const dateB = new Date(b.createdAt || b.created_at);
      
      if (commentSortBy === 'newest') {
        return dateB - dateA; // Mới nhất trên cùng (21/08 trước 15/08)
      } else if (commentSortBy === 'oldest') {
        return dateA - dateB; // Cũ nhất trên cùng (15/08 trước 21/08)
      } else if (commentSortBy === 'popular') {
        // Sort by like count (popular)
        const likesA = a.likeCount || a.like_count || 0;
        const likesB = b.likeCount || b.like_count || 0;
        return likesB - likesA;
      }
      return 0;
    });

    // Keep replies in chronological order (do not sort)
    // Replies appear in the order they were created

    return rootComments;
  };

  // Hàm đóng modal bình luận
  const handleCloseCommentsModal = () => {
    setShowCommentsPanel(false);
    setSelectedBlogForComments(null);
    setComments([]);
    setNewComment('');
    setReplyingTo(null);
    setReplyContent('');
    setExpandedComments(new Set());
    // Reset pagination states
    setCommentsPage(1);
    setTotalComments(0);
    setHasMoreComments(false);
    setLoadingMoreComments(false);
  };

  // Hàm gửi bình luận mới
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const blogId = selectedBlogForComments.blogId || selectedBlogForComments.blog_id || selectedBlogForComments.id;
      await commentService.createComment(blogId, {
        content: newComment.trim()
      });
      
      setNewComment('');
      setModalNotification({ message: '✅ Đã gửi bình luận!', type: 'success' });
      
      // Reload comments from the beginning để thấy bình luận mới (Facebook-style refresh)
      setCommentsLoading(true);
      try {
        await loadCommentsData(selectedBlogForComments, 1, true);
      } finally {
        setCommentsLoading(false);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      setModalNotification({ message: 'Lỗi khi gửi bình luận: ' + error.message, type: 'error' });
    }
  };

  // Hàm trả lời bình luận
  const handleReplyToComment = async () => {
    if (!replyContent.trim() || !replyingTo) return;
    
    try {
      const blogId = selectedBlogForComments.blogId || selectedBlogForComments.blog_id || selectedBlogForComments.id;
      await commentService.replyComment(blogId, replyingTo.commentId || replyingTo.comment_id, {
        content: replyContent.trim(),
        autoApprove: true
      });
      
      setReplyContent('');
      setReplyingTo(null);
      setModalNotification({ message: '✅ Đã trả lời bình luận!', type: 'success' });
      
      // Auto-expand the parent comment to show new reply
      const parentId = replyingTo.commentId || replyingTo.comment_id;
      setExpandedComments(prev => {
        const newSet = new Set(prev);
        newSet.add(parentId);
        return newSet;
      });
      
      // Reload comments from the beginning để thấy reply mới (Facebook-style refresh)
      setCommentsLoading(true);
      try {
        await loadCommentsData(selectedBlogForComments, 1, true);
      } finally {
        setCommentsLoading(false);
      }
    } catch (error) {
      console.error('Error replying to comment:', error);
      setModalNotification({ message: 'Lỗi khi trả lời bình luận: ' + error.message, type: 'error' });
    }
  };

  // Hàm toggle reply form
  const toggleReply = (comment) => {
    if (replyingTo && (replyingTo.commentId === comment.commentId || replyingTo.comment_id === comment.comment_id)) {
      setReplyingTo(null);
      setReplyContent('');
    } else {
      setReplyingTo(comment);
      setReplyContent('');
    }
  };

  // Hàm toggle expand/collapse comments
  const toggleCommentExpansion = (commentId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  // Hàm format thời gian
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // Component Reply Form cho parent comments với local state
  const ParentReplyForm = ({ comment, user, onCancel, onSubmit }) => {
    const [localContent, setLocalContent] = useState('');
    
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
            {(user?.fullName || user?.username || 'Y')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder={`Trả lời ${comment.fullName || comment.username || 'người dùng'}...`}
              className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex items-center justify-end space-x-1 mt-2">
              <button
                onClick={() => {
                  setLocalContent('');
                  onCancel();
                }}
                className="px-2 py-1 text-gray-600 hover:text-gray-800 text-xs"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (localContent.trim()) {
                    onSubmit(localContent);
                    setLocalContent('');
                  }
                }}
                disabled={!localContent.trim()}
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Send className="w-3 h-3 mr-1" />
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔄 Component đệ quy để render comment ở mọi tầng
  const RenderCommentRecursive = ({ comment, depth }) => {
    const commentId = comment.commentId || comment.comment_id;
    const isExpanded = expandedComments.has(commentId);
    const isReplying = replyingTo && (replyingTo.commentId === commentId || replyingTo.comment_id === commentId);
    
    // Local reply content for THIS comment only (không share giữa các comments)
    const [localReplyContent, setLocalReplyContent] = useState('');
    
    // Màu avatar theo độ sâu
    const avatarColors = [
      'from-green-500 to-teal-500',    // depth 1
      'from-purple-500 to-pink-500',   // depth 2
      'from-orange-500 to-red-500',    // depth 3
      'from-indigo-500 to-blue-500',   // depth 4+
    ];
    const avatarColor = avatarColors[Math.min(depth - 1, avatarColors.length - 1)];
    
    return (
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className={`w-6 h-6 bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>
            {(comment.fullName || comment.username || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h5 className="text-xs font-semibold text-gray-900 truncate">
                {comment.fullName || comment.username || 'Người dùng'}
              </h5>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt || comment.created_at)}
              </span>
            </div>
            <p className="text-xs text-gray-700 mt-1 break-words">{comment.content}</p>
            
            {/* Actions: Trả lời và Xem replies */}
            <div className="flex items-center space-x-3 text-xs mt-1">
              <button
                onClick={() => toggleReply(comment)}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {isReplying ? '✕ Hủy' : '↩️ Trả lời'}
              </button>
              
              {comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => toggleCommentExpansion(commentId)}
                  className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  {isExpanded ? '🔼 Ẩn' : `🔽 ${comment.replies.length} phản hồi`}
                </button>
              )}
            </div>

            {/* Reply Form - Dùng localReplyContent riêng */}
            {isReplying && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex space-x-2">
                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {(user?.fullName || user?.username || 'Y')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={localReplyContent}
                      onChange={(e) => setLocalReplyContent(e.target.value)}
                      placeholder={`Trả lời ${comment.fullName || comment.username || 'người dùng'}...`}
                      className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setLocalReplyContent('');
                        }}
                        className="px-2 py-1 text-gray-600 hover:text-gray-800 text-xs"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => {
                          // Gọi reply với localReplyContent
                          setReplyContent(localReplyContent);
                          handleReplyToComment();
                          setLocalReplyContent('');
                        }}
                        disabled={!localReplyContent.trim()}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Gửi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nested Replies - Đệ quy vô hạn */}
            {comment.replies && comment.replies.length > 0 && isExpanded && (
              <div className="mt-2 pl-3 space-y-2 border-l-2 border-gray-200">
                {comment.replies.map((nestedReply) => (
                  <RenderCommentRecursive
                    key={nestedReply.commentId || nestedReply.comment_id}
                    comment={nestedReply}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
            {/* Hotel selector: chỉ hiển thị cho owner, staff tự động load hotel của mình */}
            {user?.roleId === USER_ROLES.HOTEL_OWNER && (
              <div className="mt-3 flex items-center space-x-3">
                <label className="text-sm text-gray-600">Chọn khách sạn:</label>
                <select
                  value={selectedHotel}
                  onChange={(e) => handleHotelChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={loadingData || hotelLoading}
                >
                  <option value="">{loadingData || hotelLoading ? 'Đang tải...' : 'Chọn khách sạn...'}</option>
                  {hotels.map(hotel => {
                    const _id = hotel.hotel_id || hotel.hotelId || hotel.id || hotel._id || '';
                    const city = hotel.city ? ` - ${hotel.city}` : '';
                    const status = hotel.status || hotel.state || (hotel.active === true ? 'active' : (hotel.active === false ? 'inactive' : ''));
                    const statusText = status ? ` (${status})` : '';
                    return (
                      <option key={_id} value={_id}>
                        {hotel.name}{city}{statusText}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
            {/* Hiển thị tên hotel cho staff */}
            {user?.roleId === USER_ROLES.HOTEL_STAFF && hotels.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-gray-600">Khách sạn: </span>
                <span className="text-sm font-semibold text-gray-900">{hotels[0]?.name || hotels[0]?.hotelName || 'Đang tải...'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats removed - bình luận và bài viết */}

        {/* Create Form */}
        {/* Create Blog Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Tạo bài viết mới</h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateTitle('');
                    setCreateContent('');
                    setCreateExcerpt('');
                    setCreateSlug('');
                    setCreateTags('');
                    setCreateMetaDescription('');
                    setCreateThumbnail(null);
                    setCreateBlogImages([]);
                    setCreateThumbnailUrl('');
                    setCreateBlogImageUrl('');
                  }}
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
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài viết..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Content Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                  <textarea
                    value={createContent}
                    onChange={(e) => setCreateContent(e.target.value)}
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
                    value={createSlug}
                    onChange={(e) => setCreateSlug(e.target.value)}
                    placeholder="duong-dan-url (tự động tạo từ tiêu đề)"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Excerpt Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tóm tắt</label>
                  <textarea
                    value={createExcerpt}
                    onChange={(e) => setCreateExcerpt(e.target.value)}
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
                      value={createTags}
                      onChange={(e) => setCreateTags(e.target.value)}
                      placeholder="du lịch, khách sạn, resort"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                    <input
                      type="text"
                      value={createMetaDescription}
                      onChange={(e) => setCreateMetaDescription(e.target.value)}
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
                    {createThumbnail ? (
                      <div className="relative">
                        <img 
                          src={createThumbnail} 
                          alt="Thumbnail" 
                          className="w-full h-48 object-cover rounded"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setCreateThumbnail(null)}
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
                          value={createThumbnailUrl}
                          onChange={(e) => setCreateThumbnailUrl(e.target.value)}
                          placeholder="Nhập URL ảnh đại diện..."
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (createThumbnailUrl.trim()) {
                              setCreateThumbnail(createThumbnailUrl.trim());
                              setCreateThumbnailUrl('');
                            }
                          }}
                          disabled={!createThumbnailUrl.trim()}
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
                        value={createBlogImageUrl}
                        onChange={(e) => setCreateBlogImageUrl(e.target.value)}
                        placeholder="Nhập URL ảnh bài viết..."
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (createBlogImageUrl.trim()) {
                            setCreateBlogImages(prev => [...prev, createBlogImageUrl.trim()]);
                            setCreateBlogImageUrl('');
                          }
                        }}
                        disabled={!createBlogImageUrl.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        + Thêm ảnh
                      </button>
                    </div>

                    {/* Images Grid */}
                    {createBlogImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {createBlogImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={img} 
                              alt={`Blog ${index + 1}`} 
                              className="w-full h-32 object-cover rounded"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Invalid'; }}
                            />
                            <button
                              type="button"
                              onClick={() => setCreateBlogImages(prev => prev.filter((_, i) => i !== index))}
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
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateTitle('');
                    setCreateContent('');
                    setCreateExcerpt('');
                    setCreateSlug('');
                    setCreateTags('');
                    setCreateMetaDescription('');
                    setCreateThumbnail(null);
                    setCreateBlogImages([]);
                    setCreateThumbnailUrl('');
                    setCreateBlogImageUrl('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loadingData || !createTitle.trim() || !createContent.trim() || !selectedHotel}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {loadingData ? 'Đang tạo...' : 'Tạo bài viết'}
                </button>
              </div>
            </div>
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
                  <option value="draft">Bản nháp ({statusCounts.draft})</option>
                  <option value="pending">Chờ duyệt ({statusCounts.pending})</option>
                  <option value="published">Đã xuất bản ({statusCounts.published})</option>
                  <option value="rejected">Bị từ chối ({statusCounts.rejected})</option>
                  <option value="archived">Đã lưu trữ ({statusCounts.archived})</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
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
                              <span>{blog.username || blog.author?.name || blog.author || 'Ẩn danh'}</span>
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
                              <div 
                                className="flex items-center space-x-1 cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => {
                                  console.log('🔍 Clicked comment for blog:', blog);
                                  console.log('📊 Blog ID variants:', {
                                    blogId: blog.blogId,
                                    blog_id: blog.blog_id,
                                    id: blog.id,
                                    commentCount: blog.commentCount,
                                    comment_count: blog.comment_count
                                  });
                                  handleShowComments(blog);
                                }}
                                title="Xem bình luận"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-blue-600 font-medium">{blog.commentCount || blog.comment_count || 0}</span>
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
                              {/* Kiểm tra xem blog có phải của user hiện tại không */}
                              {(() => {
                                // Debug: In ra để kiểm tra
                                console.log('🔍 Blog debug:', {
                                  blogTitle: blog.title,
                                  blogAuthorId: blog.authorId,
                                  blogAuthor_id: blog.author_id,
                                  userUserId: user?.userId,
                                  userId: user?.id,
                                  userRoleId: user?.roleId
                                });
                                
                                // ✅ FIX: Kiểm tra isAuthor - bỏ qua các giá trị undefined
                                const isAuthor = (blog.authorId && user?.userId && blog.authorId === user.userId) || 
                                                (blog.author_id && user?.userId && blog.author_id === user.userId) || 
                                                (blog.authorId && user?.id && blog.authorId === user.id) || 
                                                (blog.author_id && user?.id && blog.author_id === user.id);
                                
                                console.log('✅ isAuthor:', isAuthor);
                                
                                // Owner: Có quyền với tất cả blog
                                // Staff: Chỉ có quyền với blog của mình
                                const hasPermission = user?.roleId === USER_ROLES.HOTEL_OWNER || 
                                                     (user?.roleId === USER_ROLES.HOTEL_STAFF && isAuthor);
                                
                                console.log('🔑 hasPermission:', hasPermission);
                                
                                if (!hasPermission) return null;
                                
                                return (
                                  <>
                                    {/* Nút Submit cho staff nếu blog ở trạng thái draft và là tác giả */}
                                    {user?.roleId === USER_ROLES.HOTEL_STAFF && 
                                     blog.status === 'draft' && (
                                      <button
                                        onClick={() => handleSubmitBlogForReview(blog)}
                                        className="inline-flex items-center px-2 py-1 border border-green-500 text-green-700 bg-green-50 rounded hover:bg-green-100 text-xs font-medium transition-colors"
                                        title="Nộp bài để chờ duyệt"
                                      >
                                        <Send className="w-3 h-3 mr-1" />
                                        Nộp
                                      </button>
                                    )}
                                    
                                    {/* Nút Edit - Không hiển thị nếu blog đang pending (chỉ áp dụng với staff) */}
                                    {(user?.roleId === USER_ROLES.HOTEL_OWNER || blog.status !== 'pending') && (
                                      <button
                                        onClick={() => handleEditBlog(blog)}
                                        className="inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                                        title="Chỉnh sửa bài viết"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    {/* Nút Delete */}
                                    <button
                                      onClick={() => setShowDeleteConfirm(blog)}
                                      className="inline-flex items-center p-2 border border-transparent rounded-md text-orange-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                                      title="Xóa"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </>
                                );
                              })()}
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
                          <span className="text-gray-700 font-medium">{selectedBlog.username || selectedBlog.author}</span>
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
                            {(() => {
                              // ✅ FIX: Kiểm tra quyền - bỏ qua các giá trị undefined
                              const isAuthor = (selectedBlog.authorId && user?.userId && selectedBlog.authorId === user.userId) || 
                                              (selectedBlog.author_id && user?.userId && selectedBlog.author_id === user.userId) || 
                                              (selectedBlog.authorId && user?.id && selectedBlog.authorId === user.id) || 
                                              (selectedBlog.author_id && user?.id && selectedBlog.author_id === user.id);
                              
                              const canChangeStatus = user?.roleId === USER_ROLES.HOTEL_OWNER;
                              const canDelete = user?.roleId === USER_ROLES.HOTEL_OWNER || 
                                               (user?.roleId === USER_ROLES.HOTEL_STAFF && isAuthor);
                              
                              return (
                                <>
                                  {canChangeStatus ? (
                                    <>
                                      {/* Pending: Xuất bản hoặc Từ chối */}
                                      {selectedBlog.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => handleStatusChangeDetail('published')}
                                            disabled={detailLoading}
                                            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                            title="Xuất bản"
                                          >
                                            <CheckCircle className="h-5 w-5" />
                                          </button>
                                          <button
                                            onClick={() => handleStatusChangeDetail('rejected')}
                                            disabled={detailLoading}
                                            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                            title="Từ chối"
                                          >
                                            <XCircle className="h-5 w-5" />
                                          </button>
                                        </>
                                      )}
                                      
                                      {/* Published: Lưu trữ hoặc Từ chối */}
                                      {selectedBlog.status === 'published' && (
                                        <>
                                          <button
                                            onClick={() => handleStatusChangeDetail('archived')}
                                            disabled={detailLoading}
                                            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                            title="Lưu trữ"
                                          >
                                            <Archive className="h-5 w-5" />
                                          </button>
                                          <button
                                            onClick={() => handleStatusChangeDetail('rejected')}
                                            disabled={detailLoading}
                                            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                            title="Từ chối"
                                          >
                                            <XCircle className="h-5 w-5" />
                                          </button>
                                        </>
                                      )}
                                      
                                      {/* Archived: Khôi phục (Xuất bản) */}
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
                                      
                                      {/* Draft, Rejected: Không có action */}
                                      {['draft', 'rejected'].includes(selectedBlog.status) && (
                                        <div className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded-lg">
                                          Không thể thay đổi trạng thái
                                        </div>
                                      )}
                                    </>
                                  ) : !canDelete ? (
                                    <div className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">Không có quyền</div>
                                  ) : null}
                                  
                                  {/* Nút xóa - Chỉ hiển thị nếu có quyền */}
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

        {/* Comments Modal Panel - Centered & Larger */}
        {showCommentsPanel && selectedBlogForComments && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={handleCloseCommentsPanel}
            ></div>

            {/* Centered Modal Panel */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[85vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5 text-blue-200" />
                      <h2 className="text-lg font-semibold truncate">Bình luận</h2>
                    </div>
                    <p className="text-blue-200 text-sm mt-1 truncate">{selectedBlogForComments.title}</p>
                  </div>
                  <button
                    onClick={handleCloseCommentsPanel}
                    className="text-blue-200 hover:text-white hover:bg-blue-800 transition-all duration-200 p-1 rounded-full ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats & Controls */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-blue-200 text-sm">
                    {totalComments > 0 ? (
                      <span>💬 {totalComments} bình luận</span>
                    ) : (
                      <span>💭 Chưa có bình luận</span>
                    )}
                  </div>
                  
                  {/* Sort & Filter Controls */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={commentSortBy}
                      onChange={(e) => handleCommentSortChange(e.target.value)}
                      className="bg-blue-800 text-white text-xs rounded px-2 py-1 border border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
                      disabled={commentsLoading}
                    >
                      <option value="newest">Cũ nhất</option>
                      <option value="oldest">Mới nhất</option>
                      {/* <option value="popular">Phổ biến</option> */}
                    </select>
                    
                    <select
                      value={commentFilter}
                      onChange={(e) => handleCommentFilterChange(e.target.value)}
                      className="bg-blue-800 text-white text-xs rounded px-2 py-1 border border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-300"
                      disabled={commentsLoading}
                    >
                      <option value="all">Tất cả</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="rejected">Từ chối</option>
                      <option value="hidden">Đã ẩn</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Area với Infinite Scroll */}
              <div className="flex-1 overflow-y-auto">
                {commentsLoading && comments.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                      <p className="text-gray-600">Đang tải bình luận...</p>
                    </div>
                  </div>
                ) : comments.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {comments.map((comment, index) => (
                      <div key={comment.commentId || comment.comment_id} className="p-4 hover:bg-gray-50 transition-colors">
                        {/* Comment Item */}
                        <div className="flex space-x-3">
                          {/* Avatar */}
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {(comment.fullName || comment.username || comment.user?.full_name || 'U')[0].toUpperCase()}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* User Info */}
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {comment.fullName || comment.username || comment.user?.full_name || 'Người dùng'}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(comment.createdAt || comment.created_at)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                comment.status === 'approved' ? 'bg-green-100 text-green-700' :
                                comment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                comment.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                comment.status === 'hidden' ? 'bg-gray-100 text-gray-700' :
                                'bg-gray-100 text-gray-500'
                              }`}>
                                {comment.status === 'approved' ? '✓' :
                                 comment.status === 'pending' ? '⏳' : 
                                 comment.status === 'rejected' ? '✗' :
                                 comment.status === 'hidden' ? '👁️' : '?'}
                              </span>
                            </div>

                            {/* Comment Text */}
                            <div className="text-gray-700 text-sm leading-relaxed mb-2 break-words">
                              {comment.content}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-3 text-xs">
                              <button
                                onClick={() => toggleReply(comment)}
                                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                              >
                                {replyingTo && (replyingTo.commentId === comment.commentId || replyingTo.comment_id === comment.comment_id) 
                                  ? '✕ Hủy' : '↩️ Trả lời'}
                              </button>
                              
                              {comment.replies && comment.replies.length > 0 && (
                                <button
                                  onClick={() => toggleCommentExpansion(comment.commentId || comment.comment_id)}
                                  className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                                >
                                  {expandedComments.has(comment.commentId || comment.comment_id) 
                                    ? '🔼 Ẩn' : `🔽 ${comment.replies.length} phản hồi`}
                                </button>
                              )}
                            </div>

                            {/* Reply Form - CHỈ hiện nếu đúng comment này được chọn */}
                            {replyingTo && 
                             (replyingTo.commentId || replyingTo.comment_id) === (comment.commentId || comment.comment_id) && (
                              <ParentReplyForm 
                                comment={comment} 
                                user={user}
                                onCancel={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                onSubmit={(content) => {
                                  setReplyContent(content);
                                  handleReplyToComment();
                                }}
                              />
                            )}

                            {/* Replies - Fully Recursive (Đệ quy hoàn toàn) */}
                            {comment.replies && comment.replies.length > 0 && expandedComments.has(comment.commentId || comment.comment_id) && (
                              <div className="mt-3 space-y-2 pl-4 border-l-2 border-blue-200">
                                {comment.replies.map((reply) => (
                                  <RenderCommentRecursive 
                                    key={reply.commentId || reply.comment_id}
                                    comment={reply}
                                    depth={1}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Infinite Scroll Trigger */}
                    {hasMoreComments && totalComments > comments.length && (
                      <div className="p-4 text-center">
                        <button
                          onClick={handleLoadMoreComments}
                          disabled={loadingMoreComments}
                          className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm font-medium"
                        >
                          {loadingMoreComments ? (
                            <span className="flex items-center justify-center">
                              <Loader className="w-4 h-4 animate-spin mr-2" />
                              Đang tải...
                            </span>
                          ) : (
                            `⬇️ Tải thêm bình luận`
                          )}
                        </button>
                      </div>
                    )}

                    {!hasMoreComments && comments.length > 5 && (
                      <div className="p-4 text-center">
                        <div className="text-xs text-gray-500 bg-gray-50 py-2 px-4 rounded-lg inline-flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          Đã hiển thị tất cả bình luận
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Chưa có bình luận</h3>
                      <p className="text-xs text-gray-500">Hãy là người đầu tiên bình luận!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Comment Input (Sticky Footer) */}
              <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {(user?.fullName || user?.username || 'Y')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Viết bình luận của bạn..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {newComment.length}/500
                      </span>
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || newComment.length > 500}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Gửi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

  );
};

export default MarketingPage;