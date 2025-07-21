// src/api/v1/repositories/blog.repository.js

const pool = require('../../../config/db');
const Blog = require('../../../models/blog.model');

/**
 * Tạo một bài blog mới.
 * @param {object} blogData - Dữ liệu của bài blog.
 * @returns {Promise<Blog>}
 */
const create = async (blogData) => {
    const {
        author_id, hotel_id, title, slug, content, excerpt,
        featured_image_url, meta_description, tags, status
    } = blogData;
    const query = `
        INSERT INTO blogs (
            author_id, hotel_id, title, slug, content, excerpt,
            featured_image_url, meta_description, tags, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
    `;
    const values = [
        author_id, hotel_id, title, slug, content, excerpt,
        featured_image_url, meta_description, tags, status
    ];
    const result = await pool.query(query, values);
    return new Blog(result.rows[0]);
};

/**
 * Tìm một bài blog bằng slug.
 * @param {string} slug - Slug của bài blog.
 * @returns {Promise<Blog|null>}
 */
const findBySlug = async (slug) => {
    const result = await pool.query('SELECT * FROM blogs WHERE slug = $1', [slug]);
    return result.rows[0] ? new Blog(result.rows[0]) : null;
};

/**
 * Tìm một bài blog bằng ID.
 * @param {string} blogId - ID của bài blog.
 * @returns {Promise<Blog|null>}
 */
const findById = async (blogId) => {
    const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [blogId]);
    return result.rows[0] ? new Blog(result.rows[0]) : null;
};


/**
 * Lấy tất cả các bài blog đã được xuất bản (có phân trang).
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<Blog[]>}
 */
const findAllPublished = async (limit = 10, offset = 0) => {
    const query = `
        SELECT * FROM blogs 
        WHERE status = 'published' 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows.map(row => new Blog(row));
};

/**
 * Cập nhật một bài blog.
 * @param {string} blogId - ID của bài blog.
 * @param {object} updateData - Dữ liệu cập nhật.
 * @returns {Promise<Blog|null>}
 */
const update = async (blogId, updateData) => {
    const fields = Object.keys(updateData).map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(updateData);
    values.push(blogId);

    const query = `
        UPDATE blogs SET ${fields.join(', ')}
        WHERE blog_id = $${values.length}
        RETURNING *;
    `;
    const result = await pool.query(query, values);
    return result.rows[0] ? new Blog(result.rows[0]) : null;
};

/**
 * Tăng số lượt xem của một bài blog.
 * @param {string} blogId - ID của bài blog.
 */
const incrementViewCount = async (blogId) => {
    await pool.query('UPDATE blogs SET view_count = view_count + 1 WHERE blog_id = $1', [blogId]);
};

/**
 * Tăng/giảm số lượt thích.
 * @param {string} blogId - ID của bài blog.
 * @param {number} amount - Số lượng để thay đổi (1 hoặc -1).
 * @param {object} client - Đối tượng client của pg từ transaction.
 */
const updateLikeCount = async (blogId, amount, client) => {
    const query = 'UPDATE blogs SET like_count = like_count + $1 WHERE blog_id = $2 AND like_count + $1 >= 0';
    await client.query(query, [amount, blogId]);
};

/**
 * Tăng/giảm số bình luận.
 * @param {string} blogId - ID của bài blog.
 * @param {number} amount - Số lượng để thay đổi (1 hoặc -1).
 */
const updateCommentCount = async (blogId, amount) => {
    const query = 'UPDATE blogs SET comment_count = comment_count + $1 WHERE blog_id = $2 AND comment_count + $1 >= 0';
    await pool.query(query, [amount, blogId]);
};

module.exports = {
    create,
    findBySlug,
    findById,
    findAllPublished,
    update,
    incrementViewCount,
    updateLikeCount,
    updateCommentCount,
};