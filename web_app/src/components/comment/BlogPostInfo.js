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

  // Sửa dependencies của useMemo và loại bỏ biến không dùng
  const blogData = useMemo(() => {
    // Ưu tiên lấy blog truyền vào, nếu không thì lấy currentBlog từ context
    const sourceBlog =  currentBlog || blog;
    if (!sourceBlog) return null;
    return {
      ...sourceBlog,
      // Sửa lại lấy đúng key cho viewCount, likeCount, commentCount
      viewCount: sourceBlog.viewCount ??  0,
      likeCount: sourceBlog.likeCount ??  0,
      commentCount: sourceBlog.commentCount ??  0
    };
  }, [currentBlog, blog, blogId]); // Thêm blogId vào dependencies

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
      case 'draft': return 'Bản nháp';
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
      // Fallback: copy to clipboard
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
    return (
      <Alert severity="warning" sx={sx}>
        Không tìm thấy thông tin bài viết
      </Alert>
    );
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
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #f7931e 100%)',
        color: 'white',
        p: 3
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Article sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                📄 Thông tin bài viết
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Chi tiết và thống kê tương tác
              </Typography>
            </Box>
          </Stack>
          
          {showActions && (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Chia sẻ">
                <IconButton onClick={handleShare} sx={{ color: 'white' }}>
                  <Share />
                </IconButton>
              </Tooltip>
              {onEdit && (
                <Tooltip title="Chỉnh sửa">
                  <IconButton onClick={() => onEdit(blogData)} sx={{ color: 'white' }}>
                    <Edit />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Xóa">
                  <IconButton onClick={() => onDelete(blogData.blog_id)} sx={{ color: 'white' }}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )}
        </Stack>
      </Box>

      <CardContent sx={{ p: 4 }}>
        {/* Blog Title */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="700" color="#1a202c" gutterBottom>
            {blogData.title}
          </Typography>
          {blogData.excerpt && (
            <Typography variant="body1" color="#64748b" sx={{ lineHeight: 1.6 }}>
              {blogData.excerpt}
            </Typography>
          )}
        </Box>

        {/* Blog Meta Info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Author Info */}
          <Grid>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 3,
              bgcolor: '#f8fafc',
              borderRadius: 3,
              border: '1px solid #f1f5f9'
            }}>
              <Avatar sx={{ 
                width: 48, 
                height: 48,
                bgcolor: '#757575'
              }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="#64748b">
                  Tác giả
                </Typography>
                <Typography variant="h6" fontWeight="600" color="#1a202c">
                  {blogData.authorId || 'Không rõ'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Date Info */}
          <Grid>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 3,
              bgcolor: '#f8fafc',
              borderRadius: 3,
              border: '1px solid #f1f5f9'
            }}>
              <Box sx={{
                bgcolor: 'rgba(255, 107, 53, 0.1)',
                p: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center'
              }}>
                <Schedule sx={{ fontSize: 24, color: '#FF6B35' }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="#64748b">
                  Ngày đăng
                </Typography>
                <Typography variant="body1" fontWeight="600" color="#1a202c">
                  {formatDate(blogData.createdAt)}
                </Typography>
                <Chip 
                  label={getStatusText(blogData.status)}
                  size="small"
                  color={getStatusColor(blogData.status)}
                  sx={{ fontSize: '0.7rem', mt: 0.5 }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Statistics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom sx={{ mb: 2, color: '#1a202c' }}>
            📊 Thống kê tương tác
          </Typography>
          
          <Grid container spacing={2}>
            <Grid>
              <Card sx={{ 
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Visibility sx={{ fontSize: 32, color: '#64748b', mb: 1 }} />
                  <Typography variant="h5" fontWeight="700" color="#1a202c">
                    {formatNumber(blogData.viewCount)}
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    Lượt xem
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid>
              <Card sx={{ 
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <ThumbUp sx={{ fontSize: 32, color: '#FF6B35', mb: 1 }} />
                  <Typography variant="h5" fontWeight="700" color="#1a202c">
                    {formatNumber(blogData.likeCount || 0)}
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    Lượt thích
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid>
              <Card sx={{ 
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <ChatBubbleOutline sx={{ fontSize: 32, color: '#3b82f6', mb: 1 }} />
                  <Typography variant="h5" fontWeight="700" color="#1a202c">
                    {formatNumber(blogData.commentCount || 0)}
                  </Typography>
                  <Typography variant="caption" color="#64748b">
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
            <Stack direction="row" spacing={2} flexWrap="wrap">
              {blogData.category && (
                <Box>
                  <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                    Danh mục:
                  </Typography>
                  <Chip 
                    icon={<Category />}
                    label={blogData.category}
                    variant="outlined"
                    sx={{
                      borderColor: '#FF6B35',
                      color: '#FF6B35',
                      '&:hover': {
                        bgcolor: 'rgba(255, 107, 53, 0.04)'
                      }
                    }}
                  />
                </Box>
              )}
              
              {blogData.tags && (
                <Box>
                  <Typography variant="subtitle2" color="#64748b" sx={{ mb: 1 }}>
                    Thẻ:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {blogData.tags.split(',').map((tag, index) => (
                      <Chip 
                        key={index}
                        icon={<Tag />}
                        label={tag.trim()}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          mb: 1,
                          borderColor: '#e2e8f0',
                          color: '#64748b',
                          '&:hover': {
                            borderColor: '#FF6B35',
                            color: '#FF6B35',
                            bgcolor: 'rgba(255, 107, 53, 0.04)'
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default BlogPostInfo;