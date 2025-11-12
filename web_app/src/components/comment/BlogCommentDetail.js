import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Stack, Chip,
  Button, Alert, CircularProgress, Collapse, TextField,
  IconButton
} from '@mui/material';
import {
  Reply, ThumbUp, ExpandMore, ExpandLess,
  Refresh, ChatBubbleOutline, Person, Send, Close
} from '@mui/icons-material';
import { useComment } from '../../context/BlogCommentContext';
import commentService from '../../api/comment.service';

const BlogCommentDetail = ({ blogId, onReply, onDataChanged }) => {
  const {
    comments,
    loading,
    error,
    getBlogById,
    getBlogCommentsWithUser,
    updateCommentStatus,
    replyComment,
    clearError,
    setComments
  } = useComment();

  const [expandedComments, setExpandedComments] = useState(new Set());
  const [deleteMessage, setDeleteMessage] = useState('');
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  
  // State cho form bình luận mới
  const [newCommentContent, setNewCommentContent] = useState('');
  const [newCommentLoading, setNewCommentLoading] = useState(false);

  const fetchBlogDetailRef = useRef();
  const fetchCommentsRef = useRef();

  fetchBlogDetailRef.current = async () => {
    if (!blogId || typeof blogId !== 'string' || blogId === 'undefined') return;
    try {
      await getBlogById(blogId);
    } catch (err) {
      console.error('💥 Fetch blog detail error:', err);
    }
  };

  fetchCommentsRef.current = async () => {
    if (!blogId || typeof blogId !== 'string' || blogId === 'undefined') return;
    try {
      const result = await getBlogCommentsWithUser(blogId);
      if (typeof setComments === 'function') {
        setComments(result);
      }
    } catch (err) {
      console.error('💥 Fetch comments error:', err);
    }
  };

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

  const handleReplyComment = useCallback((commentId, parentUserName) => {
    // Toggle inline reply form
    if (replyingToComment === commentId) {
      setReplyingToComment(null);
      setReplyContent('');
    } else {
      setReplyingToComment(commentId);
      setReplyContent('');
    }
  }, [replyingToComment]);

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyingToComment) return;
    
    setReplyLoading(true);
    try {
      // Call reply API
      await replyComment(blogId, replyingToComment, {
        content: replyContent.trim(),
        autoApprove: true
      });
      
      // Reset form
      setReplyingToComment(null);
      setReplyContent('');
      
      // Refresh comments
      if (fetchCommentsRef.current) {
        await fetchCommentsRef.current();
      }
      
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Error submitting reply:', err);
      alert('Lỗi khi gửi trả lời: ' + err.message);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingToComment(null);
    setReplyContent('');
  };

  const handleSubmitNewComment = async (content) => {
    try {
      setNewCommentLoading(true);
      
      // Gọi API tạo bình luận mới
      await commentService.createComment(blogId, {
        content: content.trim(),
        parent_comment_id: null // Bình luận gốc, không phải reply
      });
      
      // Refresh comments sau khi tạo thành công
      if (fetchCommentsRef.current) {
        await fetchCommentsRef.current();
      }
      
      if (onDataChanged) onDataChanged();
      
      // Reset form
      setNewCommentContent('');
    } catch (err) {
      console.error('Error creating comment:', err);
      alert('Lỗi khi tạo bình luận: ' + err.message);
    } finally {
      setNewCommentLoading(false);
    }
  };

  const updateStatus = async (commentId, newStatus) => {
    try {
      await updateCommentStatus(commentId, newStatus);
      if (getBlogById && blogId) {
        await getBlogById(blogId);
      }
      if (fetchCommentsRef.current) {
        await fetchCommentsRef.current();
      }
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('💥 Update status error:', err);
      if (err?.response?.data?.message) {
        alert(`Lỗi cập nhật trạng thái: ${err.response.data.message}`);
      } else {
        alert('Lỗi cập nhật trạng thái bình luận. Vui lòng thử lại hoặc kiểm tra quyền truy cập.');
      }
    }
  };

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

  // Returns MUI color for most, but 'rejected' returns 'orange' for custom styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'orange'; // custom
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

  const handleClearError = () => {
    clearError();
  };

  const renderComment = useCallback((comment, level = 0) => {
    // Debug: xem dữ liệu backend trả về
    console.log('🔍 Comment data:', {
      fullName: comment.fullName,
      username: comment.username,
      user: comment.user,
      comment
    });
    
    const isExpanded = expandedComments.has(comment.commentId);
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <Box key={comment.commentId} sx={{ mb: 2 }}>
        <Box sx={{ 
          p: 2,
          bgcolor: 'white',
          borderRadius: 1,
          border: level > 0 ? '1px solid #f0f0f0' : 'none',
          borderLeft: level > 0 ? '2px solid #e0e0e0' : 'none',
          ml: level > 0 ? 2 : 0
        }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Avatar sx={{ bgcolor: '#FF6B35', width: 32, height: 32 }}>
              <Person sx={{ fontSize: 18 }} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                  {comment.fullName || comment.username || comment.user?.full_name || 'Người dùng'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(comment.createdAt)}
                </Typography>
                {comment.status === 'rejected' ? (
                  <Chip
                    label={comment.status}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      height: 16,
                      bgcolor: '#FFF5F0',
                      color: '#FF6B35',
                      border: '1px solid #FF6B35',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                ) : (
                  <Chip
                    label={comment.status}
                    size="small"
                    color={getStatusColor(comment.status)}
                    sx={{ fontSize: '0.65rem', height: 16, textTransform: 'capitalize' }}
                  />
                )}
              </Stack>
              
              <Typography sx={{ mb: 1.5, fontSize: '0.9rem', lineHeight: 1.5 }}>
                {comment.content}
              </Typography>
              
              {/* Action Buttons - Đơn giản hóa */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  size="small"
                  startIcon={<Reply sx={{ fontSize: 14 }} />}
                  onClick={() => handleReplyComment(comment.commentId, comment.fullName || comment.username || comment.user?.full_name || 'Người dùng')}
                  sx={{
                    textTransform: 'none',
                    color: '#FF6B35',
                    bgcolor: 'transparent',
                    fontSize: '0.75rem',
                    px: 1,
                    py: 0.5,
                    minHeight: 'auto',
                    '&:hover': {
                      bgcolor: '#FFF5F0',
                      color: '#E55A2B'
                    }
                  }}
                >
                  Trả lời
                </Button>

                {/* Show/Hide Replies Button */}
                {hasReplies && (
                  <Button
                    size="small"
                    endIcon={isExpanded ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
                    onClick={() => toggleCommentExpansion(comment.commentId)}
                    sx={{ 
                      textTransform: 'none',
                      color: '#FF6B35',
                      bgcolor: 'transparent',
                      fontSize: '0.75rem',
                      px: 0.75,
                      py: 0.25,
                      minHeight: 'auto',
                      '&:hover': {
                        bgcolor: '#FFF5F0',
                        color: '#E55A2B'
                      }
                    }}
                  >
                    {comment.replies.length} phản hồi
                  </Button>
                )}

                {/* Admin Status Update Buttons */}
                {comment.status === 'pending' && (
                  <>
                    <Button
                      size="small"
                      onClick={() => updateStatus(comment.commentId, 'approved')}
                      sx={{
                        textTransform: 'none',
                        color: '#FF6B35',
                        bgcolor: 'transparent',
                        fontSize: '0.75rem',
                        px: 1,
                        py: 0.5,
                        minHeight: 'auto',
                        '&:hover': {
                          bgcolor: '#FFF5F0',
                          color: '#E55A2B'
                        }
                      }}
                    >
                      Duyệt
                    </Button>
                    <Button
                      size="small"
                      onClick={() => updateStatus(comment.commentId, 'rejected')}
                      sx={{
                        textTransform: 'none',
                        color: '#FF6B35',
                        bgcolor: 'transparent',
                        fontSize: '0.75rem',
                        px: 1,
                        py: 0.5,
                        minHeight: 'auto',
                        '&:hover': {
                          bgcolor: '#FFF5F0',
                          color: '#E55A2B'
                        }
                      }}
                    >
                      Từ chối
                    </Button>
                  </>
                )}

                {comment.status === 'approved' && (
                  <Button
                    size="small"
                    onClick={() => updateStatus(comment.commentId, 'hidden')}
                    sx={{
                      textTransform: 'none',
                      color: '#FF6B35',
                      bgcolor: 'transparent',
                      fontSize: '0.75rem',
                      px: 1,
                      py: 0.5,
                      minHeight: 'auto',
                      '&:hover': {
                        bgcolor: '#FFF5F0',
                        color: '#E55A2B'
                      }
                    }}
                  >
                    Ẩn
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Inline Reply Form */}
        {replyingToComment === comment.commentId && (
          <Box sx={{ 
            ml: level > 0 ? 4 : 2, 
            mr: 1, 
            mt: 1, 
            p: 2, 
            bgcolor: '#f8fafc', 
            borderRadius: 1
          }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#FF6B35' }}>
                <Person sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Viết trả lời của bạn..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      borderRadius: 1,
                      '& fieldset': {
                        borderColor: '#e2e8f0'
                      },
                      '&:hover fieldset': {
                        borderColor: '#d1d5db'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#64748b'
                      }
                    }
                  }}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Send sx={{ fontSize: 14 }} />}
                    onClick={handleSubmitReply}
                    disabled={!replyContent.trim() || replyLoading}
                    sx={{
                      bgcolor: '#FF6B35',
                      color: 'white',
                      border: '1px solid #FF6B35',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      px: 2,
                      boxShadow: 'none',
                      '&:hover': { 
                        bgcolor: '#E55A2B',
                        borderColor: '#E55A2B',
                        color: 'white',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {replyLoading ? 'Đang gửi...' : 'Gửi'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleCancelReply}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      bgcolor: 'white',
                      borderColor: '#FF6B35',
                      color: '#FF6B35',
                      px: 2,
                      '&:hover': {
                        bgcolor: '#FFF5F0',
                        borderColor: '#E55A2B',
                        color: '#E55A2B'
                      }
                    }}
                  >
                    Hủy
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}

        {hasReplies && (
          <Collapse in={isExpanded}>
            <Box sx={{ mt: 1 }}>
              {comment.replies.map(reply => renderComment(reply, level + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  }, [expandedComments, handleReplyComment, toggleCommentExpansion, updateStatus, replyingToComment, replyContent, replyLoading, handleSubmitReply, handleCancelReply]);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }} onClose={handleClearError}>
          {error}
        </Alert>
      )}
      {deleteMessage && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }} onClose={() => setDeleteMessage('')}>
          {deleteMessage}
        </Alert>
      )}

      <Box sx={{
        bgcolor: 'white',
        p: 3
      }}>
        {/* Header đơn giản */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ChatBubbleOutline sx={{ color: '#64748b', fontSize: 22 }} />
            <Typography variant="h6" fontWeight="600" color="#212121">
              Bình luận
            </Typography>
            <Chip
              label={countAllComments(organizedComments)}
              size="small"
              sx={{
                bgcolor: '#f8fafc',
                color: '#64748b',
                fontWeight: '600',
                fontSize: '0.75rem',
                height: 20
              }}
            />
          </Stack>

          <Button
            variant="text"
            size="small"
            startIcon={<Refresh sx={{ fontSize: 18 }} />}
            onClick={async () => {
              if (getBlogById && blogId) {
                await getBlogById(blogId);
              }
              if (fetchCommentsRef.current) {
                await fetchCommentsRef.current();
              }
            }}
            disabled={loading}
            sx={{
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
              '&:hover': {
                bgcolor: '#f8fafc',
                color: '#374151'
              },
              '&:disabled': {
                color: '#bdbdbd'
              }
            }}
          >
            {loading ? 'Đang tải...' : 'Làm mới'}
          </Button>
        </Stack>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress sx={{ color: '#FF6B35' }} size={36} />
                <Typography color="#757575" fontSize="0.875rem">
                  Đang tải bình luận...
                </Typography>
              </Stack>
            </Box>
          ) : organizedComments.length === 0 ? (
            <Box>
              {/* Thông báo chưa có bình luận */}
              <Box sx={{
                textAlign: 'center',
                py: 3,
                bgcolor: '#fafafa',
                borderRadius: 1,
                border: '1px dashed #e0e0e0',
                mb: 3
              }}>
                <ChatBubbleOutline sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
                <Typography variant="subtitle1" color="#616161" gutterBottom fontWeight="500" sx={{ fontSize: '0.95rem' }}>
                  Chưa có bình luận nào
                </Typography>
                <Typography variant="body2" color="#9e9e9e" sx={{ fontSize: '0.8rem' }}>
                  Hãy là người đầu tiên bình luận về bài viết này
                </Typography>
              </Box>

              {/* Form viết bình luận mới - Khi chưa có bình luận */}
              <Box sx={{ 
                p: 3, 
                bgcolor: '#f8fafc', 
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ width: 40, height: 40, bgcolor: '#FF6B35' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Viết bình luận của bạn về bài viết này..."
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: '#e2e8f0'
                          },
                          '&:hover fieldset': {
                            borderColor: '#d1d5db'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF6B35'
                          }
                        }
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Send sx={{ fontSize: 16 }} />}
                        onClick={async () => {
                          if (!newCommentContent.trim()) return;
                          setNewCommentLoading(true);
                          try {
                            await handleSubmitNewComment(newCommentContent.trim());
                            setNewCommentContent('');
                          } catch (err) {
                            console.error('Error:', err);
                            alert('Lỗi khi gửi bình luận: ' + err.message);
                          } finally {
                            setNewCommentLoading(false);
                          }
                        }}
                        disabled={!newCommentContent.trim() || newCommentLoading}
                        sx={{
                          bgcolor: '#FF6B35',
                          color: 'white',
                          border: '1px solid #FF6B35',
                          textTransform: 'none',
                          px: 3,
                          py: 1,
                          boxShadow: 'none',
                          '&:hover': { 
                            bgcolor: '#E55A2B',
                            borderColor: '#E55A2B',
                            color: 'white',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        {newCommentLoading ? 'Đang gửi...' : 'Đăng bình luận'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setNewCommentContent('')}
                        sx={{
                          textTransform: 'none',
                          bgcolor: 'white',
                          borderColor: '#FF6B35',
                          color: '#FF6B35',
                          px: 3,
                          py: 1,
                          '&:hover': {
                            bgcolor: '#FFF5F0',
                            borderColor: '#E55A2B',
                            color: '#E55A2B'
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Box>
          ) : (
            <Box>
              {organizedComments.map(comment => renderComment(comment))}
              
              {/* Form viết bình luận mới (khi đã có bình luận) */}
              <Box sx={{ 
                mt: 3,
                p: 3, 
                bgcolor: '#f8fafc', 
                borderRadius: 2,
                border: '1px solid #e2e8f0'
              }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2, color: '#374151' }}>
                  💬 Viết bình luận mới
                </Typography>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ width: 40, height: 40, bgcolor: '#FF6B35' }}>
                    <Person />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                      value={newCommentContent}
                      onChange={(e) => setNewCommentContent(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: '#e2e8f0'
                          },
                          '&:hover fieldset': {
                            borderColor: '#FF6B35'
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF6B35'
                          }
                        }
                      }}
                    />
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<Send sx={{ fontSize: 16 }} />}
                        onClick={async () => {
                          if (!newCommentContent.trim()) return;
                          setNewCommentLoading(true);
                          try {
                            await handleSubmitNewComment(newCommentContent.trim());
                            setNewCommentContent('');
                          } catch (err) {
                            console.error('Error:', err);
                            alert('Lỗi khi gửi bình luận: ' + err.message);
                          } finally {
                            setNewCommentLoading(false);
                          }
                        }}
                        disabled={!newCommentContent.trim() || newCommentLoading}
                        sx={{
                          bgcolor: '#FF6B35',
                          textTransform: 'none',
                          px: 3,
                          py: 1,
                          '&:hover': { bgcolor: '#e55a2b' }
                        }}
                      >
                        {newCommentLoading ? 'Đang gửi...' : 'Đăng bình luận'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => setNewCommentContent('')}
                        sx={{
                          textTransform: 'none',
                          bgcolor: 'white',
                          borderColor: '#FF6B35',
                          color: '#FF6B35',
                          px: 3,
                          py: 1,
                          '&:hover': {
                            bgcolor: '#FFF5F0',
                            borderColor: '#E55A2B',
                            color: '#E55A2B'
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Box>
          )}
      </Box>
    </Box>
  );
}

export default BlogCommentDetail;