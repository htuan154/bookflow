// src/api/v1/repositories/hotelImage.repository.js

const pool = require('../../../config/db');
const HotelImage = require('../../../models/hotelImage.model');

/**
 * Thêm một hoặc nhiều hình ảnh cho một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @param {Array<object>} imagesData - Mảng các đối tượng hình ảnh.
 * @returns {Promise<HotelImage[]>}
 */
const addImages = async (hotelId, imagesData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertedImages = [];
        for (const image of imagesData) {
            const { image_url, caption, is_thumbnail } = image;
            const query = `
                INSERT INTO hotel_images (hotel_id, image_url, caption, is_thumbnail)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const result = await client.query(query, [hotelId, image_url, caption, is_thumbnail]);
            insertedImages.push(new HotelImage(result.rows[0]));
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
 * Tìm tất cả hình ảnh của một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @returns {Promise<HotelImage[]>}
 */
const findByHotelId = async (hotelId) => {
    const query = 'SELECT * FROM hotel_images WHERE hotel_id = $1 ORDER BY order_index ASC, uploaded_at ASC';
    const result = await pool.query(query, [hotelId]);
    return result.rows.map(row => new HotelImage(row));
};

/**
 * Tìm một hình ảnh bằng ID.
 * @param {string} imageId - UUID của hình ảnh.
 * @returns {Promise<HotelImage|null>}
 */
const findById = async (imageId) => {
    const result = await pool.query('SELECT * FROM hotel_images WHERE image_id = $1', [imageId]);
    return result.rows[0] ? new HotelImage(result.rows[0]) : null;
};

/**
 * Xóa một hình ảnh bằng ID.
 * @param {string} imageId - ID của hình ảnh.
 * @returns {Promise<boolean>}
 */
const deleteById = async (imageId) => {
    const result = await pool.query('DELETE FROM hotel_images WHERE image_id = $1', [imageId]);
    return result.rowCount > 0;
};

/**
 * Đặt một hình ảnh làm ảnh đại diện (thumbnail).
 * @param {string} hotelId - ID của khách sạn.
 * @param {string} imageId - ID của hình ảnh cần đặt làm thumbnail.
 * @returns {Promise<void>}
 */
const setAsThumbnail = async (hotelId, imageId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Bước 1: Bỏ thumbnail của tất cả các ảnh khác thuộc cùng khách sạn
        await client.query('UPDATE hotel_images SET is_thumbnail = false WHERE hotel_id = $1', [hotelId]);
        // Bước 2: Đặt ảnh được chỉ định làm thumbnail
        await client.query('UPDATE hotel_images SET is_thumbnail = true WHERE image_id = $1', [imageId]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    addImages,
    findByHotelId,
    findById,
    deleteById,
    setAsThumbnail,
};