// src/api/v1/routes/blogComment.route.js

const express = require('express');
const blogCommentController = require('../controllers/blogComment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createCommentSchema } = require('../../../validators/blogComment.validator');

const router = express.Router();

// --- Routes cho một bài blog cụ thể ---
router.route('/blogs/:blogId/comments')
    // GET /api/v1/blogs/:blogId/comments -> Lấy bình luận (Public)
    .get(blogCommentController.getCommentsByBlog)
    // POST /api/v1/blogs/:blogId/comments -> Tạo bình luận mới (Authenticated)
    .post(authenticate, validate(createCommentSchema), blogCommentController.createComment);

    // --- Route trả lời bình luận ---
// POST /api/v1/blogs/:blogId/comments/:commentId/reply -> Trả lời bình luận (Admin & Hotel Owner)
router.post(
    '/blogs/:blogId/comments/:commentId/reply',
    authenticate,
    authorize(['admin', 'hotel_owner']), // Cho phép cả admin và chủ khách sạn
    blogCommentController.replyToComment
);

// --- Routes cho một bình luận cụ thể ---

// DELETE /api/v1/comments/:commentId -> Xóa bình luận (Authenticated)
router.delete('/comments/:commentId', authenticate, blogCommentController.deleteComment);

// --- Route mới: lấy bình luận kèm tên người bình luận ---
router.get(
    '/blogs/:blogId/comments-with-user',
    // authenticate, authorize(['admin']), // Nếu muốn giới hạn
    blogCommentController.getCommentsWithUserByBlog
);

// --- Route cập nhật trạng thái bình luận (Admin) ---
router.patch(
    '/comments/:commentId/status',  // PATCH /api/v1/comments/:commentId/status
    authenticate,                   // phải đăng nhập
    authorize(['admin']),           // chỉ admin được quyền
    blogCommentController.updateCommentStatus
);

module.exports = router;
