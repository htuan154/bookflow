// src/api/v1/routes/blogLike.route.js

const express = require('express');
const blogLikeController = require('../controllers/blogLike.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();


// --- Áp dụng middleware xác thực cho cả hai route ---
router.use(authenticate);

// POST /api/v1/blogs/:blogId/like -> Thích bài blog
router.post('/blogs/:blogId/like', blogLikeController.likeBlog);

// DELETE /api/v1/blogs/:blogId/like -> Bỏ thích bài blog
router.delete('/blogs/:blogId/unlike', blogLikeController.unlikeBlog);

// GET /api/v1/blogs/:blogId/is-liked -> Kiểm tra user đã like blog chưa
router.get('/blogs/:blogId/is-liked', blogLikeController.isBlogLiked);

module.exports = router;
