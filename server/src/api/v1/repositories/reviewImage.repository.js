// src/api/v1/repositories/reviewImage.repository.js

const pool = require('../../../config/db');
const ReviewImage = require('../../../models/reviewImage.model');

/**
 * Thêm một hoặc nhiều hình ảnh cho một đánh giá.
 * @param {string} reviewId - ID của đánh giá.
 * @param {Array<string>} imageUrls - Mảng các URL hình ảnh.
 * @returns {Promise<ReviewImage[]>}
 */
const addImages = async (reviewId, imageUrls) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertedImages = [];
        for (const imageUrl of imageUrls) {
            const query = `
                INSERT INTO review_images (review_id, image_url)
                VALUES ($1, $2)
                RETURNING *;
            `;
            const result = await client.query(query, [reviewId, imageUrl]);
            insertedImages.push(new ReviewImage(result.rows[0]));
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
 * Tìm tất cả hình ảnh của một đánh giá.
 * @param {string} reviewId - ID của đánh giá.
 * @returns {Promise<ReviewImage[]>}
 */
const findByReviewId = async (reviewId) => {
    const query = 'SELECT * FROM review_images WHERE review_id = $1 ORDER BY uploaded_at ASC';
    const result = await pool.query(query, [reviewId]);
    return result.rows.map(row => new ReviewImage(row));
};

/**
 * Xóa một hình ảnh bằng ID.
 * @param {string} imageId - ID của hình ảnh.
 * @returns {Promise<boolean>}
 */
const deleteById = async (imageId) => {
    const result = await pool.query('DELETE FROM review_images WHERE image_id = $1', [imageId]);
    return result.rowCount > 0;
};

/**
 * Tìm một hình ảnh bằng ID.
 * @param {string} imageId - UUID của hình ảnh.
 * @returns {Promise<ReviewImage|null>}
 */
const findById = async (imageId) => {
    const result = await pool.query('SELECT * FROM review_images WHERE image_id = $1', [imageId]);
    if (!result.rows[0]) {
        return null;
    }
    return new ReviewImage(result.rows[0]);
};


module.exports = {
    addImages,
    findByReviewId,
    deleteById,
    findById,
};
