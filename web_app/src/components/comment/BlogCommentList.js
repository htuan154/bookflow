import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  Chip, Avatar, Stack, Alert, CircularProgress,
  Tooltip, TextField, InputAdornment
} from '@mui/material';
import {
  ThumbUp, ChatBubbleOutline,
  Person, Schedule, Article, Refresh, Search
} from '@mui/icons-material';

const BlogCommentList = ({ 
  onSelectBlog, 
  blogs = [], 
  loading = false, 
  searchTerm = '', 
  onSearchChange, 
  onRefresh 
}) => {
  const [error, setError] = useState('');
  
  // ✅ FIX: Đơn giản hóa state management - không cần internal state
  const debounceTimeoutRef = useRef(null);

  // Đảm bảo blogs luôn là mảng
  const safeBlogs = Array.isArray(blogs) ? blogs : [];

  // ✅ FIX: Handle search change đơn giản - trực tiếp gọi callback
  const handleSearchChange = (value) => {
    console.log('[BlogCommentList] Search change:', value);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounced call to parent
    debounceTimeoutRef.current = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(value);
      }
    }, 300);
  };

  // ✅ Cleanup timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCommentCount = (blog) => {
    return blog.commentCount ?? 0;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" bgcolor="white">
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} sx={{ color: '#FF6B35' }} />
          <Typography variant="h6" color="#64748b">Đang tải dữ liệu...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'white' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            border: '1px solid #FEE2E2',
            bgcolor: '#FEF2F2'
          }} 
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Search and Blog List */}
      <Card sx={{ 
        borderRadius: 3, 
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        bgcolor: 'white'
      }}>
        <Box sx={{ p: 4, borderBottom: '1px solid #e2e8f0' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={3}>
            <Box>
              <Typography variant="h6" fontWeight="600" color="#1a202c" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📋 Danh sách bài viết 
                <Chip 
                  label={`${safeBlogs.length} bài viết`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,107,53,0.1)',
                    color: '#FF6B35',
                    fontWeight: '600',
                    height: 24
                  }}
                />
                {searchTerm && (
                  <Chip 
                    label={`Tìm kiếm: "${searchTerm}"`}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#FF6B35',
                      color: '#FF6B35',
                      height: 24
                    }}
                  />
                )}
              </Typography>
              <Typography variant="body2" color="#64748b">
                Click vào bài viết để quản lý bình luận
              </Typography>
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
              {onRefresh && (
                <Button
                  startIcon={<Refresh />}
                  onClick={onRefresh}
                  variant="outlined"
                  disabled={loading}
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2,
                    fontWeight: '600',
                    borderColor: '#e2e8f0',
                    color: '#475569',
                    bgcolor: 'white',
                    '&:hover': {
                      borderColor: '#FF6B35',
                      color: '#FF6B35',
                      bgcolor: 'rgba(255, 107, 53, 0.04)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  Làm mới
                </Button>
              )}
              
              {onSearchChange && (
                <TextField
                  size="medium"
                  placeholder="Tìm kiếm bài viết..."
                  defaultValue={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: loading ? '#cbd5e1' : '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 300 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: loading ? '#f8fafc' : '#f8fafc',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { 
                        bgcolor: 'white',
                        '& fieldset': { 
                          borderColor: loading ? '#e2e8f0' : '#FF6B35',
                          borderWidth: '2px'
                        }
                      },
                      '&.Mui-focused': { 
                        bgcolor: 'white',
                        '& fieldset': { 
                          borderColor: '#FF6B35',
                          borderWidth: '2px'
                        }
                      }
                    }
                  }}
                />
              )}
            </Stack>
          </Stack>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {/* No results message */}
          {!loading && safeBlogs.length === 0 && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Stack alignItems="center" spacing={2}>
                <Box sx={{ fontSize: '3rem' }}>📭</Box>
                <Typography variant="h6" color="#64748b">
                  {searchTerm ? `Không tìm thấy bài viết nào với từ khóa "${searchTerm}"` : 'Chưa có bài viết nào'}
                </Typography>
                <Typography variant="body2" color="#94a3b8">
                  {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Vui lòng thêm bài viết mới hoặc kiểm tra kết nối'}
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Table */}
          {safeBlogs.length > 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: '600', color: '#475569', py: 2 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: '#475569', py: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Article fontSize="small" sx={{ color: '#FF6B35' }} />
                        <span>Bài viết</span>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontWeight: '600', color: '#475569', py: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Schedule fontSize="small" sx={{ color: '#64748b' }} />
                        <span>Ngày đăng</span>
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: '600', color: '#475569', py: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <ThumbUp fontSize="small" sx={{ color: '#64748b' }} />
                        <span>Thích</span>
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: '600', color: '#475569', py: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <ChatBubbleOutline fontSize="small" sx={{ color: '#FF6B35' }} />
                        <span>Bình luận</span>
                      </Stack>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeBlogs.map((blog, index) => {
                    return (
                      <TableRow 
                        key={blog.blogId || blog.blog_id || blog._id || index}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: 'rgba(255, 107, 53, 0.04)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                          },
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer'
                        }}
                        onClick={() => onSelectBlog && onSelectBlog(blog)}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Chip 
                            label={blog.blogId || blog.blog_id || blog._id || '-'} 
                            sx={{
                              bgcolor: '#FF6B35',
                              color: 'white',
                              fontWeight: '600',
                              minWidth: 32,
                              height: 28
                            }}
                          />
                        </TableCell>
                        
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ maxWidth: 400 }}>
                            <Typography 
                              variant="body1" 
                              fontWeight="600"
                              color="#1e293b"
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mb: 1
                              }}
                            >
                              {blog.title}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar sx={{ width: 18, height: 18, bgcolor: 'rgba(255,107,53,0.1)' }}>
                                <Person sx={{ fontSize: 12, color: '#FF6B35' }} />
                              </Avatar>
                              <Typography variant="caption" color="#64748b" fontWeight="500">
                                {blog.authorId || blog.author_id || '-'}
                              </Typography>
                              <Chip 
                                label={blog.status || 'published'} 
                                size="small" 
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  bgcolor: 'rgba(34, 197, 94, 0.1)',
                                  color: '#16a34a',
                                  fontWeight: '600'
                                }}
                              />
                            </Stack>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ py: 2 }}>
                          <Typography variant="body2" color="#64748b" fontWeight="500">
                            {blog.createdAt || blog.created_at ? formatDate(blog.createdAt || blog.created_at) : '-'}
                          </Typography>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 2 }}>
                          <Tooltip title={`${blog.likeCount || blog.like_count || 0} lượt thích`}>
                            <Chip 
                              label={formatNumber(blog.likeCount || blog.like_count || 0)}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                fontWeight: '600',
                                minWidth: 50,
                                height: 26
                              }}
                              icon={<ThumbUp sx={{ fontSize: 12 }} />}
                            />
                          </Tooltip>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 2 }}>
                          <Tooltip title={`${getCommentCount(blog)} bình luận`}>
                            <Chip 
                              label={formatNumber(getCommentCount(blog))}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255, 107, 53, 0.1)',
                                color: '#FF6B35',
                                fontWeight: '600',
                                minWidth: 50,
                                height: 26
                              }}
                              icon={<ChatBubbleOutline sx={{ fontSize: 12 }} />}
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default BlogCommentList;