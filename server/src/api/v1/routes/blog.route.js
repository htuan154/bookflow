
const express = require('express');
const blogController = require('../controllers/blog.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createBlogSchema, updateBlogSchema } = require('../../../validators/blog.validator');

// Import các route con
const blogCommentRoutes = require('./blogComment.route');
const blogImageRoutes = require('./blogImage.route');
const blogLikeRoutes = require('./blogLike.route');

const router = express.Router();


// --- PUBLIC ROUTES ---
router.get('/', blogController.getPublishedBlogs);
router.get('/:slug', blogController.getBlogBySlug);

// --- AUTHENTICATED ROUTES ---
router.post('/', authenticate, validate(createBlogSchema), blogController.createBlog);
router.put('/:blogId', authenticate, validate(updateBlogSchema), blogController.updateBlog);

// --- TÍCH HỢP CÁC ROUTE CON ---
router.use('/', blogCommentRoutes);
router.use('/', blogImageRoutes);
router.use('/', blogLikeRoutes);

module.exports = router;
