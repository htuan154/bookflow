// src/context/BlogContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import blogService from '../api/blog.service';

// Create context
const BlogContext = createContext();

// Custom hook to use blog context
export const useBlogContext = () => {
    const context = useContext(BlogContext);
    if (!context) {
        throw new Error('useBlogContext must be used within a BlogProvider');
    }
    return context;
};

// Blog Provider Component
export const BlogProvider = ({ children }) => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState(null); // Thêm state cho statistics
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

    /**
     * Fetch blog statistics for admin
     */
    const fetchStatistics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await blogService.getBlogStatisticsAdmin();

            if (response.success) {
                setStatistics(response.data);
            } else {
                throw new Error(response.message || 'Failed to fetch blog statistics');
            }

        } catch (err) {
            console.error('Error fetching blog statistics:', err);
            setError(err.message || 'Không thể tải thống kê bài viết');
            setStatistics(null);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch blogs with current filters and pagination
     */
    const fetchBlogs = async (options = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.currentPage,
                limit: pagination.itemsPerPage,
                ...options
            };

            let response;
            
            if (options.adminView) {
                response = await blogService.getAllBlogsAdmin(params);
            } else {
                response = await blogService.getPublishedBlogs(params);
            }

            if (response.success) {
                setBlogs(response.data.blogs || []);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination
                }));
            } else {
                throw new Error(response.message || 'Failed to fetch blogs');
            }

        } catch (err) {
            console.error('Error fetching blogs:', err);
            setError(err.message || 'Không thể tải danh sách bài viết');
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch blogs by specific status
     */
    const fetchBlogsByStatus = async (status, options = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: options.page || 1,
                limit: options.limit || 10,
                search: options.search || '',
                sortBy: options.sortBy || 'created_at',
                sortOrder: options.sortOrder || 'desc'
            };

            const response = await blogService.getBlogsByStatusAdmin(status, params);

            if (response.success) {
                setBlogs(response.data.blogs || []);
                setPagination(prev => ({
                    ...prev,
                    ...response.data.pagination
                }));
            } else {
                throw new Error(response.message || 'Failed to fetch blogs');
            }

        } catch (err) {
            console.error('Error fetching blogs by status:', err);
            setError(err.message || 'Không thể tải danh sách bài viết');
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => setError(null);

    const value = {
        // States
        blogs,
        loading,
        error,
        statistics, // Thêm statistics vào context value
        pagination,

        // Actions
        fetchBlogs,
        fetchBlogsByStatus,
        fetchStatistics, // Thêm fetchStatistics vào context value
        setPagination: (newPagination) => {
            setPagination(prev => ({ ...prev, ...newPagination }));
        },
        clearError,
    };

    return (
        <BlogContext.Provider value={value}>
            {children}
        </BlogContext.Provider>
    );
};