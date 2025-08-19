import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Stack, Chip,
  Button, Divider, Alert, CircularProgress, Collapse
} from '@mui/material';
import {
  Reply, Check, Close, ThumbUp, ExpandMore, ExpandLess,
  Refresh, ChatBubbleOutline, Visibility, Person
} from '@mui/icons-material';
import { useComment } from '../../context/BlogCommentContext';
import commentService from '../../api/comment.service';


const BlogCommentDetail = ({ blogId, onReply, onDataChanged }) => {
  const {
    currentBlog,
    comments,
    loading,
    error,
    getBlogById,
    getBlogCommentsWithUser,
    replyComment,
    updateCommentStatus,
    clearError,
    setComments // Thêm nếu context có setComments, nếu không thì dùng cách khác bên dưới
  } = useComment();

  const [expandedComments, setExpandedComments] = useState(new Set());
  const [replyDialog, setReplyDialog] = useState({ open: false, commentId: null, parentUser: '' });
  const [replyContent, setReplyContent] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  // ✅ FIX 1: Tạo function refs để tránh dependency loop
  const fetchBlogDetailRef = useRef();
  const fetchCommentsRef = useRef();

  fetchBlogDetailRef.current = async () => {
    if (!blogId || typeof blogId !== 'string' || blogId === 'undefined') return;
    
    try {
      console.log('🔍 Fetching blog detail for:', blogId);
      const result = await getBlogById(blogId);
      console.log('✅ [fetchBlogDetail] API Response:', result);
    } catch (err) {
      console.error('💥 Fetch blog detail error:', err);
    }
  };

  fetchCommentsRef.current = async () => {
    if (!blogId || typeof blogId !== 'string' || blogId === 'undefined') return;
    try {
      const result = await getBlogCommentsWithUser(blogId);
      // Cập nhật comments vào state/context ngay
      if (typeof setComments === 'function') {
        setComments(result);
      }
    } catch (err) {
      console.error('💥 Fetch comments error:', err);
    }
  };

  // ✅ FIX 2: Effects CHỈ phụ thuộc vào blogId
  useEffect(() => {
    if (blogId && typeof blogId === 'string' && blogId !== 'undefined') {
      fetchBlogDetailRef.current();
    }
  }, [blogId]);

  useEffect(() => {
    if (blogId && typeof blogId === 'string' && blogId !== 'undefined') {
      fetchCommentsRef.current();
    }
  }, [blogId]);

  useEffect(() => {
    window.refreshComments = () => {
      if (blogId && typeof blogId === 'string' && blogId !== 'undefined') {
        fetchCommentsRef.current();
      }
    };
    return () => {
      delete window.refreshComments;
    };
  }, [blogId]);

  // ✅ FIX 3: Stable organized comments
  const organizedComments = useMemo(() => {
    if (!Array.isArray(comments)) return [];
    
    const commentMap = {};
    const rootComments = [];

    comments.forEach(comment => {
      commentMap[comment.commentId] = { ...comment, replies: [] };
    });

    comments.forEach(comment => {
      if (comment.parentCommentId) {
        const parent = commentMap[comment.parentCommentId];
        if (parent) {
          parent.replies.push(commentMap[comment.commentId]);
        }
      } else {
        rootComments.push(commentMap[comment.commentId]);
      }
    });

    return rootComments;
  }, [comments]);

  // ✅ FIX 4: Stable callbacks
  const handleReplyComment = useCallback((commentId, parentUserName) => {
    setReplyDialog({ open: true, commentId, parentUser: parentUserName });
    
    if (onReply) {
      const findCommentById = (commentList, id) => {
        for (const comment of commentList) {
          if (comment.commentId === id) return comment;
          if (comment.replies) {
            const found = findCommentById(comment.replies, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      const parentComment = findCommentById(organizedComments, commentId);
      onReply(commentId, parentUserName, parentComment); // SỬA: truyền object comment đầy đủ
    }
  }, [onReply, organizedComments]);

  // Hàm cập nhật lại comments ngay sau khi thao tác
  const refreshCommentsImmediate = useCallback(async () => {
    if (blogId && typeof blogId === 'string' && blogId !== 'undefined') {
      try {
        const newComments = await getBlogCommentsWithUser(blogId);
        // Nếu context có setComments thì dùng, nếu không thì reload lại trang hoặc set lại state comments nếu có
        if (typeof setComments === 'function') {
          setComments(newComments);
        }
        // Nếu không có setComments, bạn có thể dùng window.location.reload() hoặc forceUpdate, nhưng nên ưu tiên setComments
      } catch (err) {
        console.error('💥 Refresh comments error:', err);
      }
    }
  }, [blogId, getBlogCommentsWithUser, setComments]);

  const updateStatus = async (commentId, newStatus) => {
    try {
      await updateCommentStatus(commentId, newStatus);
      // Gọi lại API lấy blog để cập nhật số liệu thống kê
      if (getBlogById && blogId) {
        await getBlogById(blogId);
      }
      // Gọi fetchCommentsRef để cập nhật comments ngay
      if (fetchCommentsRef.current) {
        await fetchCommentsRef.current();
      }
      // Báo cho cha biết có thay đổi để reload danh sách blogs khi quay lại
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('💥 Update status error:', err);
      // Hiển thị lỗi lên UI nếu có message từ server
      if (err?.response?.data?.message) {
        clearError();
        // Nếu có hàm setError trong context, dùng nó. Nếu không, dùng alert tạm thời.
        if (typeof clearError === 'function') {
          clearError(); // Xóa lỗi cũ
        }
        alert(`Lỗi cập nhật trạng thái: ${err.response.data.message}`);
      } else {
        alert('Lỗi cập nhật trạng thái bình luận. Vui lòng thử lại hoặc kiểm tra quyền truy cập.');
      }
    }
  };

  // Hàm xóa bình luận
  const deleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setDeleteMessage('Bình luận đã bị từ chối và xóa thành công.');
      // Gọi lại API lấy blog để cập nhật số liệu thống kê
      if (getBlogById && blogId) {
        await getBlogById(blogId);
      }
      // Gọi fetchCommentsRef để cập nhật comments ngay
      if (fetchCommentsRef.current) {
        await fetchCommentsRef.current();
      }
      // Báo cho cha biết có thay đổi để reload danh sách blogs khi quay lại
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setDeleteMessage('Lỗi khi xóa bình luận. Vui lòng thử lại.');
      console.error('💥 Delete comment error:', err);
    }
  };

  // Hàm tính tổng số bình luận (bao gồm phản hồi)
  const countAllComments = (comments) => {
    let total = 0;
    const countRecursive = (arr) => {
      arr.forEach(comment => {
        total += 1;
        if (comment.replies && comment.replies.length > 0) {
          countRecursive(comment.replies);
        }
      });
    };
    countRecursive(comments);
    return total;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vài phút trước';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return past.toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'hidden': return 'default';
      default: return 'default';
    }
  };


  const toggleCommentExpansion = (commentId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  // Handle clear error
  const handleClearError = () => {
    clearError();
  };

  // ✅ FIX 5: Stable render function
  const renderComment = useCallback((comment, level = 0) => {
    const isExpanded = expandedComments.has(comment.commentId);
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <Box key={comment.commentId} sx={{ ml: level * 2 }}>
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 2,
            bgcolor: level > 0 ? '#f8fafc' : 'white',
            borderLeft: level > 0 ? '4px solid #FF6B35' : 'none',
            borderRadius: 3,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.1)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ 
                width: 44, 
                height: 44,
                bgcolor: '#64748b',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <Person />
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                {/* User info header */}
                <Box sx={{ 
                  bgcolor: level > 0 ? 'rgba(255, 107, 53, 0.05)' : '#f8fafc',
                  p: 2,
                  borderRadius: 2,
                  mb: 2
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight="700" color="#1a202c">
                        {comment.user?.full_name?.trim()
                          ? comment.user.full_name
                          : (comment.user?.username?.trim()
                            ? comment.user.username
                            : (comment.full_name?.trim()
                              ? comment.full_name
                              : 'Ẩn danh'))}
                      </Typography>
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="caption" color="#64748b" fontWeight="500">
                        🕒 {comment.createdAt ? formatTimeAgo(comment.createdAt) : '-'}
                      </Typography>
                      <Chip 
                        label={comment.status} 
                        size="small" 
                        color={getStatusColor(comment.status)}
                        sx={{ fontSize: '0.7rem', height: 22 }}
                      />
                    </Stack>
                  </Stack>
                </Box>

                {/* Comment content */}
                <Box sx={{ 
                  bgcolor: 'white',
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  mb: 2
                }}>
                  <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#374151' }}>
                    {comment.content}
                  </Typography>
                </Box>

                {/* Action bar */}
                <Box sx={{ 
                  bgcolor: '#f8fafc',
                  px: 3,
                  py: 2,
                  borderRadius: 2,
                  border: '1px solid #e2e8f0'
                }}>
                  <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Reply />}
                        onClick={() => handleReplyComment(comment.commentId, comment.full_name)}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          borderColor: '#FF6B35',
                          color: '#FF6B35',
                          '&:hover': {
                            bgcolor: 'rgba(255, 107, 53, 0.04)',
                            borderColor: '#e55a2b'
                          }
                        }}
                      >
                        Trả lời
                      </Button>

                      {comment.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<Check />}
                            onClick={() => updateStatus(comment.commentId, 'approved')}
                            sx={{
                              textTransform: 'none',
                              borderRadius: 2,
                              fontSize: '0.8rem'
                            }}
                          >
                            Duyệt
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<Close />}
                            onClick={() => deleteComment(comment.commentId)}
                            sx={{
                              textTransform: 'none',
                              borderRadius: 2,
                              fontSize: '0.8rem'
                            }}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}

                      {/* Nếu comment đã bị từ chối thì hiện nút Delete để xóa */}
                      {comment.status === 'rejected' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => deleteComment(comment.commentId)}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            fontSize: '0.8rem'
                          }}
                        >
                          Xóa
                        </Button>
                      )}

                      {/* Nút Ẩn bình luận (chỉ hiện nếu không phải hidden hoặc rejected) */}
                      {comment.status !== 'hidden' && comment.status !== 'rejected' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          onClick={() => updateStatus(comment.commentId, 'hidden')}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            fontSize: '0.8rem'
                          }}
                        >
                          Ẩn
                        </Button>
                      )}

                      {/* Nút Hiện bình luận (chỉ hiện nếu đang hidden) */}
                      {comment.status === 'hidden' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => updateStatus(comment.commentId, 'approved')}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            fontSize: '0.8rem'
                          }}
                        >
                          Hiện
                        </Button>
                      )}
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <ThumbUp sx={{ fontSize: 16, color: '#64748b' }} />
                        <Typography variant="caption" color="#64748b" fontWeight="600">
                          {comment.likeCount || 0}
                        </Typography>
                      </Stack>

                      {hasReplies && (
                        <Button
                          size="small"
                          variant="text"
                          endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                          onClick={() => toggleCommentExpansion(comment.commentId)}
                          sx={{ 
                            textTransform: 'none',
                            color: '#64748b',
                            fontSize: '0.8rem'
                          }}
                        >
                          {comment.replies.length} phản hồi
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Render replies */}
        {hasReplies && (
          <Collapse in={isExpanded}>
            <Box sx={{ ml: 2, position: 'relative' }}>
              {/* Connection line */}
              <Box sx={{
                position: 'absolute',
                left: -10,
                top: 0,
                bottom: 0,
                width: 2,
                bgcolor: '#FF6B35',
                opacity: 0.3
              }} />
              {comment.replies.map(reply => renderComment(reply, level + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  }, [expandedComments, handleReplyComment, toggleCommentExpansion, updateStatus]);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={handleClearError}>
          {error}
        </Alert>
      )}
      {deleteMessage && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setDeleteMessage('')}>
          {deleteMessage}
        </Alert>
      )}

      {/* Conditional render - chỉ hiển thị khi có currentBlog */}
      {currentBlog ? (
        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid #f0f0f0',
          mb: 3,
          bgcolor: 'white'
        }}>
          <CardContent sx={{ p: 4 }}>
            {/* Thông tin blog */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" fontWeight="700" color="#1a202c" gutterBottom>
                {currentBlog.title}
              </Typography>
              {currentBlog.excerpt && (
                <Typography variant="body1" color="#64748b" sx={{ lineHeight: 1.6, mb: 2 }}>
                  {currentBlog.excerpt}
                </Typography>
              )}
              <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
                <Chip
                  label={currentBlog.createdAt ? new Date(currentBlog.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                  sx={{ bgcolor: '#f8fafc', color: '#475569', fontWeight: '600' }}
                />
                <Chip
                  label={`${currentBlog.viewCount} lượt xem`} // ✅ Bỏ || 0 để debug
                  icon={<Visibility />}
                  sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: '600' }}
                />
                <Chip
                  label={`${currentBlog.likeCount} lượt thích`} // ✅ Bỏ || 0 để debug
                  icon={<ThumbUp />}
                  sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: '600' }}
                />
                <Chip
                  label={`${countAllComments(organizedComments)} bình luận`}
                  icon={<ChatBubbleOutline />}
                  sx={{ bgcolor: 'rgba(255, 107, 53, 0.1)', color: '#FF6B35', fontWeight: '600' }}
                />
              </Stack>

              {/* Tags */}
              {currentBlog?.tags && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="#64748b" sx={{ mr: 1 }}>
                    Thẻ:
                  </Typography>
                  {(Array.isArray(currentBlog?.tags) ? currentBlog.tags : typeof currentBlog?.tags === 'string' ? currentBlog.tags.split(',') : []).map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag.trim()} 
                      size="small"
                      sx={{ 
                        mr: 1, 
                        mb: 1, 
                        bgcolor: '#f3f4f6', 
                        color: '#475569',
                        fontSize: '0.75rem'
                      }} 
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Bình luận */}
            <Box>
              <Typography variant="h6" fontWeight="700" color="#1a202c" sx={{ mb: 2 }}>
                💬 Bình luận
                <Chip
                  label={organizedComments.length}
                  size="small"
                  sx={{
                    bgcolor: '#3b82f6',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    ml: 1
                  }}
                />
              </Typography>
              <Typography variant="body2" color="#64748b" sx={{ mb: 2 }}>
                Quản lý và phản hồi bình luận của bài viết
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={async () => {
                  console.log('[BlogCommentDetail] Refresh button clicked');
                  if (getBlogById && blogId) {
                    await getBlogById(blogId);
                  }
                  if (fetchCommentsRef.current) {
                    await fetchCommentsRef.current();
                  }
                }}
                size="small"
                disabled={loading}
                sx={{
                  textTransform: 'none',
                  color: '#FF6B35',
                  borderColor: '#FF6B35',
                  '&:hover': {
                    bgcolor: 'rgba(255, 107, 53, 0.04)',
                    borderColor: '#e55a2b'
                  }
                }}
              >
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
              <Box sx={{ mt: 2 }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                    <Stack alignItems="center" spacing={2}>
                      <CircularProgress sx={{ color: '#FF6B35' }} />
                      <Typography color="#64748b">Đang tải bình luận...</Typography>
                    </Stack>
                  </Box>
                ) : organizedComments.length === 0 ? (
                  <Box sx={{
                    textAlign: 'center',
                    py: 8,
                    bgcolor: '#fafafa',
                    borderRadius: 3,
                    border: '2px dashed #e2e8f0'
                  }}>
                    <ChatBubbleOutline sx={{ fontSize: 64, color: '#cbd5e0', mb: 2 }} />
                    <Typography variant="h6" color="#64748b" gutterBottom fontWeight="600">
                      💭 Chưa có bình luận nào
                    </Typography>
                    <Typography variant="body2" color="#94a3b8">
                      Bài viết này chưa nhận được bình luận từ người đọc
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {organizedComments.map(comment => renderComment(comment))}
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: '#FF6B35' }} />
            <Typography color="#64748b">Đang tải thông tin bài viết...</Typography>
          </Stack>
        </Box>
      ) : (
        <Alert severity="error">
          Không tìm thấy thông tin bài viết
        </Alert>
      )}
    </Box>
  );
}

export default BlogCommentDetail;