import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Stack, Chip,
  Button, Alert, CircularProgress, Collapse
} from '@mui/material';
import {
  Reply, ThumbUp, ExpandMore, ExpandLess,
  Refresh, ChatBubbleOutline, Person
} from '@mui/icons-material';
import { useComment } from '../../context/BlogCommentContext';

const BlogCommentDetail = ({ blogId, onReply, onDataChanged }) => {
  const {
    comments,
    loading,
    error,
    getBlogById,
    getBlogCommentsWithUser,
    updateCommentStatus,
    clearError,
    setComments
  } = useComment();

  const [expandedComments, setExpandedComments] = useState(new Set());
  const [deleteMessage, setDeleteMessage] = useState('');

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
      onReply(commentId, parentUserName, parentComment);
    }
  }, [onReply, organizedComments]);

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

  const handleClearError = () => {
    clearError();
  };

  const renderComment = useCallback((comment, level = 0) => {
    const isExpanded = expandedComments.has(comment.commentId);
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <Box key={comment.commentId} sx={{ ml: level > 0 ? 3 : 0, mb: 1.5 }}>
        <Card 
          variant="outlined" 
          sx={{ 
            bgcolor: 'white',
            borderLeft: level > 0 ? '2px solid #e0e0e0' : 'none',
            borderRadius: 1,
            border: '1px solid #e0e0e0',
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Avatar sx={{ bgcolor: '#FF6B35', width: 36, height: 36 }}>
                <Person />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography fontWeight={600}>{comment.userName || 'Ẩn danh'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeAgo(comment.createdAt)}
                  </Typography>
                  <Chip label={comment.status} size="small" color={getStatusColor(comment.status)} sx={{ fontSize: '0.7rem', height: 20 }} />
                </Stack>
                <Typography sx={{ mt: 1, mb: 1 }}>{comment.content}</Typography>
                {hasReplies && (
                  <Button
                    size="small"
                    endIcon={isExpanded ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
                    onClick={() => toggleCommentExpansion(comment.commentId)}
                    sx={{ 
                      textTransform: 'none',
                      color: '#757575',
                      fontSize: '0.75rem',
                      px: 0.75,
                      py: 0.25,
                      ml: 'auto !important',
                      fontWeight: 500,
                      '&:hover': {
                        color: '#FF6B35',
                        bgcolor: 'rgba(255, 107, 53, 0.04)'
                      }
                    }}
                  >
                    {comment.replies.length}
                  </Button>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
        {hasReplies && (
          <Collapse in={isExpanded}>
            <Box sx={{ mt: 1 }}>
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
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }} onClose={handleClearError}>
          {error}
        </Alert>
      )}
      {deleteMessage && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }} onClose={() => setDeleteMessage('')}>
          {deleteMessage}
        </Alert>
      )}

      <Card sx={{
        borderRadius: 1,
        boxShadow: 'none',
        border: '1px solid #e0e0e0',
        bgcolor: 'white'
      }}>
        <Box sx={{
          bgcolor: 'white',
          borderBottom: '1px solid #e0e0e0',
          p: 2
        }}>
          <Stack 
            direction="row" 
            alignItems="center" 
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <ChatBubbleOutline sx={{ color: '#FF6B35', fontSize: 24 }} />
              <Typography variant="h6" fontWeight="600" color="#212121" sx={{ fontSize: '1.1rem' }}>
                Bình luận
              </Typography>
              <Chip
                label={countAllComments(organizedComments)}
                size="small"
                sx={{
                  bgcolor: '#FF6B35',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  height: 22
                }}
              />
            </Stack>

            <Button
              variant="outlined"
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
                borderColor: '#e0e0e0',
                color: '#FF6B35',
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                py: 0.5,
                fontSize: '0.875rem',
                '&:hover': {
                  borderColor: '#FF6B35',
                  bgcolor: 'rgba(255, 107, 53, 0.04)'
                },
                '&:disabled': {
                  borderColor: '#e0e0e0',
                  color: '#bdbdbd'
                }
              }}
            >
              {loading ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </Stack>
        </Box>

        <CardContent sx={{ p: 2 }}>
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
            <Box sx={{
              textAlign: 'center',
              py: 5,
              bgcolor: '#fafafa',
              borderRadius: 1,
              border: '1px dashed #e0e0e0'
            }}>
              <ChatBubbleOutline sx={{ fontSize: 48, color: '#bdbdbd', mb: 1 }} />
              <Typography variant="subtitle1" color="#616161" gutterBottom fontWeight="500" sx={{ fontSize: '0.95rem' }}>
                Chưa có bình luận nào
              </Typography>
              <Typography variant="body2" color="#9e9e9e" sx={{ fontSize: '0.8rem' }}>
                Bài viết này chưa nhận được bình luận từ người đọc
              </Typography>
            </Box>
          ) : (
            <Box>
              {organizedComments.map(comment => renderComment(comment))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default BlogCommentDetail;