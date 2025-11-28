import React, { useState, useEffect, useContext } from 'react';
import { CheckCircle, Loader, MessageCircle, Send, X } from 'lucide-react';
import { AuthContext } from '../../../../context/AuthContext';
import CommentItem from './CommentItem';
import { organizeCommentsTree } from './utils';
import commentService from '../../../../api/comment.service';

// Add animation styles
const styles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
`;

const CommentsPanel = ({ blog, onClose }) => {
  const { user } = useContext(AuthContext);
  const [flatComments, setFlatComments] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [sortBy, setSortBy] = useState('newest');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalComments, setTotalComments] = useState(0);

  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Only reset state when blog changes
  useEffect(() => {
    if (blog) {
      setFlatComments([]);
      setComments([]);
      setPage(1);
      setHasMore(true);
      setTotalComments(0);
      setNewComment('');
      setReplyingTo(null);
      setExpandedComments(new Set());
      setNotification({ show: false, message: '', type: '' });
      loadComments(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blog]);

  // Reload comments when sort/filter changes
  useEffect(() => {
    if (blog) {
      loadComments(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, filter]);

  useEffect(() => {
    const tree = organizeCommentsTree(flatComments);
    setComments(tree);
  }, [flatComments]);
  
  // Filter và sort comments ở client-side
  const filteredAndSortedComments = React.useMemo(() => {
    let result = [...comments];
    
    // Filter by status
    if (filter !== 'all') {
      result = result.filter(comment => comment.status === filter);
    }
    
    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at);
      const dateB = new Date(b.createdAt || b.created_at);
      
      if (sortBy === 'newest') {
        return dateB - dateA;
      } else if (sortBy === 'oldest') {
        return dateA - dateB;
      }
      return 0;
    });
    
    return result;
  }, [comments, filter, sortBy]);
  
  // Debug: log comments and flatComments
  useEffect(() => {
    console.log('CommentsPanel flatComments:', flatComments);
    console.log('CommentsPanel comments (tree):', comments);
  }, [flatComments, comments]);

  useEffect(() => {
    if (totalComments > 0) {
      setHasMore(flatComments.length < totalComments);
    } else {
      setHasMore(false);
    }
  }, [flatComments, totalComments]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const commentsPerPage = 10;

  // Patch user info for a comment object (patch if ANY field missing)
  const patchUserInfo = (c) => {
    if (!c.username) c.username = user?.username;
    if (!c.fullName) c.fullName = user?.fullName || user?.full_name;
    if (!c.full_name) c.full_name = user?.full_name || user?.fullName;
    if (!c.user) c.user = { ...user };
    if (c.parent_id && !c.parentId) c.parentId = c.parent_id;
    if (c.parent_id && !c.parentCommentId) c.parentCommentId = c.parent_id;
    return c;
  };

  const loadComments = async (pageNum, isRefresh = false) => {
    if (!blog) return;
    const isLoadMore = pageNum > 1;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      // Chỉ gửi page và limit cho API
      const params = `page=${pageNum}&limit=${commentsPerPage}`;
      const response = await commentService.getBlogCommentsWithUser(
        blog.blogId || blog.id,
        params
      );
      console.log('CommentsPanel API response:', response); // Debug log
      // Fix: handle both array and object response
      let newFlatComments = [];
      let total = 0;
      if (Array.isArray(response)) {
        newFlatComments = response;
        total = response.length;
      } else {
        newFlatComments = response.data || response.comments || [];
        total = response.total || response.totalComments || newFlatComments.length || 0;
      }
      // Patch: inject user info and parentId for comments missing them
      // Also override status: Owner comments should be approved
      const patchedComments = newFlatComments.map(c => {
        const patched = patchUserInfo(c);
        // If comment is from hotel_owner (roleId = 2) and status is pending, change to approved
        if (patched.user?.roleId === 2 && patched.status === 'pending') {
          patched.status = 'approved';
        }
        return patched;
      });
      setTotalComments(total);
      if (isRefresh) {
        setFlatComments(patchedComments);
      } else {
        setFlatComments(prev => {
          const existingIds = new Set(prev.map(c => c.commentId || c.comment_id));
          const uniqueNew = patchedComments.filter(c => !existingIds.has(c.commentId || c.comment_id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadComments(nextPage, false);
  };

  const handleToggleExpand = (commentId) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleToggleReply = (comment) => {
    if (replyingTo && (replyingTo.commentId === comment?.commentId || replyingTo.comment_id === comment?.comment_id)) {
      setReplyingTo(null);
    } else {
      setReplyingTo(comment);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    try {
      const commentData = {
        content: newComment.trim(),
        parent_comment_id: null
      };
      const blogId = blog.blogId || blog.id;
      const response = await commentService.createComment(blogId, commentData);
      let createdComment = response.data || response;

      // Frontend patch: Manually merge current user's info to match the structure
      // of fetched comments, as the API response for new comments is incomplete.
      if (user) {
        const userInfo = {
          userId: user.userId || user.id,
          username: user.username,
          fullName: user.fullName || user.name,
          avatar: user.avatar,
        };
        
        // Determine status: owner comments are auto-approved, staff comments are pending
        const isOwner = user.roleId === 2; // USER_ROLES.HOTEL_OWNER
        const commentStatus = isOwner ? 'approved' : 'pending';
        
        createdComment = { 
          ...createdComment, 
          ...userInfo, // Add top-level fields
          user: userInfo, // Add nested user object
          status: commentStatus // Override status based on role
        };
      }

      setFlatComments(prev => [createdComment, ...prev]);
      setNewComment('');
      setTotalComments(prev => prev + 1);
      
      // Show success notification
      setNotification({
        show: true,
        message: user?.roleId === 2 ? '✅ Bình luận đã được gửi!' : '⏳ Bình luận đang chờ duyệt',
        type: 'success'
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      setNotification({
        show: true,
        message: '❌ Không thể gửi bình luận. Vui lòng thử lại!',
        type: 'error'
      });
    }
  };

  const handleReplySubmit = async (parentComment, content) => {
    try {
      const commentData = {
        content: content.trim(),
        parent_comment_id: parentComment.commentId || parentComment.comment_id
      };
      const blogId = blog.blogId || blog.id;
      const response = await commentService.createComment(blogId, commentData);
      let createdComment = response.data || response;

      // Frontend patch: Manually merge current user's info to match the structure
      // of fetched comments, as the API response for new comments is incomplete.
      if (user) {
        const userInfo = {
          userId: user.userId || user.id,
          username: user.username,
          fullName: user.fullName || user.name,
          avatar: user.avatar,
        };
        
        // Determine status: owner replies are auto-approved, staff replies are pending
        const isOwner = user.roleId === 2; // USER_ROLES.HOTEL_OWNER
        const replyStatus = isOwner ? 'approved' : 'pending';
        
        createdComment = { 
          ...createdComment, 
          ...userInfo, // Add top-level fields
          user: userInfo, // Add nested user object
          status: replyStatus // Override status based on role
        };
      }
      
      setFlatComments(prev => [...prev, createdComment]);
      setReplyingTo(null);
      setTotalComments(prev => prev + 1);
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.add(parentComment.commentId || parentComment.comment_id);
        return next;
      });
      
      // Show success notification
      setNotification({
        show: true,
        message: user?.roleId === 2 ? '✅ Phản hồi đã được gửi!' : '⏳ Phản hồi đang chờ duyệt',
        type: 'success'
      });
    } catch (error) {
      console.error('Error replying:', error);
      setNotification({
        show: true,
        message: '❌ Không thể gửi phản hồi. Vui lòng thử lại!',
        type: 'error'
      });
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
        
        {/* Toast Notification */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-[60] animate-slide-in-right">
            <div className={`px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center space-x-3 ${
              notification.type === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800' 
                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800'
            }`}>
              <div className="text-lg font-bold">{notification.message}</div>
              <button 
                onClick={() => setNotification({ show: false, message: '', type: '' })}
                className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl border border-blue-100 w-full max-w-2xl mx-auto flex flex-col" style={{ minHeight: '600px', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="p-5 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 pr-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center mb-1">
              <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
              Bình luận
              <span className="ml-2 px-2.5 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">{totalComments}</span>
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {blog?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 flex-shrink-0"
            title="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter & Sort */}
        <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 text-gray-700 text-xs rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-50 text-gray-700 text-xs rounded px-2 py-1 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="all">Tất cả</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending">Chờ duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="hidden">Đã ẩn</option>
            </select>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-0">
          {loading && flatComments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Đang tải bình luận...</p>
              </div>
            </div>
          ) : filteredAndSortedComments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredAndSortedComments.map((comment) => (
                <CommentItem
                  key={comment.commentId || comment.comment_id}
                  comment={comment}
                  depth={0}
                  user={user}
                  expandedComments={expandedComments}
                  onToggleExpand={handleToggleExpand}
                  replyingTo={replyingTo}
                  onToggleReply={handleToggleReply}
                  onSubmitReply={handleReplySubmit}
                />
              ))}
              {/* Load More */}
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 transition-colors text-sm font-medium"
                  >
                    {loadingMore ? (
                      <span className="flex items-center justify-center">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Đang tải...
                      </span>
                    ) : (
                      `⬇️ Tải thêm bình luận`
                    )}
                  </button>
                </div>
              )}
              {!hasMore && filteredAndSortedComments.length > 5 && (
                <div className="p-4 text-center">
                  <div className="text-xs text-gray-500 bg-gray-50 py-2 px-4 rounded-lg inline-flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Đã hiển thị tất cả bình luận
                  </div>
                </div>
              )}
            </div>
          ) : flatComments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {/* Fallback: render raw comments if tree is empty */}
              {flatComments.map((comment, idx) => {
                const key = comment.commentId || comment.comment_id || idx;
                return (
                  <div key={key} className="p-4">
                    <div className="font-medium text-gray-800">{comment.content}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 h-full">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">Chưa có bình luận</h3>
                <p className="text-xs text-gray-500">Hãy là người đầu tiên bình luận!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - New Comment Input */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t-2 border-blue-100 p-5 flex-shrink-0 shadow-inner">
          <div className="flex space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
                rows={2}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 font-medium">
                  {newComment.length}/500 ký tự
                </span>
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || newComment.length > 500}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center text-sm shadow-md hover:shadow-lg"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Gửi bình luận
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default CommentsPanel;
