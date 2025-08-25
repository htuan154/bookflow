// src/api/v1/services/blog.service.js

const blogRepository = require('../repositories/blog.repository');
const { AppError } = require('../../../utils/errors');
const slugify = require('slugify'); // Cần cài đặt: npm install slugify

class BlogService {
    /**
     * Tạo một bài blog mới.
     * @param {object} blogData - Dữ liệu bài blog.
     * @param {string} authorId - ID của tác giả.
     * @returns {Promise<Blog>}
     */
    async createBlog(blogData, authorId) {
        // Tự động tạo slug từ title
        const slug = slugify(blogData.title, { lower: true, strict: true });
        
        const existingBlog = await blogRepository.findBySlug(slug);
        if (existingBlog) {
            throw new AppError('A blog with this title already exists, please choose another.', 409);
        }

        const fullBlogData = {
            ...blogData,
            author_id: authorId,
            slug: slug,
            status: 'draft', // Mặc định là bản nháp
        };

        return await blogRepository.create(fullBlogData);
    }

    /**
     * Lấy danh sách các bài blog đã xuất bản.
     * @param {object} pagination - Tùy chọn phân trang.
     * @returns {Promise<Blog[]>}
     */
    async getPublishedBlogs(pagination = {}) {
        const { page = 1, limit = 10 } = pagination;
        const offset = (page - 1) * limit;
        return await blogRepository.findAllPublished(limit, offset);
    }

    /**
     * Lấy một bài blog bằng slug và tăng lượt xem.
     * @param {string} slug - Slug của bài blog.
     * @returns {Promise<Blog>}
     */
    // async getBlogBySlug(slug) {
    //     const blog = await blogRepository.findBySlug(slug);
    //     if (!blog || blog.status !== 'published') {
    //         throw new AppError('Blog not found or is not published', 404);
    //     }
    //     // Tăng lượt xem (không cần đợi kết quả)
    //     blogRepository.incrementViewCount(blog.blogId);
    //     return blog;
    // }
    async getBlogBySlug(slug) {
        const blog = await blogRepository.findBySlug(slug);
        console.log('DEBUG - slug param:', slug);
        // In ra thông tin blog để kiểm tra
        console.log('DEBUG - blog found by slug:', blog);

        if (!blog || blog.status !== 'published') {
            throw new AppError('Blog not found or is not published', 404);
        }

        // Tăng lượt xem (không cần đợi kết quả)
        blogRepository.incrementViewCount(blog.blogId);

        return blog;
    }


    /**
     * Cập nhật một bài blog.
     * @param {string} blogId - ID của bài blog.
     * @param {object} updateData - Dữ liệu cập nhật.
     * @param {string} userId - ID của người thực hiện.
     * @returns {Promise<Blog>}
     */
    async updateBlog(blogId, updateData, userId) {
        const blog = await blogRepository.findById(blogId);
        if (!blog) throw new AppError('Blog not found', 404);

    
        if (blog.authorId !== userId) {
            throw new AppError('Forbidden: You can only edit your own blog posts', 403);
        }
        
        // Nếu title thay đổi, cập nhật lại slug
        if (updateData.title) {
            updateData.slug = slugify(updateData.title, { lower: true, strict: true });
        }

        return await blogRepository.update(blogId, updateData);
    }

