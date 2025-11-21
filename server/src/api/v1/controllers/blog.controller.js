// src/api/v1/controllers/blog.controller.js

const BlogService = require('../services/blog.service');
const { successResponse } = require('../../../utils/response');
const blogService = require('../services/blog.service');

class BlogController {
    /**
     * Tạo một bài blog mới.
     * POST /api/v1/blogs
     */
    async createBlog(req, res, next) {
        
        try {
            const authorId = req.user.id;
            const newBlog = await BlogService.createBlog(req.body, authorId);
            const statusMessage = req.body.status === 'published' ? 'published' : 'draft';// sửa ngày 30/9
            successResponse(res, newBlog, `Blog created successfully as ${statusMessage}`, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách các bài blog đã xuất bản.
     * GET /api/v1/blogs
     */
    async getPublishedBlogs(req, res, next) {
        try {
            const blogs = await BlogService.getPublishedBlogs(req.query);
            successResponse(res, blogs);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy một bài blog bằng slug.
     * GET /api/v1/blogs/:slug
     */
    async getBlogBySlug(req, res, next) {
        try {
            const { slug } = req.params;
            const blog = await BlogService.getBlogBySlug(slug);
            successResponse(res, blog);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật một bài blog.
     * PUT /api/v1/blogs/:blogId
     */
    async updateBlog(req, res, next) {
        try {
            const { blogId } = req.params;
            const userId = req.user.id;
            const updatedBlog = await BlogService.updateBlog(blogId, req.body, userId);
            successResponse(res, updatedBlog, 'Blog updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một bài blog.
     * DELETE /api/v1/blogs/:blogId
     */
    async deleteBlog(req, res, next) {
        try {
            const { blogId } = req.params;
            const userId = req.user.id;

            await BlogService.deleteBlog(blogId, userId);
            res.status(200).json({ success: true, message: 'Blog deleted successfully' });
        } catch (error) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    }

    /**
     * Lấy danh sách blogs theo trạng thái (Admin only).
     * GET /api/v1/admin/blogs/status/:status
     */
    async getBlogsByStatus(req, res, next) {
        try {
            const { status } = req.params;
            const { page, limit, sortBy, sortOrder } = req.query;

            // Kiểm tra status hợp lệ trước khi gọi service
            const validStatuses = ['draft', 'pending', 'published', 'archived', 'rejected'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Trạng thái không hợp lệ: ${status}. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`
                });
            }

            const options = {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                sortBy: sortBy || 'created_at',
                sortOrder: sortOrder || 'DESC'
            };

            const result = await BlogService.getBlogsByStatus(status, options);
            res.status(200).json(result);
        } catch (error) {
            console.error('getBlogsByStatus error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách blog theo trạng thái',
                error: error.message
            });
        }
    }

    /**
     * Lấy thống kê blogs (Admin only).
     * GET /api/v1/admin/blogs/statistics
     */
    async getBlogStatistics(req, res, next) {
        try {
            const result = await BlogService.getBlogStatistics();
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy một bài blog theo ID.
     * GET /api/v1/blogs/id/:blogId
     */
    async getBlogById(req, res, next) {
        try {
            const { blogId } = req.params;
            const blog = await BlogService.getBlogById(blogId);
            successResponse(res, blog);
        } catch (error) {
            next(error);
        }
    }
      
    /**
     * Cập nhật trạng thái của một blog (Admin only).
     * PATCH /api/v1/admin/blogs/:blogId/status
     */
    async updateBlogStatus(req, res, next) {
        try {
            const { blogId } = req.params;
            const { status } = req.body;
            const userId = req.user.id; // người thực hiện
            const isAdmin = req.user.role === 'admin'; // kiểm tra quyền

            const updatedBlog = await BlogService.updateBlogStatus(blogId, status, userId, isAdmin);

            successResponse(res, updatedBlog, 'Blog status updated successfully');
        } catch (error) {
            next(error);
        }
    }

  /**
/**
 * Tìm kiếm blog theo tiêu đề (đơn giản, có phân trang, tùy chọn trạng thái)
 * GET /api/v1/blogs/search
 */
async searchBlogs(req, res, next) {
    try {
        // Lấy query params, parseInt để chắc chắn kiểu number
        const keyword = req.query.keyword || '';
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const status = req.query.status; // 'published', 'pending', v.v.

        // Gọi service
        const result = await BlogService.searchBlogsByTitleSimple(keyword, { page, limit, status });

        // Trả về JSON
        res.status(200).json(result);
    } catch (error) {
        console.error('❌ [Controller] searchBlogs error:', error);
        next(error);
    }
}



    /**
     * Lấy danh sách blog cho admin với filter/search
     * GET /api/v1/admin/blogs
     */
    async getAdminBlogs(req, res, next) {
        try {
            const {
                status = 'published',
                search = '',
                sortBy = 'created_at',
                sortOrder = 'DESC',
                page = 1,
                limit = 10
            } = req.query;

            // Sử dụng service đã có, truyền search (keyword) nếu có
            const options = {
                page: parseInt(page, 10) || 1,
                limit: parseInt(limit, 10) || 10,
                sortBy,
                sortOrder
            };

            let result;
            if (search) {
                result = await BlogService.searchBlogsByTitleSimple(search, options);
            } else {
                result = await BlogService.getBlogsByStatus(status, options);
            }

            res.status(200).json(result);
        } catch (error) {
            console.error('getAdminBlogs error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách blog cho admin',
                error: error.message
            });
        }
    }

    /**
     * Lấy thống kê blogs cho admin (Admin only).
     * GET /api/v1/admin/blogs/stats
     */
    async getAdminBlogStats(req, res, next) {
        try {
            const result = await BlogService.getAdminBlogStats();
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
    //Thêm ngày 14/8
    /**
    * Lấy danh sách blog đã publish kèm like_count và comment_count 
    * GET /api/v1/blogs/published/stats
    */
   
   async getPublishedBlogsWithStats(req, res, next) {
       try {
           // chỉ lấy published thôi
           const blogs = await BlogService.getBlogsWithStatsByStatus('published');
           successResponse(res, blogs, 'Fetched published blogs with stats');
       } catch (error) {
           next(error);
       }
   }

    // Thêm ngày 4/10/2025
    /**
     * Lấy danh sách blog của chủ khách sạn đang đăng nhập
     * GET /api/v1/hotel-owner/blogs
     */
    async getOwnerBlogs(req, res, next) {
        try {
            const authorId = req.user.id; // Lấy từ middleware xác thực
            const { page = 1, limit = 10, status } = req.query;
            const options = {
                page: parseInt(page, 10) || 1,
                limit: parseInt(limit, 10) || 10,
                status
            };
            const result = await BlogService.getBlogsByAuthor(authorId, options);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
    /**
     * thêm vào ngày 9/10/2025
     * Lấy danh sách blog do admin đăng (lọc theo role, phân trang, trạng thái)
     * GET /api/v1/admin/blogs/by-role
     */
    async getAdminBlogsByRole(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                status, // không mặc định 'published', nếu FE không truyền sẽ là undefined
                adminRole = 'admin'
            } = req.query;

            const result = await BlogService.getAdminBlogs({ page, limit, status, adminRole });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
    /**
     * Lấy danh sách blog theo hotel_id
     * GET /api/v1/blogs/hotel/:hotelId
     */
    async getBlogsByHotel(req, res, next) {
        try {
            const { hotelId } = req.params;
            const { page = 1, limit = 10, status } = req.query;
            const options = {
                page: parseInt(page, 10) || 1,
                limit: parseInt(limit, 10) || 10,
                status
            };
            const result = await BlogService.getBlogsByHotel(hotelId, options);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BlogController();