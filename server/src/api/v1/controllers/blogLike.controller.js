// src/api/v1/controllers/blogLike.controller.js

const BlogLikeService = require('../services/blogLike.service');
const { successResponse } = require('../../../utils/response');

class BlogLikeController {
    /**
     * Xử lý yêu cầu thích một bài blog.
     * POST /api/v1/blogs/:blogId/like
     */
    async likeBlog(req, res, next) {
        try {
            const { blogId } = req.params;
            const userId = req.user.id;
            await BlogLikeService.likeBlog(blogId, userId);
            successResponse(res, null, 'Blog liked successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xử lý yêu cầu bỏ thích một bài blog.
     * DELETE /api/v1/blogs/like
     */
    async unlikeBlog(req, res, next) {
        try {
            const { blog_id } = req.body;
            const userId = req.user.id;
            await BlogLikeService.unlikeBlog(blog_id, userId);
            successResponse(res, null, 'Blog unliked successfully');
        } catch (error) {
            next(error);
        }
    }

     /**
     * Kiểm tra blog có được user like chưa.
     * GET /api/v1/blogs/:blogId/is-liked
     */
    async isBlogLiked(req, res, next) {
        try {
            const { blogId } = req.params;
            const userId = req.user.id;
            const liked = await BlogLikeService.isBlogLiked(blogId, userId);
            successResponse(res, { liked }, 'Check like status successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BlogLikeController();