// src/api/v1/repositories/booking.repository.js

const pool = require('../../../config/db');
const Booking = require('../../../models/booking.model');

/**
 * Tạo một đơn đặt phòng mới (booking master).
 * Hàm này được thiết kế để chạy bên trong một giao dịch (transaction).
 * @param {object} bookingData - Dữ liệu của đơn đặt phòng.
 * @param {object} client - Đối tượng client của pg để thực hiện giao dịch.
 * @returns {Promise<Booking>}
 */
const create = async (bookingData, client) => {
    const {
        user_id, hotel_id, check_in_date, check_out_date, total_guests,
        total_price, booking_status = 'pending', payment_status = 'pending',
        payment_method, promotion_id, special_requests
    } = bookingData;

    const query = `
        INSERT INTO bookings (
            user_id, hotel_id, check_in_date, check_out_date, total_guests,
            total_price, booking_status, payment_status, payment_method,
            promotion_id, special_requests
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
    `;
    const values = [
        user_id, hotel_id, check_in_date, check_out_date, total_guests,
        total_price, booking_status, payment_status, payment_method,
        promotion_id, special_requests
    ];

    const result = await client.query(query, values);
    return new Booking(result.rows[0]);
};

/**
 * Tìm một đơn đặt phòng bằng ID.
 * @param {string} bookingId - UUID của đơn đặt phòng.
 * @returns {Promise<Booking|null>}
 */
const findById = async (bookingId) => {
    const result = await pool.query('SELECT * FROM bookings WHERE booking_id = $1', [bookingId]);
    if (!result.rows[0]) {
        return null;
    }
    return new Booking(result.rows[0]);
};

/**
 * Tìm tất cả các đơn đặt phòng của một người dùng.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<Booking[]>}
 */
const findByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY booked_at DESC', [userId]);
    return result.rows.map(row => new Booking(row));
};

/**
 * Tìm tất cả các đơn đặt phòng của một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @returns {Promise<Booking[]>}
 */
const findByHotelId = async (hotelId) => {
    const result = await pool.query('SELECT * FROM bookings WHERE hotel_id = $1 ORDER BY booked_at DESC', [hotelId]);
    return result.rows.map(row => new Booking(row));
};

/**
 * Tìm tất cả các đơn đặt phòng của một khách sạn (hotel_id).
 * @param {string} hotelId - ID của khách sạn.
 * @returns {Promise<Booking[]>}
 */
const findBookingsByHotelId = async (hotelId) => {
    const result = await pool.query('SELECT * FROM bookings WHERE hotel_id = $1 ORDER BY booked_at DESC', [hotelId]);
    return result.rows.map(row => new Booking(row));
};

/**
 * Cập nhật trạng thái của một đơn đặt phòng.
 * @param {string} bookingId - ID của đơn đặt phòng.
 * @param {string} status - Trạng thái mới.
 * @returns {Promise<Booking|null>}
 */
const updateStatus = async (bookingId, status) => {
    const query = `
        UPDATE bookings
        SET booking_status = $1, last_updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = $2
        RETURNING *;
    `;
    const result = await pool.query(query, [status, bookingId]);
    if (!result.rows[0]) {
        return null;
    }
    return new Booking(result.rows[0]);
};

module.exports = {
    create,
    findById,
    findByUserId,
    findByHotelId,
    updateStatus,
    findBookingsByHotelId,
};
