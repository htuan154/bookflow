// src/pages/admin/BlogManagement/BlogManagementPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BlogCard from '../../../components/blog/BlogCard';
import { 
    Search,
    Plus,
    XCircle,
    Building2,
    User
} from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import useAuth from '../../../hooks/useAuth';
import blogService from '../../../api/blog.service';
import { useToast } from '../../../hooks/useToast';
import Toast from '../../../components/common/Toast';

const BlogManagementPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { toast, showSuccess, showError, hideToast } = useToast();
    const {
        blogs,
        pagination,
        error,
        statistics,
        fetchStatistics,
        clearError,
        deleteBlog,
        getBlogsByRoleAdmin,
        fetchBlogsByStatus,
        updateBlogStatus,
    } = useBlogContext();

    const [currentStatus, setCurrentStatus] = useState('all');
    const [deleteModal, setDeleteModal] = useState({ open: false, blog: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // New state for blog sections
    const [activeSection, setActiveSection] = useState('admin'); // 'admin' or 'hotel'
    const [adminBlogs, setAdminBlogs] = useState([]);
    const [hotelBlogs, setHotelBlogs] = useState([]);
    const [loadingBlogs, setLoadingBlogs] = useState(false);

    // Load all blogs and separate them
    const loadAllBlogs = async () => {
        try {
            setLoadingBlogs(true);
            
            // Get ALL blogs (admin + hotel) using getAllBlogs
            const response = await blogService.getAllBlogs({ 
                limit: 1000 // Get all blogs
            });
            
            console.log('📦 loadAllBlogs response:', response);
            
            // Backend trả về status: 'success' hoặc success: true
            if ((response?.status === 'success' || response?.success === true) && response?.data) {
                const allBlogs = response.data;
                
                console.log('📋 All blogs received:', allBlogs.length);
                console.log('📋 First blog sample:', allBlogs[0]);
                
                // Separate admin blogs (hotel_id = null) and hotel blogs (hotel_id exists)
                const adminBlogsList = allBlogs.filter(blog => !blog.hotelId && !blog.hotel_id);
                const hotelBlogsList = allBlogs.filter(blog => blog.hotelId || blog.hotel_id);
                
                setAdminBlogs(adminBlogsList);
                setHotelBlogs(hotelBlogsList);
                
                console.log('📊 Blogs separated:');
                console.log('  - Admin blogs:', adminBlogsList.length);
                console.log('  - Hotel blogs:', hotelBlogsList.length);
            } else {
                console.warn('⚠️ Unexpected response format:', response);
            }
        } catch (error) {
            console.error('Failed to load blogs:', error);
        } finally {
            setLoadingBlogs(false);
        }
    };
    
    // Load statistics
    const loadStatistics = async () => {
        try {
            await fetchStatistics({ keyword: searchTerm });
        } catch (error) {
            console.error('Failed to load blog statistics:', error);
        }
    };

    // Initial load
    useEffect(() => {
        if (isAuthenticated) {
            loadAllBlogs();
            loadStatistics();
        }
    }, [isAuthenticated]);

    // Nếu chưa đăng nhập, hiển thị message
    if (!isAuthenticated) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-yellow-800 mb-2">
                            Yêu cầu đăng nhập
                        </h3>
                        <p className="text-yellow-700 mb-4">
                            Bạn cần đăng nhập với quyền admin để truy cập trang này.
                        </p>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                            Đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusCounts = () => {
        if (!statistics) {
            return {
                all: 0,
                draft: 0,
                pending: 0,
                published: 0,
                archived: 0,
                rejected: 0
            };
        }
        
        return {
            all: statistics.total || 0,
            draft: statistics.draft || 0,
            pending: statistics.pending || 0,
            published: statistics.published || 0,
            archived: statistics.archived || 0,
            rejected: statistics.rejected || 0
        };
    };

    const statusCounts = getStatusCounts();

    // Handler khi click tab - chỉ đổi currentStatus
    const handleStatusChange = (status) => {
        setCurrentStatus(status);
    };

    // Handler cho các action từ BlogList
    const handleBlogAction = async (action, blog) => {
        console.log('📋 Blog action:', action);
        console.log('📋 Full blog object:', JSON.stringify(blog, null, 2));
        
        if (!blog) {
            console.error('❌ No blog object provided');
            alert('Lỗi: Không có thông tin bài viết');
            return;
        }
        
        // Get blog ID
        const getBlogId = (blogObj) => {
            if (!blogObj) return null;
            if (typeof blogObj === 'string') return blogObj;
            
            const candidates = [
                blogObj.blogId,
                blogObj.blog_id,
                blogObj.id,
                blogObj._id
            ];

            for (const candidate of candidates) {
                if (candidate && typeof candidate === 'string' && candidate.length > 0) {
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (uuidRegex.test(candidate)) {
                        return candidate;
                    }
                }
            }
            return null;
        };
        
        const blogId = getBlogId(blog);
        
        if (!blogId && action !== 'create') {
            console.error('❌ Could not extract valid blog_id from:', blog);
            alert('Lỗi: Không tìm thấy blog_id hợp lệ');
            return;
        }
        
        switch (action) {
            case 'create':
                navigate('/admin/blog-management/create');
                break;
            case 'edit':
                // Check if blog is admin blog (hotel_id = null)
                const isAdminBlog = !blog.hotelId && !blog.hotel_id;
                if (!isAdminBlog) {
                    showError('Chỉ có thể chỉnh sửa blog của admin. Blog của khách sạn không thể chỉnh sửa.');
                    return;
                }
                console.log('🔧 Navigating to edit with blog_id:', blogId);
                navigate(`/admin/blog-management/edit/${blogId}`);
                break;
            case 'view':
                console.log('🔍 Navigating to view with blog_id:', blogId);
                navigate(`/admin/blog-management/view/${blogId}`);
                break;
            case 'delete':
                setDeleteModal({ open: true, blog });
                break;
            case 'changeStatus':
                try {
                    await updateBlogStatus(blog.blogId || blog.id, blog.newStatus);
                    await loadAllBlogs();
                    await fetchStatistics();
                    showSuccess('Cập nhật trạng thái thành công!');
                } catch (err) {
                    showError('Cập nhật trạng thái thất bại: ' + (err?.message || 'Lỗi không xác định'));
                }
                break;
            default:
                console.log('❓ Unknown action:', action);
        }
    };

    // Xác nhận xóa
    const handleConfirmDelete = async () => {
        const blog = deleteModal.blog;
        const blogId = blog?.blogId || blog?.blog_id || blog?.id || blog?.ID;
        
        // Check if this is an admin blog or hotel blog
        const isAdminBlog = !blog.hotelId && !blog.hotel_id;
        
        try {
            if (isAdminBlog) {
                // Admin blog: permanent delete
                await deleteBlog(blogId);
                showSuccess('Xóa bài viết thành công!');
            } else {
                // Hotel blog: change status to rejected
                await updateBlogStatus(blogId, 'rejected');
                showSuccess('Blog của khách sạn đã được đổi trạng thái thành "rejected"');
            }
            
            // Reload blogs
            await loadAllBlogs();
            await fetchStatistics();
            setDeleteModal({ open: false, blog: null });
        } catch (err) {
            showError('Xóa bài viết thất bại: ' + (err?.message || 'Lỗi không xác định'));
        }
    };

    // Hủy xóa
    const handleCancelDelete = () => {
        setDeleteModal({ open: false, blog: null });
    };

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <XCircle className="h-6 w-6 text-red-600" />
                            <div>
                                <h3 className="text-lg font-medium text-red-800">
                                    Có lỗi xảy ra
                                </h3>
                                <p className="text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                clearError();
                                loadStatistics();
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Get current blog list based on active section
    const getCurrentBlogs = () => {
        return activeSection === 'admin' ? adminBlogs : hotelBlogs;
    };

    return (
        <div className="space-y-6 w-full max-w-7xl mx-auto">
            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                    duration={toast.duration}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý bài viết
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý bài viết của admin và khách sạn
                    </p>
                </div>
                
                <button
                    onClick={() => navigate('/admin/blog-management/create')}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                    <Plus className="h-4 w-4" />
                    <span>Tạo bài viết mới</span>
                </button>
            </div>

            {/* Section Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveSection('admin')}
                        className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                            activeSection === 'admin'
                                ? 'border-b-2 border-orange-600 text-orange-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <User className="h-5 w-5" />
                        <span>Blog của Admin</span>
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                            {adminBlogs.length}
                        </span>
                    </button>
                    
                    <button
                        onClick={() => setActiveSection('hotel')}
                        className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                            activeSection === 'hotel'
                                ? 'border-b-2 border-orange-600 text-orange-600'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Building2 className="h-5 w-5" />
                        <span>Blog của Khách sạn</span>
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {hotelBlogs.length}
                        </span>
                    </button>
                </div>

                {/* Blog List */}
                <div className="p-6">
                    {loadingBlogs ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Đang tải bài viết...</p>
                        </div>
                    ) : getCurrentBlogs().length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                {activeSection === 'admin' ? <User className="h-12 w-12 mx-auto" /> : <Building2 className="h-12 w-12 mx-auto" />}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Chưa có bài viết nào
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {activeSection === 'admin' 
                                    ? 'Chưa có bài viết nào của admin'
                                    : 'Chưa có bài viết nào từ khách sạn'
                                }
                            </p>
                            {activeSection === 'admin' && (
                                <button
                                    onClick={() => navigate('/admin/blog-management/create')}
                                    className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Tạo bài viết đầu tiên</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {getCurrentBlogs().map((blog) => {
                                const isHotelBlog = !!(blog.hotelId || blog.hotel_id);
                                return (
                                    <BlogCard
                                        key={blog.blogId || blog.id}
                                        blog={blog}
                                        showActions={true}
                                        adminView={true}
                                        isAdmin={true}
                                        showEditButton={!isHotelBlog}
                                        showStatusActions={!isHotelBlog}
                                        onEdit={!isHotelBlog ? (blog) => handleBlogAction('edit', blog) : undefined}
                                        onView={(blog) => handleBlogAction('view', blog)}
                                        onDelete={(blog) => handleBlogAction('delete', blog)}
                                        onChangeStatus={!isHotelBlog ? (blogId, newStatus) => handleBlogAction('changeStatus', { blogId, newStatus }) : undefined}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                        <h2 className="text-lg font-semibold mb-4 text-orange-700">Xác nhận</h2>
                        <p className="mb-6 text-gray-700">
                            {(() => {
                                const isAdminBlog = !deleteModal.blog?.hotelId && !deleteModal.blog?.hotel_id;
                                if (isAdminBlog) {
                                    return (
                                        <>
                                            Bạn có chắc muốn <b className="text-red-600">xóa vĩnh viễn</b> bài viết{' '}
                                            <b>{deleteModal.blog?.title || 'này'}</b>?
                                            <br />
                                            <span className="text-sm text-red-600 mt-2 block">
                                                Thao tác này không thể hoàn tác!
                                            </span>
                                        </>
                                    );
                                } else {
                                    return (
                                        <>
                                            Bạn có chắc muốn <b className="text-yellow-600">đổi trạng thái</b> bài viết{' '}
                                            <b>{deleteModal.blog?.title || 'này'}</b> thành <b>"Rejected"</b>?
                                            <br />
                                            <span className="text-sm text-gray-600 mt-2 block">
                                                Bài viết của khách sạn sẽ không bị xóa vĩnh viễn.
                                            </span>
                                        </>
                                    );
                                }
                            })()}
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogManagementPage;