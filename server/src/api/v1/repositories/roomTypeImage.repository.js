// src/api/v1/repositories/roomTypeImage.repository.js

const pool = require('../../../config/db');
const RoomTypeImage = require('../../../models/roomTypeImage.model');

/**
 * Thêm một hoặc nhiều hình ảnh cho một loại phòng.
 * @param {string} roomTypeId - ID của loại phòng.
 * @param {Array<object>} images - Mảng các đối tượng hình ảnh, mỗi object chứa { image_url, caption, is_thumbnail }.
 * @returns {Promise<RoomTypeImage[]>}
 */
const addImages = async (roomTypeId, images) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertedImages = [];
        for (const image of images) {
            const { image_url, caption = null, is_thumbnail = false } = image;
            const query = `
                INSERT INTO room_type_images (room_type_id, image_url, caption, is_thumbnail)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const result = await client.query(query, [roomTypeId, image_url, caption, is_thumbnail]);
            insertedImages.push(new RoomTypeImage(result.rows[0]));
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
 * Tìm tất cả hình ảnh của một loại phòng.
 * @param {string} roomTypeId - ID của loại phòng.
 * @returns {Promise<RoomTypeImage[]>}
 */
const findByRoomTypeId = async (roomTypeId) => {
    const query = 'SELECT * FROM room_type_images WHERE room_type_id = $1 ORDER BY uploaded_at ASC';
    const result = await pool.query(query, [roomTypeId]);
    return result.rows.map(row => new RoomTypeImage(row));
};

/**
 * Xóa một hình ảnh bằng ID.
 * @param {string} imageId - ID của hình ảnh.
 * @returns {Promise<boolean>} - Trả về true nếu xóa thành công.
 */
const deleteById = async (imageId) => {
    const result = await pool.query('DELETE FROM room_type_images WHERE image_id = $1', [imageId]);
    return result.rowCount > 0;
};

/**
 * Đặt một hình ảnh làm ảnh đại diện (thumbnail).
 * @param {string} roomTypeId - ID của loại phòng.
 * @param {string} imageId - ID của hình ảnh cần đặt làm thumbnail.
 * @returns {Promise<void>}
 */
const setAsThumbnail = async (roomTypeId, imageId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Bước 1: Bỏ thumbnail của tất cả các ảnh khác thuộc cùng loại phòng
        await client.query('UPDATE room_type_images SET is_thumbnail = false WHERE room_type_id = $1', [roomTypeId]);
        // Bước 2: Đặt ảnh được chỉ định làm thumbnail
        await client.query('UPDATE room_type_images SET is_thumbnail = true WHERE image_id = $1', [imageId]);
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
    findByRoomTypeId,
    deleteById,
    setAsThumbnail,
};
