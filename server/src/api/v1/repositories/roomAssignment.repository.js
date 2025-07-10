// src/api/v1/repositories/roomAssignment.repository.js

const pool = require('../../../config/db');
const RoomAssignment = require('../../../models/roomAssignment.model');

/**
 * Gán một phòng cụ thể cho một chi tiết đặt phòng.
 * @param {object} assignmentData - Dữ liệu gán phòng.
 * @param {string} assignmentData.booking_detail_id - ID của chi tiết đặt phòng.
 * @param {string} assignmentData.room_id - ID của phòng cụ thể.
 * @param {string} assignmentData.assigned_by - ID của người thực hiện.
 * @param {string} [assignmentData.notes] - Ghi chú.
 * @returns {Promise<RoomAssignment>}
 */
const create = async (assignmentData) => {
    const { booking_detail_id, room_id, assigned_by, notes } = assignmentData;
    const query = `
        INSERT INTO room_assignments (booking_detail_id, room_id, assigned_by, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;
    const result = await pool.query(query, [booking_detail_id, room_id, assigned_by, notes]);
    return new RoomAssignment(result.rows[0]);
};

/**
 * Tìm tất cả các phòng đã được gán cho một chi tiết đặt phòng.
 * @param {string} bookingDetailId - ID của chi tiết đặt phòng.
 * @returns {Promise<RoomAssignment[]>}
 */
const findByBookingDetailId = async (bookingDetailId) => {
    const query = 'SELECT * FROM room_assignments WHERE booking_detail_id = $1';
    const result = await pool.query(query, [bookingDetailId]);
    return result.rows.map(row => new RoomAssignment(row));
};

/**
 * Tìm tất cả các phòng đã được gán cho một đơn đặt phòng lớn (booking).
 * @param {string} bookingId - ID của đơn đặt phòng.
 * @returns {Promise<any[]>}
 */
const findByBookingId = async (bookingId) => {
    const query = `
        SELECT ra.*, r.room_number, rt.name as room_type_name
        FROM room_assignments ra
        JOIN booking_details bd ON ra.booking_detail_id = bd.detail_id
        JOIN rooms r ON ra.room_id = r.room_id
        JOIN room_types rt ON r.room_type_id = rt.room_type_id
        WHERE bd.booking_id = $1;
    `;
    const result = await pool.query(query, [bookingId]);
    // Trả về dữ liệu đã join, không cần map qua model vì có thêm trường
    return result.rows;
};

/**
 * Hủy việc gán một phòng.
 * @param {string} assignmentId - ID của việc gán phòng.
 * @returns {Promise<boolean>}
 */
const deleteById = async (assignmentId) => {
    const result = await pool.query('DELETE FROM room_assignments WHERE assignment_id = $1', [assignmentId]);
    return result.rowCount > 0;
};

module.exports = {
    create,
    findByBookingDetailId,
    findByBookingId,
    deleteById,
};
