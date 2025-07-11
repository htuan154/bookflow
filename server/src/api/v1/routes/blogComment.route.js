// src/api/v1/routes/blogComment.route.js

const express = require('express');
const blogCommentController = require('../controllers/blogComment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createCommentSchema } = require('../../../validators/blogComment.validator');

const router = express.Router();

// --- Routes cho một bài blog cụ thể ---
router.route('/blogs/:blogId/comments')
    // GET /api/v1/blogs/:blogId/comments -> Lấy bình luận (Public)
    .get(blogCommentController.getCommentsByBlog)
    // POST /api/v1/blogs/:blogId/comments -> Tạo bình luận mới (Authenticated)
    .post(authenticate, validate(createCommentSchema), blogCommentController.createComment);

// --- Routes cho một bình luận cụ thể ---
// DELETE /api/v1/comments/:commentId -> Xóa bình luận (Authenticated)
router.delete('/comments/:commentId', authenticate, blogCommentController.deleteComment);

module.exports = router;
