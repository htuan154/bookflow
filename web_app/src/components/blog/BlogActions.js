// src/components/admin/blog/BlogActions.js
import React, { useState } from 'react';

const BlogActions = ({ 
    blog, 
    onEdit, 
    onDelete, 
    onStatusChange,
    isAdmin = false,
    loading = false,
    size = 'default' // 'default' | 'small'
}) => {
    const [showConfirm, setShowConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const handleAction = async (action, ...args) => {
        setActionLoading(action);
        try {
            switch (action) {
                case 'edit':
                    onEdit?.(blog);
                    break;
                case 'delete':
                    await onDelete?.(blog);
                    break;
                case 'approve':
                    await onStatusChange?.(blog.blogId, 'published');
                    break;
                case 'reject':
                    await onStatusChange?.(blog.blogId, 'rejected');
                    break;
                case 'unpublish':
                    await onStatusChange?.(blog.blogId, 'draft');
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(`Error ${action}:`, error);
        } finally {
            setActionLoading(null);
            setShowConfirm(null);
        }
    };

    const confirmAction = (action, message) => {
        if (window.confirm(message)) {
            handleAction(action);
        }
    };

    const buttonClass = size === 'small' 
        ? 'px-2 py-1 text-xs' 
        : 'px-3 py-1.5 text-sm';

    const iconClass = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

    return (
        <div className="flex items-center gap-2">
            {/* Edit */}
            {onEdit && (
                <button
                    onClick={() => handleAction('edit')}
                    disabled={loading || actionLoading}
                    className={`${buttonClass} text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50`}
                >
                    <div className="flex items-center gap-1">
                        {actionLoading === 'edit' ? (
                            <div className={`${iconClass} animate-spin border border-blue-600 border-t-transparent rounded-full`} />
                        ) : (
                            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        )}
                        {size === 'default' && 'Sửa'}
                    </div>
                </button>
            )}

            {/* Admin Actions */}
            {isAdmin && onStatusChange && (
                <>
                    {/* Approve */}
                    {blog.status === 'pending' && (
                        <button
                            onClick={() => handleAction('approve')}
                            disabled={loading || actionLoading}
                            className={`${buttonClass} text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50`}
                        >
                            <div className="flex items-center gap-1">
                                {actionLoading === 'approve' ? (
                                    <div className={`${iconClass} animate-spin border border-green-600 border-t-transparent rounded-full`} />
                                ) : (
                                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {size === 'default' && 'Duyệt'}
                            </div>
                        </button>
                    )}

                    {/* Reject */}
                    {blog.status === 'pending' && (
                        <button
                            onClick={() => confirmAction('reject', 'Bạn có chắc muốn từ chối bài viết này?')}
                            disabled={loading || actionLoading}
                            className={`${buttonClass} text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors disabled:opacity-50`}
                        >
                            <div className="flex items-center gap-1">
                                {actionLoading === 'reject' ? (
                                    <div className={`${iconClass} animate-spin border border-orange-600 border-t-transparent rounded-full`} />
                                ) : (
                                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                {size === 'default' && 'Từ chối'}
                            </div>
                        </button>
                    )}

                    {/* Unpublish */}
                    {blog.status === 'published' && (
                        <button
                            onClick={() => confirmAction('unpublish', 'Bạn có chắc muốn ẩn bài viết này?')}
                            disabled={loading || actionLoading}
                            className={`${buttonClass} text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors disabled:opacity-50`}
                        >
                            <div className="flex items-center gap-1">
                                {actionLoading === 'unpublish' ? (
                                    <div className={`${iconClass} animate-spin border border-yellow-600 border-t-transparent rounded-full`} />
                                ) : (
                                    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                )}
                                {size === 'default' && 'Ẩn'}
                            </div>
                        </button>
                    )}
                </>
            )}

            {/* Delete */}
            {onDelete && (
                <button
                    onClick={() => confirmAction('delete', 'Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.')}
                    disabled={loading || actionLoading}
                    className={`${buttonClass} text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50`}
                >
                    <div className="flex items-center gap-1">
                        {actionLoading === 'delete' ? (
                            <div className={`${iconClass} animate-spin border border-red-600 border-t-transparent rounded-full`} />
                        ) : (
                            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        )}
                        {size === 'default' && 'Xóa'}
                    </div>
                </button>
            )}
        </div>
    );
};

export default BlogActions;