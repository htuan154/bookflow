// src/api/blog.service.js
import { API_ENDPOINTS } from '../config/apiEndpoints';

/**
 * Helper function to make API calls with authentication
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - API response
 */
const makeApiCall = async (url, options = {}) => {
    try {
        // Thử nhiều tên key khác nhau
        let token = localStorage.getItem('accessToken') || 
                   localStorage.getItem('access_token') || 
                   localStorage.getItem('token') ||
                   localStorage.getItem('authToken') ||
                   localStorage.getItem('jwt');
        
        // Debug logging
        console.log('🔍 Making API call to:', url);
        console.log('🔑 Checking token keys:');
        console.log('  - accessToken:', !!localStorage.getItem('accessToken'));
        console.log('  - access_token:', !!localStorage.getItem('access_token'));
        console.log('  - token:', !!localStorage.getItem('token'));
        console.log('  - authToken:', !!localStorage.getItem('authToken'));
        console.log('  - jwt:', !!localStorage.getItem('jwt'));
        console.log('👤 Final token found:', !!token);
        
        if (!token) {
            console.error('❌ No authentication token found in any key!');
            console.log('Available localStorage keys:', Object.keys(localStorage));
            throw new Error('Bạn cần đăng nhập để truy cập tính năng này');
        }

        const defaultHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };

        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            if (response.status === 401) {
                console.error('🚫 401 Unauthorized - Token expired or invalid');
                console.log('Token that failed:', token?.substring(0, 50) + '...');
                
                // Clear all possible token keys
                localStorage.removeItem('accessToken');
                localStorage.removeItem('access_token');
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                localStorage.removeItem('jwt');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                
                window.location.href = '/login';
                throw new Error('Phiên đăng nhập đã hết hạn');
            }
            
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('💥 API call failed:', error);
        throw error;
    }
};

/**
 * Blog Service - Contains all blog-related API functions
 */
