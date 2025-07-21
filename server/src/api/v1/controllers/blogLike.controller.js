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
     * DELETE /api/v1/blogs/:likeId/like
     */
    async unlikeBlog(req, res, next) {
        try {
            const { likeId } = req.params;
            const userId = req.user.id;
            await BlogLikeService.unlikeBlog(likeId, userId);
            successResponse(res, null, 'Blog unliked successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BlogLikeController();