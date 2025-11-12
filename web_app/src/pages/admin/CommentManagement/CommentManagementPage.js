// src/pages/admin/CommentManagement/CommentManagementPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Container, Grid, Card, Typography, Button,
  Stack, Alert, CircularProgress,
  Breadcrumbs, Link
} from '@mui/material';
import {
  ArrowBack, Dashboard, ChatBubble
} from '@mui/icons-material';

// Import hook và components
import { BlogCommentProvider, useComment } from '../../../context/BlogCommentContext';
import BlogCommentList from '../../../components/comment/BlogCommentList';
import BlogCommentDetail from '../../../components/comment/BlogCommentDetail';
import BlogPostInfo from '../../../components/comment/BlogPostInfo';
import CommentReplyForm from '../../../components/comment/CommentReplyForm';

const CommentManagementPage = () => {
  const {
    loading,
    error,
    getPublishedBlogsStats,
    searchPublishedBlogs,
    replyComment,
    clearError
  } = useComment();

  const [currentView, setCurrentView] = useState('list');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyDialog, setReplyDialog] = useState({
    open: false,
    commentId: null,
    parentUser: '',
    content: ''
  });
  const [blogs, setBlogs] = useState([]);
  const [allBlogs, setAllBlogs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [shouldReloadBlogs, setShouldReloadBlogs] = useState(false); // Thêm state này

  // Refs
  const searchTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const isInitialLoadRef = useRef(false);

  // ✅ FIX: Load all blogs một lần duy nhất
  const loadAllBlogs = useCallback(async () => {
    if (isInitialLoadRef.current) return;
    
    try {
      console.log('📚 Loading all blogs...');
      isInitialLoadRef.current = true;
      
      const result = await getPublishedBlogsStats('');
      const blogsData = Array.isArray(result) ? result : [];
      
      if (isMountedRef.current) {
        setAllBlogs(blogsData);
        setBlogs(blogsData); // Show all initially
        console.log('✅ Loaded', blogsData.length, 'blogs');
      }
    } catch (err) {
      console.error('💥 Error loading all blogs:', err);
      if (isMountedRef.current) {
        setAllBlogs([]);
        setBlogs([]);
      }
    }
  }, [getPublishedBlogsStats]);

  // ✅ FIX: Search function với local filter trước
  const performSearch = useCallback(async (searchQuery) => {
    if (isSearching) return;
    
    setIsSearching(true);
    
    try {
      console.log('🔍 Searching for:', searchQuery);

      if (!searchQuery.trim()) {
        // ✅ FIX: Khi không có search term, hiển thị tất cả blogs
        setBlogs(allBlogs);
        return;
      }

      // ✅ FIX: Ưu tiên local filter trước (nhanh hơn)
      const lowerSearchTerm = searchQuery.toLowerCase().trim();
      const localResults = allBlogs.filter(blog => {
        const title = (blog.title || '').toLowerCase();
        const content = (blog.content || '').toLowerCase();
        const summary = (blog.summary || '').toLowerCase();
        
        return title.includes(lowerSearchTerm) || 
               content.includes(lowerSearchTerm) || 
               summary.includes(lowerSearchTerm);
      });

      console.log('✅ Local search found', localResults.length, 'results');
      
      if (isMountedRef.current) {
        setBlogs(localResults);
      }

      // Optional: Try API search for more accurate results
      try {
        const apiResult = await searchPublishedBlogs({ keyword: searchQuery });
        const apiResults = Array.isArray(apiResult) ? apiResult : [];
        console.log('📡 API search returned', apiResults.length, 'results');
        
        // Use API results if available and different
        if (apiResults.length > 0 && isMountedRef.current) {
          setBlogs(apiResults);
        }
      } catch (apiError) {
        console.warn('⚠️ API search failed, using local results:', apiError);
        // Keep local results
      }

    } catch (err) {
      console.error('💥 Search error:', err);
      if (isMountedRef.current) {
        setBlogs([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [allBlogs, searchPublishedBlogs]);

  // ✅ FIX: Chỉ load data 1 lần khi mount
  useEffect(() => {
    isMountedRef.current = true;
    loadAllBlogs();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadAllBlogs]);

  // ✅ FIX: Search effect đơn giản hơn
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // ✅ FIX: Chỉ search khi đã có data
    if (!isInitialLoadRef.current || allBlogs.length === 0) {
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && !isSearching) {
        performSearch(searchTerm);
      }
    }, 500); // Tăng debounce time để giảm số lần search

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, allBlogs.length]); // Dependency đơn giản

  // ✅ FIX: Handle search change đơn giản
  const handleSearchChange = useCallback((newSearchTerm) => {
    console.log('[handleSearchChange] New search term:', newSearchTerm);
    setSearchTerm(newSearchTerm);
  }, []);

  // ✅ Handle refresh
  const handleRefresh = useCallback(async () => {
    console.log('[handleRefresh] Refreshing data...');
    isInitialLoadRef.current = false; // Allow reload
    setBlogs([]); // Clear current blogs
    setAllBlogs([]); // Clear allBlogs để load lại từ API
    await loadAllBlogs(); // Gọi lại API để lấy dữ liệu mới nhất
  }, [loadAllBlogs]);

  // Stable callbacks
  const handleContentChange = useCallback((content) => {
    setReplyDialog(prev => ({ ...prev, content }));
  }, []);

  const handleReplyComment = useCallback((commentId, parentUser, parentCommentObj) => {
    console.log('[handleReplyComment] commentId:', commentId, 'parentUser:', parentUser);
    if (!commentId) {
      alert('Không xác định được commentId để trả lời bình luận. Vui lòng kiểm tra lại dữ liệu comment.');
      return;
    }
    setReplyDialog({
      open: true,
      commentId,
      parentUser,
      content: '',
      parentComment: parentCommentObj
    });
  }, []);

  const handleSubmitReply = useCallback(async (replyData) => {
    try {
      const blogId = selectedBlog?.blogId || selectedBlog?.blog_id;
      const commentId = replyDialog.commentId;

      console.log('[handleSubmitReply] blogId:', blogId, 'commentId:', commentId);

      if (!blogId || !commentId) {
        alert('Không xác định được blogId hoặc commentId để trả lời bình luận. Vui lòng kiểm tra lại.');
        return;
      }

      await replyComment(
        blogId,
        commentId,
        {
          content: replyData.content,
          autoApprove: replyData.autoApprove || true
        }
      );

      if (window.refreshComments) {
        window.refreshComments();
      }
      
      setReplyDialog({ open: false, commentId: null, parentUser: '', content: '' });
    } catch (err) {
      console.error('💥 Error submitting reply:', err);
      throw err;
    }
  }, [selectedBlog, replyDialog.commentId, replyComment]);

  const handleCloseReplyDialog = useCallback(() => {
    setReplyDialog({ open: false, commentId: null, parentUser: '', content: '' });
  }, []);

  const handleSelectBlog = useCallback((blog) => {
    setSelectedBlog(blog);
    setCurrentView('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setCurrentView('list');
    setSelectedBlog(null);
    // Nếu vừa thao tác ở chi tiết thì reload lại danh sách blogs
    if (shouldReloadBlogs) {
      loadAllBlogs();
      setShouldReloadBlogs(false);
    }
  }, [loadAllBlogs, shouldReloadBlogs]);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  // Callback truyền cho BlogCommentDetail để báo hiệu có thay đổi dữ liệu
  const handleBlogDataChanged = useCallback(() => {
    setShouldReloadBlogs(true);
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      isMountedRef.current = false;
    };
  }, []);

  // Loading state - chỉ show khi thực sự đang load initial data
  if (loading && !isInitialLoadRef.current) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'white', minHeight: '100vh' }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Stack alignItems="center" spacing={3}>
            <CircularProgress size={60} sx={{ color: '#FF6B35' }} />
            <Typography variant="h6" color="#64748b">Đang tải dữ liệu...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            underline="hover"
            color="inherit"
            href="/admin/dashboard"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: '#64748b',
              '&:hover': { color: '#FF6B35' },
              transition: 'color 0.2s'
            }}
          >
            <Dashboard sx={{ mr: 0.5, fontSize: 18 }} />
            Dashboard
          </Link>
          <Typography 
            color="#FF6B35" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontWeight: 600
            }}
          >
            <ChatBubble sx={{ mr: 0.5, fontSize: 18 }} />
            Quản lý bình luận
          </Typography>
          {currentView === 'detail' && selectedBlog && (
            <Typography color="#64748b" sx={{ fontWeight: 500 }}>
              {selectedBlog.title}
            </Typography>
          )}
        </Breadcrumbs>

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight="700" color="#1a202c" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 50,
                height: 50,
                borderRadius: 2,
                bgcolor: 'rgba(255,107,53,0.1)',
                mr: 2
              }}>
                📝
              </Box>
              Quản lý bình luận bài viết
            </Typography>
            {currentView === 'list' && (
              <Typography variant="body1" color="#64748b" sx={{ ml: 8 }}>
                Quản lý và theo dõi bình luận trên các bài viết blog của bạn ({blogs.length}/{allBlogs.length} bài viết)
              </Typography>
            )}
          </Box>

          {currentView === 'detail' && (
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={handleBackToList}
              sx={{ 
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: '600',
                bgcolor: '#FF6B35',
                color: 'white',
                px: 3,
                py: 1.5,
                boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                '&:hover': {
                  bgcolor: '#E55A2B',
                  boxShadow: '0 6px 16px rgba(255,107,53,0.4)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Quay lại danh sách
            </Button>
          )}
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#DC2626'
            }
          }} 
          onClose={handleClearError}
        >
          {error}
        </Alert>
      )}

      {/* Main Content */}
      {currentView === 'list' ? (
        <Box>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)', 
            bgcolor: 'white',
            border: '1px solid #e2e8f0'
          }}>
            <BlogCommentList
              blogs={blogs}
              loading={loading || isSearching}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              onSelectBlog={handleSelectBlog}
              onRefresh={handleRefresh}
            />
          </Card>
        </Box>
      ) : (
        <Card sx={{ 
          bgcolor: 'white', 
          borderRadius: 3, 
          p: 3,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <BlogPostInfo
                blog={selectedBlog}
                showActions={false}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <BlogCommentDetail
                blogId={selectedBlog?.blogId || selectedBlog?.blog_id}
                onDataChanged={handleBlogDataChanged} // truyền callback này
              />
            </Grid>
          </Grid>
        </Card>
      )}
    </Container>
  );
};

export default function WrappedCommentManagementPage(props) {
  return (
    <BlogCommentProvider>
      <CommentManagementPage {...props} />
    </BlogCommentProvider>
  );
}