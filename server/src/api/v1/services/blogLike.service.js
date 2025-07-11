// src/api/v1/services/blogLike.service.js

const pool = require('../../../config/db');
const blogLikeRepository = require('../repositories/blogLike.repository');
const blogRepository = require('../repositories/blog.repository'); // Giả định đã có
const { AppError } = require('../../../utils/errors');

class BlogLikeService {
    /**
     * Người dùng thích một bài blog.
     * @param {string} blogId - ID của bài blog.
     * @param {string} userId - ID của người dùng.
     * @returns {Promise<void>}
     */
    async likeBlog(blogId, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const blog = await blogRepository.findById(blogId);
            if (!blog || blog.status !== 'published') {
                throw new AppError('Blog not found or is not published', 404);
            }

            // Thử tạo một lượt thích mới
            const newLike = await blogLikeRepository.create(blogId, userId, client);

            // Chỉ tăng like_count nếu một lượt thích mới thực sự được tạo ra
            if (newLike) {
                await blogRepository.incrementLikeCount(blogId, client);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Người dùng bỏ thích một bài blog.
     * @param {string} blogId - ID của bài blog.
     * @param {string} userId - ID của người dùng.
     * @returns {Promise<void>}
     */
    async unlikeBlog(blogId, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Thử xóa một lượt thích
            const wasLiked = await blogLikeRepository.deleteLike(blogId, userId, client);

            // Chỉ giảm like_count nếu một lượt thích thực sự bị xóa
            if (wasLiked) {
                await blogRepository.decrementLikeCount(blogId, client);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new BlogLikeService();