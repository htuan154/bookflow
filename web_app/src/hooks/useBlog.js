// src/hooks/useBlog.js
import { useCallback, useState } from 'react';
import { useBlogContext } from '../context/BlogContext';
import { API_ENDPOINTS } from '../config/apiEndpoints';

// Helper function to make API calls
const makeApiCall = async (url, options = {}) => {
    try {
        const token = localStorage.getItem('accessToken');
        const defaultHeaders = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };

        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

// Custom hook for blog operations
const useBlog = () => {
    const blogContext = useBlogContext();
    const [localLoading, setLocalLoading] = useState(false);
    const [localError, setLocalError] = useState(null);

    // Clear local error
    const clearLocalError = useCallback(() => {
        setLocalError(null);
    }, []);

    // Set local error
    const setError = useCallback((error) => {
        setLocalError(error);
    }, []);

    // Get blogs with filters and pagination
    const getBlogs = useCallback(async (params = {}) => {
        try {
            setLocalLoading(true);
            clearLocalError();
            
            await blogContext.fetchBlogs(params);
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Get blogs by status for admin
    const getBlogsByStatus = useCallback(async (status, params = {}) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const queryParams = new URLSearchParams({
                page: params.page || 1,
                limit: params.limit || 10,
                search: params.search || '',
                sortBy: params.sortBy || 'createdAt',
                sortOrder: params.sortOrder || 'desc',
            });

            const response = await makeApiCall(
                `${API_ENDPOINTS.ADMIN.GET_BLOGS_BY_STATUS(status)}?${queryParams}`
            );

            blogContext.dispatch({ 
                type: 'SET_BLOGS', 
                payload: response.data || response.blogs || [] 
            });

            if (response.pagination) {
                blogContext.setPagination(response.pagination);
            }

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Get published blogs
    const getPublishedBlogs = useCallback(async (params = {}) => {
        return await getBlogsByStatus('published', params);
    }, [getBlogsByStatus]);

    // Get pending blogs
    const getPendingBlogs = useCallback(async (params = {}) => {
        return await getBlogsByStatus('pending', params);
    }, [getBlogsByStatus]);

    // Get draft blogs
    const getDraftBlogs = useCallback(async (params = {}) => {
        return await getBlogsByStatus('draft', params);
    }, [getBlogsByStatus]);

    // Get rejected blogs
    const getRejectedBlogs = useCallback(async (params = {}) => {
        return await getBlogsByStatus('rejected', params);
    }, [getBlogsByStatus]);

    // Get blog by ID
    const getBlogById = useCallback(async (blogId) => {
        try {
            setLocalLoading(true);
            clearLocalError();
            
            // PHẢI return dữ liệu blog từ context
            return await blogContext.getBlogById(blogId);
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Get blog by slug (for public viewing)
    const getBlogBySlug = useCallback(async (slug) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const response = await makeApiCall(API_ENDPOINTS.BLOGS.GET_BY_SLUG(slug));
            blogContext.dispatch({ 
                type: 'SET_CURRENT_BLOG', 
                payload: response.data || response 
            });

            return response.data || response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Get blog by id but ensure it belongs to the specified hotel
    const getBlogByHotelID = useCallback(async (hotelId, blogId) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            if (!hotelId || !blogId) {
                throw new Error('hotelId and blogId are required');
            }

            const response = await makeApiCall(API_ENDPOINTS.BLOGS.GET_BY_ID(blogId));
            const blog = response.data || response;

            const blogHotelId = blog?.hotel_id || blog?.hotelId || blog?.hotel || null;

            if (blogHotelId != null && String(blogHotelId) !== String(hotelId)) {
                throw new Error('Blog không thuộc khách sạn này');
            }

            blogContext.dispatch({
                type: 'SET_CURRENT_BLOG',
                payload: blog,
            });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Search blogs
    const searchBlogs = useCallback(async (searchQuery, params = {}) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const queryParams = new URLSearchParams({
                q: searchQuery,
                page: params.page || 1,
                limit: params.limit || 10,
                status: params.status || 'published',
                sortBy: params.sortBy || 'createdAt',
                sortOrder: params.sortOrder || 'desc',
            });

            const response = await makeApiCall(`${API_ENDPOINTS.BLOGS.SEARCH}?${queryParams}`);
            
            blogContext.dispatch({ 
                type: 'SET_BLOGS', 
                payload: response.data || response.blogs || [] 
            });

            if (response.pagination) {
                blogContext.setPagination(response.pagination);
            }

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Get blogs by hotel
    const getBlogsByHotel = useCallback(async (hotelId, params = {}) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const queryParams = new URLSearchParams({
                page: params.page || 1,
                limit: params.limit || 10,
            });

            // Only add status filter if explicitly provided
            if (params.status) {
                queryParams.append('status', params.status);
            }

            const response = await makeApiCall(
                `${API_ENDPOINTS.BLOGS.GET_BY_HOTEL(hotelId)}?${queryParams}`
            );

            blogContext.dispatch({ 
                type: 'SET_BLOGS', 
                payload: response.data || response.blogs || [] 
            });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Get blogs by tag
    const getBlogsByTag = useCallback(async (tag, params = {}) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const queryParams = new URLSearchParams({
                page: params.page || 1,
                limit: params.limit || 10,
                status: params.status || 'published',
            });

            const response = await makeApiCall(
                `${API_ENDPOINTS.BLOGS.GET_BY_TAG(tag)}?${queryParams}`
            );

            blogContext.dispatch({ 
                type: 'SET_BLOGS', 
                payload: response.data || response.blogs || [] 
            });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Get popular blogs
    const getPopularBlogs = useCallback(async (limit = 10) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const response = await makeApiCall(`${API_ENDPOINTS.BLOGS.GET_POPULAR}?limit=${limit}`);
            
            return response.data || response.blogs || [];
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [clearLocalError, setError]);

    // Get recent blogs
    const getRecentBlogs = useCallback(async (limit = 10) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const response = await makeApiCall(`${API_ENDPOINTS.BLOGS.GET_RECENT}?limit=${limit}`);
            
            return response.data || response.blogs || [];
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [clearLocalError, setError]);

    // Get owner blogs (chỉ lấy blog của hotel owner đang đăng nhập)
    const getOwnerBlogs = useCallback(async (params = {}) => {
        try {
            setLocalLoading(true);
            clearLocalError();
            
            return await blogContext.getOwnerBlogs(params);
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Get blogs by role for admin
    const getBlogsByRole = useCallback(async (role, params = {}) => {
        try {
            setLocalLoading(true);
            clearLocalError();
            
            await blogContext.fetchBlogsByRole(role, params);
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Create blog
    const createBlog = useCallback(async (blogData) => {
        try {
            setLocalLoading(true);
            clearLocalError();
            
            return await blogContext.createBlog(blogData);
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Update blog
    const updateBlog = useCallback(async (blogId, blogData) => {
        try {
            setLocalLoading(true);
            clearLocalError();
            
            return await blogContext.updateBlog(blogId, blogData);
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Delete blog
    const deleteBlog = useCallback(async (blogId) => {
        try {
            setLocalLoading(true);
            clearLocalError();
            
            await blogContext.deleteBlog(blogId);
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Bulk operations
    const bulkApproveBlog = useCallback(async (blogIds) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const response = await makeApiCall(API_ENDPOINTS.ADMIN.BULK_APPROVE_BLOGS, {
                method: 'POST',
                body: JSON.stringify({ blogIds }),
            });

            // Refresh the blogs list
            await blogContext.fetchBlogs({ adminView: true });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    const bulkRejectBlog = useCallback(async (blogIds) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const response = await makeApiCall(API_ENDPOINTS.ADMIN.BULK_REJECT_BLOGS, {
                method: 'POST',
                body: JSON.stringify({ blogIds }),
            });

            // Refresh the blogs list
            await blogContext.fetchBlogs({ adminView: true });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    const bulkDeleteBlog = useCallback(async (blogIds) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const response = await makeApiCall(API_ENDPOINTS.ADMIN.BULK_DELETE_BLOGS, {
                method: 'DELETE',
                body: JSON.stringify({ blogIds }),
            });

            // Refresh the blogs list
            await blogContext.fetchBlogs({ adminView: true });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [blogContext, clearLocalError, setError]);

    // Image operations
    const uploadBlogImage = useCallback(async (blogId, imageFile) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const formData = new FormData();
            formData.append('image', imageFile);

            const token = localStorage.getItem('accessToken');
            const response = await fetch(API_ENDPOINTS.BLOGS.UPLOAD_IMAGE(blogId), {
                method: 'POST',
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Upload failed');
            }

            return await response.json();
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [clearLocalError, setError]);

    const deleteBlogImage = useCallback(async (blogId, imageId) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const response = await makeApiCall(API_ENDPOINTS.BLOGS.DELETE_IMAGE(blogId, imageId), {
                method: 'DELETE',
            });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [clearLocalError, setError]);

    const setFeaturedImage = useCallback(async (blogId, imageId) => {
        try {
            setLocalLoading(true);
            clearLocalError();

            const response = await makeApiCall(API_ENDPOINTS.BLOGS.SET_FEATURED_IMAGE(blogId, imageId), {
                method: 'PATCH',
            });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLocalLoading(false);
        }
    }, [clearLocalError, setError]);

    // Interaction operations
    const incrementViewCount = useCallback(async (blogId) => {
        try {
            await makeApiCall(API_ENDPOINTS.BLOGS.INCREMENT_VIEW(blogId), {
                method: 'POST',
            });

            blogContext.dispatch({ 
                type: 'INCREMENT_VIEW_COUNT', 
                payload: blogId 
            });
        } catch (error) {
            console.error('Failed to increment view count:', error);
        }
    }, [blogContext]);

    const likeBlog = useCallback(async (blogId) => {
        try {
            const response = await makeApiCall(API_ENDPOINTS.BLOGS.LIKE(blogId), {
                method: 'POST',
            });

            blogContext.dispatch({ 
                type: 'TOGGLE_LIKE', 
                payload: { blogId, liked: true } 
            });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    }, [blogContext, setError]);

    const unlikeBlog = useCallback(async (blogId) => {
        try {
            const response = await makeApiCall(API_ENDPOINTS.BLOGS.UNLIKE(blogId), {
                method: 'DELETE',
            });

            blogContext.dispatch({ 
                type: 'TOGGLE_LIKE', 
                payload: { blogId, liked: false } 
            });

            return response;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    }, [blogContext, setError]);

    return {
        // State from context
        blogs: blogContext.blogs,
        currentBlog: blogContext.currentBlog,
        loading: blogContext.loading || localLoading,
        error: blogContext.error || localError,
        pagination: blogContext.pagination,
        filters: blogContext.filters,
        statistics: blogContext.statistics,

        // Local state
        localLoading,
        localError,
        clearLocalError,

        // Context actions
        setFilters: blogContext.setFilters,
        resetFilters: blogContext.resetFilters,
        setPagination: blogContext.setPagination,
        clearCurrentBlog: blogContext.clearCurrentBlog,
        fetchStatistics: blogContext.fetchStatistics,

        // Status operations
        approveBlog: blogContext.approveBlog,
        rejectBlog: blogContext.rejectBlog,
        publishBlog: blogContext.publishBlog,
        unpublishBlog: blogContext.unpublishBlog,
        updateBlogStatus: blogContext.updateBlogStatus,

        // CRUD operations
        getBlogs,
        getBlogById,
        getBlogBySlug,
        getBlogByHotelID,
        createBlog,
        updateBlog,
        deleteBlog,

        // Filter operations
        getBlogsByStatus,
        getPublishedBlogs,
        getPendingBlogs,
        getDraftBlogs,
        getRejectedBlogs,
        getBlogsByHotel,
        getBlogsByTag,
        searchBlogs,
        getPopularBlogs,
        getRecentBlogs,
        getOwnerBlogs,
        getBlogsByRole,

        // Bulk operations
        bulkApproveBlog,
        bulkRejectBlog,
        bulkDeleteBlog,

        // Image operations
        uploadBlogImage,
        deleteBlogImage,
        setFeaturedImage,

        // Interaction operations
        incrementViewCount,
        likeBlog,
        unlikeBlog,
    };
};

export default useBlog;