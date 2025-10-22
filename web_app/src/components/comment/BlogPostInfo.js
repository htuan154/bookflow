// src/components/comment/BlogPostInfo.js
import React, { useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Stack, Chip,
  Divider, Grid, IconButton, Tooltip, Alert
} from '@mui/material';
import {
  Person, ThumbUp, ChatBubbleOutline,
  Visibility, Schedule, Article, Category, Tag, Share,
  Edit, Delete
} from '@mui/icons-material';

import {useComment} from '../../context/BlogCommentContext';

const BlogPostInfo = ({ blog, blogId, sx, onEdit, onDelete, showActions = false }) => {
  const { currentBlog, loading, error } = useComment();

  const blogData = useMemo(() => {
    const sourceBlog = currentBlog || blog;
    if (!sourceBlog) return null;
    return {
      ...sourceBlog,
      viewCount: sourceBlog.viewCount ?? 0,
      likeCount: sourceBlog.likeCount ?? 0,
      commentCount: sourceBlog.commentCount ?? 0
    };
  }, [currentBlog, blog, blogId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'default';
      case 'pending': return 'warning';
      case 'archived': return 'info';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published': return 'Đã xuất bản';
      case 'draft': return 'Bản nhá';
      case 'pending': return 'Chờ duyệt';
      case 'archived': return 'Đã lưu trữ';
      case 'rejected': return 'Bị từ chối';
      default: return status;
    }
  };

  const handleShare = () => {
    if (navigator.share && blogData) {
      navigator.share({
        title: blogData.title,
        text: blogData.excerpt || blogData.meta_description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <Card sx={{ ...sx, borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography>Đang tải thông tin bài viết...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={sx}>
        {error}
      </Alert>
    );
  }

  if (!blogData) {
    return null;
  }

  return (
    <Card sx={{
      ...sx,
      borderRadius: 3,
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      border: '1px solid #f0f0f0',
      overflow: 'hidden',
      bgcolor: 'white'
    }}>
      {/* Header trắng, nút cam */}
      <Box sx={{
        bgcolor: 'white',
        borderBottom: '1px solid #f0f0f0',
        p: 3
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{
              bgcolor: '#FFF7F0',
              p: 1.5,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Article sx={{ fontSize: 28, color: '#FF6B35' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="700" gutterBottom sx={{ mb: 0.5, color: '#1a202c' }}>
                Thông tin bài viết
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, color: '#64748b' }}>
                Chi tiết và thống kê tương tác
              </Typography>
            </Box>
          </Stack>
          {showActions && (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Chia sẻ">
                <IconButton
                  onClick={handleShare}
                  sx={{
                    color: '#FF6B35',
                    bgcolor: '#FFF7F0',
                    '&:hover': { bgcolor: '#FFE3CC' }
                  }}
                >
                  <Share />
                </IconButton>
              </Tooltip>
              {onEdit && (
                <Tooltip title="Chỉnh sửa">
                  <IconButton
                    onClick={() => onEdit(blogData)}
                    sx={{
                      color: '#FF6B35',
                      bgcolor: '#FFF7F0',
                      '&:hover': { bgcolor: '#FFE3CC' }
                    }}
                  >
                    <Edit />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Xóa">
                  <IconButton
                    onClick={() => onDelete(blogData.blog_id)}
                    sx={{
                      color: '#FF6B35',
                      bgcolor: '#FFF7F0',
                      '&:hover': { bgcolor: '#FFE3CC' }
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Stack>
      </Box>
      {/* ...giữ nguyên phần CardContent và các section khác... */}
      <CardContent sx={{ p: 3 }}>
        {/* Blog Title & Excerpt */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="700" color="#1a202c" gutterBottom sx={{ mb: 2 }}>
            {blogData.title}
          </Typography>
          {blogData.excerpt && (
            <Typography variant="body1" color="#64748b" sx={{ lineHeight: 1.7 }}>
              {blogData.excerpt}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Author & Date Info */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2.5,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              height: '100%'
            }}>
              <Avatar sx={{ 
                width: 48, 
                height: 48,
                bgcolor: '#667eea',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="caption" color="#94a3b8" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Tác giả
                </Typography>
                <Typography variant="body1" fontWeight="700" color="#1a202c">
                  {blogData.authorId || 'Không rõ'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2.5,
              bgcolor: '#f8fafc',
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              height: '100%'
            }}>
              <Box sx={{
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                p: 1.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Schedule sx={{ fontSize: 24, color: '#667eea' }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" color="#94a3b8" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Ngày đăng
                </Typography>
                <Typography variant="body2" fontWeight="700" color="#1a202c" sx={{ mb: 0.5 }}>
                  {formatDate(blogData.createdAt)}
                </Typography>
                <Chip 
                  label={getStatusText(blogData.status)}
                  size="small"
                  color={getStatusColor(blogData.status)}
                  sx={{ fontSize: '0.7rem', height: 20, fontWeight: 600 }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Statistics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="700" gutterBottom sx={{ mb: 2, color: '#1a202c' }}>
            Thống kê tương tác
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
                  borderColor: '#667eea'
                }
              }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Visibility sx={{ fontSize: 36, color: '#667eea', mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="#1a202c">
                    {formatNumber(blogData.viewCount)}
                  </Typography>
                  <Typography variant="caption" color="#64748b" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Lượt xem
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)',
                  borderColor: '#ef4444'
                }
              }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <ThumbUp sx={{ fontSize: 36, color: '#ef4444', mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="#1a202c">
                    {formatNumber(blogData.likeCount || 0)}
                  </Typography>
                  <Typography variant="caption" color="#64748b" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Lượt thích
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                  borderColor: '#3b82f6'
                }
              }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <ChatBubbleOutline sx={{ fontSize: 36, color: '#3b82f6', mb: 1 }} />
                  <Typography variant="h4" fontWeight="700" color="#1a202c">
                    {formatNumber(blogData.commentCount || 0)}
                  </Typography>
                  <Typography variant="caption" color="#64748b" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Bình luận
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Tags and Categories */}
        {(blogData.tags || blogData.category) && (
          <Box>
            <Divider sx={{ my: 3 }} />
            
            {blogData.category && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="#64748b" fontWeight="600" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Danh mục
                </Typography>
                <Chip 
                  icon={<Category sx={{ fontSize: 16 }} />}
                  label={blogData.category}
                  sx={{
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    fontWeight: 600,
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.2)'
                    }
                  }}
                />
              </Box>
            )}
            
            {blogData.tags && (
              <Box>
                <Typography variant="subtitle2" color="#64748b" fontWeight="600" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Thẻ
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {blogData.tags.split(',').map((tag, index) => (
                    <Chip 
                      key={index}
                      icon={<Tag sx={{ fontSize: 14 }} />}
                      label={tag.trim()}
                      size="small"
                      sx={{ 
                        mb: 1,
                        bgcolor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#667eea',
                          color: '#667eea',
                          bgcolor: 'rgba(102, 126, 234, 0.04)'
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BlogPostInfo;