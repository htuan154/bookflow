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
     * Lấy tất cả bình luận đã duyệt (approved) của một bài blog.
     * GET /api/v1/blogs/:blogId/comments-approved
     */
    async getApprovedCommentsByBlog(req, res, next) {
        try {
            const { blogId } = req.params;
            const comments = await BlogCommentService.getApprovedCommentsByBlog(blogId);
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

   /**
 * Trả lời bình luận (Admin & Hotel Owner)
 * POST /api/v1/blogs/:blogId/comments/:commentId/reply
 */
async replyToComment(req, res) {
  try {
    const { blogId, commentId } = req.params; 
    const { content } = req.body;
    const currentUser = req.user; // từ authenticate middleware

    const reply = await BlogCommentService.replyToComment(
      blogId,
      commentId,
      content,
      currentUser
    );

    return res.status(201).json({
      status: "success",
      message: "Reply created successfully",
      data: reply,
    });
  } catch (err) {
    console.error("💥 Error in replyToComment:", err);

    return res.status(500).json({
      status: "error",
      message: err.message || "Internal server error",
    });
  }
}




    //thêm ngày 14
/**
 * Lấy danh sách blog đã publish kèm like_count và comment_count thực tế
 * GET /api/v1/blogs/published/stats
 */
    async getPublishedBlogsWithStats(req, res, next) {
        try {
            const blogs = await BlogCommentService.getPublishedBlogsWithStats();
            successResponse(res, blogs);
        } catch (error) {
            next(error);
        }
    }

    /**
 * Lấy tất cả bình luận kèm tên người bình luận
 * GET /api/v1/blogs/:blogId/comments-with-user
 */
    async getCommentsWithUserByBlog(req, res, next) {
        try {
            const { blogId } = req.params;
            const comments = await BlogCommentService.getCommentsWithUser(blogId);
            successResponse(res, comments);
        } catch (error) {
            next(error);
        }
    }

   //Cập nhật trạng thái bình luận nay16/8
   async updateCommentStatus(req, res, next) {
       try {
           const { commentId } = req.params;
           const { status } = req.body;
           // ✅ Đúng
           const updated = await BlogCommentService.updateCommentStatus(commentId, status, req.user);
             console.log("Current user:", req.user);

           successResponse(res, updated, 'Cập nhật trạng thái bình luận thành công');
       } catch (error) {
           next(error);
       }
   }
}

module.exports = new BlogCommentController();