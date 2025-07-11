// src/api/v1/repositories/blogComment.repository.js

const pool = require('../../../config/db');
const BlogComment = require('../../../models/blogComment.model');

/**
 * Tạo một bình luận mới.
 * @param {object} commentData - Dữ liệu của bình luận.
 * @returns {Promise<BlogComment>}
 */
const create = async (commentData) => {
    const { blog_id, user_id, parent_comment_id, content, status } = commentData;
    const query = `
        INSERT INTO blog_comments (blog_id, user_id, parent_comment_id, content, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [blog_id, user_id, parent_comment_id, content, status];
    const result = await pool.query(query, values);
    return new BlogComment(result.rows[0]);
};

/**
 * Tìm tất cả các bình luận của một bài blog.
 * @param {string} blogId - ID của bài blog.
 * @returns {Promise<BlogComment[]>}
 */
const findByBlogId = async (blogId) => {
    const query = 'SELECT * FROM blog_comments WHERE blog_id = $1 AND status = \'approved\' ORDER BY created_at ASC';
    const result = await pool.query(query, [blogId]);
    return result.rows.map(row => new BlogComment(row));
};

/**
 * Tìm một bình luận bằng ID.
 * @param {string} commentId - UUID của bình luận.
 * @returns {Promise<BlogComment|null>}
 */
const findById = async (commentId) => {
    const result = await pool.query('SELECT * FROM blog_comments WHERE comment_id = $1', [commentId]);
    return result.rows[0] ? new BlogComment(result.rows[0]) : null;
};

/**
 * Cập nhật nội dung của một bình luận.
 * @param {string} commentId - ID của bình luận.
 * @param {string} content - Nội dung mới.
 * @returns {Promise<BlogComment|null>}
 */
const updateContent = async (commentId, content) => {
    const query = `
        UPDATE blog_comments
        SET content = $1, updated_at = CURRENT_TIMESTAMP
        WHERE comment_id = $2
        RETURNING *;
    `;
    const result = await pool.query(query, [content, commentId]);
    return result.rows[0] ? new BlogComment(result.rows[0]) : null;
};

/**
 * Cập nhật trạng thái của một bình luận (Admin).
 * @param {string} commentId - ID của bình luận.
 * @param {string} status - Trạng thái mới.
 * @returns {Promise<BlogComment|null>}
 */
const updateStatus = async (commentId, status) => {
    const query = `
        UPDATE blog_comments
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE comment_id = $2
        RETURNING *;
    `;
    const result = await pool.query(query, [status, commentId]);
    return result.rows[0] ? new BlogComment(result.rows[0]) : null;
};

/**
 * Xóa một bình luận.
 * @param {string} commentId - ID của bình luận.
 * @returns {Promise<boolean>}
 */
const deleteById = async (commentId) => {
    const result = await pool.query('DELETE FROM blog_comments WHERE comment_id = $1', [commentId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    findByBlogId,
    findById,
    updateContent,
    updateStatus,
    deleteById,
};