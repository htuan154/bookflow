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
    <Box sx={{
      ...sx,
      bgcolor: 'white',
      borderRadius: 1,
      p: 2
    }}>
      {/* Header compact */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Article sx={{ fontSize: 20, color: '#64748b' }} />
          <Typography variant="h6" fontWeight="600" sx={{ color: '#1a202c', fontSize: '1rem' }}>
            Thông tin bài viết
          </Typography>
        </Stack>
        {showActions && (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Chia sẻ">
              <IconButton
                onClick={handleShare}
                size="small"
                sx={{
                  color: '#64748b',
                  bgcolor: 'transparent',
                  p: 0.5,
                  '&:hover': { 
                    bgcolor: '#f8fafc',
                    color: '#374151'
                  }
                }}
              >
                <Share sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            {onEdit && (
              <Tooltip title="Chỉnh sửa">
                <IconButton
                  onClick={() => onEdit(blogData)}
                  size="small"
                  sx={{
                    color: '#64748b',
                    bgcolor: 'transparent',
                    p: 0.5,
                    '&:hover': { 
                      bgcolor: '#f8fafc',
                      color: '#374151'
                    }
                  }}
                >
                  <Edit sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Xóa">
                <IconButton
                  onClick={() => onDelete(blogData.blog_id)}
                  size="small"
                  sx={{
                    color: '#64748b',
                    bgcolor: 'transparent',
                    p: 0.5,
                    '&:hover': { 
                      bgcolor: '#f8fafc',
                      color: '#374151'
                    }
                  }}
                >
                  <Delete sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
      </Stack>

        {/* Title only - compact */}
        <Typography variant="h5" fontWeight="600" color="#1a202c" sx={{ mb: 2 }}>
          {blogData.title}
        </Typography>

        {/* Author & Date - Responsive */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#FF6B35' }}>
              <Person sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="600" color="#1a202c">
                {blogData.username || blogData.authorId || 'Không rõ'}
              </Typography>
              <Typography variant="caption" color="#94a3b8">
                Tác giả
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Schedule sx={{ fontSize: 18, color: '#64748b' }} />
            <Box>
              <Typography variant="body2" fontWeight="600" color="#1a202c">
                {formatDate(blogData.createdAt)}
              </Typography>
              <Chip 
                label={getStatusText(blogData.status)}
                size="small"
                color={getStatusColor(blogData.status)}
                sx={{ fontSize: '0.65rem', height: 16, mt: 0.5 }}
              />
            </Box>
          </Stack>
        </Stack>

        {/* Statistics - Beautiful Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ 
              textAlign: 'center',
              p: 1.5,
              bgcolor: '#f8fafc',
              borderRadius: 1,
              border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#f1f5f9',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <Visibility sx={{ fontSize: 20, color: '#64748b', mb: 0.5 }} />
              <Typography variant="h6" fontWeight="700" color="#1a202c" sx={{ mb: 0.25 }}>
                {formatNumber(blogData.viewCount)}
              </Typography>
              <Typography variant="caption" color="#64748b" fontWeight="500">
                Lượt xem
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{ 
              textAlign: 'center',
              p: 1.5,
              bgcolor: '#f8fafc',
              borderRadius: 1,
              border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#f1f5f9',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <ThumbUp sx={{ fontSize: 20, color: '#64748b', mb: 0.5 }} />
              <Typography variant="h6" fontWeight="700" color="#1a202c" sx={{ mb: 0.25 }}>
                {formatNumber(blogData.likeCount || 0)}
              </Typography>
              <Typography variant="caption" color="#64748b" fontWeight="500">
                Lượt thích
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{ 
              textAlign: 'center',
              p: 1.5,
              bgcolor: '#f8fafc',
              borderRadius: 1,
              border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#f1f5f9',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }
            }}>
              <ChatBubbleOutline sx={{ fontSize: 20, color: '#64748b', mb: 0.5 }} />
              <Typography variant="h6" fontWeight="700" color="#1a202c" sx={{ mb: 0.25 }}>
                {formatNumber(blogData.commentCount || 0)}
              </Typography>
              <Typography variant="caption" color="#64748b" fontWeight="500">
                Bình luận
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Tags and Categories - Responsive */}
        {(blogData.tags || blogData.category) && (
          <Stack 
            direction="row" 
            spacing={1} 
            flexWrap="wrap" 
            useFlexGap
            sx={{ gap: 1 }}
          >
            {blogData.category && (
              <Chip 
                icon={<Category sx={{ fontSize: 14 }} />}
                label={blogData.category}
                size="small"
                sx={{
                  bgcolor: '#f8fafc',
                  color: '#64748b',
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              />
            )}
            
            {blogData.tags && blogData.tags.split(',').map((tag, index) => (
              <Chip 
                key={index}
                icon={<Tag sx={{ fontSize: 12 }} />}
                label={tag.trim()}
                size="small"
                sx={{ 
                  bgcolor: '#f8fafc',
                  color: '#64748b',
                  fontWeight: 400,
                  fontSize: '0.7rem'
                }}
              />
            ))}
          </Stack>
        )}
    </Box>
  );
};

export default BlogPostInfo;