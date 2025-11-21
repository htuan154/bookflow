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
    const parentId = comment.parentId || comment.parent_id;

    if (parentId && commentMap[parentId]) {
      commentMap[parentId].replies.push(commentMap[id]);
    } else {
      roots.push(commentMap[id]);
    }
  });

  // 3. Sắp xếp replies (mới nhất lên đầu hoặc cũ nhất lên đầu tùy ý)
  // Ở đây ta sort theo createdAt tăng dần (cũ nhất trước) cho replies
  const sortReplies = (comments) => {
    comments.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
    comments.forEach(c => {
      if (c.replies.length > 0) sortReplies(c.replies);
    });
  };

  roots.forEach(root => {
    if (root.replies.length > 0) sortReplies(root.replies);
  });

  return roots;
};
