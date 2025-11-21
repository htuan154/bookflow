import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { formatTimeAgo } from './utils';

const ReplyForm = ({ user, onCancel, onSubmit }) => {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };

  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {(user?.fullName || user?.username || 'Y')[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết phản hồi..."
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            rows={2}
            autoFocus
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center"
            >
              <Send className="w-3 h-3 mr-1" />
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommentItem = ({ 
  comment, 
  depth = 0, 
  user, 
  expandedComments, 
  onToggleExpand, 
  replyingTo, 
  onToggleReply, 
  onSubmitReply 
}) => {
  const commentId = comment.commentId || comment.comment_id;
  const isExpanded = expandedComments.has(commentId);
  const isReplying = replyingTo && (replyingTo.commentId === commentId || replyingTo.comment_id === commentId);
  
  // Màu avatar theo độ sâu
  const avatarColors = [
    'from-green-500 to-teal-500',    // depth 1 (reply level 1)
    'from-purple-500 to-pink-500',   // depth 2
    'from-orange-500 to-red-500',    // depth 3
    'from-indigo-500 to-blue-500',   // depth 4+
  ];
  // Note: depth 0 is root, handled by parent loop usually, but if we use this recursively, depth 0 is root.
  // If depth > 0, use gradient. If depth 0, use solid blue (default in parent).
  // Let's stick to the logic: depth 0 is root.
  
  const avatarClass = depth === 0 
    ? "bg-blue-600" 
    : `bg-gradient-to-br ${avatarColors[Math.min(depth - 1, avatarColors.length - 1)]}`;

  return (
    <div className={`p-4 hover:bg-gray-50 transition-colors ${depth > 0 ? 'pl-4 border-l-2 border-blue-200 mt-2' : ''}`}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className={`w-8 h-8 ${avatarClass} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
          {(comment.fullName || comment.username || comment.user?.full_name || 'U')[0].toUpperCase()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* User Info */}
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {comment.fullName || comment.username || comment.user?.full_name || 'Người dùng'}
            </h4>
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt || comment.created_at)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              comment.status === 'approved' ? 'bg-green-100 text-green-700' :
              comment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              comment.status === 'rejected' ? 'bg-red-100 text-red-700' :
              comment.status === 'hidden' ? 'bg-gray-100 text-gray-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {comment.status === 'approved' ? '✓' :
               comment.status === 'pending' ? '⏳' : 
               comment.status === 'rejected' ? '✗' :
               comment.status === 'hidden' ? '👁️' : '?'}
            </span>
          </div>

          {/* Comment Text */}
          <div className="text-gray-700 text-sm leading-relaxed mb-2 break-words">
            {comment.content}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => onToggleReply(comment)}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {isReplying ? '✕ Hủy' : '↩️ Trả lời'}
            </button>
            
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => onToggleExpand(commentId)}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                {isExpanded ? '🔼 Ẩn' : `🔽 ${comment.replies.length} phản hồi`}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <ReplyForm 
              user={user}
              onCancel={() => onToggleReply(null)}
              onSubmit={(content) => onSubmitReply(comment, content)}
            />
          )}

          {/* Recursive Replies */}
          {comment.replies && comment.replies.length > 0 && isExpanded && (
            <div className="mt-3 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.commentId || reply.comment_id}
                  comment={reply}
                  depth={depth + 1}
                  user={user}
                  expandedComments={expandedComments}
                  onToggleExpand={onToggleExpand}
                  replyingTo={replyingTo}
                  onToggleReply={onToggleReply}
                  onSubmitReply={onSubmitReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
