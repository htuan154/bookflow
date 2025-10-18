// src/components/admin/blog/BlogCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArrowDown, Send } from 'lucide-react';

const BlogCard = ({ 
    blog, 
    onView, 
    onEdit, 
    onDelete, 
    onChangeStatus, // chỉ dùng tên này
    showActions = true,
    isAdmin = false,
    loading = false
}) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const truncateText = (text, maxLength = 150) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const handleEdit = () => {
        if (onEdit && !loading) {
            console.log('🔄 Editing blog:', blog.blogId);
            onEdit(blog);
        }
    };

    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        setShowDeleteModal(false);
        if (onDelete && !loading) {
            onDelete(blog); // <-- truyền object blog thay vì blog.blogId
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
    };

    const handleView = () => {
        if (onView && !loading) {
            console.log('🔄 Viewing blog:', blog.blogId);
            onView(blog);
        }
    };

    const handleStatusChange = (newStatus) => {
        if (onChangeStatus && !loading) {
            onChangeStatus(blog.blogId, newStatus); // chỉ truyền blogId như cũ
        }
    };

    // Thêm các nút chuyển trạng thái cho admin
    const renderStatusActions = () => {
        if (!isAdmin || !onChangeStatus) return null;
        switch (blog.status) {
            case 'draft':
                return (
                    <button
                        onClick={() => handleStatusChange('pending')}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 border border-yellow-400 rounded text-yellow-700 bg-yellow-50 hover:bg-yellow-100 text-xs font-medium"
                        title="Gửi duyệt"
                    >
                        <Send className="w-3 h-3" />
                    </button>
                );
            case 'pending':
                return (
                    <>
                        <button
                            onClick={() => handleStatusChange('published')}
                            disabled={loading}
                            className="inline-flex items-center px-2 py-1 border border-green-400 rounded text-green-700 bg-green-50 hover:bg-green-100 text-xs font-medium mr-1"
                            title="Duyệt"
                        >
                            Duyệt
                        </button>
                        <button
                            onClick={() => handleStatusChange('rejected')}
                            disabled={loading}
                            className="inline-flex items-center px-2 py-1 border border-red-400 rounded text-red-700 bg-red-50 hover:bg-red-100 text-xs font-medium"
                            title="Từ chối"
                        >
                            Từ chối
                        </button>
                    </>
                );
            case 'published':
                return (
                    <>
                        <button
                            onClick={() => handleStatusChange('archived')}
                            disabled={loading}
                            className="inline-flex items-center px-2 py-1 border border-blue-400 rounded text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-medium mr-1"
                            title="Lưu trữ"
                        >
                            <Archive className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => handleStatusChange('draft')}
                            disabled={loading}
                            className="inline-flex items-center px-2 py-1 border border-yellow-400 rounded text-yellow-700 bg-yellow-50 hover:bg-yellow-100 text-xs font-medium"
                            title="Rút lại"
                        >
                            <ArrowDown className="w-3 h-3" />
                        </button>
                    </>
                );
            case 'rejected':
                return (
                    <button
                        onClick={() => handleStatusChange('draft')}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 border border-gray-400 rounded text-gray-700 bg-gray-50 hover:bg-gray-100 text-xs font-medium"
                        title="Chỉnh sửa lại"
                    >
                        Chỉnh sửa
                    </button>
                );
            case 'archived':
                return (
                    <button
                        onClick={() => handleStatusChange('draft')}
                        disabled={loading}
                        className="inline-flex items-center px-2 py-1 border border-gray-400 rounded text-gray-700 bg-gray-50 hover:bg-gray-100 text-xs font-medium"
                        title="Khôi phục về nháp"
                    >
                        Khôi phục
                    </button>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Blog Image */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                {blog.featuredImageUrl ? (
                    <img
                        src={blog.featuredImageUrl}
                        alt={blog.title}
                        className="w-full h-48 object-cover"
                    />
                ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Blog Content */}
            <div className="p-6">
                {/* Category and Status */}
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

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {blog.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {blog.excerpt || blog.content?.substring(0, 150) + '...'}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{blog.author?.name || blog.author || 'Ẩn danh'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(blog.createdAt)}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{blog.viewCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{blog.likeCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{blog.commentCount || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleView}
                            disabled={loading}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            
                        </button>

                        <div className="flex items-center space-x-2">
                            {/* Edit Button */}
                            <button
                                onClick={handleEdit}
                                disabled={loading}
                                className="inline-flex items-center p-2 border border-transparent rounded-md text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                                title="Chỉnh sửa"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                )}
                            </button>

                            {/* Admin Status Actions */}
                            {isAdmin && onChangeStatus && (
                                <div className="flex items-center space-x-1">
                                    {renderStatusActions()}
                                </div>
                            )}

                            {/* Delete Button */}
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="inline-flex items-center p-2 border border-transparent rounded-md text-orange-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                                title="Xóa"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full text-center">
                        <h2 className="text-lg font-semibold mb-4 text-orange-700">Xác nhận xóa</h2>
                        <p className="mb-6 text-gray-700">
                            Bạn có chắc chắn muốn xóa bài viết <b>{blog.title}</b>?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
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

export default BlogCard;