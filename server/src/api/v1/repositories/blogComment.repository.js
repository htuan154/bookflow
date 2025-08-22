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
    const query = 'SELECT blog_comments.*, users.username FROM blog_comments JOIN users On users.user_id = blog_comments.user_id WHERE blog_id = $1 AND status = \'approved\' ORDER BY created_at ASC';
    const result = await pool.query(query, [blogId]);
    // Đảm bảo trả về new BlogComment(row) để mapping sang camelCase
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
 * Lấy comment theo ID
 * @param {string} commentId
 * @returns {Promise<BlogComment|null>}
 */
    const getById = async (commentId) => {
        const query = `SELECT * FROM blog_comments WHERE comment_id = $1`;
        const result = await pool.query(query, [commentId]);
        return result.rows[0] ? new BlogComment(result.rows[0]) : null;
    };

/**Ngày 16/8
 * Cập nhật trạng thái của một comment
 * Chỉ update status + updated_at
 * @param {string} commentId
 * @param {string} status
 * @returns {Promise<BlogComment|null>}
 */
const updateStatus = async (commentId, status) => {
    try {
        const query = `
            UPDATE blog_comments
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE comment_id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [status, commentId]);
        return result.rows[0] ? new BlogComment(result.rows[0]) : null;
    } catch (err) {
        // Nếu status không hợp lệ, DB sẽ tự bắn lỗi CHECK constraint
        throw new Error(`Không thể cập nhật trạng thái: ${err.message}`);
    }
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
// Thêm 
/**
 * Admin hoặc chủ khách sạn trả lời bình luận.
 * @param {object} replyData - Dữ liệu trả lời.
 * @param {string} replyData.blog_id - ID bài blog.
 * @param {string} replyData.user_id - ID người trả lời (admin hoặc chủ khách sạn).
 * @param {string} replyData.parent_comment_id - ID bình luận gốc cần trả lời.
 * @param {string} replyData.content - Nội dung trả lời.
 * @param {string} replyData.status - Trạng thái trả lời.
 * @returns {Promise<BlogComment>}
 */
const replyToComment = async (replyData) => {
    const {
        blog_id,
        user_id,
        parent_comment_id,
        content,
        status 
    } = replyData;

    const query = `
        INSERT INTO blog_comments (blog_id, user_id, parent_comment_id, content, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
  


    const values = [blog_id, user_id, parent_comment_id, content, status];
    const result = await pool.query(query, values);
    return new BlogComment(result.rows[0]);
};

//Thêm vào ngày 14

// detail
/**
 * Lấy toàn bộ bình luận của một blog, kèm tên người bình luận và ngày bình luận.
 * @param {string} blogId - ID của bài blog.
 * @returns {Promise<BlogComment[]>}
 */
const findCommentsWithUserByBlogId = async (blogId) => {
    const query = `
        SELECT 
            bc.comment_id,
            bc.blog_id,
            bc.user_id,
            bc.parent_comment_id,
            bc.content,
            bc.status,
            bc.like_count,
            bc.created_at,
            bc.updated_at,
            u.full_name,
            u.username
        FROM blog_comments bc
        JOIN users u ON bc.user_id = u.user_id
        WHERE bc.blog_id = $1
        ORDER BY bc.created_at ASC
    `;
    const result = await pool.query(query, [blogId]);
    return result.rows.map(row => new BlogComment({
        ...row,
        full_name: row.full_name,
        username: row.username,
        created_at: row.created_at
    }));
};

/**
 * Đếm số lượng bình luận (bao gồm cả phản hồi) của một bài blog với các trạng thái hợp lệ.
 * @param {string} blogId - ID của bài blog.
 * @returns {Promise<number>}
 */
const countByBlogId = async (blogId) => {
    const query = `
        SELECT COUNT(*) FROM blog_comments 
        WHERE blog_id = $1 AND status IN ('pending', 'approved', 'rejected', 'hidden')
    `;
    const result = await pool.query(query, [blogId]);
    return parseInt(result.rows[0].count, 10) || 0;
};

module.exports = {
    create,
    findByBlogId,
    findById,
    updateContent,
    updateStatus,
    deleteById,
    replyToComment,
    findCommentsWithUserByBlogId,
    getById,
    countByBlogId
};