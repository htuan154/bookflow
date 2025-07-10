// src/api/v1/repositories/bookingDetail.repository.js

const pool = require('../../../config/db');
const BookingDetail = require('../../../models/bookingDetail.model');

/**
 * Tạo một hoặc nhiều chi tiết đặt phòng trong một giao dịch.
 * Hàm này được thiết kế để chạy bên trong một giao dịch (transaction)
 * do đó nó nhận một 'client' thay vì sử dụng 'pool' trực tiếp.
 * @param {Array<object>} details - Mảng các đối tượng chi tiết đặt phòng.
 * @param {string} bookingId - ID của đơn đặt phòng lớn.
 * @param {object} client - Đối tượng client của pg để thực hiện giao dịch.
 * @returns {Promise<BookingDetail[]>}
 */
const createMany = async (details, bookingId, client) => {
    const createdDetails = [];
    for (const detail of details) {
        const { room_type_id, quantity, unit_price, subtotal, guests_per_room } = detail;
        const query = `
            INSERT INTO booking_details (booking_id, room_type_id, quantity, unit_price, subtotal, guests_per_room)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [bookingId, room_type_id, quantity, unit_price, subtotal, guests_per_room];
        const result = await client.query(query, values);
        createdDetails.push(new BookingDetail(result.rows[0]));
    }
    return createdDetails;
};

/**
 * Tìm một chi tiết đặt phòng bằng ID.
 * @param {string} detailId - UUID của chi tiết đặt phòng.
 * @returns {Promise<BookingDetail|null>}
 */
const findById = async (detailId) => {
    const result = await pool.query('SELECT * FROM booking_details WHERE detail_id = $1', [detailId]);
    if (!result.rows[0]) {
        return null;
    }
    return new BookingDetail(result.rows[0]);
};

/**
 * Tìm tất cả các chi tiết đặt phòng của một đơn đặt phòng.
 * @param {string} bookingId - ID của đơn đặt phòng.
 * @returns {Promise<BookingDetail[]>}
 */
const findByBookingId = async (bookingId) => {
    const result = await pool.query('SELECT * FROM booking_details WHERE booking_id = $1', [bookingId]);
    return result.rows.map(row => new BookingDetail(row));
};

module.exports = {
    createMany,
    findById,
    findByBookingId,
};
