import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader, MessageCircle, Send, X } from 'lucide-react';
import CommentItem from './CommentItem';
import { organizeCommentsTree } from './utils';
import commentService from '../../../../api/comment.service';

const CommentsPanel = ({ show, blog, onClose, user }) => {
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

  const commentsPerPage = 10;

  useEffect(() => {
    if (show && blog) {
      // Reset state when opening for a new blog
      setComments([]);
      setPage(1);
      setHasMore(true);
      setTotalComments(0);
      setNewComment('');
      setReplyingTo(null);
      setExpandedComments(new Set());
      
      loadComments(1, true);
    }
  }, [show, blog, sortBy, filter]);

  const loadComments = async (pageNum, isRefresh = false) => {
    if (!blog) return;
    
    const isLoadMore = pageNum > 1;
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const response = await commentService.getCommentsByBlogId(
        blog.blogId || blog.id, 
        pageNum, 
        commentsPerPage, 
        sortBy, 
        filter
      );
      
      const flatComments = response.data || response.comments || [];
      const total = response.total || response.totalComments || 0;
      
      setTotalComments(total);

      // Nếu là load more, ta cần merge với comments cũ trước khi organize
      // Tuy nhiên, organizeCommentsTree cần toàn bộ flat list để build tree chính xác
      // Nếu API trả về paginated flat list, việc build tree client-side có thể bị thiếu parent.
      // Giả sử API trả về root comments và children của nó, hoặc trả về flat list đầy đủ?
      // Theo code cũ, nó concat flat list rồi mới organize.
      
      if (isRefresh) {
        const tree = organizeCommentsTree(flatComments);
        setComments(tree);
        // Lưu lại raw flat comments nếu cần, nhưng ở đây ta lưu tree.
        // Wait, if we paginate, we might get children without parents if sorted by date?
        // Usually pagination for comments is on root comments.
        // Let's assume API handles this or we just append roots.
        // Code cũ: setComments(prev => organizeCommentsTree([...prevFlat, ...newFlat]))
        // Nhưng code cũ có vẻ lưu state `comments` là tree?
        // Code cũ: setComments(organizeCommentsTree(allComments));
        // Nó maintain một list `allComments` (flat) không?
        // Code cũ dòng 1480: setComments(organizeCommentsTree(response.data)); (khi load page 1)
        // Dòng 1498 (load more): const newComments = [...comments, ...response.data]; setComments(organizeCommentsTree(newComments));
        // Vấn đề: `comments` state ở code cũ là TREE hay FLAT?
        // Dòng 1480: setComments(organizeCommentsTree(...)) -> Tree.
        // Dòng 1498: [...comments, ...response.data] -> Tree + Flat? Sai.
        // Code cũ có vẻ bug hoặc logic phức tạp.
        // Nếu `comments` là tree, thì `...comments` là array of roots.
        // `...response.data` là array of flat comments.
        // organizeCommentsTree nhận flat comments.
        // Vậy code cũ có thể sai nếu nó mix tree và flat.
        // Tuy nhiên, để an toàn, ta nên lưu `flatComments` state riêng, và derived `treeComments`.
        // Hoặc ta chỉ append vào tree.
        
        // Let's simplify: We will store flat comments and rebuild tree on render or memoize.
        // But `organizeCommentsTree` is expensive? Not really for 100 comments.
      } else {
        // Load more logic is tricky with trees.
        // For now, let's assume we just fetch more and rebuild.
        // We need to keep track of ALL fetched flat comments.
        // But `comments` state currently stores the TREE.
        // Let's change strategy: Store `flatComments` and derive tree.
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-implementing load logic with flat storage
  const [flatComments, setFlatComments] = useState([]);
  
  useEffect(() => {
    setComments(organizeCommentsTree(flatComments));
  }, [flatComments]);

  const loadCommentsRefined = async (pageNum, isRefresh = false) => {
    if (!blog) return;
    
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await commentService.getCommentsByBlogId(
        blog.blogId || blog.id, 
        pageNum, 
        commentsPerPage, 
        sortBy, 
        filter
      );
      
      const newFlatComments = response.data || response.comments || [];
      const total = response.total || response.totalComments || 0;
      
      setTotalComments(total);
      
      if (isRefresh) {
        setFlatComments(newFlatComments);
      } else {
        // Filter duplicates just in case
        setFlatComments(prev => {
          const existingIds = new Set(prev.map(c => c.commentId || c.comment_id));
          const uniqueNew = newFlatComments.filter(c => !existingIds.has(c.commentId || c.comment_id));
          return [...prev, ...uniqueNew];
        });
      }
      
      if (newFlatComments.length < commentsPerPage) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Override the initial useEffect to use loadCommentsRefined
  useEffect(() => {
    if (show && blog) {
      setFlatComments([]);
      setPage(1);
      setHasMore(true);
      setTotalComments(0);
      setNewComment('');
      setReplyingTo(null);
      setExpandedComments(new Set());
      
      loadCommentsRefined(1, true);
    }
  }, [show, blog, sortBy, filter]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCommentsRefined(nextPage, false);
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
        blog_id: blog.blogId || blog.id,
        content: newComment.trim(),
        parent_id: null
      };

      const response = await commentService.createComment(commentData);
      const createdComment = response.data || response;
      
      // Add to flat list
      setFlatComments(prev => [createdComment, ...prev]);
      setNewComment('');
      setTotalComments(prev => prev + 1);
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Không thể gửi bình luận. Vui lòng thử lại!');
    }
  };

  const handleReplySubmit = async (parentComment, content) => {
    try {
      const commentData = {
        blog_id: blog.blogId || blog.id,
        content: content.trim(),
        parent_id: parentComment.commentId || parentComment.comment_id
      };

      const response = await commentService.createComment(commentData);
      const createdComment = response.data || response;

      // Add to flat list
      setFlatComments(prev => [...prev, createdComment]);
      setReplyingTo(null);
      setTotalComments(prev => prev + 1);
      
      // Auto expand parent to show new reply
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.add(parentComment.commentId || parentComment.comment_id);
        return next;
      });
    } catch (error) {
      console.error('Error replying:', error);
      alert('Không thể gửi phản hồi. Vui lòng thử lại!');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
            Bình luận ({totalComments})
          </h3>
          <p className="text-xs text-gray-500 mt-1 truncate max-w-[250px]">
            Bài viết: {blog?.title}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
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
        ) : comments.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
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
            
            {!hasMore && comments.length > 5 && (
              <div className="p-4 text-center">
                <div className="text-xs text-gray-500 bg-gray-50 py-2 px-4 rounded-lg inline-flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Đã hiển thị tất cả bình luận
                </div>
              </div>
            )}
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
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="flex space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {(user?.fullName || user?.username || 'Y')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận của bạn..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {newComment.length}/500
              </span>
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || newComment.length > 500}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center text-sm"
              >
                <Send className="w-3 h-3 mr-1" />
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;
