// src/context/BlogCommentContext.js
import React, { createContext, useContext, useReducer, useRef, useCallback } from 'react';
import commentService from '../api/comment.service';

// ✅ Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_CURRENT_BLOG: 'SET_CURRENT_BLOG',
  SET_COMMENTS: 'SET_COMMENTS',
  SET_BLOGS: 'SET_BLOGS'
};

// ✅ Initial state
const initialState = {
  currentBlog: null,
  comments: [],
  blogs: [],
  loading: false,
  error: null
};

// ✅ Reducer function
const blogCommentReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTION_TYPES.CLEAR_ERROR:
      return { ...state, error: null };
    case ACTION_TYPES.SET_CURRENT_BLOG:
      return { ...state, currentBlog: action.payload, loading: false };
    case ACTION_TYPES.SET_COMMENTS:
      return { ...state, comments: action.payload, loading: false };
    case ACTION_TYPES.SET_BLOGS:
      return { ...state, blogs: action.payload, loading: false };
    default:
      return state;
  }
};

// ✅ Create Context
const BlogCommentContext = createContext();

// ✅ Provider Component
export const BlogCommentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(blogCommentReducer, initialState);

  // ✅ Use refs for stable API functions
  const apiRef = useRef({});

  // ✅ Stable dispatch functions
  const setLoading = useCallback((loading) => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  }, []);

  // ✅ Stable API functions using refs
  apiRef.current.getPublishedBlogsStats = async (params = '') => {
    try {
      setLoading(true);
      clearError();
      
      console.log('📡 [Context] Calling commentService.getPublishedBlogsStats with params:', params);
      const result = await commentService.getPublishedBlogsStats();
      console.log('✅ [Context] getPublishedBlogsStats result:', result);
      
      dispatch({ type: ACTION_TYPES.SET_BLOGS, payload: result });
      return result;
    } catch (error) {
      console.error('❌ [Context] getPublishedBlogsStats error:', error);
      setError(error.message || 'Lỗi khi tải danh sách bài viết');
      throw error;
    }
  };

  apiRef.current.getBlogById = async (blogId) => {
    try {
      setLoading(true);
      clearError();
      
      console.log('📡 [Context] Calling commentService.getBlogById for:', blogId);
      const result = await commentService.getBlogById(blogId);
      console.log('✅ [Context] getBlogById result:', result);
      
      dispatch({ type: ACTION_TYPES.SET_CURRENT_BLOG, payload: result });
      return result;
    } catch (error) {
      console.error('❌ [Context] getBlogById error:', error);
      setError(error.message || 'Lỗi khi tải thông tin bài viết');
      throw error;
    }
  };

  apiRef.current.getBlogCommentsWithUser = async (blogId) => {
    try {
      setLoading(true);
      clearError();
      
      console.log('📡 [Context] Calling commentService.getBlogCommentsWithUser for:', blogId);
      const result = await commentService.getBlogCommentsWithUser(blogId);
      console.log('✅ [Context] getBlogCommentsWithUser result:', result);
      
      dispatch({ type: ACTION_TYPES.SET_COMMENTS, payload: result });
      return result;
    } catch (error) {
      console.error('❌ [Context] getBlogCommentsWithUser error:', error);
      setError(error.message || 'Lỗi khi tải bình luận');
      throw error;
    }
  };

  apiRef.current.replyComment = async (blogId, commentId, replyData) => {
  try {
    setLoading(true);
    clearError();

    console.log('📡 [Context] Calling commentService.replyComment:');
    console.log('   blogId:', blogId);
    console.log('   commentId:', commentId);
    console.log('   replyData:', replyData);

    const result = await commentService.replyComment(blogId, commentId, replyData);
    console.log('✅ [Context] replyComment result:', result);

    setLoading(false);
    return result;
  } catch (error) {
    console.error('❌ [Context] replyComment error:', error);
    setError(error.message || 'Lỗi khi trả lời bình luận');
    throw error;
  }
};


  apiRef.current.updateCommentStatus = async (commentId, status) => {
    try {
      setLoading(true);
      clearError();
      
      console.log('📡 [Context] Calling commentService.updateCommentStatus:', { commentId, status });
      const result = await commentService.updateCommentStatus(commentId, status);
      console.log('✅ [Context] updateCommentStatus result:', result);
      
      setLoading(false);
      return result;
    } catch (error) {
      console.error('❌ [Context] updateCommentStatus error:', error);
      setError(error.message || 'Lỗi khi cập nhật trạng thái bình luận');
      throw error;
    }
  };

  apiRef.current.searchPublishedBlogs = async (params = {}) => {
    try {
      setLoading(true);
      clearError();
      const result = await commentService.searchPublishedBlogs(params);
      dispatch({ type: ACTION_TYPES.SET_BLOGS, payload: result });
      setLoading(false);
      return result;
    } catch (error) {
      setError(error.message || 'Lỗi khi tìm kiếm bài viết');
      setLoading(false);
      throw error;
    }
  };

  // ✅ Stable wrapper functions
  const getPublishedBlogsStats = useCallback((params) => {
    return apiRef.current.getPublishedBlogsStats(params);
  }, []);

  const getBlogById = useCallback((blogId) => {
    return apiRef.current.getBlogById(blogId);
  }, []);

  const getBlogCommentsWithUser = useCallback((blogId) => {
    return apiRef.current.getBlogCommentsWithUser(blogId);
  }, []);

  const replyComment = useCallback((blogId, commentId, replyData) => {
    return apiRef.current.replyComment(blogId, commentId, replyData);
  }, []);

  const updateCommentStatus = useCallback((commentId, status) => {
    return apiRef.current.updateCommentStatus(commentId, status);
  }, []);

  const searchPublishedBlogs = useCallback((params) => {
    return apiRef.current.searchPublishedBlogs(params);
  }, []);

  // Thêm hàm setComments để cập nhật comments từ component
  const setComments = useCallback((comments) => {
    dispatch({ type: ACTION_TYPES.SET_COMMENTS, payload: comments });
  }, []);

  // ✅ Context value
  const value = {
    // State
    currentBlog: state.currentBlog,
    comments: state.comments,
    blogs: state.blogs,
    loading: state.loading,
    error: state.error,
    
    // Actions
    getPublishedBlogsStats,
    getBlogById,
    getBlogCommentsWithUser,
    replyComment,
    updateCommentStatus,
    searchPublishedBlogs,
    clearError,
    setLoading,
    setError,
    setComments // expose hàm này ra ngoài
  };

  return (
    <BlogCommentContext.Provider value={value}>
      {children}
    </BlogCommentContext.Provider>
  );
};

// ✅ Hook to use context
export const useComment = () => {
  const context = useContext(BlogCommentContext);
  if (!context) {
    throw new Error('useComment must be used within a BlogCommentProvider');
  }
  return context;
};

export default BlogCommentContext;