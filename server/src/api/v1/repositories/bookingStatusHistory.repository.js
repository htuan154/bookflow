// src/api/v1/repositories/bookingStatusHistory.repository.js

const pool = require('../../../config/db');
const BookingStatusHistory = require('../../../models/bookingStatusHistory.model');

/**
 * Ghi lại một thay đổi trạng thái của đơn đặt phòng.
 * @param {object} historyData - Dữ liệu lịch sử.
 * @returns {Promise<BookingStatusHistory>}
 */
const create = async (historyData) => {
    const {
        booking_id,
        old_status,
        new_status,
        changed_by_staff,
        change_reason,
        notes
    } = historyData;

    const query = `
        INSERT INTO booking_status_history (
            booking_id, old_status, new_status, changed_by_staff, change_reason, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;
    const values = [booking_id, old_status, new_status, changed_by_staff, change_reason, notes];
    const result = await pool.query(query, values);
    return new BookingStatusHistory(result.rows[0]);
};

/**
 * Tìm tất cả lịch sử thay đổi của một đơn đặt phòng.
 * @param {string} bookingId - ID của đơn đặt phòng.
 * @returns {Promise<BookingStatusHistory[]>}
 */
const findByBookingId = async (bookingId) => {
    const query = 'SELECT * FROM booking_status_history WHERE booking_id = $1 ORDER BY changed_at ASC';
    const result = await pool.query(query, [bookingId]);
    return result.rows.map(row => new BookingStatusHistory(row));
};

module.exports = {
    create,
    findByBookingId,
};
