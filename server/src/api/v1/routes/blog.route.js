const express = require('express');
const blogController = require('../controllers/blog.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { createBlogSchema, updateBlogSchema } = require('../../../validators/blog.validator');

// Import các route con
const blogCommentRoutes = require('./blogComment.route');
const blogImageRoutes = require('./blogImage.route');
const blogLikeRoutes = require('./blogLike.route');

const router = express.Router();

// --- PUBLIC ROUTES ---
// Các route cụ thể trước
router.get('/id/:blogId', blogController.getBlogById);

// Route tìm kiếm blog theo tiêu đề (phân trang, mặc định 10)
router.get('/search', blogController.searchBlogs);


// --- ADMIN ROUTES ---
// ✅ SỬA: Thêm route /admin/blogs/stats 
router.get('/admin/blogs/stats', 
    authenticate, 
    authorize(['admin']), 
    blogController.getAdminBlogStats
);


// Route thống kê tổng quan blogs
router.get('/admin/statistics', 
    authenticate, 
    authorize(['admin']), 
    blogController.getBlogStatistics
);

// Route lấy blogs theo status  
router.get('/admin/status/:status', 
    authenticate, 
    authorize(['admin']), 
    blogController.getBlogsByStatus
);

// Route lấy danh sách blog cho admin với filter/search
router.get('/admin/blogs', 
    authenticate, 
    authorize(['admin']), 
    blogController.getAdminBlogs
);

// Cập nhật trạng thái blog
router.patch(
    '/admin/:blogId/status',
    authenticate,
    authorize(['admin']), // chỉ admin
    blogController.updateBlogStatus
);
// --- Route mới: lấy danh sách blog publish kèm like_count, comment_count ---
router.get(
    '/admin/published/stats',
    authenticate, 
    authorize(['admin']), 
    blogController.getPublishedBlogsWithStats
);

// --- ROUTES CÔNG KHAI ---
router.get('/', blogController.getPublishedBlogs);

// --- TÍCH HỢP CÁC ROUTE CON TRƯỚC CÁC ROUTE CÓ PARAMETER ---
router.use('/', blogCommentRoutes);
router.use('/', blogImageRoutes);
router.use('/', blogLikeRoutes); // Di chuyển lên đây

// --- CÁC ROUTE CÓ PARAMETER ĐẶT CUỐI CÙNG ---
router.get('/:slug', blogController.getBlogBySlug);

// --- AUTHENTICATED ROUTES ---
router.post('/', authenticate, validate(createBlogSchema), blogController.createBlog);
router.put('/:blogId', authenticate, validate(updateBlogSchema), blogController.updateBlog);
router.delete('/:blogId', authenticate, blogController.deleteBlog); // Để cuối

module.exports = router;