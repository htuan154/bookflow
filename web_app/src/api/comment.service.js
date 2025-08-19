// src/api/comment.service.js
import axiosClient from '../config/axiosClient';
import { API_ENDPOINTS } from '../config/apiEndpoints';

const commentService = {
    /**
     * Lấy danh sách tất cả blogs với thống kê bình luận (Admin)
     * @param {Object} params - Query parameters (page, limit, search, status)
     * @returns {Promise} Response data
     */
    getAllBlogs: async (params = '') => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_ALL_BLOGS(params));
            // Lấy lại đúng mảng blogs từ backend (ưu tiên rows, sau đó các key khác)
            if (Array.isArray(response.data?.rows)) {
                return response.data.rows;
            }
            if (Array.isArray(response.data?.data?.rows)) {
                return response.data.data.rows;
            }
            if (Array.isArray(response.data)) {
                return response.data;
            }
            if (Array.isArray(response.data.blogs)) {
                return response.data.blogs;
            }
            if (Array.isArray(response.data.data)) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            // Xử lý lỗi tài nguyên hoặc mạng
            if (error.message === 'Network Error' || error.code === 'ERR_INSUFFICIENT_RESOURCES') {
                throw new Error('Không thể kết nối tới máy chủ hoặc tài nguyên hệ thống bị thiếu. Vui lòng kiểm tra lại mạng hoặc khởi động lại backend.');
            }
            console.error('Error fetching blogs:', error);
            throw error;
        }
    },

    /**
     * Lấy thống kê blogs đã xuất bản (cho comment list)
     * @returns {Promise} Response data với commentCount, likeCount
     */
    getPublishedBlogsStats: async () => {
        try {
            console.log('📡 [API] Calling API_ENDPOINTS.BLOGS.GET_PUBLISHED_STATS');
            const response = await axiosClient.get(API_ENDPOINTS.BLOGS.GET_PUBLISHED_STATS);
            console.log('✅ [API Response] Raw response:', response);
            console.log('📊 [API Response] Response data:', response.data);

            // FIXED: Backend trả về { data: { success: true, data: [...] } }
        // Cần check response.data.data.data
        if (response.data?.data?.success && Array.isArray(response.data?.data?.data)) {
            console.log('🎉 [FIXED] Found blogs in response.data.data.data:', response.data.data.data);
            return response.data.data.data;
        }
        
        // Backup: check response.data.data nếu không có success
        if (Array.isArray(response.data?.data?.data)) {
            console.log('🎉 [FIXED] Found blogs in response.data.data.data:', response.data.data.data);
            return response.data.data.data;
        }
        
        // Original logic as fallback
        if (Array.isArray(response.data?.data)) {
            return response.data.data;
        }
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        console.warn('⚠️ [API] Unexpected response format, returning empty array');
        return [];
    } catch (error) {
        console.error('❌ [API] Error fetching published blogs stats:', error);
        throw error;
    }
    },

    /**
     * Lấy chi tiết blog theo ID
     * @param {string} blogId - ID của blog
     * @returns {Promise} Blog data với view_count, like_count, comment_count
     */
    getBlogById: async (blogId) => {
        try {
            const endpoint = API_ENDPOINTS.BLOGS.GET_BY_ID(blogId);
            console.log('📡 [API] Calling getBlogById for:', blogId);
            console.log('🔗 [API] Full URL:', endpoint);
            
            const response = await axiosClient.get(endpoint);
            console.log('✅ [API Response] getBlogById raw response:', response);
            
            // ✅ Parse response.data.data thay vì response.data
            const blogData = response.data?.data || response.data;
            console.log('📊 [API Response] parsed blogData:', blogData);
            console.log('🔍 [Debug] viewCount value:', blogData?.viewCount, 'type:', typeof blogData?.viewCount);
            console.log('🔍 [Debug] likeCount value:', blogData?.likeCount, 'type:', typeof blogData?.likeCount);
            
            return blogData;
        } catch (error) {
            console.error('❌ [API] Error fetching blog detail:', error);
            console.error('🔗 [API] Failed URL:', API_ENDPOINTS.BLOGS.GET_BY_ID(blogId));
            throw error;
        }
    },

    /**
     * Lấy danh sách bình luận của blog kèm tên người dùng
     * @param {string} blogId - ID của blog  
     * @param {string} params - Query parameters
     * @returns {Promise} Comments data với full_name
     */
    getBlogCommentsWithUser: async (blogId, params = '') => {
        try {
            const endpoint = API_ENDPOINTS.BLOG_COMMENTS.GET_WITH_USER(blogId, params);
            console.log('📡 [API] Calling getBlogCommentsWithUser for:', blogId);
            console.log('🔗 [API] Full URL:', endpoint);
            
            const response = await axiosClient.get(endpoint);
            console.log('✅ [API Response] getBlogCommentsWithUser raw response:', response);
            
            // ✅ Parse response đúng cách
            const commentsData = response.data?.data || response.data;
            console.log('📊 [API Response] parsed commentsData:', commentsData);
            
            return commentsData;
        } catch (error) {
            console.error('❌ [API] Error fetching blog comments with user:', error);
            console.error('🔗 [API] Failed URL:', API_ENDPOINTS.BLOG_COMMENTS.GET_WITH_USER(blogId, params));
            throw error;
        }
    },

    /**
     * Lấy danh sách bình luận của blog (basic)
     * @param {string} blogId - ID của blog
     * @param {string} params - Query parameters  
     * @returns {Promise} Comments data
     */
    getBlogComments: async (blogId, params = '') => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.BLOG_COMMENTS.GET_BY_BLOG(blogId, params));
            return response.data;
        } catch (error) {
            console.error('Error fetching blog comments:', error);
            throw error;
        }
    },

    /**
     * Tạo bình luận mới cho blog
     * @param {string} blogId - ID của blog
     * @param {Object} commentData - Dữ liệu bình luận {content, parent_comment_id}
     * @returns {Promise} Created comment data
     */
    createComment: async (blogId, commentData) => {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.BLOG_COMMENTS.CREATE(blogId), commentData);
            return response.data;
        } catch (error) {
            console.error('Error creating comment:', error);
            throw error;
        }
    },

    /**
     * Trả lời bình luận (Admin & Hotel Owner)
     * @param {string} blogId - ID của blog
     * @param {string} commentId - ID của bình luận gốc
     * @param {Object} replyData - Dữ liệu trả lời {content, autoApprove}
     * @returns {Promise} Reply comment data
     */
    replyComment: async (blogId, commentId, replyData) => {
        if (!blogId || !commentId) {
            throw new Error('blogId hoặc commentId bị thiếu khi gọi replyComment');
        }
        try {
            const response = await axiosClient.post(API_ENDPOINTS.BLOG_ADMIN.REPLY_COMMENT(blogId, commentId), replyData);
            return response.data;
        } catch (error) {
            console.error('Error replying to comment:', error);
            throw error;
        }
    },

    /**
     * Xóa bình luận
     * @param {string} commentId - ID của bình luận
     * @returns {Promise} Response data
     */
    deleteComment: async (commentId) => {
        try {
            const response = await axiosClient.delete(API_ENDPOINTS.BLOG_COMMENTS.DELETE(commentId));
            return response.data;
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw error;
        }
    },

    /**
     * Cập nhật trạng thái bình luận
     * @param {string} commentId - ID của bình luận
     * @param {string} status - Trạng thái mới (approved, rejected, hidden)
     * @returns {Promise} Updated comment data
     */
    updateCommentStatus: async (commentId, status) => {
        try {
            const response = await axiosClient.patch(
                API_ENDPOINTS.BLOG_COMMENTS.UPDATE_STATUS(commentId),
                { status }
            );
            return response.data;
        } catch (error) {
            console.error('Error updating comment status:', error);
            throw error;
        }
    },

    /**
     * Like/Unlike bình luận
     * @param {string} commentId - ID của bình luận
     * @param {boolean} isLike - true để like, false để unlike
     * @returns {Promise} Response data
     */
    likeComment: async (commentId, isLike = true) => {
        try {
            const method = isLike ? 'POST' : 'DELETE';
            const response = await axiosClient({
                method: method,
                url: `/api/comments/${commentId}/like`
            });
            return response.data;
        } catch (error) {
            console.error('Error liking comment:', error);
            throw error;
        }
    },

    /**
     * Kiểm tra trạng thái like của bình luận
     * @param {string} commentId - ID của bình luận
     * @returns {Promise} Like status data {isLiked}
     */
    getCommentLikeStatus: async (commentId) => {
        try {
            const response = await axiosClient.get(`/api/comments/${commentId}/like-status`);
            return response.data;
        } catch (error) {
            console.error('Error checking comment like status:', error);
            throw error;
        }
    },

    /**
     * Báo cáo bình luận
     * @param {string} commentId - ID của bình luận
     * @param {Object} reportData - Dữ liệu báo cáo {reason, description}
     * @returns {Promise} Response data
     */
    reportComment: async (commentId, reportData) => {
        try {
            const response = await axiosClient.post(`/api/comments/${commentId}/report`, reportData);
            return response.data;
        } catch (error) {
            console.error('Error reporting comment:', error);
            throw error;
        }
    },

    /**
     * Lấy thống kê bình luận cho admin
     * @returns {Promise} Comment statistics data
     */
    getBlogStatistics: async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.BLOG_ADMIN.GET_STATISTICS);
            return response.data;
        } catch (error) {
            console.error('Error fetching blog statistics:', error);
            throw error;
        }
    },

    /**
     * Lấy thống kê blogs (Admin)
     * @returns {Promise} Blog stats data
     */
    getBlogStats: async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.BLOG_ADMIN.GET_STATS);
            return response.data;
        } catch (error) {
            console.error('Error fetching blog stats:', error);
            throw error;
        }
    },

    /**
     * Lấy danh sách blogs với filter/search (Admin)
     * @param {string} params - Query parameters string
     * @returns {Promise} Filtered blogs data
     */
    getBlogsAdmin: async (params = '') => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.BLOG_ADMIN.GET_BLOGS(params));
            return response.data;
        } catch (error) {
            console.error('Error fetching admin blogs:', error);
            throw error;
        }
    },

    /**
     * Lấy chi tiết blog cho admin
     * @param {string} blogId - ID của blog
     * @returns {Promise} Blog details for admin
     */
    getBlogDetailsAdmin: async (blogId) => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_BLOG_DETAILS_ADMIN(blogId));
            return response.data;
        } catch (error) {
            console.error('Error fetching blog details for admin:', error);
            throw error;
        }
    },

    /**
     * Tăng lượt xem blog
     * @param {string} blogId - ID của blog
     * @returns {Promise} Response data
     */
    incrementBlogView: async (blogId) => {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.BLOGS.INCREMENT_VIEW(blogId));
            return response.data;
        } catch (error) {
            console.error('Error incrementing blog view:', error);
            throw error;
        }
    },

    /**
     * Like blog
     * @param {string} blogId - ID của blog
     * @returns {Promise} Response data
     */
    likeBlog: async (blogId) => {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.BLOGS.LIKE(blogId));
            return response.data;
        } catch (error) {
            console.error('Error liking blog:', error);
            throw error;
        }
    },

    /**
     * Unlike blog
     * @param {string} blogId - ID của blog
     * @returns {Promise} Response data
     */
    unlikeBlog: async (blogId) => {
        try {
            const response = await axiosClient.post(API_ENDPOINTS.BLOGS.UNLIKE(blogId));
            return response.data;
        } catch (error) {
            console.error('Error unliking blog:', error);
            throw error;
        }
    },

    /**
     * Tìm kiếm blogs đã xuất bản theo tiêu đề (dùng cho trang comment)
     * @param {Object} params - { keyword, page, limit }
     * @returns {Promise} Mảng blogs đã xuất bản
     */
    searchPublishedBlogs: async (params = {}) => {
        try {
            const { keyword = '', page = 1, limit = 10 } = params;

            // Gọi chung API search, thêm status=published
            const response = await axiosClient.get(
                `${API_ENDPOINTS.BLOGS.SEARCH}?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}&status=published`
            );

            // Parse response
            return response.data?.data?.blogs || response.data?.blogs || [];
        } catch (error) {
            console.error('Error searching published blogs for comments:', error);
            throw error;
        }
    }

};

export default commentService;