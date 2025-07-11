// src/api/v1/repositories/blogLike.repository.js

const pool = require('../../../config/db');
const BlogLike = require('../../../models/blogLike.model');

/**
 * Thêm một lượt thích mới cho một bài blog.
 * Sử dụng ON CONFLICT để tránh lỗi nếu người dùng đã thích bài viết này.
 * @param {string} blogId - ID của bài blog.
 * @param {string} userId - ID của người dùng.
 * @param {object} client - Đối tượng client của pg từ transaction.
 * @returns {Promise<BlogLike|null>} - Trả về instance nếu tạo mới, null nếu đã tồn tại.
 */
const create = async (blogId, userId, client) => {
    const query = `
        INSERT INTO blog_likes (blog_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (blog_id, user_id) DO NOTHING
        RETURNING *;
    `;
    const result = await client.query(query, [blogId, userId]);
    return result.rows[0] ? new BlogLike(result.rows[0]) : null;
};

/**
 * Xóa một lượt thích khỏi một bài blog.
 * @param {string} blogId - ID của bài blog.
 * @param {string} userId - ID của người dùng.
 * @param {object} client - Đối tượng client của pg từ transaction.
 * @returns {Promise<boolean>}
 */
const deleteLike = async (blogId, userId, client) => {
    const query = 'DELETE FROM blog_likes WHERE blog_id = $1 AND user_id = $2';
    const result = await client.query(query, [blogId, userId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    deleteLike,
};