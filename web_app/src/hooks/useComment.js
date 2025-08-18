// src/context/useComment.js
import { useContext } from 'react';
import { BlogCommentContext } from './BlogCommentContext';

/**
 * Custom hook để sử dụng Blog Comment Context
 * @returns {Object} Blog comment context value với state và actions
 */
const useComment = () => {
    const context = useContext(BlogCommentContext);
    
    // Debug: Log hook usage
    console.log('🪝 useComment hook called');
    
    // Kiểm tra xem hook có được sử dụng trong provider không
    if (!context) {
        console.error('❌ useComment must be used within BlogCommentProvider');
        throw new Error(
            'useComment must be used within a BlogCommentProvider. ' +
            'Wrap your component tree with <BlogCommentProvider>.'
        );
    }
    
    // Debug: Log available context properties
    console.log('🎯 useComment context keys:', Object.keys(context));
    console.log('📊 Current state summary:', {
        blogsCount: context.blogs?.length || 0,
        commentsCount: context.comments?.length || 0,
        currentBlog: context.currentBlog?.blog_id || null,
        loading: context.loading,
        hasError: !!context.error
    });
    
    // Destructure để dễ sử dụng
    const {
        // State
        blogs,
        currentBlog,
        comments,
        statistics,
        blogStats,
        publishedBlogsStats,
        loading,
        error,
        pagination,
        
        // Actions - Blog management
        getAllBlogs,
        getPublishedBlogsStats,
        getBlogById,
        getBlogsAdmin,
        getBlogDetailsAdmin,
        getBlogStatistics,
        getBlogStats,
        incrementBlogView,
        likeBlog,
        unlikeBlog,
        searchPublishedBlogs, // <-- thêm dòng này
        
        // Actions - Comment management
        getBlogCommentsWithUser,
        getBlogComments,
        createComment,
        replyComment,
        deleteComment,
        updateCommentStatus,
        likeComment,
        getCommentLikeStatus,
        reportComment,
        
        // Utility actions
        clearError,
        setPagination
    } = context;
    
    // Helper functions với debug
    const helpers = {
        /**
         * Kiểm tra xem có đang loading không
         */
        isLoading: () => {
            const result = loading;
            console.log('⏳ isLoading:', result);
            return result;
        },
        
        /**
         * Kiểm tra xem có lỗi không
         */
        hasError: () => {
            const result = !!error;
            console.log('🚨 hasError:', result, error);
            return result;
        },
        
        /**
         * Lấy thông tin lỗi
         */
        getErrorMessage: () => {
            const message = error || 'No error';
            console.log('📝 getErrorMessage:', message);
            return message;
        },
        
        /**
         * Kiểm tra xem có blog hiện tại không
         */
        hasCurrentBlog: () => {
            const result = !!currentBlog;
            console.log('📖 hasCurrentBlog:', result, currentBlog?.blog_id);
            return result;
        },
        
        /**
         * Lấy ID của blog hiện tại
         */
        getCurrentBlogId: () => {
            const blogId = currentBlog?.blog_id || null;
            console.log('🆔 getCurrentBlogId:', blogId);
            return blogId;
        },
        
        /**
         * Kiểm tra xem có comments không
         */
        hasComments: () => {
            const result = comments && comments.length > 0;
            console.log('💬 hasComments:', result, `(${comments?.length || 0} comments)`);
            return result;
        },
        
        /**
         * Lấy số lượng comments
         */
        getCommentsCount: () => {
            const count = comments?.length || 0;
            console.log('🔢 getCommentsCount:', count);
            return count;
        },
        
        /**
         * Lấy số lượng blogs
         */
        getBlogsCount: () => {
            const count = blogs?.length || 0;
            console.log('📚 getBlogsCount:', count);
            return count;
        },
        
        /**
         * Tìm comment theo ID
         */
        findCommentById: (commentId) => {
            console.log('🔍 findCommentById:', commentId);
            const comment = comments?.find(c => c.comment_id === commentId) || null;
            console.log('📝 Found comment:', comment ? 'Yes' : 'No');
            return comment;
        },
        
        /**
         * Tìm blog theo ID
         */
        findBlogById: (blogId) => {
            console.log('🔍 findBlogById:', blogId);
            const blog = blogs?.find(b => b.blog_id === blogId) || null;
            console.log('📖 Found blog:', blog ? 'Yes' : 'No');
            return blog;
        },
        
        /**
         * Lấy comments theo trạng thái
         */
        getCommentsByStatus: (status) => {
            console.log('🔍 getCommentsByStatus:', status);
            const filteredComments = comments?.filter(c => c.status === status) || [];
            console.log('📝 Found comments:', filteredComments.length);
            return filteredComments;
        },
        
        /**
         * Lấy pending comments (chờ duyệt)
         */
        getPendingComments: () => {
            console.log('⏳ Getting pending comments');
            return helpers.getCommentsByStatus('pending');
        },
        
        /**
         * Lấy approved comments
         */
        getApprovedComments: () => {
            console.log('✅ Getting approved comments');
            return helpers.getCommentsByStatus('approved');
        },
        
        /**
         * Lấy rejected comments
         */
        getRejectedComments: () => {
            console.log('❌ Getting rejected comments');
            return helpers.getCommentsByStatus('rejected');
        },
        
        /**
         * Reset toàn bộ state về initial
         */
        resetState: () => {
            console.log('🔄 Resetting state (Note: This would require additional reducer action)');
            // Có thể implement thêm action RESET_STATE trong reducer nếu cần
        },
        
        /**
         * Refresh data - reload current blog và comments
         */
        refreshCurrentData: async () => {
            console.log('🔄 Refreshing current data');
            try {
                if (currentBlog?.blog_id) {
                    console.log('🔄 Refreshing blog and comments for:', currentBlog.blog_id);
                    await getBlogById(currentBlog.blog_id);
                    await getBlogCommentsWithUser(currentBlog.blog_id);
                }
            } catch (error) {
                console.error('💥 Error refreshing data:', error);
            }
        }
    };
    
    // Debug: Log helper functions
    console.log('🛠️ useComment helpers available:', Object.keys(helpers));
    
    return {
        // State
        blogs,
        currentBlog,
        comments,
        statistics,
        blogStats,
        publishedBlogsStats,
        loading,
        error,
        pagination,
        
        // Actions - Blog management
        getAllBlogs,
        getPublishedBlogsStats,
        getBlogById,
        getBlogsAdmin,
        getBlogDetailsAdmin,
        getBlogStatistics,
        getBlogStats,
        incrementBlogView,
        likeBlog,
        unlikeBlog,
        searchPublishedBlogs,
        
        // Actions - Comment management
        getBlogCommentsWithUser,
        getBlogComments,
        createComment,
        replyComment,
        deleteComment,
        updateCommentStatus,
        likeComment,
        getCommentLikeStatus,
        reportComment,
        
        // Utility actions
        clearError,
        setPagination,
        
        // Helper functions
        ...helpers
    };
};

export default useComment;