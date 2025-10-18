// src/pages/admin/BlogManagement/BlogManagementPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BlogList from '../../../components/blog/BlogList';
import { 
    Search,
    Plus,
    XCircle
} from 'lucide-react';
import { useBlogContext } from '../../../context/BlogContext';
import useAuth from '../../../hooks/useAuth';

const BlogManagementPage = () => {
    // State nhận thông tin phân trang từ BlogList
    const [blogListPagination, setBlogListPagination] = useState({ pagination: {}, loading: false, handlePageChange: () => {} });

    // Đăng ký callback nhận thông tin phân trang từ BlogList
    useEffect(() => {
        window.onBlogListPaginationChange = (data) => {
            setBlogListPagination(data);
        };
        return () => {
            window.onBlogListPaginationChange = null;
        };
    }, []);
    const navigate = useNavigate();
    const {  isAuthenticated } = useAuth();
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
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Thêm state cho từ khóa tìm kiếm

    // Thêm state để lưu sortBy và sortOrder
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    // Định nghĩa hàm trước các hook
    const loadStatistics = async () => {
        try {
            // Truyền keyword (searchTerm) vào fetchStatistics để lấy đúng số lượng theo bộ lọc
            await fetchStatistics({ keyword: searchTerm });
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
                fetchBlogsByStatus(currentStatus, { keyword: searchTerm });
            } else {
                getBlogsByRoleAdmin({ role: 'admin', keyword: searchTerm });
            }
        }
    }, [isAuthenticated, currentStatus, searchTerm, fetchBlogsByStatus, getBlogsByRoleAdmin]);

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
                    await getBlogsByRoleAdmin({ role: 'admin', keyword: searchTerm });
                    await fetchStatistics();
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
            await getBlogsByRoleAdmin({ role: 'admin', keyword: searchTerm });
            setDeleteModal({ open: false, blog: null });
            setDeleteSuccess(true);
            setTimeout(() => setDeleteSuccess(false), 2000);
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
    <div className="space-y-6 w-full max-w-6xl mx-auto">
            
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
                
                
            </div>

           

            {/* Blog List */}
            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                    <BlogList
                        adminView={true}
                        statusFilter={currentStatus}
                        showActions={true}
                        selectable={true}
                        onBlogSelect={handleBlogAction}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        searchTerm={searchTerm}
                        gridLayout={true}
                        // Thêm các props cho Status Filter
                        currentStatus={currentStatus}
                        onStatusChange={handleStatusChange}
                        statusCounts={getStatusCounts()}
                    />
                </div>
                {/* Phân trang ngoài BlogList - theo mẫu */}
                <div className="flex justify-between items-center mt-8 bg-white p-4 rounded-lg shadow border">
                    {/* Thông tin hiển thị bên trái - sử dụng dữ liệu thực tế */}
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                            {(() => {
                                const currentPage = pagination.currentPage || 1;
                                const itemsPerPage = 9;
                                const totalItems = pagination.totalItems || blogs?.length || 0;
                                const startItem = totalItems > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
                                const endItem = Math.min(currentPage * itemsPerPage, totalItems);
                                
                                return `Hiển thị ${startItem}-${endItem} trong tổng số ${totalItems} bài viết`;
                            })()}
                        </span>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Hiển thị:</span>
                            <select 
                                value={9}
                                onChange={(e) => {
                                    // Logic thay đổi items per page nếu cần
                                    console.log('Change items per page to:', e.target.value);
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
                            onClick={() => blogListPagination.handlePageChange(1)}
                            disabled={(pagination.currentPage || 1) === 1 || blogListPagination.loading}
                            className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                            title="Trang đầu"
                        >
                            &laquo;&laquo;
                        </button>
                        {/* Nút về trước */}
                        <button
                            onClick={() => blogListPagination.handlePageChange((pagination.currentPage || 1) - 1)}
                            disabled={(pagination.currentPage || 1) === 1 || blogListPagination.loading}
                            className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                            title="Trang trước"
                        >
                            Trước
                        </button>
                            {/* Số trang hiện tại */}
                            <button
                                className="px-3 py-1 bg-orange-600 text-white border border-blue-600 rounded text-sm font-medium"
                                disabled
                            >
                                {pagination.currentPage || 1}
                            </button>
                            
                            {/* Nút về sau */}
                            <button
                                onClick={() => blogListPagination.handlePageChange((pagination.currentPage || 1) + 1)}
                                disabled={(pagination.currentPage || 1) === (pagination.totalPages || 1) || blogListPagination.loading}
                                className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
                                title="Trang sau"
                            >
                                Tiếp
                            </button>
                            {/* Nút về cuối */}
                            <button
                                onClick={() => blogListPagination.handlePageChange(pagination.totalPages || 1)}
                                disabled={(pagination.currentPage || 1) === (pagination.totalPages || 1) || blogListPagination.loading}
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
                                    max={pagination.totalPages || 1}
                                    defaultValue={pagination.currentPage || 1}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            const val = Number(e.target.value);
                                            const maxPage = pagination.totalPages || 1;
                                            if (val >= 1 && val <= maxPage) {
                                                blogListPagination.handlePageChange(val);
                                            }
                                        }
                                    }}
                                    className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

            </div>
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