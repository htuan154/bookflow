// src/api/v1/repositories/blogImage.repository.js

const pool = require('../../../config/db');
const BlogImage = require('../../../models/blogImage.model');

/**
 * Thêm một hoặc nhiều hình ảnh cho một bài blog.
 * @param {string} blogId - ID của bài blog.
 * @param {Array<object>} imagesData - Mảng các đối tượng hình ảnh.
 * @returns {Promise<BlogImage[]>}
 */
const addImages = async (blogId, imagesData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertedImages = [];
        for (const image of imagesData) {
            const { image_url, caption, order_index } = image;
            const query = `
                INSERT INTO blog_images (blog_id, image_url, caption, order_index)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const result = await client.query(query, [blogId, image_url, caption, order_index]);
            insertedImages.push(new BlogImage(result.rows[0]));
        }
        await client.query('COMMIT');
        return insertedImages;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Tìm một hình ảnh bằng ID.
 * @param {string} imageId - UUID của hình ảnh.
 * @returns {Promise<BlogImage|null>}
 */
const findById = async (imageId) => {
    const result = await pool.query('SELECT * FROM blog_images WHERE image_id = $1', [imageId]);
    return result.rows[0] ? new BlogImage(result.rows[0]) : null;
};

/**
 * Xóa một hình ảnh bằng ID.
 * @param {string} imageId - ID của hình ảnh.
 * @returns {Promise<boolean>}
 */
const deleteById = async (imageId) => {
    const result = await pool.query('DELETE FROM blog_images WHERE image_id = $1', [imageId]);
    return result.rowCount > 0;
};

module.exports = {
    addImages,
    findById,
    deleteById,
};