     /**
     * Lấy danh sách blogs theo trạng thái (Admin only).
     * @param {string} status - Trạng thái của blog.
     * @param {object} options - Tùy chọn phân trang và sắp xếp.
     * @returns {Promise<object>}
     */
    async getBlogsByStatus(status, options = {}) {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            
            const result = await blogRepository.findByStatus(status, limit, offset, sortBy, sortOrder);
            
            const totalPages = Math.ceil(result.total / limit);
            
            return {
                success: true,
                data: {
                    blogs: result.blogs,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: result.total,
                        itemsPerPage: limit,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1
                    }
                }
            };
        } catch (error) {
            throw new Error(`Error getting blogs by status: ${error.message}`);
        }
    }


    /**
     * Lấy thống kê blogs theo trạng thái (Admin only).
     * @returns {Promise<object>}
     */
    async getBlogStatistics() {
        try {
            const stats = await blogRepository.getBlogStatsByStatus();
            
            // Tính tổng
            const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
            
            return {
                success: true,
                data: {
                    ...stats,
                    total
                }
            };
        } catch (error) {
            throw new Error(`Error getting blog statistics: ${error.message}`);
        }
    }

    /**
     * Lấy thống kê blogs cho admin (Admin only).
     * @returns {Promise<object>}
     */
    async getAdminBlogStats() {
        // Có thể dùng lại logic của getBlogStatistics hoặc tùy chỉnh cho admin
        return await this.getBlogStatistics();
    }

        /**
     * Xóa một bài blog theo ID.
     * @param {string} blogId - ID của bài blog.
     * @param {string} userId - ID của người thực hiện (để kiểm tra quyền).
     * @returns {Promise<void>}
     */
    async deleteBlog(blogId, userId) {
        const blog = await blogRepository.findById(blogId);
        if (!blog) throw new AppError('Blog not found', 404);

        // if (blog.authorId !== userId) {
        //     throw new AppError('Forbidden: You can only delete your own blog posts', 403);
        // }

        const success = await blogRepository.deleteById(blogId);
        if (!success) {
            throw new AppError('Failed to delete blog', 500);
        }
    }

    /**
     * Lấy một bài blog theo ID.
     * @param {string} blogId - ID của bài blog.
     * @returns {Promise<Blog>}
     */
    async getBlogById(blogId) {
        const blog = await blogRepository.findById(blogId);
        if (!blog) {
            throw new AppError('Blog not found', 404);
        }
        return blog;
    }

    //Thêm hàm cập nhật trạng thái của blogs
    /**
     * Cập nhật trạng thái của một blog (Admin only).
     * @param {string} blogId - ID của blog.
     * @param {string} newStatus - Trạng thái mới.
     * @param {string} userId - ID của người thực hiện (người duyệt nếu là published).
     * @param {boolean} isAdmin - Có phải admin hay không.
     * @returns {Promise<Blog>}
     */
    async updateBlogStatus(blogId, newStatus, userId, isAdmin = false) {
        const blog = await blogRepository.findById(blogId);
        if (!blog) {
            throw new AppError('Blog not found', 404);
        }

        // Chỉ admin mới được đổi trạng thái
        if (!isAdmin) {
            throw new AppError('Forbidden: Only admins can change blog status', 403);
        }

        // Nếu trạng thái mới là published thì lưu người duyệt
        const updatedBlog = await blogRepository.updateStatus(
            blogId,
            newStatus,
            newStatus === 'published' ? userId : null
        );

        if (!updatedBlog) {
            throw new AppError('Failed to update blog status', 500);
        }

        return updatedBlog;
    }

    /**
 /**
 * Tìm kiếm blog theo tiêu đề (đơn giản, có phân trang, tùy chọn trạng thái)
 * @param {string} keyword - Từ khóa tìm kiếm.
 * @param {object} options - { page, limit, status }
 * @returns {Promise<object>}
 */
async searchBlogsByTitleSimple(keyword, options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const status = options.status; // 'published' hoặc undefined

    // Gọi repository đã sửa để tránh lỗi param Postgres
    const result = await blogRepository.searchByTitleSimple(keyword, limit, offset, status);

    const totalPages = Math.ceil(result.total / limit);

    return {
        success: true,
        data: {
            blogs: result.blogs,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: result.total,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }
    };
}


    //Thêm ngày 14/8
  // Lấy blog được xuất bản kèm bình luận và lượt thích
  // src/api/v1/services/blog.service.js
    async getBlogsWithStatsByStatus(status = 'published') {
        try {
            // gọi thẳng hàm từ repository
            const blogs = await blogRepository.findBlogsWithStatsByStatus(status);

            return {
                success: true,
                data: blogs
            };
        } catch (error) {
            throw new Error(`Error getting blogs with stats by status: ${error.message}`);
        }
    }
}

module.exports = new BlogService();