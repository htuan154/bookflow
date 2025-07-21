// src/api/v1/controllers/blogImage.controller.js

const BlogImageService = require('../services/blogImage.service');
const { successResponse } = require('../../../utils/response');

class BlogImageController {
    /**
     * Tải lên hình ảnh cho một bài blog.
     * POST /api/v1/blogs/:blogId/images
     */
    async uploadImages(req, res, next) {
        try {
            const { blogId } = req.params;
            const imagesData = req.body.images;
            const userId = req.user.id;

            const newImages = await BlogImageService.addImagesToBlog(blogId, imagesData, userId);
            successResponse(res, newImages, 'Images added to blog successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa một hình ảnh của bài blog.
     * DELETE /api/v1/blog-images/:imageId
     */
    async deleteImage(req, res, next) {
        try {
            const { imageId } = req.params;
            const currentUser = req.user;

            await BlogImageService.deleteBlogImage(imageId, currentUser);
            successResponse(res, null, 'Image deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BlogImageController();