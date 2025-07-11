// src/api/v1/controllers/blog.controller.js

const BlogService = require('../services/blog.service');
const { successResponse } = require('../../../utils/response');

class BlogController {
    /**
     * Tạo một bài blog mới.
     * POST /api/v1/blogs
     */
    async createBlog(req, res, next) {
        try {
            const authorId = req.user.userId;
            const newBlog = await BlogService.createBlog(req.body, authorId);
            successResponse(res, newBlog, 'Blog created successfully as a draft', 201);
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
            const userId = req.user.userId;
            const updatedBlog = await BlogService.updateBlog(blogId, req.body, userId);
            successResponse(res, updatedBlog, 'Blog updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BlogController();