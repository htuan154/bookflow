// src/pages/admin/BlogManagement/BlogManagementPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BlogList from '../../../components/blog/BlogList';
import { 
    FileText, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    Archive
} from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import useAuth from '../../../hooks/useAuth';

const BlogManagementPage = () => {
    const navigate = useNavigate();
    const {  isAuthenticated } = useAuth();
    const {
        error,
        statistics,
        fetchStatistics,
        clearError,
        deleteBlog,
        fetchBlogs,
        fetchBlogsByStatus, // <-- thêm dòng này
        updateBlogStatus, // <-- Thêm dòng này nếu đã có hàm updateBlogStatus trong BlogContext
    } = useBlogContext();

    const [currentStatus, setCurrentStatus] = useState('all');
    const [deleteModal, setDeleteModal] = useState({ open: false, blog: null });
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Thêm state cho từ khóa tìm kiếm

    // Thêm state để lưu sortBy và sortOrder
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    // Định nghĩa hàm trước các hook
    const loadStatistics = async () => {
        try {
            await fetchStatistics();
        } catch (error) {
            console.error('Failed to load blog statistics:', error);
        }
    };

    // useEffect gọi loadStatistics
    useEffect(() => {
        // Xử lý điều kiện bên trong hook
        if (isAuthenticated) {
            loadStatistics();
        }
    }, [isAuthenticated]);

    // useEffect gọi fetchBlogsByStatus/fetchBlogs
    useEffect(() => {
        // Đã truyền keyword vào fetchBlogsByStatus và fetchBlogs
        if (isAuthenticated) {
            if (currentStatus !== 'all') {
                // Khi truyền vào fetchBlogsByStatus hoặc fetchBlogs để tìm kiếm theo tiêu đề, bạn phải dùng key là "keyword":
                fetchBlogsByStatus(currentStatus, { keyword: searchTerm });
            } else {
                fetchBlogs({ keyword: searchTerm });
            }
        }
    }, [isAuthenticated, currentStatus, searchTerm, fetchBlogsByStatus, fetchBlogs]);

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
        
        // Debug tất cả các trường có thể chứa ID
        console.log('📋 ID fields debug:');
        Object.keys(blog).forEach(key => {
            if (key.toLowerCase().includes('id')) {
                console.log(`  - ${key}:`, blog[key], typeof blog[key]);
            }
        });
        
        // Hàm helper để lấy blog ID - ƯU TIÊN blogId theo model Blog
        const getBlogId = (blogObj) => {
            if (!blogObj) return null;

            // Nếu truyền vào là string (blogId), trả về luôn
            if (typeof blogObj === 'string') {
                return blogObj;
            }

            // Ưu tiên blogId đầu tiên (theo model Blog)
            const candidates = [
                blogObj.blogId,     // Model Blog trả về (camelCase)
                blogObj.blog_id,    // Fallback từ database (snake_case)
                blogObj.id,         // Fallback chung
                blogObj._id         // Fallback MongoDB style
            ];

            for (const candidate of candidates) {
                if (candidate && typeof candidate === 'string' && candidate.length > 0) {
                    // Kiểm tra format UUID (36 ký tự với dấu gạch ngang)
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (uuidRegex.test(candidate)) {
                        console.log(`✅ Found valid ID: ${candidate} (from blogId field)`);
                        return candidate;
                    }
                }
            }

            return null;
        };
        
        const blogId = getBlogId(blog);
        console.log('📋 Final extracted blogId:', blogId);
        
        if (!blogId) {
            console.error('❌ Could not extract valid blog_id from:', blog);
            alert('Lỗi: Không tìm thấy blog_id hợp lệ');
            return;
        }
        
        switch (action) {
            case 'create':
                navigate('/admin/blog-management/create');
                break;
            case 'edit':
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
                // blog.newStatus là trạng thái mới
                try {
                    await updateBlogStatus(blog.blogId || blog.id, blog.newStatus);
                    await fetchBlogs();
                    await fetchStatistics(); // <-- Thêm dòng này để cập nhật số lượng ở các tab
                } catch (err) {
                    alert('Cập nhật trạng thái thất bại: ' + (err?.message || 'Lỗi không xác định'));
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
        try {
            await deleteBlog(blogId);
            await fetchBlogs();
            setDeleteModal({ open: false, blog: null });
            setDeleteSuccess(true);
            setTimeout(() => setDeleteSuccess(false), 2000); // Ẩn sau 2 giây
        } catch (err) {
            alert('Xóa bài viết thất bại: ' + (err?.message || 'Lỗi không xác định'));
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

    return (
        <div className="space-y-6">
            
            {/* Thông báo xóa thành công dạng modal giống xác nhận xóa */}
            {deleteSuccess && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full text-center border border-green-200">
                        <p className="mb-6 text-orange-800 font-medium">Xóa bài viết thành công!</p>
                        <div className="flex justify-center">
                            <button
                                onClick={() => setDeleteSuccess(false)}
                                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý bài viết
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý tất cả bài viết du lịch và đánh giá khách sạn
                    </p>
                </div>
                {/* Bộ lọc sortBy/sortOrder */}
                <div>
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={e => {
                            const [newSortBy, newSortOrder] = e.target.value.split('-');
                            setSortBy(newSortBy);
                            setSortOrder(newSortOrder);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="created_at-desc">Mới nhất</option>
                        <option value="created_at-asc">Cũ nhất</option>
                        <option value="title-asc">Tiêu đề A-Z</option>
                        <option value="title-desc">Tiêu đề Z-A</option>
                        <option value="view_count-desc">Lượt xem cao</option>
                        <option value="like_count-desc">Lượt thích cao</option>
                    </select>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {[
                            { 
                                key: 'all', 
                                label: 'Tất cả', 
                                icon: FileText,
                                color: 'text-gray-600' 
                            },
                            { 
                                key: 'draft', 
                                label: 'Nháp', 
                                icon: AlertCircle,
                                color: 'text-gray-600' 
                            },
                            { 
                                key: 'pending', 
                                label: 'Chờ duyệt', 
                                icon: Clock,
                                color: 'text-yellow-600' 
                            },
                            { 
                                key: 'published', 
                                label: 'Đã xuất bản', 
                                icon: CheckCircle,
                                color: 'text-green-600' 
                            },
                            { 
                                key: 'archived', 
                                label: 'Lưu trữ', 
                                icon: Archive,
                                color: 'text-blue-600' 
                            },
                            { 
                                key: 'rejected', 
                                label: 'Bị từ chối', 
                                icon: XCircle,
                                color: 'text-red-600' 
                            }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => handleStatusChange(tab.key)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 ${
                                        currentStatus === tab.key
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{tab.label}</span>
                                    {statusCounts[tab.key] !== undefined && statusCounts[tab.key] > 0 && (
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                            currentStatus === tab.key 
                                                ? 'bg-orange-100 text-orange-600' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {statusCounts[tab.key]}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Blog List - Truyền currentStatus làm filter */}
            <BlogList
                adminView={true}
                statusFilter={currentStatus}
                showActions={true}
                selectable={true}
                onBlogSelect={handleBlogAction}
                sortBy={sortBy}
                sortOrder={sortOrder}
            />

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full text-center">
                        <h2 className="text-lg font-semibold mb-4 text-orange-700">Xác nhận xóa</h2>
                        <p className="mb-6 text-gray-700">
                            Bạn có chắc muốn xóa bài viết <b>{deleteModal.blog?.title || 'này'}</b>?
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
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogManagementPage;