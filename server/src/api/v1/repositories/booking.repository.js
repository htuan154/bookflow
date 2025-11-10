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
        total_price, booking_status, payment_status = 'pending',
        payment_method, promotion_id, special_requests
    } = bookingData;

    // booking_status giờ được truyền từ service (không còn default = 'pending')
    // Nếu không có thì mới fallback về 'pending'
    const finalBookingStatus = booking_status || 'pending';

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
        total_price, finalBookingStatus, payment_status, payment_method,
        promotion_id, special_requests
    ];

    const result = await client.query(query, values);
    return new Booking(result.rows[0]);
};

/**
 * Lấy tất cả booking có status 'no_show' của một user.
 * @param {string} userId
 * @returns {Promise<Booking[]>}
 */
const findNoShowByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT * FROM bookings WHERE user_id = $1 AND booking_status = 'no_show' ORDER BY booked_at DESC`,
        [userId]
    );
    return result.rows.map(row => new Booking(row));
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

/**
 * Cập nhật booking (generic update - nhiều fields)
 * @param {string} bookingId - ID của đơn đặt phòng.
 * @param {object} updateData - Object chứa các field cần update
 * @returns {Promise<Booking|null>}
 */
const update = async (bookingId, updateData) => {
    // Build dynamic query
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Mapping frontend field names to database column names
    const fieldMapping = {
        paymentStatus: 'payment_status',
        bookingStatus: 'booking_status',
        paymentMethod: 'payment_method',
        specialRequests: 'special_requests',
        totalPrice: 'total_price',
        totalGuests: 'total_guests',
        actualCheckInDate: 'actual_check_in_date',
        actualCheckOutDate: 'actual_check_out_date'
    };

    for (const [key, value] of Object.entries(updateData)) {
        // Convert camelCase to snake_case using mapping
        const dbField = fieldMapping[key] || key;
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
    }

    // Always update last_updated_at
    fields.push(`last_updated_at = CURRENT_TIMESTAMP`);

    if (fields.length === 1) { // Only last_updated_at
        throw new Error('No fields to update');
    }

    const query = `
        UPDATE bookings
        SET ${fields.join(', ')}
        WHERE booking_id = $${paramIndex}
        RETURNING *;
    `;
    values.push(bookingId);

    const result = await pool.query(query, values);
    if (!result.rows[0]) {
        return null;
    }
    return new Booking(result.rows[0]);
};

/**
 * Lấy tất cả các booking đã hoàn thành của một user.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<Booking[]>}
 */
const findCompletedByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT * FROM bookings WHERE booking_status = 'completed' AND user_id = $1 ORDER BY booked_at DESC`,
        [userId]
    );
    return result.rows.map(row => new Booking(row));
};

module.exports = {
    create,
    findById,
    findByUserId,
    findByHotelId,
    updateStatus,
    update,
    findBookingsByHotelId,
    findCompletedByUserId,
    findNoShowByUserId
};
