import React from 'react';
import { AlertTriangle, Archive, CheckCircle, Clock, XCircle } from 'lucide-react';

export const getStatusText = (status) => {
  const statusMap = {
    draft: 'Nháp',
    pending: 'Chờ duyệt',
    published: 'Đã xuất bản',
    archived: 'Lưu trữ',
    rejected: 'Bị từ chối'
  };
  return statusMap[status] || status;
};

export const getStatusIcon = (status) => {
  const iconMap = {
    draft: <AlertTriangle className="h-4 w-4" />,
    pending: <Clock className="h-4 w-4" />,
    published: <CheckCircle className="h-4 w-4" />,
    archived: <Archive className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />
  };
  return iconMap[status] || <AlertTriangle className="h-4 w-4" />;
};

export const getStatusColor = (status) => {
  const colorMap = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const formatTimeAgo = (dateString) => {
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

export const organizeCommentsTree = (flatComments) => {
  if (!flatComments || flatComments.length === 0) {
    return [];
  }
  const commentMap = {};
  const roots = [];

  // 1. Tạo map và khởi tạo replies array
  flatComments.forEach(comment => {
    const id = comment.commentId || comment.comment_id;
    commentMap[id] = { ...comment, replies: [] };
  });

  // 2. Xây dựng cây
  flatComments.forEach(comment => {
    const id = comment.commentId || comment.comment_id;
    const parentId = comment.parentCommentId || comment.parentId || comment.parent_id;

    if (parentId && commentMap[parentId] && id !== parentId) {
      commentMap[parentId].replies.push(commentMap[id]);
    } else if (!parentId) {
      // Only push root if parentId is null/undefined
      roots.push(commentMap[id]);
    }
    // If parentId exists but not in map, do not push to roots (avoid duplicate root)
  });

  return roots;
};

/**
 * Check if a string looks like a URL
 * @param {string} text - Text to check
 * @returns {boolean} - True if text looks like a URL
 */
export const isUrlLike = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Check for common URL patterns
  const urlPattern = /^(https?:\/\/|www\.|ftp:\/\/)/i;
  const hasUrlChars = text.includes('://') || text.startsWith('www.');
  
  return urlPattern.test(text) || hasUrlChars;
};

/**
 * Truncate text intelligently with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 60)
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 60) => {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  
  // Try to truncate at a word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

/**
 * Sanitize and clean blog titles for display
 * @param {string} title - Original title
 * @param {number} maxLength - Maximum length (default: 60)
 * @returns {string} - Sanitized title
 */
export const sanitizeTitle = (title, maxLength = 60) => {
  if (!title || typeof title !== 'string') return 'Không có tiêu đề';
  
  // If title looks like a URL, try to extract a meaningful part
  if (isUrlLike(title)) {
    // Try to extract filename from URL
    try {
      const urlParts = title.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // If we found a filename, use it (truncated)
      if (filename && filename.length > 0 && filename !== '') {
        // Remove file extension and decode URI
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
        const decoded = decodeURIComponent(nameWithoutExt);
        return truncateText(decoded, maxLength);
      }
    } catch (e) {
      // If parsing fails, just truncate the URL
    }
    
    // Fallback: just truncate the URL
    return truncateText(title, 40);
  }
  
  // For normal titles, just truncate if too long
  return truncateText(title, maxLength);
};
