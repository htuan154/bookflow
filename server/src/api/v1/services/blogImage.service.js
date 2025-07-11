// src/api/v1/services/blogImage.service.js

const blogImageRepository = require('../repositories/blogImage.repository');
const blogRepository = require('../repositories/blog.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class BlogImageService {
    /**
     * Thêm hình ảnh mới cho một bài blog.
     * @param {string} blogId - ID của bài blog.
     * @param {Array<object>} imagesData - Dữ liệu hình ảnh.
     * @param {string} userId - ID của người dùng thực hiện.
     * @returns {Promise<BlogImage[]>}
     */
    async addImagesToBlog(blogId, imagesData, userId) {
        // --- Kiểm tra nghiệp vụ ---
        const blog = await blogRepository.findById(blogId);
        if (!blog) {
            throw new AppError('Blog not found', 404);
        }
        // Chỉ tác giả của bài blog mới có quyền thêm ảnh.
        if (blog.authorId !== userId) {
            throw new AppError('Forbidden: You can only add images to your own blog posts', 403);
        }

        return await blogImageRepository.addImages(blogId, imagesData);
    }

    /**
     * Xóa một hình ảnh của bài blog.
     * @param {string} imageId - ID của hình ảnh.
     * @param {object} currentUser - Thông tin người dùng hiện tại.
     * @returns {Promise<void>}
     */
    async deleteBlogImage(imageId, currentUser) {
        const image = await blogImageRepository.findById(imageId);
        if (!image) {
            throw new AppError('Image not found', 404);
        }

        const blog = await blogRepository.findById(image.blogId);
        if (!blog) {
            throw new AppError('Associated blog not found', 404);
        }

        // Chỉ tác giả bài blog hoặc admin mới được xóa ảnh.
        if (blog.authorId !== currentUser.userId && currentUser.role !== 'admin') {
            throw new AppError('Forbidden: You do not have permission to delete this image', 403);
        }

        const isDeleted = await blogImageRepository.deleteById(imageId);
        if (!isDeleted) {
            throw new AppError('Failed to delete image', 500);
        }
    }
}

module.exports = new BlogImageService();