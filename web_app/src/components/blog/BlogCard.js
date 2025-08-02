// src/components/admin/blog/BlogCard.js
import React from 'react';
import { Link } from 'react-router-dom';

const BlogCard = ({ 
    blog, 
    onEdit, 
    onDelete, 
    onStatusChange, 
    showActions = true,
    isAdmin = false 
}) => {
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
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const truncateText = (text, maxLength = 150) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Featured Image */}
            {blog.featuredImageUrl && (
                <div className="aspect-video bg-gray-100">
                    <img
                        src={blog.featuredImageUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.parentElement.style.display = 'none';
                        }}
                    />
                </div>
            )}

            <div className="p-4">
                {/* Status & Date */}
                <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(blog.status)}`}>
                        {getStatusText(blog.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                        {formatDate(blog.createdAt)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {blog.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {truncateText(blog.excerpt)}
                </p>

                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {blog.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded"
                            >
                                {tag}
                            </span>
                        ))}
                        {blog.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded">
                                +{blog.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {blog.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {blog.likeCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {blog.commentCount || 0}
                    </span>
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex gap-2">
                            {/* View Button */}
                            <Link
                                to={`/admin/blogs/${blog.blogId}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Xem
                            </Link>

                            {/* Edit Button */}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(blog)}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                >
                                    Sửa
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {/* Status Actions for Admin */}
                            {isAdmin && onStatusChange && (
                                <>
                                    {blog.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => onStatusChange(blog.blogId, 'published')}
                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                            >
                                                Duyệt
                                            </button>
                                            <button
                                                onClick={() => onStatusChange(blog.blogId, 'rejected')}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Từ chối
                                            </button>
                                        </>
                                    )}
                                    {blog.status === 'published' && (
                                        <button
                                            onClick={() => onStatusChange(blog.blogId, 'draft')}
                                            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                                        >
                                            Ẩn
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Delete Button */}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(blog)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Xóa
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogCard;