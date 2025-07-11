// src/api/v1/repositories/review.repository.js

const pool = require('../../../config/db');
const Review = require('../../../models/review.model');

/**
 * Tạo một đánh giá mới.
 * @param {object} reviewData - Dữ liệu của đánh giá.
 * @returns {Promise<Review>}
 */
const create = async (reviewData) => {
    const {
        user_id, hotel_id, booking_id, rating, comment,
        cleanliness_rating, comfort_rating, service_rating,
        location_rating, value_rating
    } = reviewData;

    const query = `
        INSERT INTO reviews (
            user_id, hotel_id, booking_id, rating, comment,
            cleanliness_rating, comfort_rating, service_rating,
            location_rating, value_rating
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
    `;
    const values = [
        user_id, hotel_id, booking_id, rating, comment,
        cleanliness_rating, comfort_rating, service_rating,
        location_rating, value_rating
    ];

    const result = await pool.query(query, values);
    return new Review(result.rows[0]);
};

/**
 * Tìm tất cả các đánh giá của một khách sạn (có phân trang).
 * @param {string} hotelId - ID của khách sạn.
 * @param {number} limit - Số lượng kết quả.
 * @param {number} offset - Vị trí bắt đầu.
 * @returns {Promise<Review[]>}
 */
const findByHotelId = async (hotelId, limit = 10, offset = 0) => {
    const query = 'SELECT * FROM reviews WHERE hotel_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    const result = await pool.query(query, [hotelId, limit, offset]);
    return result.rows.map(row => new Review(row));
};

/**
 * Tìm một đánh giá bằng ID.
 * @param {string} reviewId - UUID của đánh giá.
 * @returns {Promise<Review|null>}
 */
const findById = async (reviewId) => {
    const result = await pool.query('SELECT * FROM reviews WHERE review_id = $1', [reviewId]);
    if (!result.rows[0]) {
        return null;
    }
    return new Review(result.rows[0]);
};

/**
 * Tìm một đánh giá bằng booking_id để kiểm tra trùng lặp.
 * @param {string} bookingId - UUID của đơn đặt phòng.
 * @returns {Promise<Review|null>}
 */
const findByBookingId = async (bookingId) => {
    const result = await pool.query('SELECT * FROM reviews WHERE booking_id = $1', [bookingId]);
    return result.rows[0] ? new Review(result.rows[0]) : null;
};

/**
 * Cập nhật một đánh giá.
 * @param {string} reviewId - ID của đánh giá cần cập nhật.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<Review|null>}
 */
const update = async (reviewId, updateData) => {
    const { rating, comment, cleanliness_rating, comfort_rating, service_rating, location_rating, value_rating } = updateData;
    const query = `
        UPDATE reviews
        SET rating = $1, comment = $2, cleanliness_rating = $3, comfort_rating = $4,
            service_rating = $5, location_rating = $6, value_rating = $7
        WHERE review_id = $8
        RETURNING *;
    `;
    const values = [rating, comment, cleanliness_rating, comfort_rating, service_rating, location_rating, value_rating, reviewId];
    const result = await pool.query(query, values);
    if (!result.rows[0]) {
        return null;
    }
    return new Review(result.rows[0]);
};

/**
 * Xóa một đánh giá.
 * @param {string} reviewId - ID của đánh giá cần xóa.
 * @returns {Promise<boolean>}
 */
const deleteById = async (reviewId) => {
    const result = await pool.query('DELETE FROM reviews WHERE review_id = $1', [reviewId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    findByHotelId,
    findById,
    findByBookingId,
    update,
    deleteById,
};
