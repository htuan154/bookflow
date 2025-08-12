// src/api/v1/routes/blogImage.route.js

const express = require('express');
const blogImageController = require('../controllers/blogImage.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { uploadBlogImagesSchema } = require('../../../validators/blogImage.validator');

const router = express.Router();


// --- Áp dụng middleware xác thực cho tất cả các route bên dưới ---
router.use(authenticate);

// POST /api/v1/blogs/:blogId/images -> Thêm ảnh vào bài blog
router.post(
    '/blogs/:blogId/images',
    validate(uploadBlogImagesSchema),
    blogImageController.uploadImages
);

// GET /api/v1/blogs/:blogId/images -> Lấy tất cả ảnh của blog
router.get(
    '/blogs/:blogId/images',
    blogImageController.getImages
);

// DELETE /api/v1/blog-images/:imageId -> Xóa một ảnh cụ thể
router.delete(
    '/blog-images/:imageId',
    blogImageController.deleteImage
);

module.exports = router;
