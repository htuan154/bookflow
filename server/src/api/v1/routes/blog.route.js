const express = require('express');
const blogController = require('../controllers/blog.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware'); // Thêm authorize vào đây
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

// Admin routes - Thêm các route mới
router.get('/admin/statistics', 
    authenticate, 
    authorize(['admin']), 
    blogController.getBlogStatistics
);

router.get('/admin/status/:status', 
    authenticate, 
    authorize(['admin']), 
    blogController.getBlogsByStatus
);

// --- TÍCH HỢP CÁC ROUTE CON ---
router.use('/', blogCommentRoutes);
router.use('/', blogImageRoutes);
router.use('/', blogLikeRoutes);

module.exports = router;