const blogService = {
    // ===============================
    // PUBLIC BLOG ENDPOINTS
    // ===============================

    /**
     * Get all blogs with optional filtering and pagination
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Blogs data with pagination
     */
    getAllBlogs: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        // Add query parameters if they exist
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.hotelId) queryParams.append('hotelId', params.hotelId);
        if (params.tag) queryParams.append('tag', params.tag);

        const url = `${API_ENDPOINTS.BLOGS.GET_ALL}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return await makeApiCall(url);
    },

    /**
     * Get all published blogs
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Published blogs data
     */
    getPublishedBlogs: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const url = `${API_ENDPOINTS.BLOGS.GET_PUBLISHED}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return await makeApiCall(url);
    },

    /**
     * Get blog by ID
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Blog data
     */
    getBlogById: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.GET_BY_ID(blogId));
    },

    /**
     * Get blog by slug
     * @param {string} slug - Blog slug
     * @returns {Promise<object>} - Blog data
     */
    getBlogBySlug: async (slug) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.GET_BY_SLUG(slug));
    },

    /**
     * Get blogs by hotel ID
     * @param {string} hotelId - Hotel ID
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Blogs data
     */
    getBlogsByHotel: async (hotelId, params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);

        const url = `${API_ENDPOINTS.BLOGS.GET_BY_HOTEL(hotelId)}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return await makeApiCall(url);
    },

    /**
     * Search blogs
     * @param {object} params - Search parameters
     * @returns {Promise<object>} - Search results
     */
    searchBlogs: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.q) queryParams.append('q', params.q);
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.hotelId) queryParams.append('hotelId', params.hotelId);
        if (params.tag) queryParams.append('tag', params.tag);

        const url = `${API_ENDPOINTS.BLOGS.SEARCH}?${queryParams}`;
        return await makeApiCall(url);
    },

    /**
     * Get blogs by tag
     * @param {string} tag - Tag name
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Blogs data
     */
    getBlogsByTag: async (tag, params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);

        const url = `${API_ENDPOINTS.BLOGS.GET_BY_TAG(tag)}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return await makeApiCall(url);
    },

    /**
     * Get popular blogs
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Popular blogs data
     */
    getPopularBlogs: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.days) queryParams.append('days', params.days);

        const url = `${API_ENDPOINTS.BLOGS.GET_POPULAR}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return await makeApiCall(url);
    },

    /**
     * Get recent blogs
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Recent blogs data
     */
    getRecentBlogs: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.limit) queryParams.append('limit', params.limit);

        const url = `${API_ENDPOINTS.BLOGS.GET_RECENT}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return await makeApiCall(url);
    },

    // ===============================
    // BLOG INTERACTION ENDPOINTS
    // ===============================

    /**
     * Increment blog view count
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Response data
     */
    incrementView: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.INCREMENT_VIEW(blogId), {
            method: 'POST',
        });
    },

    /**
     * Like a blog
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Response data
     */
    likeBlog: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.LIKE(blogId), {
            method: 'POST',
        });
    },

    /**
     * Unlike a blog
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Response data
     */
    unlikeBlog: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.UNLIKE(blogId), {
            method: 'DELETE',
        });
    },

    // ===============================
    // ADMIN BLOG MANAGEMENT ENDPOINTS
    // ===============================

    /**
     * Create a new blog (Admin/Author)
     * @param {object} blogData - Blog data
     * @returns {Promise<object>} - Created blog data
     */
    createBlog: async (blogData) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.CREATE, {
            method: 'POST',
            body: JSON.stringify(blogData),
        });
    },

    /**
     * Update an existing blog
     * @param {string} blogId - Blog ID
     * @param {object} blogData - Updated blog data
     * @returns {Promise<object>} - Updated blog data
     */
    updateBlog: async (blogId, blogData) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.UPDATE(blogId), {
            method: 'PUT',
            body: JSON.stringify(blogData),
        });
    },

    /**
     * Delete a blog
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Response data
     */
    deleteBlog: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.DELETE(blogId), {
            method: 'DELETE',
        });
    },

    /**
     * Update blog status
     * @param {string} blogId - Blog ID
     * @param {string} status - New status (draft, pending, approved, published, rejected)
     * @returns {Promise<object>} - Updated blog data
     */
    updateBlogStatus: async (blogId, status) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.UPDATE_STATUS(blogId), {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    /**
     * Approve a blog (Admin only)
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Response data
     */
    approveBlog: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.APPROVE(blogId), {
            method: 'PATCH',
        });
    },

    /**
     * Reject a blog (Admin only)
     * @param {string} blogId - Blog ID
     * @param {string} reason - Rejection reason (optional)
     * @returns {Promise<object>} - Response data
     */
    rejectBlog: async (blogId, reason = '') => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.REJECT(blogId), {
            method: 'PATCH',
            body: JSON.stringify({ reason }),
        });
    },

    /**
     * Publish a blog
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Response data
     */
    publishBlog: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.PUBLISH(blogId), {
            method: 'PATCH',
        });
    },

    /**
     * Unpublish a blog
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Response data
     */
    unpublishBlog: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.UNPUBLISH(blogId), {
            method: 'PATCH',
        });
    },

    // ===============================
    // ADMIN SPECIFIC ENDPOINTS
    // ===============================

    /**
     * Get all blogs for admin (Admin only)
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - All blogs data with pagination
     */
    getAllBlogsAdmin: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const url = `${API_ENDPOINTS.ADMIN.GET_ALL_BLOGS}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return await makeApiCall(url);
    },

    /**
     * Get blogs by status for admin (Sử dụng endpoint mới)
     * @param {string} status - Blog status ('draft', 'pending', 'published', 'archived', 'rejected')
     * @param {object} params - Query parameters
     * @returns {Promise<object>} - Blogs data
     */
    getBlogsByStatusAdmin: async (status, params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

        const url = `${API_ENDPOINTS.ADMIN.GET_BLOGS_BY_STATUS(status)}${queryParams.toString() ? `?${queryParams}` : ''}`;
        return await makeApiCall(url);
    },

    // Thay thế các hàm riêng lẻ bằng hàm chung
    getPendingBlogsAdmin: async (params = {}) => {
        return await blogService.getBlogsByStatusAdmin('pending', params);
    },

    getPublishedBlogsAdmin: async (params = {}) => {
        return await blogService.getBlogsByStatusAdmin('published', params);
    },

    getDraftBlogsAdmin: async (params = {}) => {
        return await blogService.getBlogsByStatusAdmin('draft', params);
    },

    getRejectedBlogsAdmin: async (params = {}) => {
        return await blogService.getBlogsByStatusAdmin('rejected', params);
    },

    getArchivedBlogsAdmin: async (params = {}) => {
        return await blogService.getBlogsByStatusAdmin('archived', params);
    },

    /**
     * Get blog details for admin
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Detailed blog data
     */
    getBlogDetailsAdmin: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.ADMIN.GET_BLOG_DETAILS_ADMIN(blogId));
    },

    // ===============================
    // BULK OPERATIONS (ADMIN)
    // ===============================

    /**
     * Bulk approve blogs
     * @param {string[]} blogIds - Array of blog IDs
     * @returns {Promise<object>} - Response data
     */
    bulkApproveBlogs: async (blogIds) => {
        return await makeApiCall(API_ENDPOINTS.ADMIN.BULK_APPROVE_BLOGS, {
            method: 'PATCH',
            body: JSON.stringify({ blogIds }),
        });
    },

    /**
     * Bulk reject blogs
     * @param {string[]} blogIds - Array of blog IDs
     * @param {string} reason - Rejection reason (optional)
     * @returns {Promise<object>} - Response data
     */
    bulkRejectBlogs: async (blogIds, reason = '') => {
        return await makeApiCall(API_ENDPOINTS.ADMIN.BULK_REJECT_BLOGS, {
            method: 'PATCH',
            body: JSON.stringify({ blogIds, reason }),
        });
    },

    /**
     * Bulk delete blogs
     * @param {string[]} blogIds - Array of blog IDs
     * @returns {Promise<object>} - Response data
     */
    bulkDeleteBlogs: async (blogIds) => {
        return await makeApiCall(API_ENDPOINTS.ADMIN.BULK_DELETE_BLOGS, {
            method: 'DELETE',
            body: JSON.stringify({ blogIds }),
        });
    },

    // ===============================
    // BLOG IMAGE MANAGEMENT
    // ===============================

    /**
     * Upload blog image
     * @param {string} blogId - Blog ID
     * @param {FormData} formData - Form data with image file
     * @returns {Promise<object>} - Upload response
     */
    uploadBlogImage: async (blogId, formData) => {
        const token = localStorage.getItem('accessToken');
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(API_ENDPOINTS.BLOGS.UPLOAD_IMAGE(blogId), {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Delete blog image
     * @param {string} blogId - Blog ID
     * @param {string} imageId - Image ID
     * @returns {Promise<object>} - Response data
     */
    deleteBlogImage: async (blogId, imageId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.DELETE_IMAGE(blogId, imageId), {
            method: 'DELETE',
        });
    },

    /**
     * Set featured image for blog
     * @param {string} blogId - Blog ID
     * @param {string} imageId - Image ID
     * @returns {Promise<object>} - Response data
     */
    setFeaturedImage: async (blogId, imageId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.SET_FEATURED_IMAGE(blogId, imageId), {
            method: 'PATCH',
        });
    },

    // ===============================
    // STATISTICS AND ANALYTICS
    // ===============================

    /**
     * Get general blog statistics
     * @returns {Promise<object>} - Statistics data
     */
    getBlogStats: async () => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.GET_STATS);
    },

    /**
     * Get specific blog statistics
     * @param {string} blogId - Blog ID
     * @returns {Promise<object>} - Blog statistics
     */
    getBlogStatistics: async (blogId) => {
        return await makeApiCall(API_ENDPOINTS.BLOGS.GET_BLOG_STATS(blogId));
    },

    /**
     * Get blog statistics for admin
     * @returns {Promise<object>} - Admin blog statistics
     */
    getBlogStatisticsAdmin: async () => {
        return await makeApiCall(API_ENDPOINTS.ADMIN.GET_BLOG_STATISTICS);
    },
};

export default blogService;