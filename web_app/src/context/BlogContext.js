    // src/context/BlogContext.js
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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
    const [statistics, setStatistics] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 9, // Đặt 9 mục mỗi trang cho blog
        totalItems: 0,
        totalPages: 1
    });
    const [currentBlog, setCurrentBlog] = useState(null);

    // Hàm lấy tất cả blog của admin

    // Hàm lấy tất cả blog của admin
    const getAllBlogsAdmin = useCallback(async (options = {}) => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                page: options.page || pagination.currentPage,
                limit: options.limit || pagination.itemsPerPage,
                ...options
            };
            const response = await blogService.getAllBlogsAdmin(params);
            if (response?.success) {
                const blogsData = Array.isArray(response.data) ? response.data : response.data?.blogs || [];
                const paginationData = response.pagination || response.data?.pagination || {};
                setBlogs(blogsData);
                setPagination(prev => ({ ...prev, ...paginationData, currentPage: params.page }));
                return { blogs: blogsData, pagination: paginationData };
            } else {
                throw new Error(response?.message || 'Không thể lấy danh sách bài viết admin');
            }
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách bài viết admin');
            setBlogs([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.itemsPerPage]);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    /**
     * Fetch blog statistics for admin only
     */
    const fetchStatistics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔄 Fetching admin blog statistics...');
            // Lấy tất cả blog của admin để tính thống kê
            const response = await blogService.getBlogsByRoleAdmin({ 
                role: 'admin',
                limit: 1000 // Lấy nhiều để đảm bảo có đủ dữ liệu tính thống kê
            });

            if (response.success) {
                const blogs = Array.isArray(response.data) ? response.data : response.data?.blogs || [];
                
                // Tính số lượng theo từng trạng thái
                const statistics = {
                    total: blogs.length,
                    draft: blogs.filter(blog => blog.status === 'draft').length,
                    pending: blogs.filter(blog => blog.status === 'pending').length,
                    published: blogs.filter(blog => blog.status === 'published').length,
                    archived: blogs.filter(blog => blog.status === 'archived').length,
                    rejected: blogs.filter(blog => blog.status === 'rejected').length
                };
                
                setStatistics(statistics);
                console.log('✅ Admin blog statistics loaded successfully:', statistics);
            } else {
                throw new Error(response.message || 'Failed to fetch admin blog statistics');
            }

        } catch (err) {
            console.error('❌ Error fetching admin blog statistics:', err);
            setError(err.message || 'Không thể tải thống kê bài viết admin');
            setStatistics(null);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch blogs with current filters and pagination
     */
    const fetchBlogs = useCallback(async (options = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: options.page || pagination.currentPage,
                limit: options.limit || pagination.itemsPerPage,
                ...options
            };

            console.log('🔄 Fetching blogs with params:', params);

            let response;

            // Nếu adminView=true, chỉ lấy blog của admin
            if (options.adminView) {
                // Sử dụng getBlogsByRoleAdmin để chỉ lấy blog của admin
                response = await blogService.getBlogsByRoleAdmin({ 
                    ...params, 
                    role: 'admin' 
                });
            } else {
                response = await blogService.getPublishedBlogs(params);
            }

            if (response?.success) {
                const blogsData = Array.isArray(response.data) ? response.data : response.data?.blogs || [];
                const paginationData = response.pagination || response.data?.pagination || {};
                console.log('🔍 Raw blogs data from API:', blogsData);
                if (blogsData.length > 0) {
                    console.log('🔍 First blog structure:', blogsData[0]);
                    console.log('🔍 First blog keys:', Object.keys(blogsData[0]));
                }
                setBlogs(blogsData);
                setPagination(prev => ({
                    ...prev,
                    ...paginationData,
                    currentPage: params.page
                }));
                console.log('✅ Blogs loaded successfully:', {
                    count: blogsData.length,
                    pagination: paginationData
                });
            } else if (
                response?.message &&
                (
                    response.message.toLowerCase() === 'success' ||
                    response.message.toLowerCase().includes('deleted successfully')
                )
            ) {
                // Nếu message là "Success" hoặc "Deleted successfully" thì coi như thành công, không ném lỗi
                // Có thể giữ nguyên data cũ hoặc reload lại nếu cần
                return;
            } else {
                throw new Error(response?.message || 'Failed to fetch blogs');
            }

        } catch (err) {
            console.error('❌ Error fetching blogs:', err);
            setError(err.message || 'Không thể tải danh sách bài viết');
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.currentPage, pagination.itemsPerPage]); // ⚠️ Có thể cần review dependencies này

    /**
     * Fetch blogs by specific status (admin only)
     */
    const fetchBlogsByStatus = useCallback(async (status, options = {}) => {
        try {
            setLoading(true);
            setError(null);

            if (!status) {
                throw new Error('Status is required');
            }

            const params = {
                page: options.page || 1,
                limit: options.limit || 10,
                keyword: options.keyword || '', 
                sortBy: options.sortBy || 'created_at',
                sortOrder: options.sortOrder || 'desc',
                role: 'admin', // Chỉ lấy blog của admin
                status: status // Thêm status vào params
            };

            console.log('🔄 Fetching admin blogs by status:', status, params);

            // Sử dụng getBlogsByRoleAdmin thay vì getBlogsByStatusAdmin để đảm bảo chỉ lấy blog của admin
            const response = await blogService.getBlogsByRoleAdmin(params);

            if (response?.success) {
                const blogsData = Array.isArray(response.data) ? response.data : response.data?.blogs || [];
                const paginationData = response.pagination || response.data?.pagination || {};
                setBlogs(blogsData);
                setPagination(prev => ({
                    ...prev,
                    ...paginationData,
                    currentPage: params.page
                }));
                console.log('✅ Admin blogs by status loaded successfully:', {
                    status,
                    count: blogsData.length,
                    pagination: paginationData
                });
            } else {
                throw new Error(response?.message || 'Failed to fetch blogs by status');
            }

        } catch (err) {
            console.error('❌ Error fetching blogs by status:', err);
            setError(err.message || 'Không thể tải danh sách bài viết');
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Create a new blog (CREATE)
     */
    const createBlog = useCallback(async (blogData) => {
        try {
            setLoading(true);
            setError(null);

            if (!blogData) {
                throw new Error('Blog data is required');
            }

            console.log('🔄 Creating blog via context:', blogData);
            
            if (!blogData.title?.trim()) {
                throw new Error('Tiêu đề bài viết là bắt buộc');
            }
            
            if (!blogData.content?.trim()) {
                throw new Error('Nội dung bài viết là bắt buộc');
            }

            if (!blogData.author_id) {
                throw new Error('Không xác định được tác giả. Vui lòng đăng nhập lại.');
            }

            const response = await blogService.createBlog(blogData);
            
            console.log('📥 Raw response from blog service:', response);

            if (response && response.success === true) {
                const newBlog = response.data;
                
                setBlogs(prev => {
                    if (prev.length === 0 || prev[0].status === newBlog.status) {
                        return [newBlog, ...prev];
                    }
                    return prev;
                });
                
                if (statistics) {
                    setStatistics(prev => ({
                        ...prev,
                        total: (prev.total || 0) + 1,
                        [newBlog.status]: (prev[newBlog.status] || 0) + 1
                    }));
                }
                
                console.log('✅ Blog created successfully in context:', newBlog);
                return newBlog;
                
            } else if (response && response.message && response.message.includes('successfully')) {
                console.log('🎯 Success message detected, treating as success');
                
                const newBlog = response.data || {
                    blog_id: Date.now(),
                    title: blogData.title,
                    status: blogData.status || 'draft',
                    created_at: new Date().toISOString()
                };
                
                setBlogs(prev => [newBlog, ...prev]);
                console.log('✅ Blog created successfully (special case):', newBlog);
                return newBlog;
                
            } else {
                console.error('❌ Blog creation failed:', response);
                throw new Error(response?.message || 'Tạo bài viết thất bại');
            }

        } catch (err) {
            console.error('❌ Error in createBlog context:', err);
            
            if (err.message && err.message.includes('successfully')) {
                console.log('🎯 Success message in error, treating as success');
                return { success: true, message: err.message };
            }
            
            const errorMessage = err.message || 'Không thể tạo bài viết';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [statistics]);

    /**
     * Update a blog (UPDATE)
     */
    const updateBlog = useCallback(async (blogId, blogData) => {
        try {
            setLoading(true);
            setError(null);

            if (!blogId) {
                throw new Error('Blog ID is required');
            }
            
            if (!blogData) {
                throw new Error('Blog data is required');
            }

            // Chỉ forward các trường hợp hợp lệ cho backend
            const allowedFields = [
                'title',
                'slug',
                'content',
                'excerpt',
                'status',
                'tags',
                'hotel_id',
                'featured_image_url',
                'meta_description'
            ];
            const filteredBlogData = {};
            for (const key of allowedFields) {
                if (blogData[key] !== undefined) {
                    filteredBlogData[key] = blogData[key];
                }
            }

            console.log('🔄 Updating blog via context:', blogId, filteredBlogData);
            
            const response = await blogService.updateBlog(blogId, filteredBlogData);

            // Xử lý trường hợp backend trả về message thành công nhưng không có success:true
            if (response?.success) {
                const updatedBlog = response.data;
                setBlogs(prevBlogs => 
                    prevBlogs.map(blog => 
                        // Sửa: dùng blog.blogId thay vì blog.blog_id
                        blog.blogId === blogId
                            ? { ...blog, ...updatedBlog } 
                            : blog
                    )
                );
                console.log('✅ Blog updated successfully:', updatedBlog);
                return updatedBlog;
            } else if (
                response &&
                typeof response === 'object' &&
                response.message &&
                response.message.toLowerCase().includes('successfully')
            ) {
                // Xử lý thành công đặc biệt
                console.log('🎯 Success message detected, treating as success');
                return response.data || {};
            } else {
                throw new Error(response?.message || 'Cập nhật bài viết thất bại');
            }

        } catch (err) {
            console.error('❌ Error updating blog:', err);
            const errorMessage = err.message || 'Không thể cập nhật bài viết';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Delete a blog (DELETE)
     */
    const deleteBlog = useCallback(async (blogId) => {
        try {
            setLoading(true);
            setError(null);

            if (!blogId) {
                throw new Error('Blog ID is required');
            }

            console.log('🔄 Deleting blog via context:', blogId);
            
            const response = await blogService.deleteBlog(blogId);

            // Chỉ xóa khỏi UI nếu chắc chắn thành công
            if (response?.success === true) {
                setBlogs(prevBlogs => 
                    prevBlogs.filter(blog => 
                        // Sửa: dùng blog.blogId thay vì blog.blog_id
                        blog.blogId !== blogId
                    )
                );
                if (statistics) {
                    setStatistics(prev => ({
                        ...prev,
                        total: Math.max(0, (prev.total || 0) - 1)
                    }));
                }
                console.log('✅ Blog deleted successfully');
                return true;
            } else if (
                response &&
                typeof response === 'object' &&
                response.message &&
                response.message.toLowerCase().includes('deleted successfully')
            ) {
                setBlogs(prevBlogs => 
                    prevBlogs.filter(blog => 
                        // Sửa: dùng blog.blogId thay vì blog.blog_id
                        blog.blogId !== blogId
                    )
                );
                if (statistics) {
                    setStatistics(prev => ({
                        ...prev,
                        total: Math.max(0, (prev.total || 0) - 1)
                    }));
                }
                console.log('✅ Blog deleted successfully (special case)');
                return true;
            } else {
                // Không xóa khỏi UI nếu API trả về lỗi hoặc response không hợp lệ
                console.error('❌ Delete failed, API response:', response);
                throw new Error(response?.message || 'Xóa bài viết thất bại');
            }

        } catch (err) {
            console.error('❌ Error deleting blog:', err);
            const errorMessage = err.message || 'Không thể xóa bài viết';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [statistics]);

    /**
     * Get blog by ID (READ) - QUAN TRỌNG: Thêm cache để tránh gọi lại
     */
    const getBlogById = useCallback(async (blogId) => {
        try {
            setLoading(true);
            setError(null);

            if (!blogId) {
                throw new Error('Blog ID is required');
            }

            console.log('🔄 Fetching blog by ID via context:', blogId);

            // ✅ LOẠI BỎ cache logic để đảm bảo luôn lấy dữ liệu mới
            const response = await blogService.getBlogById(blogId);

            if (response && response.status === 'success' && response.data) {
                console.log('✅ Blog data from API:', response.data);
                return response.data;
            }

            if (
                response &&
                typeof response === 'object' &&
                (response.blogId || response.blog_id || response.title)
            ) {
                return response;
            }

            if (response?.success === true) {
                const blogData = response.data;
                if (blogData && typeof blogData === 'object') {
                    return blogData;
                } else {
                    throw new Error('Dữ liệu bài viết không hợp lệ');
                }
            } else if (response?.success === false) {
                throw new Error(response?.message || 'API trả về lỗi');
            } else {
                throw new Error('Phản hồi từ server không rõ ràng');
            }

        } catch (err) {
            console.error('❌ Error fetching blog:', err);
            
            let errorMessage = 'Không thể tải bài viết';
            
            if (err.message?.includes('404')) {
                errorMessage = 'Không tìm thấy bài viết với ID này';
                setError(errorMessage);
                return null;
            } else if (err.message?.includes('401')) {
                errorMessage = 'Bạn cần đăng nhập để xem bài viết';
            } else if (err.message?.includes('403')) {
                errorMessage = 'Bạn không có quyền xem bài viết này';
            } else if (err.message?.includes('successfully')) {
                console.log('🎯 Success message in error, treating as success');
                return { success: true, message: err.message };
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []); // ✅ Không dependency nào để tránh vòng lặp

    /**
     * Update blog status
     */
    const updateBlogStatus = useCallback(async (blogId, status) => {
        try {
            setLoading(true);
            setError(null);

            if (!blogId) {
                throw new Error('Blog ID is required');
            }
            
            if (!status) {
                throw new Error('Status is required');
            }

            console.log('🔄 Updating blog status via context:', blogId, status);
            
            const response = await blogService.updateBlogStatus(blogId, status);

            if (response?.success) {
                const updatedBlog = response.data;
                
                setBlogs(prevBlogs => 
                    prevBlogs.map(blog => 
                        // Sửa: dùng blog.blogId thay vì blog.blog_id
                        blog.blogId === blogId
                            ? { ...blog, status, ...updatedBlog } 
                            : blog
                    )
                );
                
                console.log('✅ Blog status updated successfully');
                return updatedBlog;
            } else if (
                response &&
                typeof response === 'object' &&
                response.message &&
                response.message.toLowerCase().includes('successfully')
            ) {
                // Xử lý thành công đặc biệt (message thành công nhưng không có success:true)
                console.log('🎯 Success message detected, treating as success');
                return response.data || {};
            } else {
                throw new Error(response?.message || 'Cập nhật trạng thái thất bại');
            }

        } catch (err) {
            console.error('❌ Error updating blog status:', err);
            const errorMessage = err.message || 'Không thể cập nhật trạng thái bài viết';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Refresh current blog list
     */
    const refreshBlogs = useCallback(async () => {
        console.log('🔄 Refreshing blogs...');
        await fetchBlogs({ page: pagination.currentPage });
    }, [fetchBlogs, pagination.currentPage]);

    /**
     * Clear error manually
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Update pagination
     */
    const updatePagination = useCallback((newPagination) => {
        setPagination(prev => ({ ...prev, ...newPagination }));
    }, []);

    /**
     * Clear current blog
     */
    const clearCurrentBlog = useCallback(() => {
        setCurrentBlog(null);
    }, []);

    // Thêm hàm getOwnerBlogs để lấy blog của hotel owner
    const getOwnerBlogs = useCallback(async (options = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: options.page || 1,
                limit: options.limit || 10,
                status: options.status,
                sortBy: options.sortBy || 'created_at',
                sortOrder: options.sortOrder || 'desc'
            };

            console.log('🔄 Fetching owner blogs with params:', params);
            const response = await blogService.getOwnerBlogs(params);

            if (response?.success) {
                const blogsData = Array.isArray(response.data) ? response.data : response.data?.blogs || [];
                const paginationData = response.pagination || response.data?.pagination || {};
                console.log('✅ Owner blogs loaded successfully:', blogsData);
                setBlogs(blogsData);
                setPagination(prev => ({
                    ...prev,
                    ...paginationData,
                    currentPage: params.page
                }));
                return { blogs: blogsData, pagination: paginationData };
            } else {
                throw new Error(response?.message || 'Không thể lấy danh sách bài viết');
            }
        } catch (err) {
            console.error('❌ Error fetching owner blogs:', err);
            setError(err.message || 'Không thể tải danh sách bài viết của bạn');
            setBlogs([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Thêm hàm searchBlogsByTitle vào BlogProvider
    const searchBlogsByTitle = useCallback(async (keyword, options = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                keyword,
                page: options.page || 1,
                limit: options.limit || 10
            };

            const response = await blogService.searchBlogsByTitle(params);

            if (response?.success) {
                const blogsData = Array.isArray(response.data) ? response.data : response.data?.blogs || [];
                const paginationData = response.pagination || response.data?.pagination || {};
                setBlogs(blogsData);
                setPagination(prev => ({
                    ...prev,
                    ...paginationData,
                    currentPage: params.page
                }));
            } else {
                throw new Error(response?.message || 'Không tìm thấy bài viết phù hợp');
            }
        } catch (err) {
            setError(err.message || 'Không thể tìm kiếm bài viết');
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch blogs by admin role (lọc theo role, phân trang, trạng thái)
     */
    const fetchBlogsByRole = useCallback(async (options = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: options.page || 1,
                limit: options.limit || 10,
                role: options.role,
                status: options.status,
                sortBy: options.sortBy || 'created_at',
                sortOrder: options.sortOrder || 'desc'
            };

            const response = await blogService.getBlogsByRoleAdmin(params);

            if (response?.success) {
                const blogsData = Array.isArray(response.data) ? response.data : response.data?.blogs || [];
                const paginationData = response.pagination || response.data?.pagination || {};
                setBlogs(blogsData);
                setPagination(prev => ({
                    ...prev,
                    ...paginationData,
                    currentPage: params.page
                }));
            } else {
                throw new Error(response?.message || 'Failed to fetch blogs by role');
            }
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách bài viết');
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Lấy blog theo authorId (admin)
    const getBlogsByAuthorId = useCallback(async (authorId, options = {}) => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                page: options.page || 1,
                limit: options.limit || 10,
                status: options.status,
                keyword: options.keyword || '',
                sortBy: options.sortBy || 'created_at',
                sortOrder: options.sortOrder || 'desc'
            };
            const response = await blogService.getBlogsByAuthorId(authorId, params);
            if (response?.success) {
                const blogsData = Array.isArray(response.data) ? response.data : response.data?.blogs || [];
                const paginationData = response.pagination || response.data?.pagination || {};
                setBlogs(blogsData);
                setPagination(prev => ({
                    ...prev,
                    ...paginationData,
                    currentPage: params.page
                }));
                return { blogs: blogsData, pagination: paginationData };
            } else {
                throw new Error(response?.message || 'Không thể lấy danh sách bài viết');
            }
        } catch (err) {
            setError(err.message || 'Không thể tải danh sách bài viết của admin');
            setBlogs([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);
    // ✅ QUAN TRỌNG: Memoize context value để tránh re-render vô tận
    const value = useMemo(() => ({
        // States
        blogs,
        loading,
        error,
        statistics,
        pagination,
        currentBlog,

        // Actions
    fetchBlogs,
    fetchBlogsByStatus,
    fetchStatistics,
    createBlog,
    updateBlog,
    deleteBlog,
    getBlogById,
    updateBlogStatus,
    refreshBlogs,
    updatePagination,
    clearError,
    setCurrentBlog,
    clearCurrentBlog,
    getOwnerBlogs,
    getAllBlogsAdmin,

    // Thêm hàm tìm kiếm blog theo tiêu đề (không dấu)
    searchBlogsByTitle,
    // Thêm hàm lấy blog theo role admin
    fetchBlogsByRole,
    getBlogsByRoleAdmin: fetchBlogsByRole,
    }), [
        // ✅ QUAN TRỌNG: Dependencies chính xác
        blogs,
        loading,
        error,
        statistics,
        pagination,
        currentBlog,
    fetchBlogs,
    fetchBlogsByStatus,
    fetchStatistics,
    createBlog,
    updateBlog,
    deleteBlog,
    getBlogById,
    updateBlogStatus,
    refreshBlogs,
    updatePagination,
    clearError,
    setCurrentBlog,
    clearCurrentBlog,
    getOwnerBlogs,
    getAllBlogsAdmin,
    searchBlogsByTitle,
    fetchBlogsByRole,
    ]);

    return (
        <BlogContext.Provider value={value}>
            {children}
        </BlogContext.Provider>
    );
};

export default BlogContext;