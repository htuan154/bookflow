// src/api/v1/repositories/hotelStaff.repository.js

const pool = require('../../../config/db');
const HotelStaff = require('../../../models/hotelStaff.model');

/**
 * Thêm một nhân viên mới vào một khách sạn.
 * @param {object} staffData - Dữ liệu của nhân viên.
 * @returns {Promise<HotelStaff>}
 */
const addStaff = async (staffData) => {
    const { hotel_id, user_id, job_position, start_date, contact, hired_by } = staffData;
    const query = `
        INSERT INTO hotel_staff (hotel_id, user_id, job_position, start_date, contact, hired_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING *;
    `;
    const values = [hotel_id, user_id, job_position, start_date, contact, hired_by];
    const result = await pool.query(query, values);
    return new HotelStaff(result.rows[0]);
};

/**
 * Tìm tất cả nhân viên của một khách sạn.
 * @param {string} hotelId - ID của khách sạn.
 * @returns {Promise<HotelStaff[]>}
 */
const findByHotelId = async (hotelId) => {
    const query = 'SELECT * FROM hotel_staff WHERE hotel_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [hotelId]);
    return result.rows.map(row => new HotelStaff(row));
};

/**
 * Tìm một nhân viên bằng ID.
 * @param {string} staffId - UUID của nhân viên.
 * @returns {Promise<HotelStaff|null>}
 */
const findById = async (staffId) => {
    const result = await pool.query('SELECT * FROM hotel_staff WHERE staff_id = $1', [staffId]);
    return result.rows[0] ? new HotelStaff(result.rows[0]) : null;
};

/**
 * Cập nhật thông tin của một nhân viên.
 * @param {string} staffId - ID của nhân viên cần cập nhật.
 * @param {object} updateData - Dữ liệu mới.
 * @returns {Promise<HotelStaff|null>}
 */
const updateStaff = async (staffId, updateData) => {
    const { job_position, status, contact, end_date } = updateData;
    const query = `
        UPDATE hotel_staff
        SET job_position = $1, status = $2, contact = $3, end_date = $4
        WHERE staff_id = $5
        RETURNING *;
    `;
    const values = [job_position, status, contact, end_date, staffId];
    const result = await pool.query(query, values);
    return result.rows[0] ? new HotelStaff(result.rows[0]) : null;
};

/**
 * Xóa (sa thải) một nhân viên khỏi khách sạn.
 * @param {string} staffId - ID của nhân viên.
 * @returns {Promise<boolean>}
 */
const removeStaff = async (staffId) => {
    const result = await pool.query('DELETE FROM hotel_staff WHERE staff_id = $1', [staffId]);
    return result.rowCount > 0;
};

module.exports = {
    addStaff,
    findByHotelId,
    findById,
    updateStaff,
    removeStaff,
};
