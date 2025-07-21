// src/api/v1/controllers/blogComment.controller.js

const BlogCommentService = require('../services/blogComment.service');
const { successResponse } = require('../../../utils/response');

class BlogCommentController {
    /**
     * Tạo một bình luận mới.
     * POST /api/v1/blogs/:blogId/comments
     */
    async createComment(req, res, next) {
        try {
            const { blogId } = req.params;
            const userId = req.user.id;
            const commentData = { ...req.body, blog_id: blogId };

            const newComment = await BlogCommentService.createComment(commentData, userId);
            successResponse(res, newComment, 'Comment submitted and is pending approval', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy tất cả bình luận của một bài blog.
     * GET /api/v1/blogs/:blogId/comments
     */
    async getCommentsByBlog(req, res, next) {
        try {
            const { blogId } = req.params;
            const comments = await BlogCommentService.getCommentsByBlog(blogId);
            successResponse(res, comments);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một bình luận.
     * DELETE /api/v1/comments/:commentId
     */
    async deleteComment(req, res, next) {
        try {
            const { commentId } = req.params;
            const currentUser = req.user;
            await BlogCommentService.deleteComment(commentId, currentUser);
            successResponse(res, null, 'Comment deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BlogCommentController();