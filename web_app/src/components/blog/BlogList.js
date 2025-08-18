// src/components/admin/blog/BlogList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, RefreshCw, Eye } from 'lucide-react';
import { useBlogContext } from '../../context/BlogContext';
import BlogCard from './BlogCard';
import { useNavigate } from 'react-router-dom';

const BlogList = ({ 
    showActions = true, 
    adminView = true,
    statusFilter = 'all', // Nhận status từ parent
    onBlogSelect = null,
    selectable = false,
    sortBy: propSortBy,
    sortOrder: propSortOrder,
}) => {
    const {
        blogs,
        loading,
        error,
        pagination,
        fetchBlogs,
        fetchBlogsByStatus,
        clearError
    } = useBlogContext();

    const [selectedBlogs, setSelectedBlogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState(propSortBy || 'created_at');
    const [sortOrder, setSortOrder] = useState(propSortOrder || 'desc');
    const navigate = useNavigate();

    // Load blogs khi statusFilter thay đổi
    useEffect(() => {
        handleLoadBlogs();
    }, [statusFilter]);

    // Load blogs khi pagination thay đổi
    useEffect(() => {
        if (pagination.currentPage > 1) {
            handleLoadBlogs();
        }
    }, [pagination.currentPage]);

    // Nếu muốn đồng bộ sortBy/sortOrder khi props thay đổi:
    useEffect(() => {
        if (propSortBy) setSortBy(propSortBy);
        if (propSortOrder) setSortOrder(propSortOrder);
    }, [propSortBy, propSortOrder]);

    // Đảm bảo khi chọn bộ lọc sortBy/sortOrder thì gọi lại handleLoadBlogs để cập nhật danh sách
    useEffect(() => {
        handleLoadBlogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, sortOrder]);

    const handleLoadBlogs = useCallback(async () => {
        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.itemsPerPage,
                search: searchQuery,
                sortBy: sortBy,
                sortOrder: sortOrder
            };

            if (adminView) {
                // Luôn sử dụng fetchBlogsByStatus, với statusFilter = 'all' thì backend sẽ trả về tất cả
                const status = statusFilter === 'all' ? 'published' : statusFilter;
                await fetchBlogsByStatus(status, params);
            } else {
                // Public blogs
                await fetchBlogs(params);
            }
        } catch (error) {
            console.error('Failed to load blogs:', error);
        }
    }, [fetchBlogsByStatus, fetchBlogs, statusFilter, adminView, pagination.currentPage, pagination.itemsPerPage, searchQuery, sortBy, sortOrder]);

    const handleSearch = (e) => {
        e.preventDefault();
        // setPagination({ currentPage: 1 }); // Reset về trang 1
        handleLoadBlogs();
    };

    const handleSortChange = (newSortBy) => {
        const newSortOrder = sortBy === newSortBy && sortOrder === 'desc' ? 'asc' : 'desc';
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        // setPagination({ currentPage: 1 });
    };

    const handlePageChange = (page) => {
        // setPagination({ currentPage: page });
    };

    const handleRefresh = () => {
        // setPagination({ currentPage: 1 });
        handleLoadBlogs();
    };

    const handleSelectBlog = (blogId) => {
        if (!selectable) return;
        
        setSelectedBlogs(prev => 
            prev.includes(blogId) 
                ? prev.filter(id => id !== blogId)
                : [...prev, blogId]
        );
    };

    const handleSelectAll = () => {
        if (selectedBlogs.length === blogs.length) {
            setSelectedBlogs([]);
        } else {
            setSelectedBlogs(blogs.map(blog => blog.blogId));
        }
    };

    if (error) {
        return (
            <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-red-700">
                            <span className="font-medium">Lỗi khi tải danh sách bài viết:</span>
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => {
                                clearError();
                                handleLoadBlogs();
                            }}
                            className="text-red-600 hover:text-red-800 font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!blogs || blogs.length === 0) {
        return (
            <>
                <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
                    <div className="text-gray-400 mb-4">
                        <Eye className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Không có bài viết nào
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery 
                            ? `Không tìm thấy bài viết phù hợp với từ khóa "${searchQuery}".`
                            : statusFilter !== 'all' 
                                ? `Không có bài viết nào ở trạng thái này.`
                                : 'Chưa có bài viết nào được tạo.'
                        }
                    </p>
                    {showActions && (
                        <button
                            onClick={() => navigate('/admin/blog-management/create')}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Tạo bài viết đầu tiên</span>
                        </button>
                    )}
                </div>
            </>
        );
    }

    // Đảm bảo chỉ hiển thị đúng danh sách bài viết liên quan đến từ khóa tìm kiếm.
    // Nếu backend đã trả về đúng danh sách đã lọc, KHÔNG cần lọc lại ở frontend.
    // Nếu muốn lọc lại ở frontend (chỉ để kiểm tra), có thể làm như sau:

    // Để tìm kiếm không dấu ở frontend (nếu backend chưa hỗ trợ tốt), hãy lọc lại ở frontend như sau:

    // Hàm loại bỏ dấu tiếng Việt
    function removeVietnameseTones(str) {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    const filteredBlogs = searchQuery
        ? blogs.filter(blog => {
            const title = blog.title || '';
            // So sánh cả có dấu và không dấu
            return (
                title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                removeVietnameseTones(title.toLowerCase()).includes(removeVietnameseTones(searchQuery.toLowerCase()))
            );
        })
        : blogs;

    return (
        <div className="space-y-6">
            {/* Thông báo tìm kiếm thành công/thất bại */}
            {searchQuery && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-2">
                    <span className="font-semibold text-blue-700">Kết quả tìm kiếm:</span>
                    <span className="text-blue-900">
                        {filteredBlogs.length > 0
                            ? `Có ${filteredBlogs.length} bài viết liên quan đến từ khóa "${searchQuery}".`
                            : `Không tìm thấy bài viết nào phù hợp với từ khóa "${searchQuery}".`
                        }
                    </span>
                </div>
            )}

            {/* Header với search và actions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tiêu đề, nội dung..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </form>

                    {/* Sort and Actions */}
                    <div className="flex items-center space-x-3">
                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [newSortBy, newSortOrder] = e.target.value.split('-');
                                setSortBy(newSortBy);
                                setSortOrder(newSortOrder);
                                // Gọi handleLoadBlogs ngay khi đổi bộ lọc
                                // handleLoadBlogs(); // Không cần nếu đã có useEffect ở trên
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
                        
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Làm mới</span>
                        </button>
                        
                        {showActions && (
                            <button
                                onClick={() => navigate('/admin/blog-management/create')}
                                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Thêm bài viết</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bulk selection */}
                {selectable && blogs.length > 0 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedBlogs.length === blogs.length}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                                Chọn tất cả ({selectedBlogs.length}/{blogs.length})
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {/* Stats */}
            {pagination.totalItems > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Hiển thị {Math.min(pagination.itemsPerPage, blogs.length)} trong tổng số {pagination.totalItems} bài viết
                        </span>
                        <span>
                            Trang {pagination.currentPage} / {pagination.totalPages}
                        </span>
                    </div>
                </div>
            )}

            {/* Blog List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
                            <div className="flex space-x-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredBlogs.length === 0 ? (
                <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
                    <div className="text-gray-400 mb-4">
                        <Eye className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Không có bài viết nào
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery 
                            ? 'Không tìm thấy bài viết phù hợp với từ khóa tìm kiếm.'
                            : statusFilter !== 'all' 
                                ? `Không có bài viết nào ở trạng thái này.`
                                : 'Chưa có bài viết nào được tạo.'
                        }
                    </p>
                    {showActions && (
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
                <div className="space-y-4">
                    {filteredBlogs.map((blog) => {
                        // Đánh dấu bài viết liên quan nếu tiêu đề chứa từ khóa (không phân biệt hoa thường)
                        const isRelated =
                            searchQuery &&
                            blog.title &&
                            blog.title.toLowerCase().includes(searchQuery.toLowerCase());

                        return (
                            <div
                                key={blog.blogId}
                                className={isRelated ? "ring-2 ring-orange-400 rounded" : ""}
                            >
                                <BlogCard
                                    blog={blog}
                                    showActions={showActions}
                                    adminView={adminView}
                                    isAdmin={adminView}
                                    selectable={selectable}
                                    selected={selectedBlogs.includes(blog.blogId)}
                                    onSelect={() => handleSelectBlog(blog.blogId)}
                                    onEdit={(blog) => onBlogSelect && onBlogSelect('edit', blog)}
                                    onView={(blog) => onBlogSelect && onBlogSelect('view', blog)}
                                    onDelete={(blog) => onBlogSelect && onBlogSelect('delete', blog)}
                                    onChangeStatus={(blogId, newStatus) => onBlogSelect && onBlogSelect('changeStatus', { blogId, newStatus })}
                                />
                                {isRelated && (
                                    <div className="text-xs text-orange-600 pl-4 pb-2">
                                        <span className="font-semibold">Liên quan đến từ khóa tìm kiếm</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1 || loading}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Trước
                            </button>
                            
                            <div className="flex items-center space-x-1">
                                {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                                    const page = index + 1;
                                    const isActive = page === pagination.currentPage;
                                    
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            disabled={loading}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                                isActive
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-50'
                                            } disabled:opacity-50`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages || loading}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sau
                            </button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                            Trang {pagination.currentPage} / {pagination.totalPages}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogList;