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
    // Thêm các props mới cho status filter
    currentStatus = 'all',
    onStatusChange = null,
    statusCounts = {},
}) => {
    const {
        blogs,
        loading,
        error,
        pagination,
        fetchBlogs,
        fetchBlogsByStatus,
        clearError,
        setPagination
    } = useBlogContext();

    // Trả pagination, loading, handlePageChange ra ngoài qua callback
    React.useEffect(() => {
        if (typeof window.onBlogListPaginationChange === 'function') {
            window.onBlogListPaginationChange({
                pagination,
                loading,
                handlePageChange,
            });
        }
    }, [pagination, loading]);

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
                if (statusFilter === 'all' || !statusFilter) {
                    await fetchBlogs({ adminView: true, ...params });
                } else {
                    await fetchBlogsByStatus(statusFilter, params);
                }
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
        setPagination(prev => ({
            ...prev,
            currentPage: page
        }));
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

            {/* Header với search và actions - gọn gàng hơn */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex flex-row items-center gap-2 flex-wrap">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1 min-w-[220px] max-w-lg">
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

                    {/* Status Filter Dropdown - chỉ hiển thị trong admin view */}
                    {adminView && (
                        <select
                            value={currentStatus}
                            onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[120px]"
                        >
                            <option value="all">Tất cả ({statusCounts.all || 0})</option>
                            <option value="draft">Nháp ({statusCounts.draft || 0})</option>
                            <option value="pending">Chờ duyệt ({statusCounts.pending || 0})</option>
                            <option value="published">Đã xuất bản ({statusCounts.published || 0})</option>
                            <option value="archived">Lưu trữ ({statusCounts.archived || 0})</option>
                            <option value="rejected">Bị từ chối ({statusCounts.rejected || 0})</option>
                        </select>
                    )}

                    {/* Sort Dropdown */}
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [newSortBy, newSortOrder] = e.target.value.split('-');
                            setSortBy(newSortBy);
                            setSortOrder(newSortOrder);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[110px]"
                    >
                        <option value="created_at-desc">Mới nhất</option>
                        <option value="created_at-asc">Cũ nhất</option>
                        <option value="title-asc">Tiêu đề A-Z</option>
                        <option value="title-desc">Tiêu đề Z-A</option>
                        <option value="view_count-desc">Lượt xem cao</option>
                        <option value="like_count-desc">Lượt thích cao</option>
                    </select>

                    {/* Nút làm mới */}
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Làm mới</span>
                    </button>

                    {/* Nút thêm bài viết */}
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


            {/* Blog List - Grid 3 cột, căn giữa, card nhỏ hơn, sát nhau */}
            <div className="w-full max-w-5xl mx-auto">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-white p-2 rounded-lg shadow-sm border animate-pulse">
                            <div className="w-full h-24 bg-gray-200 rounded-lg mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            ) : filteredBlogs.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {filteredBlogs.map((blog) => {
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
            </div>

            {/* Pagination sẽ render ở ngoài BlogList */}
        </div>
    );
};

export default BlogList;