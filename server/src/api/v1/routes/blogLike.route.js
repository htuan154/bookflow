// src/api/v1/routes/blogLike.route.js

const express = require('express');
const blogLikeController = require('../controllers/blogLike.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();


// --- Áp dụng middleware xác thực cho cả hai route ---
router.use(authenticate);

// POST /api/v1/blogs/:blogId/like -> Thích bài blog
router.post('/blogs/:blogId/like', blogLikeController.likeBlog);

// DELETE /api/v1/blogs/:likeId/like -> Bỏ thích bài blog
router.delete('/blogs/:likeId/like', blogLikeController.unlikeBlog);

module.exports = router;
